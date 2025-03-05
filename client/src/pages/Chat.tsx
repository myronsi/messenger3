
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatSidebar from '../components/ChatSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import Button from '../components/ui/Button';

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentChat } = useChat();
  
  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <header className="h-16 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center">
                <h2 className="font-medium">{currentChat.name}</h2>
                {/* Status indicator for direct chats */}
                {!currentChat.isGroup && currentChat.participants.length === 2 && (
                  <div className="ml-2 flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{user?.username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </header>
            
            <MessageList />
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Chat App</h2>
              <p className="text-muted-foreground max-w-md">
                Select a conversation from the sidebar or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
