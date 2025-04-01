import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckIcon, DollarSignIcon, ImagePlus, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import WalkForm from "./WalkForm";
import { formatDate, formatTime } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface Walk {
  id: number;
  clientId: number;
  walkerId?: number;
  petId: number;
  date: string;
  time: string;
  duration: number | string; // Can be number (minutes) or 'overnight'
  status: string;
  notes?: string;
  isGroupWalk: boolean;
  clientName: string;
  petName: string; // Primary pet name (for backward compatibility)
  allPetNames?: string; // Comma-separated list of all pet names
  walkerName?: string;
  billingAmount?: string | number;
  allPetIds?: string; // Comma-separated list of all pet IDs
  repeatWeekly?: boolean;
  numberOfWeeks?: number | null;
  recurringGroupId?: string;
  isPaid?: boolean; // Payment status flag
}

interface Photo {
  id: number;
  walkId: number;
  photoUrl: string;
  uploadedAt: string;
}

interface WalkDetailsProps {
  walkId: number;
}

export default function WalkDetails({ walkId }: WalkDetailsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { 
    data: walk, 
    isLoading, 
    isError,
    refetch: refetchWalk
  } = useQuery<Walk>({
    queryKey: [`/api/walks/${walkId}`],
    refetchInterval: 2000, // Refresh data every 2 seconds
    select: (data: any) => {
      console.log("Walk data loaded:", data);
      return data as Walk;
    }
  });

  const { 
    data: photos = [], 
    isLoading: isPhotosLoading,
    refetch: refetchPhotos
  } = useQuery<Photo[]>({
    queryKey: [`/api/walks/${walkId}/photos`],
    refetchInterval: 5000, // Refresh photo data every 5 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      // Now only update the status, not the payment status
      return apiRequest("PUT", `/api/walks/${walkId}`, { status });
    },
    onSuccess: (_, status) => {
      // Invalidate the specific walk
      queryClient.invalidateQueries({ queryKey: [`/api/walks/${walkId}`] });
      
      // Invalidate all walks to update listings in other views
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/walks/upcoming'] });
      
      // Invalidate any client or walker specific walks
      if (walk && walk.clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${walk.clientId}/walks`] });
      }
      if (walk && walk.walkerId) {
        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walk.walkerId}/walks`] });
      }
      
      // Display appropriate message based on the status
      if (status === "completed") {
        toast({
          title: "Walk Completed",
          description: "The walk has been marked as completed.",
          variant: "default",
        });
      } else if (status === "cancelled") {
        toast({
          title: "Walk Cancelled",
          description: "The walk has been cancelled.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Status updated",
          description: "Walk status has been updated successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update walk status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add mutation for toggling payment status
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async (isPaid: boolean) => {
      return apiRequest("PUT", `/api/walks/${walkId}`, { isPaid });
    },
    onSuccess: (_, isPaid) => {
      // Invalidate the specific walk
      queryClient.invalidateQueries({ queryKey: [`/api/walks/${walkId}`] });
      
      // Invalidate all walks to update listings in other views
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/walks/upcoming'] });
      
      // Invalidate any client or walker specific walks
      if (walk && walk.clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${walk.clientId}/walks`] });
      }
      if (walk && walk.walkerId) {
        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walk.walkerId}/walks`] });
      }
      
      toast({
        title: isPaid ? "Payment Recorded" : "Payment Cleared",
        description: isPaid 
          ? "This walk has been marked as paid." 
          : "This walk has been marked as unpaid.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payment status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      return apiRequest("POST", `/api/walks/${walkId}/photos`, { photoUrl });
    },
    onSuccess: () => {
      // Invalidate the photos query to refresh the photos list
      queryClient.invalidateQueries({ queryKey: [`/api/walks/${walkId}/photos`] });
      
      // Additionally, immediately refetch photos
      refetchPhotos();
      
      setPhotoUrl("");
      setIsUploadOpen(false);
      toast({
        title: "Photo uploaded",
        description: "Photo has been added to this walk.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload photo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteWalkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/walks/${walkId}`, {});
    },
    onSuccess: () => {
      // Invalidate all walks queries
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/walks/upcoming'] });
      
      // Invalidate any client or walker specific walks
      if (walk && walk.clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${walk.clientId}/walks`] });
      }
      if (walk && walk.walkerId) {
        queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walk.walkerId}/walks`] });
      }
      
      toast({
        title: "Walk deleted",
        description: "The walk has been permanently deleted.",
      });
      
      // Navigate back to schedule page
      navigate("/schedule");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete walk: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !walk) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
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
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-medium text-lg text-red-500">Error loading walk details</h3>
              <p className="text-sm text-slate-500 mt-2">There was a problem fetching the walk information. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const walkData = walk;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Walk Details
          {/* Walk Status Badge */}
          <Badge 
            className={`ml-2 ${
              walkData.status === 'completed' ? 'bg-green-100 text-green-800' : 
              walkData.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}
          >
            {walkData.status.charAt(0).toUpperCase() + walkData.status.slice(1)}
          </Badge>
          
          {/* Payment Status Badge */}
          <Badge 
            className={`ml-2 ${
              walkData.isPaid ? 'bg-emerald-100 text-emerald-800' : 
              'bg-amber-100 text-amber-800'
            }`}
          >
            {walkData.isPaid ? 'Paid' : 'Unpaid'}
          </Badge>
          
          {/* Recurring Walk Badge */}
          {walkData.repeatWeekly && (
            <Badge className="ml-2 bg-blue-100 text-blue-800">
              Recurring
            </Badge>
          )}
        </h1>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Walk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Walk</DialogTitle>
            </DialogHeader>
            <WalkForm 
              walkId={walkData.id} 
              onSuccess={() => {
                setIsEditOpen(false);
                // Force a refresh of the data
                refetchWalk();
              }}
              defaultValues={{
                // clientId in walkData is actually the clientDetails.id, not the user.id
                // WalkForm component will handle mapping this to the correct client user ID
                clientId: walkData.clientId,
                walkerId: walkData.walkerId,
                // Get all petIds if available
                petIds: walkData.allPetIds ? walkData.allPetIds.split(',').map(Number) : [walkData.petId],
                // Create a proper Date object for the form without timezone issues
                // Parse the date components directly to avoid timezone shifts
                date: (() => {
                  // Parse YYYY-MM-DD format and create a date in local timezone
                  const [year, month, day] = walkData.date.split('-').map(Number);
                  // Note: month is 0-indexed in JavaScript Date
                  return new Date(year, month - 1, day); 
                })(),
                time: walkData.time,
                duration: walkData.duration === 'overnight' ? 'overnight' : (typeof walkData.duration === 'string' ? parseInt(walkData.duration, 10) : walkData.duration),
                notes: walkData.notes,
                billingAmount: walkData.billingAmount ? Number(walkData.billingAmount) : 25
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Walk Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500">Date & Time</h4>
              <p>{formatDate(walkData.date)} at {formatTime(walkData.time)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Duration</h4>
              <p>{walkData.duration === 'overnight' ? 'Overnight stay' : `${walkData.duration} minutes`}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Client</h4>
              <p>{walkData.clientName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Pets</h4>
              <p>{walkData.allPetNames || walkData.petName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Walker</h4>
              <p>{walkData.walkerName ? walkData.walkerName.split(' ')[0] : "Unassigned"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Billing Amount</h4>
              <p>${walkData.billingAmount || '0.00'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500">Notes</h4>
              <p className="whitespace-pre-line">{walkData.notes || "No notes"}</p>
            </div>
            
            {walkData.repeatWeekly && (
              <div>
                <h4 className="text-sm font-medium text-slate-500">Recurring Info</h4>
                <p>
                  Repeats weekly
                  {walkData.numberOfWeeks ? ` for ${walkData.numberOfWeeks} weeks` : " until cancelled"}
                  {walkData.recurringGroupId && <span className="text-xs text-slate-500 block mt-1">Group ID: {walkData.recurringGroupId}</span>}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-wrap gap-2">
            <div className="flex gap-2 justify-start flex-wrap">
              {/* Walk Status Buttons */}
              {walkData.status === "scheduled" ? (
                <>
                  <Button 
                    variant="default" 
                    onClick={() => updateStatusMutation.mutate("completed")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => updateStatusMutation.mutate("cancelled")}
                    disabled={updateStatusMutation.isPending}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel Walk
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => updateStatusMutation.mutate("scheduled")}
                  disabled={updateStatusMutation.isPending}
                >
                  Reactivate Walk
                </Button>
              )}
            </div>

            {/* Payment Status Button */}
            <Button 
              variant={walkData.isPaid ? "outline" : "default"}
              onClick={() => updatePaymentStatusMutation.mutate(!walkData.isPaid)}
              disabled={updatePaymentStatusMutation.isPending}
              className={walkData.isPaid 
                ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                : "bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
              }
            >
              <DollarSignIcon className="h-4 w-4 mr-2" />
              {walkData.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
            </Button>
            
            {/* Delete Walk Button and Alert Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Delete Walk Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this walk
                    from the system and remove all associated photos and records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteWalkMutation.mutate()}
                    disabled={deleteWalkMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {deleteWalkMutation.isPending ? "Deleting..." : "Delete Walk"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Photos</CardTitle>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">Photo URL</Label>
                    <Input 
                      id="photoUrl" 
                      placeholder="Enter image URL" 
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Enter a URL to a publicly accessible image (in a real app, you would upload a file)
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUploadOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => uploadPhotoMutation.mutate(photoUrl)}
                      disabled={uploadPhotoMutation.isPending || !photoUrl}
                    >
                      {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isPhotosLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12">
                <ImagePlus className="h-12 w-12 mx-auto text-slate-300" />
                <p className="mt-4 text-sm text-slate-500">No photos uploaded yet</p>
                <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                  Upload First Photo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo: Photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden">
                    <img 
                      src={photo.photoUrl} 
                      alt={`Walk photo ${photo.id}`} 
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white">
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
