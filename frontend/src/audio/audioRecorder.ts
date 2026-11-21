/**
 * Audio Recorder for Trivaani
 * Captures browser microphone input, resamples to 16 kHz 16-bit linear PCM,
 * and passes base64 audio chunks to the WebSocket voice bridge.
 */

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioChunk: (base64Chunk: string) => void;
  private isRecording: boolean = false;

  constructor(onAudioChunk: (base64Chunk: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    const sourceSampleRate = this.audioContext.sampleRate;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    // Buffer size 4096 gives approx 85ms packets at 48kHz
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const resampledData = this.resampleTo16kHz(inputData, sourceSampleRate);
      const pcm16 = this.floatTo16BitPCM(resampledData);
      const base64Chunk = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
      this.onAudioChunk(base64Chunk);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop(): void {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private resampleTo16kHz(audioData: Float32Array, sourceSampleRate: number): Float32Array {
    if (sourceSampleRate === 16000) return audioData;
    const ratio = sourceSampleRate / 16000;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetSource = 0;
    while (offsetResult < result.length) {
      const nextOffsetSource = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetSource; i < nextOffsetSource && i < audioData.length; i++) {
        accum += audioData[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetSource = nextOffsetSource;
    }
    return result;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
