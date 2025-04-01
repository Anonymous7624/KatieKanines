import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import ClientForm from "../clients/ClientForm";
import { getInitials } from "@/lib/utils";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  clientDetails: {
    id: number;
    address?: string;
    emergencyContact?: string;
    notes?: string;
  };
}

export default function ClientsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: clients = [], isLoading, isError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <div className="flex items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="ml-3 h-5 w-12" />
            </div>
          </div>
        ))}
        
        <div className="pt-5 flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="p-6 text-center">
          <div className="inline-block p-3 rounded-full bg-pink-light/50 text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-brown-dark mb-2">Unable to Load Clients</h3>
          <p className="text-brown-medium">There was a problem loading the client list. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Fill out the details to add a new client to Katie's Canines.
              </DialogDescription>
            </DialogHeader>
            <ClientForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {clients && clients.length === 0 ? (
        <div className="text-center py-6">
          <div className="inline-block p-3 rounded-full bg-accent text-accent-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-brown-medium mb-2">No clients found in the system.</p>
          <p className="text-brown-medium/70">Click the 'Add Client' button to add your first client.</p>
        </div>
      ) : (
        <>
          {clients && clients.slice(0, 4).map((client: Client) => (
            <div key={client.id} className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-light flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {getInitials(`${client.firstName} ${client.lastName}`)}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-base font-medium text-brown-dark">{client.firstName} {client.lastName}</div>
                  <div className="text-sm text-brown-medium">{client.email}</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full 
                  ${client.isActive ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
                <Link href={`/clients/${client.clientDetails.id}`}>
                  <div className="ml-4 text-primary hover:text-primary/80 font-medium cursor-pointer">
                    Details
                  </div>
                </Link>
              </div>
            </div>
          ))}
          
          <div className="pt-5 flex justify-end">
            <Link href="/clients">
              <Button variant="outline" className="rounded-full px-5">View All Clients</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
