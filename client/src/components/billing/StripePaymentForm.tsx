import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Client, Walk } from '@shared/schema';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Extended client interface to include user details
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

interface StripePaymentFormProps {
  client: ExtendedClient | null;
  unpaidWalks: Walk[];
  onPaymentSuccess: () => void;
}

// Set up Stripe with publishable key
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : 
  null;

if (!stripePromise) {
  console.warn('Stripe publishable key not found. Set VITE_STRIPE_PUBLIC_KEY in environment.');
}

// Form schema
const paymentAmountSchema = z.object({
  amount: z.union([
    z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
    z.number().min(0.01, { message: 'Amount must be a positive number' })
  ]).transform(val => typeof val === 'string' ? val : val.toString())
});

// Inner payment form that uses Stripe context
function StripeCheckoutForm({ client, onPaymentSuccess, amount }: { 
  client: ExtendedClient; 
  onPaymentSuccess: () => void;
  amount: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: error.message || 'Payment could not be processed',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully',
          variant: 'default',
        });
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred');
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred during payment processing',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${parseFloat(amount).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

// Main component that wraps with Stripe Elements
export default function StripePaymentForm({ client, unpaidWalks, onPaymentSuccess }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalOwed = unpaidWalks.reduce((sum, walk) => {
    const amount = typeof walk.billingAmount === 'string'
      ? parseFloat(walk.billingAmount)
      : (typeof walk.billingAmount === 'number' ? walk.billingAmount : 0);
    return sum + amount;
  }, 0);

  const form = useForm<z.infer<typeof paymentAmountSchema>>({
    resolver: zodResolver(paymentAmountSchema),
    defaultValues: {
      amount: totalOwed.toFixed(2),
    },
  });

  const initializePayment = async (values: z.infer<typeof paymentAmountSchema>) => {
    if (!client) {
      toast({
        title: "Error",
        description: "Please select a client first",
        variant: "destructive",
      });
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Stripe Not Configured",
        description: "Stripe payment is not available at this time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create payment intent on the server
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        clientId: client.id,
        amount: parseFloat(values.amount),
      });

      const data = await response.json();
      
      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Could not set up payment. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelPayment = () => {
    setClientSecret(null);
  };

  if (!client) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Credit Card Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a client to process a credit card payment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Credit Card Payment for {client.firstName} {client.lastName}</CardTitle>
      </CardHeader>
      <CardContent>
        {!stripePromise && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Stripe API Keys Missing</AlertTitle>
            <AlertDescription>
              Stripe payment processing is currently disabled because API keys are not configured. 
              This is a demo mode. In a production environment, you would need to add Stripe API keys.
            </AlertDescription>
          </Alert>
        )}
        
        {!clientSecret ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(initializePayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total Unpaid Amount:</span>
                  <span className="font-bold text-xl">${totalOwed.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  This payment will apply to {unpaidWalks.length} unpaid walk{unpaidWalks.length !== 1 ? 's' : ''}.
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !stripePromise}
                  title={!stripePromise ? "Stripe API keys required for payment processing" : ""}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up payment...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your card information below to complete the payment.
              </p>
              
              {stripePromise && (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#5c6ac4',
                        colorBackground: '#ffffff',
                        colorText: '#1a1f36',
                      }
                    }
                  }}
                >
                  <StripeCheckoutForm 
                    client={client} 
                    onPaymentSuccess={onPaymentSuccess} 
                    amount={form.getValues().amount}
                  />
                </Elements>
              )}
            </div>
            
            <div className="mt-4 flex justify-start">
              <Button 
                variant="outline" 
                onClick={cancelPayment}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}