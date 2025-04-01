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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Pet form schema
const petFormSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  breed: z.string().optional(),
  age: z.coerce.number().int().min(0).optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

interface PetFormProps {
  clientId: number;
  onSuccess?: () => void;
  defaultValues?: PetFormValues;
  petId?: number;
}

export default function PetForm({ 
  clientId, 
  onSuccess, 
  defaultValues,
  petId
}: PetFormProps) {
  const { toast } = useToast();
  
  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: defaultValues || {
      name: "",
      breed: "",
      age: undefined,
      size: "",
      notes: "",
    },
  });

  const petMutation = useMutation({
    mutationFn: async (data: PetFormValues) => {
      if (petId) {
        // Update existing pet
        return apiRequest("PUT", `/api/pets/${petId}`, data);
      } else {
        // Create new pet
        return apiRequest("POST", `/api/clients/${clientId}/pets`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: petId ? "Pet updated" : "Pet added",
        description: petId ? "Pet has been updated successfully." : "New pet has been added successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${petId ? "update" : "add"} pet: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: PetFormValues) {
    petMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pet Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breed</FormLabel>
                <FormControl>
                  <Input placeholder="Breed" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age (Years)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Age" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Special needs, behaviors, or other information" 
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
            disabled={petMutation.isPending}
          >
            {petMutation.isPending ? (
              <>Saving...</>
            ) : petId ? (
              <>Update Pet</>
            ) : (
              <>Add Pet</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
