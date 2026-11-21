import asyncio
import base64
import json
import os
import traceback
from typing import Optional, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from backend.session_state import SessionState
from backend.prompts import get_system_prompt_for_session
from backend.tools import TOOL_DECLARATIONS, execute_tool
from backend.audit import audit_logger

class VoiceBridgeSession:
    def __init__(self, websocket: WebSocket, session_state: SessionState):
        self.ws: WebSocket = websocket
        self.state: SessionState = session_state
        self.api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        self.live_model: str = os.getenv("LIVE_MODEL", "gemini-2.0-flash-exp")
        self.is_connected: bool = True

    async def run(self) -> None:
        """Main lifecycle managing browser audio WebSocket and Gemini Live session."""
        await audit_logger.log_event(
            self.state.session_id,
            "SESSION_START",
            "citizen",
            {"service_id": self.state.service_id, "language": self.state.language}
        )

        # Notify UI of initial connection and requirements
        await self.ws.send_json({
            "type": "session_init",
            "session_id": self.state.session_id,
            "service_id": self.state.service_id,
            "language": self.state.language,
            "state": self.state.to_dict()
        })

        if not self.api_key or self.api_key.startswith("your_") or self.api_key == "fake_test_key":
            await self._run_simulated_mode()
        else:
            try:
                await self._run_live_gemini()
            except Exception as e:
                # If Live API connection fails (e.g. quota, region or network drop), smoothly fall back
                await self.ws.send_json({
                    "type": "warning",
                    "message": f"Live voice connection notice: {str(e)}. Operating in fallback interactive mode."
                })
                await self._run_simulated_mode()

    async def _run_live_gemini(self) -> None:
        client = genai.Client(api_key=self.api_key)
        system_prompt = get_system_prompt_for_session(
            self.state.config.title.get(self.state.language),
            self.state.language
        )

        # Build tools config
        gemini_tools = [{"function_declarations": TOOL_DECLARATIONS}]
        live_config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(parts=[types.Part.from_text(text=system_prompt)]),
            tools=gemini_tools
        )

        async with client.aio.live.connect(model=self.live_model, config=live_config) as session:
            # Task to receive messages from Gemini and relay to browser
            async def gemini_to_browser():
                try:
                    async for response in session.receive():
                        server_content = response.server_content
                        if server_content is not None:
                            model_turn = server_content.model_turn
                            if model_turn is not None:
                                for part in model_turn.parts:
                                    if part.inline_data:
                                        # Audio chunk (PCM 24kHz)
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                                        await self.ws.send_json({
                                            "type": "audio",
                                            "data": audio_b64
                                        })
                                    elif part.text:
                                        await self.ws.send_json({
                                            "type": "transcript",
                                            "speaker": "agent",
                                            "text": part.text
                                        })

                        # Handle Tool Calls requested by Gemini Live
                        tool_call = response.tool_call
                        if tool_call is not None:
                            function_calls = tool_call.function_calls
                            responses = []
                            for fc in function_calls:
                                tool_result = await execute_tool(fc.name, fc.args or {}, self.state)
                                responses.append(
                                    types.FunctionResponse(
                                        name=fc.name,
                                        id=fc.id,
                                        response=tool_result
                                    )
                                )
                                # Notify UI immediately of state mutations
                                await self.ws.send_json({
                                    "type": "tool_executed",
                                    "tool": fc.name,
                                    "args": fc.args,
                                    "result": tool_result,
                                    "state": self.state.to_dict()
                                })

                            await session.send(
                                input=types.LiveClientToolResponse(function_responses=responses)
                            )
                except Exception as ex:
                    print(f"Error in gemini_to_browser: {ex}")

            # Task to receive audio and commands from browser and relay to Gemini
            async def browser_to_gemini():
                try:
                    while True:
                        msg_str = await self.ws.receive_text()
                        msg = json.loads(msg_str)
                        msg_type = msg.get("type")

                        if msg_type == "audio":
                            audio_bytes = base64.b64decode(msg["data"])
                            await session.send(
                                realtime_input=types.LiveSendRealtimeInputParameters(
                                    media_chunks=[
                                        types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                                    ]
                                )
                            )

                        elif msg_type == "text":
                            # Citizen sent typed text or manual edit
                            text_input = msg.get("text", "")
                            await session.send(input=text_input, end_of_turn=True)

                        elif msg_type == "switch_language":
                            new_lang = msg.get("language", "en")
                            self.state.set_language(new_lang)
                            await self.ws.send_json({
                                "type": "language_switched",
                                "language": new_lang,
                                "state": self.state.to_dict()
                            })

                        elif msg_type == "confirm":
                            # Explicit UI confirmation
                            self.state.user_confirm()
                            await audit_logger.log_event(self.state.session_id, "CONFIRMED", "citizen", {})
                            await self.ws.send_json({
                                "type": "confirmed",
                                "state": self.state.to_dict()
                            })

                        elif msg_type == "submit":
                            # Trigger guarded submission
                            res = await execute_tool("submit_application", {}, self.state)
                            await self.ws.send_json({
                                "type": "submit_result",
                                "result": res,
                                "state": self.state.to_dict()
                            })

                except WebSocketDisconnect:
                    self.is_connected = False
                except Exception as ex:
                    print(f"Error in browser_to_gemini: {ex}")

            # Run both loops concurrently
            g2b = asyncio.create_task(gemini_to_browser())
            b2g = asyncio.create_task(browser_to_gemini())
            done, pending = await asyncio.wait([g2b, b2g], return_when=asyncio.FIRST_COMPLETED)
            for p in pending:
                p.cancel()

    async def _run_simulated_mode(self) -> None:
        """
        Interactive fallback mode ensuring the demo script never crashes
        even without an active Google AI Studio billing credit or API key.
        """
        welcome_text = {
            "en": "Welcome to Trivaani. I will help you request a copy of a birth certificate. What is your full name?",
            "si": "ත්‍රිවාණී වෙත සාදරයෙන් පිළිගනිමු. උප්පැන්න සහතික පිටපතක් ලබාගැනීමට මම ඔබට උදව් කරන්නෙමි. ඔබගේ සම්පූර්ණ නම කුමක්ද?",
            "ta": "திரிவாணிக்கு நல்வரவு. பிறப்புச் சான்றிதழ் பிரதியைப் பெற நான் உங்களுக்கு உதவுகிறேன். உங்கள் முழுப் பெயர் என்ன?"
        }.get(self.state.language, "Welcome to Trivaani.")

        await self.ws.send_json({
            "type": "transcript",
            "speaker": "agent",
            "text": welcome_text
        })

        try:
            while True:
                msg_str = await self.ws.receive_text()
                msg = json.loads(msg_str)
                msg_type = msg.get("type")

                if msg_type == "audio":
                    # In simulated mode, acknowledge audio packet received
                    pass

                elif msg_type == "text":
                    text_input = msg.get("text", "").strip()
                    await self._process_text_in_simulated_mode(text_input)

                elif msg_type == "switch_language":
                    new_lang = msg.get("language", "en")
                    self.state.set_language(new_lang)
                    await self.ws.send_json({
                        "type": "language_switched",
                        "language": new_lang,
                        "state": self.state.to_dict()
                    })

                elif msg_type == "confirm":
                    self.state.user_confirm()
                    await audit_logger.log_event(self.state.session_id, "CONFIRMED", "citizen", {})
                    await self.ws.send_json({
                        "type": "confirmed",
                        "state": self.state.to_dict()
                    })

                elif msg_type == "submit":
                    res = await execute_tool("submit_application", {}, self.state)
                    await self.ws.send_json({
                        "type": "submit_result",
                        "result": res,
                        "state": self.state.to_dict()
                    })

        except WebSocketDisconnect:
            self.is_connected = False

    async def _process_text_in_simulated_mode(self, text: str) -> None:
        """Parses simulated citizen responses for the demo path."""
        # Simple intelligent pattern matcher for demo path
        lower = text.lower()
        if "name is" in lower or "නම" in text or "பெயர்" in text:
            # Extract name
            name = text.split("is")[-1] if "is" in lower else text.replace("මගේ නම", "").replace("මගෙ නම", "").replace("என் பெயர்", "")
            name = name.replace(".", "").replace("!", "").strip()
            if not name:
                name = "Kasun Perera"
            self.state.set_field("child_full_name", name, source="voice")
            self.state.set_field("applicant_full_name", name, source="voice")
            reply = f"Thank you, {name}. What is your date of birth and district of birth?"
            await self._send_agent_reply(reply, updated_field="child_full_name")

        elif "1995" in text or "colombo" in lower or "දිනය" in text:
            self.state.set_field("date_of_birth", "1995-05-12", source="voice")
            self.state.set_field("birth_district", "Colombo", source="voice")
            self.state.set_field("divisional_secretariat", "Colombo", source="voice")
            reply = "Recorded date of birth 1995-05-12 and Colombo district. Could you please scan your National Identity Card (NIC)?"
            await self._send_agent_reply(reply, updated_field="date_of_birth")

        elif "submit" in lower or "ready" in lower or "ඉවරයි" in text:
            missing = self.state.get_missing()
            if not missing["is_complete"]:
                m_names = [f["label"] for f in missing["missing_fields"]]
                reply = f"Before submitting, we still need: {', '.join(m_names)}. What is your mother's full name and reason for copy?"
                await self._send_agent_reply(reply)
            else:
                summary = "All fields and NIC verified for Kasun Perera. Please review and confirm your application on screen."
                res = self.state.request_confirmation(summary=summary)
                await self.ws.send_json({
                    "type": "confirmation_requested",
                    "summary": summary,
                    "state": self.state.to_dict()
                })

        elif "mother" in lower or "sunethra" in lower or "passport" in lower or "මව" in text:
            self.state.set_field("mother_full_name", "Sunethra Silva", source="voice")
            self.state.set_field("reason_for_copy", "Passport Application", source="voice")
            self.state.set_field("applicant_phone", "0771234567", source="voice")
            self.state.set_field("applicant_relationship", "Self", source="voice")
            self.state.set_field("applicant_address", "No. 45, Galle Road, Colombo 03", source="voice")
            self.state.set_field("place_of_birth", "Colombo General Hospital", source="voice")
            
            summary = "All requirements complete. Full Name: Kasun Perera, NIC: 199512345678, Mother: Sunethra Silva, Reason: Passport Application. Please review and confirm on screen."
            self.state.request_confirmation(summary=summary)
            await self.ws.send_json({
                "type": "confirmation_requested",
                "summary": summary,
                "state": self.state.to_dict()
            })

        else:
            reply = f"I noted: '{text}'. Let us continue with your application."
            await self._send_agent_reply(reply)

    async def _send_agent_reply(self, text: str, updated_field: Optional[str] = None) -> None:
        await self.ws.send_json({
            "type": "transcript",
            "speaker": "agent",
            "text": text,
            "updated_field": updated_field,
            "state": self.state.to_dict()
        })
