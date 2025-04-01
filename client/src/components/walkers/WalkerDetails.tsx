import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, DollarSign, ChevronLeft, ChevronRight, Info } from "lucide-react";
import WalkerForm from "./WalkerForm";
import WalkerPaymentForm from "./WalkerPaymentForm";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Walker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  walkerDetails: {
    id: number;
    bio?: string;
    availability?: string;
    rating?: number;
    rate20Min?: string;
    rate30Min?: string;
    rate60Min?: string;
    rateOvernight?: string;
    totalEarnings?: string;
    unpaidEarnings?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface WalkerEarning {
  id: number;
  walkerId: number;
  walkId: number;
  amount: string;
  earnedDate: string;
  isPaid: boolean;
  walkDetails?: {
    date: string;
    time: string;
    duration: number;
    clientName: string;
    petName: string;
  };
}

interface WalkerPayment {
  id: number;
  walkerId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

interface Walk {
  id: number;
  date: string;
  time: string;
  status: string;
  duration: number;
  petId: number;
  clientName: string;
  petName: string;
  notes?: string;
  allPetNames?: string;
  address?: string;
}

interface WalkerDetailsProps {
  walkerId: number;
}

export default function WalkerDetails({ walkerId }: WalkerDetailsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();
  
  // Function to determine time frame based on the time
  const getTimeFrame = (time: string): string => {
    const hour = parseInt(time.split(':')[0]);
    
    if (hour >= 8 && hour < 11) {
      return "Morning";
    } else if (hour >= 11 && hour < 14) {
      return "Midday";
    } else if (hour >= 14 && hour < 17) {
      return "Early Evening";
    } else if (hour >= 17 && hour < 20) {
      return "Late Evening";
    } else {
      return "Night";
    }
  };
  
  // Function to get pet and client address from petId
  const getPetAddress = (petId: number): string => {
    // Try to find client info from the walk
    const clientInfo = Array.isArray(walks) ? 
      walks.find((walk: Walk) => walk.petId === petId) : null;
    
    if (clientInfo) {
      return `${clientInfo.clientName}'s Address: 123 Main St, Anytown, CA 12345`;
    }
    
    return "Client address information will be displayed here";
  };
  
  // Function to mark a walk as completed
  const markWalkAsCompleted = (walkId: number) => {
    if (!confirm("Are you sure you want to mark this walk as completed?")) {
      return;
    }
    
    // Call API to update walk status
    apiRequest("PUT", `/api/walks/${walkId}`, { status: "completed" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/walks`] });
        toast({
          title: "Walk Completed",
          description: "The walk has been marked as completed successfully.",
        });
      })
      .catch(error => {
        toast({
          title: "Error",
          description: `Failed to mark walk as completed: ${error.message}`,
          variant: "destructive",
        });
      });
  };

  console.log("WalkerDetails component - walkerId prop:", walkerId);

  const { data: walker, isLoading, isError } = useQuery({
    queryKey: [`/api/walkers/${walkerId}`],
  });

  // Log the walker data received from the API
  console.log("WalkerDetails component - walker data:", walker);

  const { data: walks = [], isLoading: isWalksLoading } = useQuery({
    queryKey: [`/api/walkers/${walkerId}/walks`],
  });
  
  // Filter walks for the selected date
  const walksForSelectedDate = Array.isArray(walks) 
    ? walks.filter((walk: Walk) => {
        const walkDate = new Date(walk.date);
        const selected = new Date(selectedDate);
        return walkDate.getFullYear() === selected.getFullYear() && 
               walkDate.getMonth() === selected.getMonth() && 
               walkDate.getDate() === selected.getDate();
      })
    : [];
  
  const { data: walkerEarnings = [], isLoading: isEarningsLoading } = useQuery<WalkerEarning[]>({
    queryKey: [`/api/walkers/${walkerId}/earnings`],
    // Add a retry mechanism to ensure data loads properly
    retry: 3,
    refetchOnWindowFocus: true, 
  });
  
  // Log earnings data
  console.log("WalkerDetails component - earnings data:", walkerEarnings);
  
  const { data: walkerPayments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: [`/api/walkers/${walkerId}/payments`],
  });

  const deactivateWalkerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/walkers/${walkerId}`, { 
        user: { isActive: false } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}`] });
      toast({
        title: "Walker deactivated",
        description: "Walker has been deactivated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate walker: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-medium text-lg text-red-500">Error loading walker details</h3>
              <p className="text-sm text-slate-500 mt-2">There was a problem fetching the walker information. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const walkerData: Walker = walker;
  let availabilityObj = {};
  
  try {
    if (walkerData.walkerDetails.availability) {
      availabilityObj = JSON.parse(walkerData.walkerDetails.availability);
    }
  } catch (e) {
    // If parsing fails, keep the original string
    availabilityObj = { "error": "Could not parse availability" };
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {walkerData.firstName} {walkerData.lastName}
          {!walkerData.isActive && (
            <Badge variant="outline" className="ml-2 bg-slate-100">
              Inactive
            </Badge>
          )}
        </h1>
        <Button onClick={() => setIsEditOpen(!isEditOpen)}>
          <PencilIcon className="h-4 w-4 mr-2" />
          {isEditOpen ? "Cancel Edit" : "Edit Walker"}
        </Button>
      </div>

      {isEditOpen ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Walker</CardTitle>
          </CardHeader>
          <CardContent>
            <WalkerForm 
              walkerId={walkerData.walkerDetails.id} 
              onSuccess={() => setIsEditOpen(false)}
              defaultValues={{
                user: {
                  username: "",  // Can't edit username
                  password: "",  // Can't edit password through this form
                  email: walkerData.email,
                  firstName: walkerData.firstName,
                  lastName: walkerData.lastName,
                  phone: walkerData.phone || "",
                },
                walker: {
                  bio: walkerData.walkerDetails.bio || "",
                  availability: walkerData.walkerDetails.availability || "",
                  street: walkerData.walkerDetails.street || "",
                  city: walkerData.walkerDetails.city || "",
                  state: walkerData.walkerDetails.state || "",
                  zip: walkerData.walkerDetails.zip || "",
                },
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="walks">Walk History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Walker Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Email</h4>
                    <p>{walkerData.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Phone</h4>
                    <p>{walkerData.phone || "No phone number provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Address</h4>
                    <div className="space-y-1">
                      <p>{walkerData.walkerDetails.street || "No street address provided"}</p>
                      <p>
                        {walkerData.walkerDetails.city || "-"}{walkerData.walkerDetails.city && walkerData.walkerDetails.state ? ", " : ""}{walkerData.walkerDetails.state || ""}
                        {(walkerData.walkerDetails.city || walkerData.walkerDetails.state) && walkerData.walkerDetails.zip ? " " : ""}
                        {walkerData.walkerDetails.zip || ""}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Bio</h4>
                    <p className="whitespace-pre-line">{walkerData.walkerDetails.bio || "No bio provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Rating</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 ${i < (walkerData.walkerDetails.rating || 0) ? "text-yellow-400" : "text-slate-300"}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2">{walkerData.walkerDetails.rating || 0}/5</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                  <Button 
                    variant="destructive" 
                    onClick={() => deactivateWalkerMutation.mutate()}
                    disabled={deactivateWalkerMutation.isPending || !walkerData.isActive}
                  >
                    {deactivateWalkerMutation.isPending ? "Deactivating..." : "Deactivate Walker"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                  <CardDescription>Walker's typical schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  {typeof availabilityObj === 'object' && !('error' in availabilityObj) ? (
                    <div className="space-y-3">
                      {Object.entries(availabilityObj).map(([day, times]) => (
                        <div key={day} className="flex justify-between">
                          <span className="font-medium capitalize">{day}</span>
                          <span>
                            {Array.isArray(times) && times.length === 2 
                              ? `${times[0]} - ${times[1]}`
                              : "Not available"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{walkerData.walkerDetails.availability || "No availability information provided"}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="earnings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Rate Structure</CardTitle>
                    <CardDescription>Current payment rates for this walker</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">20 Minute Walk:</span>
                        <span className="font-medium">{formatCurrency(walkerData.walkerDetails.rate20Min || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">30 Minute Walk:</span>
                        <span className="font-medium">{formatCurrency(walkerData.walkerDetails.rate30Min || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">60 Minute Walk:</span>
                        <span className="font-medium">{formatCurrency(walkerData.walkerDetails.rate60Min || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overnight Stay:</span>
                        <span className="font-medium">{formatCurrency(walkerData.walkerDetails.rateOvernight || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Update Rates
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Enter Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WalkerPaymentForm 
                      walkerId={walkerId} 
                      unpaidAmount={Number(walkerData.walkerDetails.unpaidEarnings || 0)}
                      onSuccess={() => {
                        // Refresh data
                        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}`] });
                        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/earnings`] });
                        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/payments`] });
                        toast({
                          title: "Payment recorded",
                          description: `Payment has been recorded successfully.`,
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings History</CardTitle>
                    <CardDescription>
                      Track walks and earned amounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEarningsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center pb-4 border-b">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : walkerEarnings.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500">No earnings recorded yet for this walker.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {walkerEarnings.map((earning: WalkerEarning) => (
                          <div key={earning.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                            <div>
                              <h4 className="font-medium">{formatDate(earning.earnedDate)}</h4>
                              {earning.walkDetails && (
                                <p className="text-sm text-slate-500">
                                  {earning.walkDetails.petName} - {earning.walkDetails.duration} minutes
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{formatCurrency(earning.amount)}</span>
                              <Badge className={
                                earning.isPaid 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }>
                                {earning.isPaid ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPaymentsLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="flex justify-between items-center pb-4 border-b">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : walkerPayments.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500">No payments recorded yet for this walker.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {walkerPayments.map((payment: WalkerPayment) => (
                          <div key={payment.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                            <div>
                              <h4 className="font-medium">{formatDate(payment.paymentDate)}</h4>
                              <p className="text-sm text-slate-500">
                                Method: {payment.paymentMethod}
                                {payment.notes && <span className="ml-1">({payment.notes})</span>}
                              </p>
                            </div>
                            <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between items-center">
                    <span className="text-sm font-medium">Unpaid Earnings:</span>
                    <span className="font-bold text-red-600">{formatCurrency(walkerData.walkerDetails.unpaidEarnings || 0)}</span>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Daily Schedule</CardTitle>
                    <CardDescription>Walk schedule for this walker</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                      // Navigate to previous day
                      const prevDay = new Date(selectedDate);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setSelectedDate(prevDay);
                    }}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-medium">{formatDate(selectedDate.toISOString().split('T')[0])}</div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                      // Navigate to next day
                      const nextDay = new Date(selectedDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setSelectedDate(nextDay);
                    }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isWalksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center pb-4 border-b">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {walksForSelectedDate.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500">No walks scheduled for this day.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {walksForSelectedDate
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
                                  {walk.time} - {getTimeFrame(walk.time)}
                                </h4>
                                <Badge className={`${walk.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                                                   walk.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                                                   'bg-gray-100 text-gray-800'}`}>
                                  {walk.status.charAt(0).toUpperCase() + walk.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="mb-2">
                                <span className="font-medium text-primary">{walk.petName}</span>
                                {walk.allPetNames && walk.petName !== walk.allPetNames && (
                                  <span className="text-slate-600"> (+ {walk.allPetNames.split(',').length - 1} other pets)</span>
                                )}
                                <span className="ml-2 text-slate-500">{walk.duration} minutes</span>
                              </div>
                              <div className="mb-2">
                                <span className="font-medium">Client:</span>
                                <span className="text-slate-700 ml-1">{walk.clientName}</span>
                              </div>
                              <div className="text-sm text-slate-700 mb-3 font-medium">
                                Address: {walk.address || "123 Main St, Anytown, CA 12345"}
                              </div>
                              {walk.notes && (
                                <div className="text-sm bg-yellow-50 p-2 rounded-md mb-3 border border-yellow-200">
                                  <span className="font-medium">Notes:</span> {walk.notes}
                                </div>
                              )}
                              <div className="flex justify-end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="mr-2">
                                      <Info className="h-4 w-4 mr-1" />
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Walk Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Date</p>
                                          <p>{formatDate(walk.date)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Time</p>
                                          <p>{walk.time}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Duration</p>
                                          <p>{walk.duration} minutes</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Status</p>
                                          <p className="capitalize">{walk.status}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Client</p>
                                          <p>{walk.clientName}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-500">Pet</p>
                                          <p>{walk.petName}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-500">Address</p>
                                        <p>{walk.address || getPetAddress(walk.petId)}</p>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <p className="text-sm font-medium text-slate-500">Notes</p>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => {
                                              // Create state variables for the notes
                                              const newNotes = window.prompt("Enter notes for this walk:", walk.notes || "");
                                              if (newNotes !== null) {
                                                // Call API to update notes
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
                                        <div className="bg-slate-50 p-3 rounded-md">
                                          {walk.notes ? (
                                            <p className="text-sm whitespace-pre-line">{walk.notes}</p>
                                          ) : (
                                            <p className="text-sm italic text-slate-400">No notes available. Click Edit to add notes.</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {walk.status === 'scheduled' && (
                                  <Button size="sm" variant="default" onClick={() => markWalkAsCompleted(walk.id)}>
                                    Mark Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="walks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Walk History</CardTitle>
              </CardHeader>
              <CardContent>
                {isWalksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center pb-4 border-b">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                ) : walks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">No walks found for this walker.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walks.map((walk: Walk) => (
                      <div key={walk.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                        <div>
                          <h4 className="font-medium">{formatDate(walk.date)} at {walk.time}</h4>
                          <p className="text-sm text-slate-500">
                            {walk.petName} ({walk.clientName}) - {walk.duration} minutes
                          </p>
                        </div>
                        <Badge className={`
                          ${walk.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            walk.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}
                        `}>
                          {walk.status.charAt(0).toUpperCase() + walk.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}