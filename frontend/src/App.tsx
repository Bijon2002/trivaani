import React, { useEffect } from "react";
import { useSession } from "./hooks/useSession";
import { Header } from "./components/Header";
import { ConsentModal } from "./components/ConsentModal";
import { FormPanel } from "./components/FormPanel";
import { VoicePanel } from "./components/VoicePanel";
import { DocumentScanner } from "./components/DocumentScanner";
import { ActionLog } from "./components/ActionLog";
import { ConfirmModal } from "./components/ConfirmModal";

export const App: React.FC = () => {
  const {
    sessionId,
    serviceId,
    language,
    serviceConfig,
    availableServices,
    sessionData,
    conversation,
    actionLogs,
    isRecording,
    isConnected,
    activeFieldId,
    showConfirmModal,
    showConsentModal,
    simpleMode,
    setShowConfirmModal,
    setShowConsentModal,
    setSimpleMode,
    connectWebSocket,
    toggleRecording,
    sendTextMessage,
    switchLanguage,
    switchService,
    updateFieldManual,
    userConfirm,
    submitApplication,
    uploadDocument
  } = useSession();

  // Connect WebSocket on initial load
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  return (
    <div className={simpleMode ? "simple-mode" : ""}>
      <Header
        language={language}
        onLanguageChange={switchLanguage}
        serviceId={serviceId}
        onServiceChange={switchService}
        availableServices={availableServices}
        simpleMode={simpleMode}
        onToggleSimpleMode={() => setSimpleMode(!simpleMode)}
        isConnected={isConnected}
      />

      <main className="main-container">
        {/* Left column: Voice assistant & Conversation */}
        <VoicePanel
          conversation={conversation}
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          onSendText={sendTextMessage}
          language={language}
        />

        {/* Center column: Dynamic Government Form */}
        <FormPanel
          serviceConfig={serviceConfig}
          sessionData={sessionData}
          language={language}
          activeFieldId={activeFieldId}
          onFieldChange={updateFieldManual}
          onRequestSubmit={() => setShowConfirmModal(true)}
        />

        {/* Right column: Document Vision Scanner & Action Log */}
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
          <DocumentScanner
            serviceConfig={serviceConfig}
            sessionData={sessionData}
            language={language}
            onUploadDocument={uploadDocument}
          />
          <ActionLog logs={actionLogs} sessionId={sessionId} />
        </div>
      </main>

      <ConsentModal
        isOpen={showConsentModal}
        onAccept={() => {
          setShowConsentModal(false);
          // If not connected, connect
          if (!isConnected) connectWebSocket();
        }}
        language={language}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        sessionData={sessionData}
        serviceConfig={serviceConfig}
        language={language}
        onConfirm={userConfirm}
        onSubmit={submitApplication}
      />
    </div>
  );
};

export default App;
