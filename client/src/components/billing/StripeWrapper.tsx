import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';
import { useToast } from '@/hooks/use-toast';
import { UserWithRole } from '@shared/schema';

interface StripeWrapperProps {
  amount: number;
  clientId: number;
}

export default function StripeWrapper({ amount, clientId }: StripeWrapperProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get client details
  const { data: client } = useQuery<UserWithRole>({
    queryKey: ['/api/clients', clientId],
    staleTime: 60000,
  });
  
  // Get unpaid walks for client
  const { data: clientWalks = [] } = useQuery({
    queryKey: ['/api/clients', clientId, 'walks'],
    staleTime: 60000,
  });
  
  // Filter unpaid walks
  const unpaidWalks = Array.isArray(clientWalks) 
    ? clientWalks.filter((walk: any) => 
        (walk.status === 'completed' || walk.status === 'outstanding') && 
        !walk.isPaid)
    : [];

  const handlePaymentSuccess = () => {
    // Invalidate queries to refresh data after successful payment
    queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
    
    toast({
      title: 'Payment Successful',
      description: `Payment of $${amount.toFixed(2)} for client #${clientId} has been processed.`,
    });
  };

  const hasStripeKey = Boolean(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

  if (!hasStripeKey) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Stripe API Keys Missing</AlertTitle>
        <AlertDescription>
          Stripe payment processing is currently in demo mode. Payment operations will be simulated.
        </AlertDescription>
      </Alert>
    );
  }

  if (!client) {
    return <div>Loading client details...</div>;
  }

  // Convert UserWithRole to the expected ExtendedClient format
  const extendedClient = client ? {
    id: client.clientDetails?.id || 0,
    userId: client.id,
    address: client.clientDetails?.address || null,
    emergencyContact: client.clientDetails?.emergencyContact || null,
    notes: client.clientDetails?.notes || null,
    balance: client.clientDetails?.balance?.toString() || "0",
    lastPaymentDate: client.clientDetails?.lastPaymentDate || null,
    stripeCustomerId: client.clientDetails?.stripeCustomerId || null,
    stripeSubscriptionId: client.clientDetails?.stripeSubscriptionId || null,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email
  } : null;

  return (
    <StripePaymentForm
      client={extendedClient} 
      unpaidWalks={unpaidWalks}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}