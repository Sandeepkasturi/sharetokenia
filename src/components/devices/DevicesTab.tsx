
import React, { useState, useEffect } from 'react';
import { usePeer } from '@/context/PeerContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DevicesList } from './DevicesList';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import { ChatInterface } from './ChatInterface';

export const DevicesTab: React.FC = () => {
  const { 
    username, 
    announcePresence, 
    setIsChatOpen, 
    isChatOpen, 
    activeChatPeer, 
    setActiveChatPeer,
    onlineDevices
  } = usePeer();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-scan for devices when the component mounts
  useEffect(() => {
    if (username) {
      refreshDevices();
      
      // Set up an interval to refresh devices
      const interval = setInterval(() => {
        refreshDevices(false); // Silent refresh
      }, 10000); // Every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [username]);

  const handleConnect = (deviceId: string) => {
    setActiveChatPeer(deviceId);
    setIsChatOpen(true);
    toast.info(`Opening chat with ${deviceId}...`);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setActiveChatPeer(null);
  };

  const refreshDevices = (showToast = true) => {
    setIsRefreshing(true);
    announcePresence();
    
    if (showToast) {
      toast.info("Scanning for devices...");
    }
    
    // Reset refreshing state after animation completes
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <AnimatePresence mode="wait">
      {!isChatOpen ? (
        <motion.div 
          key="devices-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6 animate-fade-up"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Available Devices</h2>
            <p className="text-sm text-gray-500 mt-1">
              Connect to another device to chat and share files
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {onlineDevices.length > 0 
                ? `Found ${onlineDevices.length} devices` 
                : "No devices found. Try refreshing."}
            </p>
          </div>

          <DevicesList 
            handleConnect={handleConnect}
            isRefreshing={isRefreshing}
            refreshDevices={refreshDevices}
          />
          
          <DeviceStatusBadge />
        </motion.div>
      ) : (
        <motion.div 
          key="chat-interface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full flex flex-col"
        >
          <ChatInterface onClose={handleCloseChat} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
