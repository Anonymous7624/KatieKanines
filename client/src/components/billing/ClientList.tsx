import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpDown, Search, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { UserWithRole } from '@shared/schema';
import InvoicePdfGenerator from './InvoicePdfGenerator';

type SortField = 'name' | 'balance' | 'lastPayment';
type SortDirection = 'asc' | 'desc';

interface ClientListProps {
  clients: UserWithRole[];
  onSelectClient: (client: UserWithRole) => void;
}

export default function ClientList({ clients, onSelectClient }: ClientListProps) {
  const [, navigate] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending by default
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const directionMod = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) * directionMod;
      } else if (sortField === 'balance') {
        // Parse balance values (handle cases where they might be strings)
        const balanceA = a.clientDetails?.balance !== undefined ? Number(a.clientDetails.balance) : 0;
        const balanceB = b.clientDetails?.balance !== undefined ? Number(b.clientDetails.balance) : 0;
        return (balanceA - balanceB) * directionMod;
      } else if (sortField === 'lastPayment') {
        // Sort by last payment date, newest first
        const dateA = a.clientDetails?.lastPaymentDate ? new Date(a.clientDetails.lastPaymentDate) : new Date(0);
        const dateB = b.clientDetails?.lastPaymentDate ? new Date(b.clientDetails.lastPaymentDate) : new Date(0);
        return (dateA.getTime() - dateB.getTime()) * directionMod;
      }
      return 0;
    });

  // Render sort indicator
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // View client details
  const viewClientDetails = (clientId: number) => {
    navigate(`/client-details/${clientId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableCaption>Current Client Balances and Payment Information</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Client Name {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center justify-end">
                  Current Balance {renderSortIcon('balance')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('lastPayment')}
              >
                <div className="flex items-center">
                  Last Payment {renderSortIcon('lastPayment')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewClientDetails(client.id)}
                      title="View client details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {client.firstName} {client.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={client.clientDetails?.balance !== undefined && Number(client.clientDetails.balance) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      ${client.clientDetails?.balance !== undefined ? Number(client.clientDetails.balance).toFixed(2) : '0.00'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {client.clientDetails?.lastPaymentDate ? formatDate(client.clientDetails.lastPaymentDate) : 'No payments'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectClient(client)}
                      >
                        Process Payment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Use our InvoicePdfGenerator component
                          const { generateClientInvoice } = InvoicePdfGenerator({ client });
                          generateClientInvoice();
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}