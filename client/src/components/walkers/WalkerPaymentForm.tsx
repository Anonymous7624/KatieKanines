import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const paymentFormSchema = z.object({
  amount: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Amount must be a positive number",
  }),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface WalkerPaymentFormProps {
  walkerId: number;
  unpaidAmount: number;
  onSuccess: () => void;
}

export default function WalkerPaymentForm({ walkerId, unpaidAmount, onSuccess }: WalkerPaymentFormProps) {
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: unpaidAmount.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "",
      notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return apiRequest("POST", `/api/walkers/${walkerId}/payments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/walkers/${walkerId}/earnings`] });
      toast({
        title: "Payment recorded",
        description: `Payment successfully recorded for walker.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    createPaymentMutation.mutate(data);
  };
  
  // Function to set the amount to the full unpaid amount
  const setFullAmount = () => {
    form.setValue("amount", unpaidAmount.toString());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <div className="flex space-x-2 items-center">
                <FormControl>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={setFullAmount}
                >
                  Set Full Amount
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes about this payment"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include details such as check number or confirmation number if applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPaymentMutation.isPending}
          >
            {createPaymentMutation.isPending ? "Processing..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}