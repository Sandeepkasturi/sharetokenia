
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { usePeer } from '@/context/PeerContext';
import { useFileTransfer } from '@/context/FileTransferContext';
import { Laptop, User, Share2, RefreshCw, Users, Shield, MessageSquare, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

interface DevicesListProps {
  handleConnect: (deviceId: string) => void;
  isRefreshing: boolean;
  refreshDevices: () => void;
}

export const DevicesList: React.FC<DevicesListProps> = ({ 
  handleConnect, 
  isRefreshing, 
  refreshDevices 
}) => {
  const { onlineDevices, peerId, username } = usePeer();
  const { handlePeerConnect } = useFileTransfer();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleRefresh = () => {
    refreshDevices();
    setLastRefresh(new Date());
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-sm">
            {onlineDevices.length} {onlineDevices.length === 1 ? 'device' : 'devices'} found
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Scan for Devices
        </Button>
      </div>

      {/* Device info alert */}
      <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
        <Users className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-800">Your device info</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="flex flex-col gap-1 mt-2 text-xs">
            <div><strong>Username:</strong> {username || 'Not set'}</div>
            <div><strong>Device ID:</strong> {peerId || 'Not connected'}</div>
            <div><strong>Last scan:</strong> {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}</div>
          </div>
        </AlertDescription>
      </Alert>

      {onlineDevices.length === 0 ? (
        <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg border border-dashed border-gray-300">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Laptop className="mx-auto h-12 w-12 text-indigo-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click the button below to scan for available devices
            </p>
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleRefresh}
              className="mt-4"
            >
              Scan for devices
            </Button>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          className="grid gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {onlineDevices.map((device) => (
            <motion.div 
              key={device.id}
              variants={itemVariants}
              className={`flex items-center justify-between p-4 
                ${selectedDevice === device.id 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-md' 
                  : 'bg-white hover:bg-gray-50'
                } rounded-lg border transition-all duration-200 hover:shadow-sm`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500">
                  <AvatarFallback>{getInitials(device.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{device.username}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">ID: {device.id}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">Last seen: {getTimeAgo(device.lastSeen)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDevice(device.id);
                    handleConnect(device.id);
                  }}
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handlePeerConnect(device.id)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
};
