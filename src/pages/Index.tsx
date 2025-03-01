
import React from "react";
import { PeerProvider } from "../context/PeerContext";
import { FileTransferProvider } from "../context/FileTransferContext";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { HeroSection } from "../components/HeroSection";
import { FileTransferTabs } from "../components/FileTransferTabs";
import { InfoSection } from "../components/InfoSection";
import { Footer } from "../components/Footer";
import { PermissionDialog } from "@/components/PermissionDialog";
import { UsernameDialog } from "@/components/UsernameDialog";
import { useFileTransfer } from "../context/FileTransferContext";

// Main content component
const IndexContent: React.FC = () => {
  const { showPermissionDialog, pendingPermission, handlePermissionResponse } = useFileTransfer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <ConnectionStatus />
        <HeroSection />
        <FileTransferTabs />
        <InfoSection />
        <Footer />
      </div>
      
      {/* Dialogs */}
      <UsernameDialog />
      
      {showPermissionDialog && (
        <PermissionDialog 
          requesterPeerId={pendingPermission.conn?.peer || ''}
          files={pendingPermission.files}
          onConfirm={() => handlePermissionResponse(true)}
          onCancel={() => handlePermissionResponse(false)}
        />
      )}
    </div>
  );
};

// Wrapper with providers
const Index: React.FC = () => {
  return (
    <PeerProvider>
      <FileTransferProvider>
        <IndexContent />
      </FileTransferProvider>
    </PeerProvider>
  );
};

export default Index;
