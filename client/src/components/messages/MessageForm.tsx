import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MessageList from "./MessageList";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface MessageFormProps {
  currentUserId: number;
  userRole: string;
}

export default function MessageForm({ 
  currentUserId,
  userRole
}: MessageFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Fetch appropriate users based on role
  const { data: users = [], isLoading } = useQuery({
    queryKey: [userRole === 'client' ? "/api/walkers" : "/api/clients"],
  });
  
  const filteredUsers = users.filter((user: User) => user.id !== currentUserId && user.isActive);
  
  // Get selected user info
  const selectedUser = filteredUsers.find(
    (user: any) => 
      (userRole === 'client' && user.walkerDetails?.id === selectedUserId) ||
      (userRole !== 'client' && user.clientDetails?.id === selectedUserId)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Select Recipient</Label>
              <Select 
                onValueChange={(value) => setSelectedUserId(Number(value))}
                disabled={isLoading || filteredUsers.length === 0}
              >
                <SelectTrigger id="recipient">
                  <SelectValue placeholder={
                    isLoading 
                      ? "Loading..." 
                      : filteredUsers.length === 0 
                        ? "No recipients available" 
                        : "Select a recipient"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map((user: any) => (
                    <SelectItem 
                      key={userRole === 'client' ? user.walkerDetails.id : user.clientDetails.id} 
                      value={(userRole === 'client' ? user.walkerDetails.id : user.clientDetails.id).toString()}
                    >
                      {user.firstName} {user.lastName} 
                      {user.role && ` (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <MessageList 
          user1Id={currentUserId}
          user2Id={selectedUserId}
          currentUserId={currentUserId}
          recipientInfo={selectedUser}
        />
      )}
    </div>
  );
}
