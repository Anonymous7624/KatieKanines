import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials, formatDate, formatTime } from "@/lib/utils";
import { CalendarIcon, CheckIcon, ClipboardListIcon, ImageIcon, MapPinIcon, Upload, PencilIcon, RefreshCcwIcon } from "lucide-react";
import MessageForm from "@/components/messages/MessageForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WalkerViewProps {
  switchRole?: (role: 'admin' | 'client' | 'walker' | null) => void;
}

export default function WalkerView({ switchRole }: WalkerViewProps) {
  const [selectedWalk, setSelectedWalk] = useState<Walk | null>(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const { toast } = useToast();
  
  // In a real app, we would get the walker ID from auth context
  const walkerId = 1; // Example walker ID
  const currentUserId = walkerId; // For message component
  
  // Fetch walker data
  const { data: walker = {} as Walker, isLoading: isWalkerLoading } = useQuery<Walker>({
    queryKey: [`/api/walkers/${walkerId}`],
  });
  
  // Fetch walks data
  const { data: walks = [] as Walk[], isLoading: isWalksLoading } = useQuery<Walk[]>({
    queryKey: [`/api/walkers/${walkerId}/walks`],
  });
  
  interface Walk {
    id: number;
    clientName: string;
    petName: string;
    allPetNames?: string;
    walkerName?: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    notes?: string;
    clientId: number;
    walkerId?: number;
    petId: number;
    isGroupWalk: boolean;
    address?: string;
  }

  interface Walker {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    walkerDetails?: {
      id: number;
      bio?: string;
      availability?: string;
      rating?: number;
    };
  }

  // Filter today's walks
  const [todaysWalks, setTodaysWalks] = useState<Walk[]>([]);
  const [upcomingWalks, setUpcomingWalks] = useState<Walk[]>([]);
  
  useEffect(() => {
    if (Array.isArray(walks) && walks.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Walks scheduled for today
      const todayWalks = (walks as Walk[]).filter((walk) => 
        walk.status === "scheduled" && walk.date === today
      ).sort((a, b) => {
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
      });
      
      // Upcoming walks (excluding today)
      const upcoming = (walks as Walk[]).filter((walk) => {
        return walk.status === "scheduled" && walk.date > today;
      }).sort((a, b) => {
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
      });
      
      setTodaysWalks(todayWalks);
      setUpcomingWalks(upcoming);
    }
  }, [walks]);
  
  // WebSocket connection reference
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Connection status component with timestamp
  const ConnectionStatus = () => (
    <div className="flex flex-col items-end text-sm text-slate-500">
      <div className="flex items-center">
        <span className={`h-2 w-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {wsConnected ? 'Live updates on' : 'Live updates off'}
      </div>
      <div className="text-xs mt-1">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Create WebSocket connection using the correct protocol based on current connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Initialize the WebSocket connection
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    
    // Connection opened event
    socket.addEventListener('open', (event) => {
      console.log("Connected to server WebSocket");
      setWsConnected(true);
      
      // Request the initial walker-specific walks data
      socket.send(JSON.stringify({
        type: 'get_walks_for_walker',
        walkerId
      }));
    });
    
    // Message received event
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'walks_data' || data.type === 'walks_update') {
          // When a general walks update is received, update the walks in React Query cache
          if (data.walks && Array.isArray(data.walks)) {
            if (data.walkerId === walkerId) {
              // Update React Query cache with the new walks data
              queryClient.setQueryData([`/api/walkers/${walkerId}/walks`], data.walks);
              
              // Set the last updated timestamp
              setLastUpdated(new Date());
              toast({
                title: "Schedule Updated",
                description: "Your walk schedule has been updated in real-time.",
              });
            }
          }
        } else if (data.type === 'connected') {
          console.log(data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Connection error event
    socket.addEventListener('error', (event) => {
      console.error("WebSocket error:", event);
      setWsConnected(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to real-time updates. Using periodic refreshes instead.",
        variant: "destructive"
      });
    });
    
    // Connection closed event
    socket.addEventListener('close', (event) => {
      console.log("WebSocket connection closed:", event);
      setWsConnected(false);
    });
    
    // Clean up the WebSocket connection when component unmounts
    return () => {
      console.log("Closing WebSocket connection");
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [walkerId, toast]);
  
  // Handle marking a walk as complete
  const completeWalk = async (walkId: number) => {
    try {
      await apiRequest("PUT", `/api/walks/${walkId}`, { status: "completed" });
      
      // Refresh walks data
      queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
      
      toast({
        title: "Walk completed",
        description: "The walk has been marked as completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark walk as completed.",
        variant: "destructive",
      });
    }
  };
  
  // Handle photo upload
  const uploadPhoto = async () => {
    if (!photoUrl || !selectedWalk) return;
    
    try {
      await apiRequest("POST", `/api/walks/${selectedWalk.id}/photos`, { photoUrl });
      
      setPhotoUrl("");
      setIsPhotoDialogOpen(false);
      
      toast({
        title: "Photo uploaded",
        description: "The photo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout pageTitle="Walker Dashboard" userRole="walker" switchRole={switchRole}>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-brown-dark text-3xl">Welcome, {walker?.firstName || "Walker"}</CardTitle>
                <CardDescription className="text-brown-medium text-base">Manage your schedule and update clients on their pet walks at Katie's Canines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats cards */}
                  <Card className="bg-pink-light border-pink-light/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <CalendarIcon className="h-9 w-9 text-primary mb-3" />
                        <h3 className="text-2xl font-bold text-brown-dark">
                          {todaysWalks.length}
                        </h3>
                        <p className="text-brown-medium">Today's Walks</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-pink-light border-pink-light/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <ClipboardListIcon className="h-9 w-9 text-primary mb-3" />
                        <h3 className="text-2xl font-bold text-brown-dark">
                          {upcomingWalks.length}
                        </h3>
                        <p className="text-brown-medium">Upcoming Walks</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-pink-light border-pink-light/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <MapPinIcon className="h-9 w-9 text-primary mb-3" />
                        <h3 className="text-2xl font-bold text-brown-dark">
                          {walker?.walkerDetails?.rating || 5}
                        </h3>
                        <p className="text-brown-medium">Rating</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="today">Today's Walks</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                </TabsList>
                
                <TabsContent value="today">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Today's Schedule</CardTitle>
                          <CardDescription>
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <ConnectionStatus />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                              setLastUpdated(new Date());
                              toast({
                                title: "Refreshed",
                                description: "Schedule data has been refreshed."
                              });
                            }}
                          >
                            <RefreshCcwIcon className="h-3 w-3 mr-1" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isWalksLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex justify-between items-center pb-4 border-b">
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                              </div>
                              <Skeleton className="h-8 w-24" />
                            </div>
                          ))}
                        </div>
                      ) : todaysWalks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-500">No walks scheduled for today.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {todaysWalks
                            .sort((a: Walk, b: Walk) => {
                              // Sort by time
                              const timeA = a.time.split(':');
                              const timeB = b.time.split(':');
                              return (parseInt(timeA[0]) * 60 + parseInt(timeA[1])) - 
                                    (parseInt(timeB[0]) * 60 + parseInt(timeB[1]));
                            })
                            .map((walk: Walk) => (
                              <div key={walk.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-lg">
                                    {formatTime(walk.time)}
                                  </h4>
                                  <Badge className={`${walk.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                                                    walk.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                                                    'bg-gray-100 text-gray-800'}`}>
                                    {walk.status.charAt(0).toUpperCase() + walk.status.slice(1)}
                                  </Badge>
                                </div>
                                <div className="mb-2">
                                  <div className="font-medium text-primary">
                                    {walk.allPetNames ? walk.allPetNames : walk.petName}
                                  </div>
                                  <span className="text-slate-500">{walk.duration} minutes</span>
                                </div>
                                <div className="mb-2">
                                  <span className="text-slate-700">{walk.clientName}</span>
                                </div>
                                <div className="flex items-center mb-3">
                                  <MapPinIcon className="h-4 w-4 text-primary mr-1 flex-shrink-0" />
                                  <span className="text-sm text-slate-700 font-medium">
                                    {walk.address || "Address not available"}
                                  </span>
                                </div>
                                {walk.notes && (
                                  <div className="text-sm bg-yellow-50 p-2 rounded-md mb-3 border border-yellow-200">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium">Notes:</span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          const newNotes = window.prompt("Enter notes for this walk:", walk.notes || "");
                                          if (newNotes !== null) {
                                            apiRequest("PUT", `/api/walks/${walk.id}`, { notes: newNotes })
                                              .then(() => {
                                                queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                                                toast({
                                                  title: "Notes Updated",
                                                  description: "Walk notes have been updated successfully.",
                                                });
                                              })
                                              .catch(error => {
                                                toast({
                                                  title: "Error",
                                                  description: `Failed to update notes: ${error.message}`,
                                                  variant: "destructive",
                                                });
                                              });
                                          }
                                        }}
                                      >
                                        <PencilIcon className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                    <p className="whitespace-pre-line">{walk.notes}</p>
                                  </div>
                                )}
                                {!walk.notes && (
                                  <div className="text-sm bg-slate-50 p-2 rounded-md mb-3 border border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-slate-400">No notes available</span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          const newNotes = window.prompt("Enter notes for this walk:", "");
                                          if (newNotes !== null && newNotes.trim() !== "") {
                                            apiRequest("PUT", `/api/walks/${walk.id}`, { notes: newNotes })
                                              .then(() => {
                                                queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                                                toast({
                                                  title: "Notes Added",
                                                  description: "Walk notes have been added successfully.",
                                                });
                                              })
                                              .catch(error => {
                                                toast({
                                                  title: "Error",
                                                  description: `Failed to add notes: ${error.message}`,
                                                  variant: "destructive",
                                                });
                                              });
                                          }
                                        }}
                                      >
                                        <PencilIcon className="h-3 w-3 mr-1" />
                                        Add Notes
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-end space-x-2">
                                  <Dialog 
                                    open={isPhotoDialogOpen && selectedWalk?.id === walk.id} 
                                    onOpenChange={(open) => {
                                      setIsPhotoDialogOpen(open);
                                      if (open) setSelectedWalk(walk);
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        Upload Photo
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Upload Walk Photo</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="photoUrl">Photo URL</Label>
                                          <Input 
                                            id="photoUrl" 
                                            placeholder="Enter image URL" 
                                            value={photoUrl}
                                            onChange={(e) => setPhotoUrl(e.target.value)}
                                          />
                                          <p className="text-xs text-slate-500">
                                            Enter a URL to a publicly accessible image
                                          </p>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-2">
                                          <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setIsPhotoDialogOpen(false)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={uploadPhoto}
                                            disabled={!photoUrl}
                                          >
                                            Upload Photo
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button size="sm" onClick={() => completeWalk(walk.id)}>
                                    <CheckIcon className="h-4 w-4 mr-2" />
                                    Complete
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="upcoming">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Upcoming Walks</CardTitle>
                        <div className="flex items-center gap-2">
                          <ConnectionStatus />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                              setLastUpdated(new Date());
                              toast({
                                title: "Refreshed",
                                description: "Schedule data has been refreshed."
                              });
                            }}
                          >
                            <RefreshCcwIcon className="h-3 w-3 mr-1" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isWalksLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex justify-between items-center pb-4 border-b">
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                              </div>
                              <Skeleton className="h-8 w-24" />
                            </div>
                          ))}
                        </div>
                      ) : upcomingWalks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-500">No upcoming walks scheduled.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {upcomingWalks.map((walk: Walk) => (
                            <div key={walk.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-lg">
                                    {formatDate(walk.date)} at {formatTime(walk.time)}
                                  </h4>
                                  <div className="mb-2">
                                    <div className="font-medium text-primary">
                                      {walk.allPetNames ? walk.allPetNames : walk.petName}
                                    </div>
                                    <span className="text-slate-500">{walk.duration} minutes</span>
                                  </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800">
                                  Scheduled
                                </Badge>
                              </div>
                              <div className="mb-2">
                                <span className="text-slate-700">{walk.clientName}</span>
                              </div>
                              <div className="flex items-center mb-3">
                                <MapPinIcon className="h-4 w-4 text-primary mr-1 flex-shrink-0" />
                                <span className="text-sm text-slate-700 font-medium">
                                  {walk.address || "Address not available"}
                                </span>
                              </div>
                              {walk.notes && (
                                <div className="text-sm bg-yellow-50 p-2 rounded-md mb-3 border border-yellow-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">Notes:</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => {
                                        const newNotes = window.prompt("Enter notes for this walk:", walk.notes || "");
                                        if (newNotes !== null) {
                                          apiRequest("PUT", `/api/walks/${walk.id}`, { notes: newNotes })
                                            .then(() => {
                                              queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                                              toast({
                                                title: "Notes Updated",
                                                description: "Walk notes have been updated successfully.",
                                              });
                                            })
                                            .catch(error => {
                                              toast({
                                                title: "Error",
                                                description: `Failed to update notes: ${error.message}`,
                                                variant: "destructive",
                                              });
                                            });
                                        }
                                      }}
                                    >
                                      <PencilIcon className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                  <p className="whitespace-pre-line">{walk.notes}</p>
                                </div>
                              )}
                              {!walk.notes && (
                                <div className="text-sm bg-slate-50 p-2 rounded-md mb-3 border border-slate-200">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-400">No notes available</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => {
                                        const newNotes = window.prompt("Enter notes for this walk:", "");
                                        if (newNotes !== null && newNotes.trim() !== "") {
                                          apiRequest("PUT", `/api/walks/${walk.id}`, { notes: newNotes })
                                            .then(() => {
                                              queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
                                              toast({
                                                title: "Notes Added",
                                                description: "Walk notes have been added successfully.",
                                              });
                                            })
                                            .catch(error => {
                                              toast({
                                                title: "Error",
                                                description: `Failed to add notes: ${error.message}`,
                                                variant: "destructive",
                                              });
                                            });
                                        }
                                      }}
                                    >
                                      <PencilIcon className="h-3 w-3 mr-1" />
                                      Add Notes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isWalksLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(walks) && (walks as Walk[]).filter(walk => walk.status === "completed")
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((walk) => (
                          <div key={walk.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary-100 text-primary-600">
                                {getInitials(walk.petName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {walk.petName}'s walk completed
                              </p>
                              <p className="text-sm text-slate-500">
                                {formatDate(walk.date)} at {formatTime(walk.time)}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                      {Array.isArray(walks) && (walks as Walk[]).filter(walk => walk.status === "completed").length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-slate-500">No recent activity to show.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    Communicate with your clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <MessageForm currentUserId={currentUserId} userRole="walker" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
