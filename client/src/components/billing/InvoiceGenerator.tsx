import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { Check, ChevronDown, FileText } from 'lucide-react';
import { formatDate, formatTime, cn } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ClientPaymentForm from './ClientPaymentForm';

interface Client {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  clientDetails?: any;
}

interface ExtendedClient {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
  balance: string | null;
  lastPaymentDate?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

interface Walk {
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

interface InvoiceGeneratorProps {
  filteredWalks: Walk[];
  setFilters?: (fn: (prev: any) => any) => void;
}

export default function InvoiceGenerator({ filteredWalks = [], setFilters }: InvoiceGeneratorProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch clients data
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Get unpaid walks for selected client or all clients
  const getUnpaidWalks = () => {
    // If no client is selected, show all unpaid walks
    if (!selectedClientId) {
      return filteredWalks.filter((walk: Walk) => !walk.isPaid);
    }
    
    // Otherwise, filter by the selected client
    const client = clients.find((c: Client) => c.id === selectedClientId);
    if (!client) return [];
    
    const clientFullName = `${client.firstName} ${client.lastName}`;
    
    return filteredWalks.filter((walk: Walk) => 
      walk.clientName === clientFullName && !walk.isPaid);
  };

  const unpaidWalks = getUnpaidWalks();
  
  // Calculate total amount owed
  const totalAmountOwed = unpaidWalks.reduce((sum: number, walk: Walk) => {
    const amount = typeof walk.billingAmount === 'string' 
      ? parseFloat(walk.billingAmount) 
      : (typeof walk.billingAmount === 'number' ? walk.billingAmount : 0);
    return sum + amount;
  }, 0);

  // Handle client selection
  const handleSelectClient = (clientId: number) => {
    setSelectedClientId(clientId);
    
    const client = clients.find(c => c.id === clientId);
    
    // Apply filter to the walk list
    if (setFilters && client) {
      setFilters((prev: any) => ({
        ...prev,
        client: client.firstName + ' ' + client.lastName
      }));
    }
  };

  // Handle PDF generation
  const generatePDF = () => {
    if (!selectedClientId || unpaidWalks.length === 0) {
      toast({
        title: 'No unpaid walks',
        description: 'There are no unpaid walks for this client to generate an invoice.',
        variant: 'destructive',
      });
      return;
    }

    // Get client details
    const client = clients.find((c: Client) => c.id === selectedClientId);
    if (!client) return;

    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add heading
    doc.setFontSize(20);
    doc.text('Katie\'s Canines', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Invoice', pageWidth / 2, 30, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(new Date().toISOString())}`, pageWidth - 15, 40, { align: 'right' });
    
    // Add client info
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 50);
    doc.text(`${client.firstName} ${client.lastName}`, 20, 58);
    doc.text(`Email: ${client.email}`, 20, 66);
    
    // Add walks table
    doc.text('Walk Details:', 20, 80);
    
    doc.setFontSize(10);
    const headers = ['Date', 'Pet', 'Duration', 'Status', 'Amount'];
    const headerPositions = [20, 50, 90, 120, 150];
    
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], headerPositions[i], 88);
    }
    
    doc.line(20, 90, 190, 90);
    
    // Add walk rows
    unpaidWalks.forEach((walk: Walk, index: number) => {
      const yPos = 98 + (index * 8);
      
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], headerPositions[i], 20);
        }
        doc.line(20, 22, 190, 22);
        const newYPos = 30 + ((index % 20) * 8);
        
        doc.text(formatDate(walk.date), headerPositions[0], newYPos);
        doc.text(walk.petName, headerPositions[1], newYPos);
        doc.text(`${walk.duration} min`, headerPositions[2], newYPos);
        doc.text(walk.status, headerPositions[3], newYPos);
        doc.text(`$${typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount).toFixed(2) : (typeof walk.billingAmount === 'number' ? walk.billingAmount.toFixed(2) : '0.00')}`, headerPositions[4], newYPos);
      } else {
        doc.text(formatDate(walk.date), headerPositions[0], yPos);
        doc.text(walk.petName, headerPositions[1], yPos);
        doc.text(`${walk.duration} min`, headerPositions[2], yPos);
        doc.text(walk.status, headerPositions[3], yPos);
        doc.text(`$${typeof walk.billingAmount === 'string' ? parseFloat(walk.billingAmount).toFixed(2) : (typeof walk.billingAmount === 'number' ? walk.billingAmount.toFixed(2) : '0.00')}`, headerPositions[4], yPos);
      }
    });
    
    // Add total
    const totalY = Math.min(98 + (unpaidWalks.length * 8) + 10, 270);
    doc.line(20, totalY - 5, 190, totalY - 5);
    doc.setFontSize(12);
    doc.text('Total:', 120, totalY);
    doc.text(`$${totalAmountOwed.toFixed(2)}`, 150, totalY);
    
    // Add footer
    const footerY = totalY + 20;
    doc.setFontSize(10);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Please remit payment within 30 days.', pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Save PDF
    doc.save(`invoice_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: 'Invoice Generated',
      description: 'The invoice has been generated and downloaded.',
    });
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
  };

  // Get the selected client object
  const selectedClient = selectedClientId 
    ? clients.find((c: any) => c.id === selectedClientId) || null
    : null;
    
  // Convert to ExtendedClient if needed for StripePaymentForm
  const extendedClient = selectedClient ? {
    id: selectedClient.clientDetails?.id || selectedClient.id,
    userId: selectedClient.id,
    firstName: selectedClient.firstName,
    lastName: selectedClient.lastName,
    email: selectedClient.email || '',
    address: selectedClient.clientDetails?.address || null,
    emergencyContact: selectedClient.clientDetails?.emergencyContact || null,
    notes: selectedClient.clientDetails?.notes || null,
    balance: selectedClient.clientDetails?.balance?.toString() || "0",
    lastPaymentDate: selectedClient.clientDetails?.lastPaymentDate || null,
    stripeCustomerId: selectedClient.clientDetails?.stripeCustomerId || null,
    stripeSubscriptionId: selectedClient.clientDetails?.stripeSubscriptionId || null
  } : null;

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Client lookup section */}
            <div className="space-y-2">
              <Label htmlFor="client-select">Client Select</Label>
              <div className="flex items-center space-x-2">
                <Select 
                  value={selectedClientId ? String(selectedClientId) : ""} 
                  onValueChange={(value) => handleSelectClient(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.firstName} {client.lastName} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline" 
                  disabled={!selectedClientId}
                  onClick={() => {
                    setSelectedClientId(null);
                    if (setFilters) {
                      setFilters((prev: any) => ({
                        ...prev,
                        client: "all"
                      }));
                    }
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Invoice details section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unpaid Walks</h3>
                  <p className="text-2xl font-semibold">{unpaidWalks.length}</p>
                  {!selectedClientId && unpaidWalks.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Showing all unpaid walks</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                  <p className="text-2xl font-semibold text-green-600">${totalAmountOwed.toFixed(2)}</p>
                  {!selectedClientId && unpaidWalks.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">From all clients</p>
                  )}
                </div>
                <Button 
                  onClick={generatePDF}
                  disabled={!selectedClientId || unpaidWalks.length === 0}
                  className="bg-primary"
                >
                  <FileText className="mr-2 h-4 w-4" /> Invoice
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Check className="mr-2 h-5 w-5" /> Payment Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientPaymentForm 
            client={selectedClient}
            unpaidWalks={unpaidWalks} 
            onPaymentSuccess={handlePaymentSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}