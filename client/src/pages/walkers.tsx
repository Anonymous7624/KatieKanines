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
import { EyeIcon, MoreHorizontal, PlusIcon, SearchIcon, XIcon, ArrowUpDown } from "lucide-react";
import WalkerForm from "@/components/walkers/WalkerForm";

interface Walker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  walkerDetails: {
    id: number;
    rating?: number;
    totalEarnings?: string;
    unpaidEarnings?: string;
    city?: string;
    state?: string;
  };
}

type SortField = 'name' | 'city' | 'status' | 'earnings';
type SortDirection = 'asc' | 'desc';

export default function Walkers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWalkerForm, setShowWalkerForm] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const { data: walkers = [] as Walker[], isLoading, isError } = useQuery<Walker[]>({
    queryKey: ["/api/walkers"],
  });

  // Filter walkers based on search term
  const filteredWalkers = walkers.filter((walker: Walker) => {
    const fullName = `${walker.firstName} ${walker.lastName}`.toLowerCase();
    const city = walker.walkerDetails?.city?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) || 
      city.includes(searchLower) ||
      (walker.email && walker.email.toLowerCase().includes(searchLower)) ||
      (walker.phone && walker.phone.includes(searchLower))
    );
  });
  
  // Sort walkers based on selected field and direction
  const sortedWalkers = [...filteredWalkers].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB) * modifier;
    } else if (sortField === 'city') {
      const cityA = a.walkerDetails?.city || '';
      const cityB = b.walkerDetails?.city || '';
      return cityA.localeCompare(cityB) * modifier;
    } else if (sortField === 'status') {
      // Sort active walkers first if ascending, or inactive first if descending
      return (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) * modifier;
    } else if (sortField === 'earnings') {
      const earningsA = a.walkerDetails?.totalEarnings ? parseFloat(a.walkerDetails.totalEarnings) : 0;
      const earningsB = b.walkerDetails?.totalEarnings ? parseFloat(b.walkerDetails.totalEarnings) : 0;
      return (earningsA - earningsB) * modifier;
    }
    return 0;
  });
  
  // Handle column header clicks for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and reset to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <MainLayout pageTitle="Walkers">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Walker Creation Form */}
          {showWalkerForm && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Walker</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowWalkerForm(false)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WalkerForm onSuccess={() => setShowWalkerForm(false)} />
              </CardContent>
            </Card>
          )}
          
          {/* Walker List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search walkers..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowWalkerForm(!showWalkerForm)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Walker
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
                  <p className="text-red-500">Error loading walkers. Please try again later.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          onClick={() => handleSort('name')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center">
                            Name 
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === 'name' && (
                              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('city')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center">
                            City
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === 'city' && (
                              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('status')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center">
                            Status
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === 'status' && (
                              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('earnings')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center">
                            Earnings
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                            {sortField === 'earnings' && (
                              <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWalkers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            {searchTerm 
                              ? "No walkers matching your search criteria" 
                              : "No walkers found. Add your first walker!"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedWalkers.map((walker: Walker) => (
                          <TableRow key={walker.id}>
                            <TableCell className="font-medium">
                              {walker.firstName} {walker.lastName}
                            </TableCell>
                            <TableCell>
                              {walker.walkerDetails?.city || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={walker.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                                {walker.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ${walker.walkerDetails?.totalEarnings 
                                ? parseFloat(walker.walkerDetails.totalEarnings).toFixed(2) 
                                : "0.00"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <Link href={`/walkers/${walker.walkerDetails.id}`}>
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
