import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Walk {
  id: number;
  clientId: number;
  clientName: string;
  petName: string;
  date: string;
  time: string;
  status: string;
  billingAmount?: number | string;
  isPaid?: boolean;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
}

interface ClientPaymentFormProps {
  client: Client | null;
  unpaidWalks: Walk[];
  onPaymentSuccess: () => void;
}

const paymentSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentDate: z.date({
    required_error: 'Please select a payment date',
  }),
  paymentMethod: z.enum(['cash', 'check', 'venmo', 'zelle'], {
    required_error: 'Please select a payment method',
  }),
});

export default function ClientPaymentForm({ client, unpaidWalks, onPaymentSuccess }: ClientPaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalOwed = unpaidWalks.reduce((sum, walk) => {
    const amount = typeof walk.billingAmount === 'string'
      ? parseFloat(walk.billingAmount)
      : (typeof walk.billingAmount === 'number' ? walk.billingAmount : 0);
    return sum + amount;
  }, 0);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: totalOwed.toFixed(2),
      paymentDate: new Date(),
      paymentMethod: 'cash',
    },
  });

  const handleSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (!client) {
      toast({
        title: 'No client selected',
        description: 'Please select a client before recording a payment',
        variant: 'destructive',
      });
      return;
    }

    if (unpaidWalks.length === 0) {
      toast({
        title: 'No unpaid walks',
        description: 'There are no unpaid walks to apply payment to',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const walkIds = unpaidWalks.map(walk => walk.id);
      
      const response = await apiRequest(
        'POST',
        `/api/clients/${client.id}/payments`,
        {
          amount: parseFloat(values.amount),
          paymentDate: values.paymentDate.toISOString().split('T')[0],
          paymentMethod: values.paymentMethod,
          walkIds: walkIds,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment recorded',
          description: `Successfully recorded ${values.paymentMethod} payment of $${values.amount}`,
        });
        form.reset({
          amount: '0.00',
          paymentDate: new Date(),
          paymentMethod: 'cash',
        });
        onPaymentSuccess();
      } else {
        throw new Error(data.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a client to record a payment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Record Payment for {client.firstName} {client.lastName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
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

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                This payment will be applied to {unpaidWalks.length} unpaid walk{unpaidWalks.length !== 1 ? 's' : ''}.
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}