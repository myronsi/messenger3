
import React, { useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface MessageGrouping {
  senderId: number;
  username: string;
  messages: any[];
}

const MessageList: React.FC = () => {
  const { currentChat, messages, isLoading } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  
  // Group messages by sender and consecutive time
  const groupedMessages = messages.reduce((acc: MessageGrouping[], message) => {
    const sender = currentChat?.participants.find(p => p.id === message.senderId);
    const username = sender?.username || 'Unknown User';
    
    // If last group is from the same sender and within 5 minutes, add to that group
    const lastGroup = acc[acc.length - 1];
    
    if (
      lastGroup && 
      lastGroup.senderId === message.senderId &&
      new Date(message.createdAt).getTime() - new Date(lastGroup.messages[lastGroup.messages.length - 1].createdAt).getTime() < 5 * 60 * 1000
    ) {
      lastGroup.messages.push(message);
    } else {
      // Create a new group
      acc.push({
        senderId: message.senderId,
        username,
        messages: [message]
      });
    }
    
    return acc;
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);
  
  // Handle loading more messages when scrolling to top
  useEffect(() => {
    const container = containerRef.current;
    
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
      
      const handleScroll = () => {
        if (container.scrollTop === 0 && !isLoading) {
          // TODO: Implement pagination for older messages
          // This would call something like:
          // fetchHistory(currentChat.id, currentPage + 1);
          
          // We would need to maintain the scroll position after loading more messages
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - prevScrollHeightRef.current;
          container.scrollTop = heightDifference;
          prevScrollHeightRef.current = newScrollHeight;
        }
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading, currentChat]);
  
  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }
  
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        groupedMessages.map((group, groupIndex) => {
          const isCurrentUser = group.senderId === user?.id;
          
          return (
            <div key={`group-${groupIndex}`} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[75%]`}>
                {!isCurrentUser && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {group.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  {!isCurrentUser && (
                    <span className="text-xs text-muted-foreground mb-1">{group.username}</span>
                  )}
                  
                  <div className="space-y-1">
                    {group.messages.map((message, messageIndex) => (
                      <div
                        key={message.id || `temp-${messageIndex}`}
                        className={`px-4 py-2 rounded-2xl max-w-full break-words text-sm
                          ${isCurrentUser 
                              ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                              : 'bg-secondary text-secondary-foreground rounded-tl-sm'}`}
                      >
                        {message.content}
                        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isCurrentUser && (
                            <span className="ml-1">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
