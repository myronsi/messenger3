
import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const ChatSidebar: React.FC = () => {
  const { user } = useAuth();
  const { chats, currentChat, selectChat, onlineUsers } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    const chatName = getChatName(chat, user?.id || 0);
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Function to get display name for a chat
  const getChatName = (chat: any, currentUserId: number): string => {
    if (chat.isGroup) return chat.name;
    
    // For direct messages, show the other person's name
    const otherParticipant = chat.participants?.find(
      (p: any) => p.id !== currentUserId
    );
    return otherParticipant?.username || 'Unknown User';
  };

  // Function to get the last message preview
  const getLastMessagePreview = (chat: any): string => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const sender = chat.lastMessage.senderId === user?.id ? 'You' : 
      chat.participants.find((p: any) => p.id === chat.lastMessage.senderId)?.username || 'Unknown';
    
    return `${sender}: ${chat.lastMessage.content.substring(0, 20)}${chat.lastMessage.content.length > 20 ? '...' : ''}`;
  };

  // Function to check if a user is online
  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.includes(userId);
  };

  return (
    <div className="w-80 border-r border-border bg-card h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Messages</h2>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-3 py-2 bg-secondary/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            const chatName = getChatName(chat, user?.id || 0);
            const isActive = currentChat?.id === chat.id;
            const otherUser = !chat.isGroup ? 
              chat.participants.find((p: any) => p.id !== user?.id) : null;
            
            return (
              <div 
                key={chat.id}
                className={`p-3 cursor-pointer hover:bg-secondary/70 transition-colors border-b border-border ${isActive ? 'bg-secondary' : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      {chat.isGroup ? 'G' : chatName.charAt(0).toUpperCase()}
                    </div>
                    {otherUser && (
                      <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${isUserOnline(otherUser.id) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">{chatName}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate">
                      {getLastMessagePreview(chat)}
                    </p>
                    
                    {chat.unreadCount > 0 && (
                      <div className="mt-1 flex">
                        <span className="text-xs font-medium bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                          {chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <p>No conversations found</p>
            {searchQuery && (
              <button 
                className="mt-2 text-primary text-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
