import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SendIcon } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  isRead: boolean;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface MessageListProps {
  user1Id: number;
  user2Id: number;
  currentUserId: number;
  recipientInfo?: User;
}

export default function MessageList({ 
  user1Id, 
  user2Id, 
  currentUserId,
  recipientInfo
}: MessageListProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/messages/${user1Id}/${user2Id}`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        senderId: currentUserId,
        receiverId: currentUserId === user1Id ? user2Id : user1Id,
        content
      });
    },
    onSuccess: () => {
      setMessage("");
      refetch();
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest("PUT", `/api/messages/${messageId}/read`, {});
    }
  });

  // Mark unread messages as read
  useEffect(() => {
    if (messages.length) {
      messages.forEach((msg: Message) => {
        if (msg.receiverId === currentUserId && !msg.isRead) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  }, [messages, currentUserId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-slate-100' : 'bg-primary-100'} rounded-lg p-3`}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="flex w-full items-center space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          {recipientInfo ? (
            <>
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>
                  {getInitials(`${recipientInfo.firstName} ${recipientInfo.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <span>{recipientInfo.firstName} {recipientInfo.lastName}</span>
            </>
          ) : (
            "Message Thread"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg: Message) => {
            const isSentByCurrentUser = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] ${
                    isSentByCurrentUser 
                      ? 'bg-primary-100 text-primary-900' 
                      : 'bg-slate-100 text-slate-900'
                  } rounded-lg p-3`}
                >
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs mt-1 text-slate-500">
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isSentByCurrentUser && (
                      <span className="ml-2">
                        {msg.isRead ? "Read" : "Delivered"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
