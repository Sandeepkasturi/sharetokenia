
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Users, Paperclip, Image, ChevronRight, Info, MoreVertical, Search, Home, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePeer } from '../context/PeerContext';
import { useFileTransfer } from '../context/FileTransferContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatMessage } from '@/types/peer.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ChatPage: React.FC = () => {
  const { 
    username, 
    peerId, 
    chatMessages, 
    broadcastMessage, 
    onlineDevices, 
    scanForDevices, 
    isScanning,
    announcePresence
  } = usePeer();
  
  const { currentFiles, handleFileSelect } = useFileTransfer();
  const [newMessage, setNewMessage] = useState('');
  const [showFileShare, setShowFileShare] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Periodically announce presence and scan for devices
  useEffect(() => {
    // Immediate initial scan
    if (username) {
      announcePresence();
      scanForDevices();
    }
    
    const interval = setInterval(() => {
      if (username) {
        scanForDevices();
        announcePresence();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [username]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    broadcastMessage(newMessage);
    setNewMessage('');
    
    // Focus the textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const confirmFileShare = () => {
    if (currentFiles.length === 0) return;
    
    const fileNames = currentFiles.map(f => f.name).join(', ');
    
    // Create file data for sharing
    const fileDataToShare = currentFiles.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type 
    }));
    
    broadcastMessage(
      `I'm sharing files with everyone: ${fileNames}`, 
      'file',
      { 
        name: fileNames,
        size: currentFiles.reduce((total, f) => total + f.size, 0),
        type: currentFiles.length > 1 ? 'multiple' : currentFiles[0].type,
        files: fileDataToShare
      }
    );
    
    setShowFileShare(false);
    toast.success('Files shared with everyone');
  };

  // Force refresh chat from peers
  const refreshChat = () => {
    announcePresence();
    scanForDevices();
    toast.info("Refreshing chat and looking for new messages...");
  };

  const broadcastMessages = chatMessages['broadcast'] || [];
  const onlineCount = onlineDevices.length;

  if (!username) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="mb-4 text-center animate-bounce">
          <Users className="h-12 w-12 text-indigo-500 mx-auto mb-2" />
          <p className="text-lg font-medium text-gray-700">Please set your username first</p>
        </div>
        <Link to="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md">
          <Home className="h-4 w-4" />
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 shadow-lg z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Global Chat</h1>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                <p className="text-xs text-indigo-100">{onlineCount} {onlineCount === 1 ? 'user' : 'users'} online</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10" 
              size="sm"
              onClick={refreshChat}
            >
              <RefreshCw className={`h-5 w-5 ${isScanning ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10" 
              size="sm"
              onClick={() => setShowOnlineUsers(true)}
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10" size="sm">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10" size="sm">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden bg-[url('https://i.pinimg.com/originals/97/c0/07/97c00759d90d786d9b6096d274ad3e07.png')] bg-repeat">
        <ScrollArea className="h-full py-3 px-2 md:py-6 md:px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {broadcastMessages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 rounded-lg p-6 md:p-8 text-center shadow-sm backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                <p className="text-gray-500">Be the first to send a message to everyone in this chat room!</p>
                <Button
                  variant="outline"
                  onClick={refreshChat}
                  className="mt-4"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  Refresh Chat
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {broadcastMessages.map((message, index) => {
                  const showAvatar = index === 0 || 
                    broadcastMessages[index - 1].senderId !== message.senderId;
                  
                  return (
                    <MessageBubble 
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === peerId}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-3 shadow-md">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="text-indigo-600 h-10 w-10 rounded-full hover:bg-indigo-50"
              onClick={handleFileButtonClick}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(Array.from(e.target.files));
                  setShowFileShare(true);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-indigo-600 h-10 w-10 rounded-full hover:bg-indigo-50"
            >
              <Image className="h-5 w-5" />
            </Button>
          </div>
          
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[50px] max-h-[120px] rounded-2xl border-gray-300 focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none"
            onKeyDown={handleKeyDown}
          />
          
          <Button
            className="rounded-full h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-md"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* File Share Dialog */}
      <Dialog open={showFileShare} onOpenChange={setShowFileShare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Files With Everyone</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentFiles.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <p className="text-sm text-gray-500">No files selected</p>
                <p className="text-xs text-gray-400 mt-1">Please select files to share</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Selected files:</p>
                {currentFiles.map((file, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFileShare(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmFileShare}
              disabled={currentFiles.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Share With Everyone
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Users Dialog */}
      <Dialog open={showOnlineUsers} onOpenChange={setShowOnlineUsers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Online Users</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] mt-4 pr-4">
            <div className="space-y-2">
              {onlineDevices.map(device => (
                <motion.div 
                  key={device.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500">
                      <AvatarFallback className="text-white font-medium">
                        {device.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{device.username}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">ID: {device.id}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              ))}

              {onlineDevices.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No users online at the moment</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isScanning ? 'Searching for users...' : 'Try refreshing to find users'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => {
                scanForDevices();
                announcePresence();
                toast.info('Refreshing user list...');
              }}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? 'Scanning...' : 'Refresh Users List'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser,
  showAvatar
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-2 mb-2",
        isCurrentUser ? "justify-end" : "justify-start",
        !showAvatar && !isCurrentUser ? "pl-12" : "" // Indent for continuity
      )}
    >
      {!isCurrentUser && showAvatar && (
        <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {isCurrentUser && !showAvatar && <div className="w-3"></div>}
      
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm",
        isCurrentUser 
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none" 
          : "bg-white text-gray-800 rounded-bl-none",
        !showAvatar && !isCurrentUser ? "rounded-tl-2xl" : "",
        !showAvatar && isCurrentUser ? "rounded-tr-2xl" : ""
      )}>
        {showAvatar && !isCurrentUser && (
          <div className="text-xs font-medium mb-1 text-indigo-600">{message.senderName}</div>
        )}
        
        {message.type === 'text' && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        {message.type === 'file' && (
          <div className="flex flex-col">
            <p className="text-sm mb-1">{message.content}</p>
            {message.fileData && (
              <div className={cn(
                "rounded-lg p-3 mt-1 text-xs",
                isCurrentUser ? "bg-indigo-700/60" : "bg-gray-100"
              )}>
                <div className="font-medium">Shared Files:</div>
                <div className={cn(
                  "mt-1",
                  isCurrentUser ? "text-indigo-100" : "text-gray-600"
                )}>
                  {message.fileData.name}
                  {message.fileData.size && (
                    <span className="ml-2 opacity-80">
                      ({(message.fileData.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <span 
          className={cn(
            "text-xs block mt-1",
            isCurrentUser ? "text-indigo-200" : "text-gray-500"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
    </motion.div>
  );
};
