import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";
import StripeWrapper from "@/components/billing/StripeWrapper";
import InvoicePdfGenerator from "@/components/billing/InvoicePdfGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CreditCard, Eye, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { UserWithRole } from "@shared/schema";

// Define local interface for walks with the properties we use 
interface WalkData {
  id: number;
  clientId: number;
  clientName: string;
  petName: string;
  walkerName?: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  billingAmount?: number | string;
  isPaid?: boolean;
  paidDate?: string | null;
}

export default function Billing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<UserWithRole | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get all walks data
  const { data: walks = [], isLoading: walksLoading, isError: walksError, refetch: refetchWalks } = useQuery({
    queryKey: ["/api/walks"],
    refetchInterval: 5000, // Refresh every 5 seconds to ensure data is current
  });
  
  // Get all clients with balances
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError, refetch: refetchClients } = useQuery({
    queryKey: ["/api/clients", { withBalances: true }],
  });

  // Enhanced financial summary calculations
  const calculateRevenueSummary = () => {
    // Default to empty array if walks is not an array
    const walksArray = Array.isArray(walks) ? walks : [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get start of current day
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Calculate billing amounts for different time periods
    const calculateForPeriod = (walks: WalkData[], filterFn: (walkDate: Date) => boolean) => {
      const filtered = walks.filter(walk => {
        if (!walk || !walk.date) return false;
        const walkDate = new Date(walk.date);
        return filterFn(walkDate);
      });
      
      // Count of scheduled walks
      const scheduled = filtered.filter(walk => walk.status === 'scheduled');
      
      // Only include completed or outstanding walks for billing
      const completed = filtered.filter(walk => walk.status === 'completed' || walk.status === 'outstanding');
      
      const totalAmount = completed.reduce((sum, walk) => {
        const amount = typeof walk.billingAmount === 'number' ? walk.billingAmount : 
          (typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount) : 0);
        return sum + amount;
      }, 0);
      
      const paidAmount = completed
        .filter(walk => walk.isPaid === true)
        .reduce((sum, walk) => {
          const amount = typeof walk.billingAmount === 'number' ? walk.billingAmount : 
            (typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount) : 0);
          return sum + amount;
        }, 0);
      
      // Calculate estimated revenue from scheduled walks
      const scheduledAmount = scheduled.reduce((sum, walk) => {
        const amount = typeof walk.billingAmount === 'number' ? walk.billingAmount : 
          (typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount) : 0);
        return sum + amount;
      }, 0);
      
      return {
        count: completed.length,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        scheduledCount: scheduled.length,
        scheduledAmount
      };
    };
    
    // Calculate outstanding amounts by age ranges
    const calculateOutstandingByAge = () => {
      const completedUnpaid = walksArray.filter(walk => 
        (walk.status === 'completed' || walk.status === 'outstanding') && 
        walk.isPaid !== true &&
        walk.date
      );
      
      const categories = {
        days1to7: 0,
        days8to30: 0,
        days31to60: 0,
        days61plus: 0
      };
      
      completedUnpaid.forEach(walk => {
        const walkDate = new Date(walk.date);
        const daysDiff = Math.floor((now.getTime() - walkDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = typeof walk.billingAmount === 'number' ? walk.billingAmount : 
          (typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount) : 0);
        
        if (daysDiff <= 7) {
          categories.days1to7 += amount;
        } else if (daysDiff <= 30) {
          categories.days8to30 += amount;
        } else if (daysDiff <= 60) {
          categories.days31to60 += amount;
        } else {
          categories.days61plus += amount;
        }
      });
      
      return categories;
    };
    
    return {
      ytd: calculateForPeriod(walksArray, date => date.getFullYear() === currentYear),
      mtd: calculateForPeriod(walksArray, date => 
        date.getFullYear() === currentYear && date.getMonth() === currentMonth
      ),
      wtd: calculateForPeriod(walksArray, date => date >= startOfWeek),
      day: calculateForPeriod(walksArray, date => date >= startOfDay),
      outstandingByAge: calculateOutstandingByAge()
    };
  };

  const revenueSummary = calculateRevenueSummary();

  // Get client's unpaid walks
  const getClientUnpaidWalks = (clientId: number) => {
    if (!Array.isArray(walks)) return [];
    return walks.filter((walk: WalkData) => 
      walk.clientId === clientId && 
      (walk.status === 'completed' || walk.status === 'outstanding') && 
      !walk.isPaid
    );
  };

  // Handle processing payment for a client
  const handleSelectClient = (client: UserWithRole) => {
    setSelectedClient(client);
  };

  // Handle export to CSV
  const exportToCSV = () => {
    // Generate CSV content
    const headers = ["ID", "Date", "Time", "Client", "Pet", "Walker", "Duration", "Status", "Amount", "Paid", "Payment Date"];
    
    // Get all walks for export
    const walksArray = Array.isArray(walks) ? walks : [];
    
    const csvContent = [
      headers.join(","),
      ...walksArray.map((walk: WalkData) => [
        walk.id,
        walk.date,
        walk.time,
        walk.clientName,
        walk.petName,
        walk.walkerName || "",
        walk.duration,
        walk.status,
        walk.billingAmount || 0,
        walk.isPaid ? "Yes" : "No",
        walk.paidDate || ""
      ].join(","))
    ].join("\\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `katie-canines-billing-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Billing data has been exported to CSV.",
    });
  };

  // Generate invoice for a client
  const generateInvoice = (clientName: string, clientId: number) => {
    // In a real application, this would generate a PDF invoice
    // For now, we'll just show a success toast
    toast({
      title: "Invoice Generated",
      description: `Invoice for ${clientName} has been generated.`,
    });
  };

  // Mark walk as paid
  const markAsPaid = async (walkId: number) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Call the API endpoint to update payment status with paidDate
      await apiRequest("PUT", `/api/walks/${walkId}/payment-status`, {
        isPaid: true,
        paidDate: currentDate
      });
      
      // Invalidate the walks query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/walks"] });
      
      toast({
        title: "Payment Recorded",
        description: `Walk #${walkId} has been marked as paid.`,
      });
    } catch (error) {
      console.error("Error marking walk as paid:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Process payment for a client
  const processPayment = async (clientId: number, amount: number, method: string) => {
    try {
      // Make sure we have selectedClient and clientDetails before proceeding
      if (!selectedClient || !selectedClient.clientDetails || !selectedClient.clientDetails.id) {
        throw new Error("Client details not found");
      }
      
      const clientDetailsId = selectedClient.clientDetails.id;
      const currentDate = new Date().toISOString().split('T')[0];
      
      console.log(`Processing payment for client details ID: ${clientDetailsId}`, { client: selectedClient });
      
      // Record the payment - Note: we're not trying to read the response body here
      await apiRequest("POST", `/api/clients/${clientDetailsId}/payments`, {
        amount: amount.toString(),
        paymentMethod: method, // Match the server-side expected parameter name
        paymentDate: currentDate
      });
      
      // Invalidate all relevant queries to refresh data
      // First invalidate all client queries including those with parameters
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      // Explicitly invalidate the withBalances query to ensure it refreshes
      queryClient.invalidateQueries({ 
        queryKey: ["/api/clients", { withBalances: true }] 
      });
      
      // Invalidate specific client data
      if (selectedClient && selectedClient.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClient.id] });
      }
      
      // Invalidate walks data as payment may affect walk statuses
      queryClient.invalidateQueries({ queryKey: ["/api/walks"] });
      
      // Force immediate refetch to ensure UI is updated
      refetchClients();
      
      // Close modal and reset form
      setSelectedClient(null);
      setPaymentAmount(0);
      setPaymentMethod("cash");
      
      toast({
        title: "Payment Successful",
        description: `Payment of $${amount.toFixed(2)} has been recorded for ${selectedClient.firstName} ${selectedClient.lastName}.`,
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = walksLoading || clientsLoading;
  const isError = walksError || clientsError;
  
  // Filter clients by search term
  const filteredClients = Array.isArray(clients) ? clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  ) : [];
  
  // Function to handle sort field changes
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Sort clients based on the selected field and direction
  const sortedClients = [...filteredClients].sort((a, b) => {
    // Modifier based on sort direction (1 for ascending, -1 for descending)
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      // Sort by client name
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB) * modifier;
    } else if (sortField === 'balance') {
      // Sort by outstanding balance
      const balanceA = a.clientDetails?.balance !== undefined ? Number(a.clientDetails.balance) : 0;
      const balanceB = b.clientDetails?.balance !== undefined ? Number(b.clientDetails.balance) : 0;
      return (balanceA - balanceB) * modifier;
    } else if (sortField === 'lastPayment') {
      // Sort by last payment date
      const dateA = a.clientDetails?.lastPaymentDate ? new Date(a.clientDetails.lastPaymentDate).getTime() : 0;
      const dateB = b.clientDetails?.lastPaymentDate ? new Date(b.clientDetails.lastPaymentDate).getTime() : 0;
      return (dateA - dateB) * modifier;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <MainLayout pageTitle="Billing">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout pageTitle="Billing">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Billing Data</h2>
          <p className="mt-2">Please try again later.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Billing">
      <div className="space-y-6">
        {/* Comprehensive Financial Summary */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Katie's Canines Billing Dashboard</CardTitle>
                <CardDescription>Comprehensive financial summary</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={async () => {
                    try {
                      const response = await apiRequest("POST", "/api/walks/apply-balances");
                      const data = await response.json();
                      toast({
                        title: "Update Successful",
                        description: data.message || `Updated ${data.count} walk balances`,
                      });
                      // Refresh all relevant data after updating balances
                      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                      
                      // Explicitly invalidate the withBalances query to ensure it refreshes
                      queryClient.invalidateQueries({ 
                        queryKey: ["/api/clients", { withBalances: true }] 
                      });
                      
                      queryClient.invalidateQueries({ queryKey: ["/api/walks"] });
                      
                      // Force refetch of current data
                      refetchClients();
                      refetchWalks();
                    } catch (error) {
                      console.error("Error applying balances:", error);
                      toast({
                        title: "Error",
                        description: "Failed to apply balances. See console for details.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Apply Walks to Client Balances
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={async () => {
                    try {
                      const response = await apiRequest("POST", "/api/walks/apply-walker-earnings");
                      const data = await response.json();
                      toast({
                        title: "Update Successful",
                        description: data.message || "Walker earnings updated successfully",
                      });
                      // No need to refresh client data as this only affects walkers
                      // But we'll refresh the walks data in case any status changes
                      queryClient.invalidateQueries({ queryKey: ["/api/walks"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/walkers"] });
                    } catch (error) {
                      console.error("Error applying walker earnings:", error);
                      toast({
                        title: "Error",
                        description: "Failed to apply walker earnings. See console for details.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Apply Walks to Walker Earnings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unpaid Walks by Age */}
              <div className="space-y-4 border-2 border-red-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold border-b pb-2">Unpaid Walks</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">1-7 Days</span>
                      <span className="font-medium text-amber-500">${revenueSummary.outstandingByAge.days1to7.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">8-30 Days</span>
                      <span className="font-medium text-amber-600">${revenueSummary.outstandingByAge.days8to30.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">31-60 Days</span>
                      <span className="font-medium text-orange-600">${revenueSummary.outstandingByAge.days31to60.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Over 60 Days</span>
                      <span className="font-medium text-red-600">${revenueSummary.outstandingByAge.days61plus.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total Outstanding</span>
                      <span className="text-lg font-bold">${(
                        revenueSummary.outstandingByAge.days1to7 +
                        revenueSummary.outstandingByAge.days8to30 +
                        revenueSummary.outstandingByAge.days31to60 +
                        revenueSummary.outstandingByAge.days61plus
                      ).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Money Collected */}
              <div className="space-y-4 border-2 border-green-500 rounded-lg p-4">
                <h3 className="text-lg font-semibold border-b pb-2">Money Collected</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Today</span>
                      <div className="text-right">
                        <span className="block text-sm">{revenueSummary.day.count - (revenueSummary.day.unpaidAmount > 0 ? Math.ceil(revenueSummary.day.unpaidAmount / (revenueSummary.day.totalAmount / revenueSummary.day.count)) : 0)} walks</span>
                        <span className="font-medium text-green-600">${revenueSummary.day.paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Week to Date</span>
                      <div className="text-right">
                        <span className="block text-sm">{revenueSummary.wtd.count - (revenueSummary.wtd.unpaidAmount > 0 ? Math.ceil(revenueSummary.wtd.unpaidAmount / (revenueSummary.wtd.totalAmount / revenueSummary.wtd.count)) : 0)} walks</span>
                        <span className="font-medium text-green-600">${revenueSummary.wtd.paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Month to Date</span>
                      <div className="text-right">
                        <span className="block text-sm">{revenueSummary.mtd.count - (revenueSummary.mtd.unpaidAmount > 0 ? Math.ceil(revenueSummary.mtd.unpaidAmount / (revenueSummary.mtd.totalAmount / revenueSummary.mtd.count)) : 0)} walks</span>
                        <span className="font-medium text-green-600">${revenueSummary.mtd.paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Year to Date</span>
                      <div className="text-right">
                        <span className="block text-sm">{revenueSummary.ytd.count - (revenueSummary.ytd.unpaidAmount > 0 ? Math.ceil(revenueSummary.ytd.unpaidAmount / (revenueSummary.ytd.totalAmount / revenueSummary.ytd.count)) : 0)} walks</span>
                        <span className="font-medium text-green-600">${revenueSummary.ytd.paidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client List with Balances */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4">
              <div className="relative w-full md:w-64 mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search clients..."
                  className="pl-8"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
              <TableCaption>
                A list of all clients and their current balances.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSortChange('name')}>
                    <div className="flex items-center">
                      Client Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </div>
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSortChange('balance')}>
                    <div className="flex items-center justify-end">
                      Current Balance {sortField === 'balance' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSortChange('lastPayment')}>
                    <div className="flex items-center justify-end">
                      Last Payment {sortField === 'lastPayment' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedClients.map((client) => {
                    // Get client's details
                    const clientDetails = client.clientDetails;
                    const balance = clientDetails?.balance !== undefined ? Number(clientDetails.balance) : 0;
                    const lastPaymentDate = clientDetails?.lastPaymentDate;
                    
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.id}</TableCell>
                        <TableCell>{client.firstName} {client.lastName}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          <span className={balance > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                            ${balance.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {lastPaymentDate ? formatDate(lastPaymentDate) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={() => window.location.href = `/clients/${client.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleSelectClient(client)}
                              disabled={balance <= 0}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Payment
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-600 hover:bg-purple-50"
                              onClick={() => {
                                if (client.clientDetails?.id) {
                                  const { generateClientInvoice } = InvoicePdfGenerator({ client });
                                  generateClientInvoice();
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Could not generate invoice. Client details not found.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Payment Modal */}
        {selectedClient && (
          <Dialog open={Boolean(selectedClient)} onOpenChange={() => setSelectedClient(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Process Payment for {selectedClient.firstName} {selectedClient.lastName}</DialogTitle>
                <DialogDescription>
                  Current balance: <span className="font-medium">${selectedClient.clientDetails?.balance !== undefined ? Number(selectedClient.clientDetails.balance).toFixed(2) : "0.00"}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-4">
                  <Label htmlFor="paymentAmount">Payment Amount</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {paymentMethod === 'card' && (
                    <div className="mt-4">
                      <StripeWrapper amount={paymentAmount} clientId={Number(selectedClient.id)} />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedClient(null)}>Cancel</Button>
                <Button 
                  disabled={!paymentAmount || paymentAmount <= 0 || (paymentMethod === 'card')}
                  onClick={() => processPayment(selectedClient.id, paymentAmount, paymentMethod)} 
                >
                  Process Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}