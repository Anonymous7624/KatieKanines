import { UserWithRole, Walk } from '@shared/schema';
import { jsPDF } from 'jspdf';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InvoicePdfGeneratorProps {
  client: UserWithRole;
}

export function generatePdf(
  client: UserWithRole,
  walks: Walk[],
  businessDetails: BusinessDetails
): void {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set default font size and text color
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Add business logo/header
  doc.setFontSize(20);
  doc.setTextColor(189, 127, 138); // Katie's Canines pink color
  doc.text("Katie's Canines", 105, 20, { align: 'center' });
  
  // Business details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const businessAddress = `${businessDetails.city}, ${businessDetails.state} ${businessDetails.zip}`;
  doc.text([
    businessDetails.name,
    businessDetails.address,
    businessAddress,
    "Phone: " + businessDetails.phone,
    "Email: " + businessDetails.email
  ], 20, 35);
  
  // Invoice title and number
  doc.setFontSize(16);
  const invoiceNumber = "INV-" + new Date().getTime().toString().slice(-6);
  doc.text("INVOICE #" + invoiceNumber, 190, 35, { align: 'right' });
  
  // Invoice date and due date
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 15); // Due in 15 days
  
  doc.setFontSize(10);
  doc.text([
    "Invoice Date: " + formatDate(today.toISOString()),
    "Due Date: " + formatDate(dueDate.toISOString())
  ], 190, 45, { align: 'right' });
  
  // Client information
  doc.setFontSize(12);
  doc.text("Bill To:", 20, 70);
  doc.setFontSize(10);
  doc.text([
    client.firstName + " " + client.lastName,
    client.clientDetails?.address || "No address provided",
    client.email || "No email provided",
    client.phone || "No phone provided"
  ], 20, 75);
  
  // Invoice table header
  const tableTop = 100;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableTop - 10, 170, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Date", 22, tableTop - 5);
  doc.text("Service", 50, tableTop - 5);
  doc.text("Pet", 90, tableTop - 5);
  doc.text("Duration", 115, tableTop - 5);
  doc.text("Status", 140, tableTop - 5);
  doc.text("Amount", 175, tableTop - 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  // Invoice table data
  let y = tableTop;
  let totalAmount = 0;

  // Filter to only show completed walks for this client
  const clientWalks = walks.filter(walk => 
    walk.clientId === client.clientDetails?.id && 
    walk.status === 'completed'
  );

  clientWalks.forEach((walk, index) => {
    // Add page if content exceeds page height
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, y, 170, 8, 'F');
    }
    
    // Row data
    const amount = parseFloat(walk.billingAmount?.toString() || '0');
    totalAmount += amount;
    
    doc.text(formatDate(walk.date), 22, y + 5);
    doc.text("Dog Walking", 50, y + 5);
    doc.text("Pet #" + walk.petId, 90, y + 5);
    doc.text((walk.duration?.toString() || "0") + " min", 115, y + 5);
    doc.text(walk.status || "unknown", 140, y + 5);
    doc.text("$" + amount.toFixed(2), 175, y + 5, { align: 'right' });
    
    y += 10;
  });
  
  // Summary
  y += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(120, y, 70, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text("Total Due:", 130, y + 5);
  doc.text("$" + totalAmount.toFixed(2), 175, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  // Payment information
  y += 20;
  doc.setFontSize(11);
  doc.text("Payment Information", 20, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.text([
    "Payment Due: Within 15 days",
    "Payment Methods: Cash, Check, Venmo, Zelle",
    "Make checks payable to: Katie's Canines",
    "Current balance: $" + (client.clientDetails?.balance !== undefined ? Number(client.clientDetails.balance).toFixed(2) : '0.00')
  ], 20, y);
  
  // Thank you note
  y += 30;
  doc.setFontSize(10);
  doc.text("Thank you for your business!", 105, y, { align: 'center' });
  
  // Save PDF
  doc.save(`invoice_${client.firstName}_${client.lastName}_${invoiceNumber}.pdf`);
}

interface BusinessDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export default function InvoicePdfGenerator({ client }: InvoicePdfGeneratorProps) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Business details - would typically come from settings
  const businessDetails: BusinessDetails = {
    name: "Katie's Canines",
    address: "123 Paw Street",
    city: "Dogtown",
    state: "CA",
    zip: "90210",
    phone: "(555) 123-4567",
    email: "info@katiescanines.com"
  };
  
  const generateClientInvoice = async () => {
    setLoading(true);
    try {
      // Get all walks for this client
      const clientId = client.clientDetails?.id;
      if (!clientId) {
        throw new Error("Client details ID not found");
      }
      const response = await apiRequest("GET", `/api/clients/${clientId}/walks`);
      const clientWalks = await response.json();
      
      if (Array.isArray(clientWalks)) {
        // Filter to just completed walks
        const completedWalks = clientWalks.filter(walk => walk.status === 'completed');
        
        // Generate PDF
        generatePdf(client, completedWalks, businessDetails);
        
        toast({
          title: "Invoice Generated",
          description: `Invoice for ${client.firstName} ${client.lastName} has been created.`,
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return { generateClientInvoice, loading };
}