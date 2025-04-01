import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { EyeIcon, MoreHorizontal, PlusIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon, XIcon } from "lucide-react";
import ClientForm from "@/components/clients/ClientForm";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  clientDetails: {
    id: number;
  };
  pets?: {
    id: number;
    name: string;
  }[];
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  
  const { data: clients = [], isLoading, isError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter clients based on search term
  const filteredClients = Array.isArray(clients) ? clients.filter((client: Client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) || 
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(searchLower))
    );
  }) : [];

  return (
    <MainLayout pageTitle="Clients">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Client Creation Form */}
          {showClientForm && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Client</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowClientForm(false)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ClientForm onSuccess={() => setShowClientForm(false)} />
              </CardContent>
            </Card>
          )}

          {/* Client List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search clients..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowClientForm(!showClientForm)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  </div>
                  
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-12" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading clients. Please try again later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Pets</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            {searchTerm 
                              ? "No clients matching your search criteria" 
                              : "No clients found. Click 'Add New Client' to create your first client."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client: Client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">
                              {client.firstName} {client.lastName}
                            </TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.phone || "-"}</TableCell>
                            <TableCell>
                              {client.pets ? client.pets.length : 0}
                            </TableCell>
                            <TableCell>
                              <Badge className={client.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                                {client.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Link href={`/clients/${client.clientDetails.id}`}>
                                    <DropdownMenuItem>
                                      <EyeIcon className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </Link>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
