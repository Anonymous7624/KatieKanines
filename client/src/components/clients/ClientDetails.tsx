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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PencilIcon, PlusIcon, TrashIcon, DollarSign, DownloadIcon } from "lucide-react";
import ClientForm from "./ClientForm";
import PetForm from "../pets/PetForm";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Pet {
  id: number;
  name: string;
  breed?: string;
  age?: number;
  size?: string;
  notes?: string;
  isActive: boolean;
}

interface Payment {
  amount: number;
  date: string;
  paymentMethod: string;
}

interface ClientWithPets {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  clientDetails: {
    id: number;
    address?: string;
    emergencyContact?: string;
    notes?: string;
    balance?: string | number;
    lastPaymentDate?: string;
    payments?: Payment[];
  };
  pets: Pet[];
}

interface Walk {
  id: number;
  date: string;
  time: string;
  status: string;
  duration: number;
  petId: number;
  petName: string;
  walkerName?: string;
}

interface ClientDetailsProps {
  clientId: number;
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const { toast } = useToast();

  // Add refetchInterval to keep balance up to date
  const { data: client, isLoading, isError, refetch } = useQuery<ClientWithPets>({
    queryKey: [`/api/clients/${clientId}`],
    refetchInterval: 10000, // Refetch every 10 seconds to keep balance updated
  });

  const { data: walks = [] as Walk[], isLoading: isWalksLoading } = useQuery<Walk[]>({
    queryKey: [`/api/clients/${clientId}/walks`],
  });

  const deactivateClientMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/clients/${clientId}`, { 
        user: { isActive: false } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: "Client deactivated",
        description: "Client has been deactivated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deactivatePetMutation = useMutation({
    mutationFn: async (petId: number) => {
      return apiRequest("PUT", `/api/pets/${petId}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: "Pet deactivated",
        description: "Pet has been deactivated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate pet: ${error.message}`,
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
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-medium text-lg text-red-500">Error loading client details</h3>
              <p className="text-sm text-slate-500 mt-2">There was a problem fetching the client information. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // We've already checked that client is not undefined
  const clientData = client as ClientWithPets;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {clientData.firstName} {clientData.lastName}
          {!clientData.isActive && (
            <Badge variant="outline" className="ml-2 bg-slate-100">
              Inactive
            </Badge>
          )}
        </h1>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Make changes to the client information below.
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              clientId={clientData.clientDetails.id} 
              onSuccess={() => setIsEditOpen(false)}
              defaultValues={{
                user: {
                  username: "",  // Can't edit username
                  password: "",  // Can't edit password through this form
                  email: clientData.email,
                  firstName: clientData.firstName,
                  lastName: clientData.lastName,
                  phone: clientData.phone || "",
                },
                client: {
                  address: clientData.clientDetails.address || "",
                  emergencyContact: clientData.clientDetails.emergencyContact || "",
                  notes: clientData.clientDetails.notes || "",
                },
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="walks">Walk History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage client's balance and payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Current Balance</h4>
                  <p className={`text-2xl font-bold ${clientData.clientDetails.balance !== undefined && Number(clientData.clientDetails.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(clientData.clientDetails.balance !== undefined ? Number(clientData.clientDetails.balance) : 0).toFixed(2)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={clientData.clientDetails.balance === undefined || Number(clientData.clientDetails.balance) <= 0}
                  onClick={() => window.location.href = `/billing?client=${clientData.id}`}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Last Payment</h4>
                <p>{clientData.clientDetails.lastPaymentDate 
                    ? `${formatDate(clientData.clientDetails.lastPaymentDate)}` 
                    : "No payment records found"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Payment Actions</h4>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = `/billing?invoice=${clientData.id}`}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-500 mb-2">Payment History</h4>
                {!clientData.clientDetails.payments || clientData.clientDetails.payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payment history available.</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientData.clientDetails.payments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell className="text-green-600 font-medium">${payment.amount.toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payment.paymentMethod || "cash"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500">Email</h4>
                <p>{clientData.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500">Phone</h4>
                <p>{clientData.phone || "No phone number provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500">Address</h4>
                <p>{clientData.clientDetails.address || "No address provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500">Emergency Contact</h4>
                <p>{clientData.clientDetails.emergencyContact || "No emergency contact provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500">Notes</h4>
                <p className="whitespace-pre-line">{clientData.clientDetails.notes || "No notes"}</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button 
                variant="destructive" 
                onClick={() => deactivateClientMutation.mutate()}
                disabled={deactivateClientMutation.isPending || !clientData.isActive}
              >
                {deactivateClientMutation.isPending ? "Deactivating..." : "Deactivate Client"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pets" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={isAddPetOpen} onOpenChange={setIsAddPetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Pet</DialogTitle>
                  <DialogDescription>
                    Enter your pet's information below.
                  </DialogDescription>
                </DialogHeader>
                <PetForm 
                  clientId={clientData.clientDetails.id} 
                  onSuccess={() => setIsAddPetOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {clientData.pets.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-sm text-slate-500">No pets have been added for this client yet.</p>
                  <Button className="mt-4" onClick={() => setIsAddPetOpen(true)}>
                    Add First Pet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientData.pets.map(pet => (
                <Card key={pet.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{pet.name}</CardTitle>
                      {!pet.isActive && (
                        <Badge variant="outline" className="bg-slate-100">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {pet.breed || "Unknown breed"}, {pet.age || "?"} years old
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Size</h4>
                      <p>{pet.size || "Unknown"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Notes</h4>
                      <p className="whitespace-pre-line">{pet.notes || "No notes"}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivatePetMutation.mutate(pet.id)}
                      disabled={deactivatePetMutation.isPending || !pet.isActive}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      {pet.isActive ? "Deactivate" : "Deactivated"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
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
                  <p className="text-sm text-slate-500">No walks found for this client.</p>
                  <Button className="mt-4" onClick={() => window.location.href = "/schedule"}>
                    Schedule a Walk
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {walks.map((walk: Walk) => (
                    <div key={walk.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-medium">{formatDate(walk.date)} at {walk.time}</h4>
                        <p className="text-sm text-slate-500">
                          {walk.petName} with {walk.walkerName || "Unassigned"} ({walk.duration} minutes)
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
            <CardFooter className="border-t pt-6">
              <Button className="w-full" onClick={() => window.location.href = "/schedule"}>
                Schedule New Walk
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
