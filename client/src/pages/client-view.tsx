import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatTime } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import MessageForm from "@/components/messages/MessageForm";
import { CalendarIcon, ImageIcon, MapPinIcon, MessageSquareIcon } from "lucide-react";
import WalkForm from "@/components/walks/WalkForm";

interface ClientViewProps {
  switchRole?: (role: 'admin' | 'client' | 'walker' | null) => void;
}

export default function ClientView({ switchRole }: ClientViewProps) {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  // In a real app, we would get the client ID from auth context
  const clientId = 1; // Example client ID
  const currentUserId = clientId; // For message component
  
  // Fetch pets data
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
  });
  
  // Fetch walks data
  const { data: walks = [], isLoading: isWalksLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/walks`],
  });
  
  // Filter upcoming walks
  const upcomingWalks = walks.filter((walk: any) => 
    walk.status === "scheduled" && new Date(walk.date) >= new Date()
  ).sort((a: any, b: any) => {
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });
  
  // Filter past walks
  const pastWalks = walks.filter((walk: any) => 
    walk.status === "completed"
  ).sort((a: any, b: any) => {
    return new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime();
  });

  return (
    <MainLayout pageTitle="Client Dashboard" userRole="client" switchRole={switchRole}>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-brown-dark text-3xl">Welcome Back, {client?.firstName || "Client"}</CardTitle>
                <CardDescription className="text-brown-medium text-base">Manage your pet walks and communicate with your walkers at Katie's Canines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats cards */}
                  <Card className="bg-pink-light border-pink-light/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <CalendarIcon className="h-9 w-9 text-primary mb-3" />
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
                        <ImageIcon className="h-9 w-9 text-primary mb-3" />
                        <h3 className="text-2xl font-bold text-brown-dark">
                          {pastWalks.length}
                        </h3>
                        <p className="text-brown-medium">Completed Walks</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-pink-light border-pink-light/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <MapPinIcon className="h-9 w-9 text-primary mb-3" />
                        <h3 className="text-2xl font-bold text-brown-dark">
                          {client?.pets?.length || 0}
                        </h3>
                        <p className="text-brown-medium">Active Pets</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-4">
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="rounded-full px-6">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Schedule a Walk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Schedule a New Walk</DialogTitle>
                      <DialogDescription>
                        Book a walk for your pet with one of our trusted dog walkers.
                      </DialogDescription>
                    </DialogHeader>
                    <WalkForm 
                      onSuccess={() => setIsScheduleDialogOpen(false)}
                      defaultValues={{
                        clientId: clientId
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming Walks</TabsTrigger>
                  <TabsTrigger value="completed">Past Walks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Walks</CardTitle>
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
                          <Button className="mt-4" onClick={() => setIsScheduleDialogOpen(true)}>
                            Schedule Your First Walk
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {upcomingWalks.slice(0, 5).map((walk: any) => (
                            <div key={walk.id} className="flex justify-between items-center pb-4 border-b last:border-b-0 last:pb-0">
                              <div>
                                <h4 className="font-medium">{formatDate(walk.date)} at {formatTime(walk.time)}</h4>
                                <p className="text-sm text-slate-500">
                                  {walk.petName} with {walk.walkerName || "Unassigned Walker"} ({walk.duration} min)
                                </p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Scheduled
                              </Badge>
                            </div>
                          ))}
                          
                          {upcomingWalks.length > 5 && (
                            <div className="text-center pt-2">
                              <Button variant="link">View All ({upcomingWalks.length})</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Walks</CardTitle>
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
                      ) : pastWalks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-500">No completed walks yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pastWalks.slice(0, 5).map((walk: any) => (
                            <div key={walk.id} className="flex justify-between items-center pb-4 border-b last:border-b-0 last:pb-0">
                              <div>
                                <h4 className="font-medium">{formatDate(walk.date)} at {formatTime(walk.time)}</h4>
                                <p className="text-sm text-slate-500">
                                  {walk.petName} with {walk.walkerName || "Unassigned Walker"} ({walk.duration} min)
                                </p>
                              </div>
                              <Button variant="ghost" size="sm">View Photos</Button>
                            </div>
                          ))}
                          
                          {pastWalks.length > 5 && (
                            <div className="text-center pt-2">
                              <Button variant="link">View All ({pastWalks.length})</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>My Pets</CardTitle>
                </CardHeader>
                <CardContent>
                  {isClientLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !client?.pets?.length ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500">No pets registered yet.</p>
                      <Button variant="outline" className="mt-4">Add a Pet</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {client.pets.filter((pet: any) => pet.isActive).map((pet: any) => (
                        <div key={pet.id} className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-bold">{pet.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{pet.name}</h4>
                            <p className="text-sm text-slate-500">
                              {pet.breed || "Mixed"}, {pet.age || "?"} years old
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquareIcon className="h-5 w-5 mr-2" />
                    Messages
                  </CardTitle>
                  <CardDescription>
                    Chat with your dog walkers
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <MessageForm currentUserId={currentUserId} userRole="client" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
