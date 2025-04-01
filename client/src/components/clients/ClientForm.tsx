import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Client form schema combining user and client details
const clientFormSchema = z.object({
  user: z.object({
    username: z.string()
      .min(1, { message: "Username is required" })
      .optional(),
    password: z.string()
      .min(1, { message: "Password is required" })
      .optional(),
    email: z.string()
      .email({ message: "Must be a valid email" })
      .min(1, { message: "Email is required" })
      .optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
  client: z.object({
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    notes: z.string().optional(),
  }),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSuccess?: () => void;
  defaultValues?: ClientFormValues;
  clientId?: number;
}

export default function ClientForm({ 
  onSuccess, 
  defaultValues,
  clientId
}: ClientFormProps) {
  const { toast } = useToast();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultValues || {
      user: {
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
      },
      client: {
        address: "",
        emergencyContact: "",
        notes: "",
      },
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      if (clientId) {
        // Update existing client
        return apiRequest("PUT", `/api/clients/${clientId}`, data);
      } else {
        // Create new client
        return apiRequest("POST", "/api/clients", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: clientId ? "Client updated" : "Client created",
        description: clientId ? "Client has been updated successfully." : "New client has been added successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      // Handle specific error messages for username and email conflicts
      if (error.message === "Username already exists") {
        form.setError("user.username", { 
          type: "manual", 
          message: "This username is already taken. Please choose another." 
        });
        toast({
          title: "Username Already Exists",
          description: "Please choose a different username.",
          variant: "destructive",
        });
      } else if (error.message === "Email already exists") {
        form.setError("user.email", { 
          type: "manual", 
          message: "This email is already registered. Please use another." 
        });
        toast({
          title: "Email Already Exists",
          description: "Please use a different email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to ${clientId ? "update" : "create"} client: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  function onSubmit(data: ClientFormValues) {
    createClientMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700">Personal Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="user.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="user.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="user.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="user.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!clientId && (
            <>
              <FormField
                control={form.control}
                name="user.username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="user.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <h3 className="text-sm font-medium text-slate-700 pt-4">Additional Information</h3>
          
          <FormField
            control={form.control}
            name="client.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Full address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="client.emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Name and phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="client.notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional notes (gate codes, special instructions, etc.)" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createClientMutation.isPending}
          >
            {createClientMutation.isPending ? (
              <>Saving...</>
            ) : clientId ? (
              <>Update Client</>
            ) : (
              <>Add Client</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
