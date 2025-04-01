import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { generateTimeSlots } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Define interfaces for our entities
interface Client {
  id: number;
  clientDetails: {
    id: number;
  };
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface Pet {
  id: number;
  name: string;
  breed?: string;
  age?: number;
  size?: string; 
  notes?: string;
  clientId: number;
  isActive: boolean;
}

interface Walker {
  id: number;
  walkerDetails: {
    id: number;
  };
  firstName: string;
  lastName: string;
  isActive: boolean;
}

// Form schema for validation
const walkFormSchema = z.object({
  clientId: z.number({
    required_error: "Please select a client",
  }),
  walkerId: z.number({
    required_error: "Please select a walker",
  }).optional(),
  petIds: z.array(z.number()).min(1, {
    message: "Please select at least one pet",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time frame",
  }),
  duration: z.union([z.number(), z.literal('overnight')], {
    required_error: "Please select a duration",
  }),
  billingAmount: z.number({
    required_error: "Please enter a billing amount",
  }).min(0, {
    message: "Billing amount must be a positive number",
  }).optional(),
  notes: z.string().optional(),
  repeatWeekly: z.boolean().optional(),
  numberOfWeeks: z.number().min(1).max(52).optional().nullable(),
});

type WalkFormValues = z.infer<typeof walkFormSchema>;

// Time slot options
const timeSlots = [
  { value: 'morning', label: 'Morning (8am-11am)' },
  { value: 'midday', label: 'Midday (11am-2pm)' },
  { value: 'early_evening', label: 'Early Evening (2pm-5pm)' },
  { value: 'late_evening', label: 'Late Evening (5pm-8pm)' },
  { value: 'overnight', label: 'Overnight' },
];

interface WalkFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<WalkFormValues>;
  walkId?: number;
}

export default function WalkForm({ 
  onSuccess,
  defaultValues,
  walkId,
}: WalkFormProps) {
  const { toast } = useToast();

  // Log default values for debugging
  console.log("Default values provided:", defaultValues);

  // Initialize form with default values or values from existing walk
  const form = useForm<WalkFormValues>({
    resolver: zodResolver(walkFormSchema),
    defaultValues: {
      clientId: defaultValues?.clientId !== undefined ? defaultValues.clientId : undefined,
      walkerId: defaultValues?.walkerId !== undefined ? defaultValues.walkerId : undefined,
      petIds: defaultValues?.petIds || [],
      date: defaultValues?.date 
        ? (
            // Handle different types of date values
            typeof defaultValues.date === 'string' 
              ? new Date(defaultValues.date) // String date from API
              : defaultValues.date instanceof Date 
                ? defaultValues.date // Already a Date object
                : new Date() // Fallback (shouldn't happen)
          ) 
        : new Date(), // Default to today
      time: defaultValues?.time || "midday", // Default to midday
      duration: typeof defaultValues?.duration === 'number' || defaultValues?.duration === 'overnight' 
        ? defaultValues.duration 
        : 20, // Default to 20 minutes
      billingAmount: defaultValues?.billingAmount !== undefined 
        ? Number(defaultValues.billingAmount) 
        : 25, // Default to $25
      notes: defaultValues?.notes || "",
      repeatWeekly: defaultValues?.repeatWeekly || false, // Default to not repeating weekly
      numberOfWeeks: defaultValues?.numberOfWeeks || null, // Default to null (no set end date)
    },
  });

  // Log the form values for debugging
  React.useEffect(() => {
    if (defaultValues) {
      console.log("Default values provided:", defaultValues);
      console.log("Form values after initialization:", form.getValues());
    }
  }, []);

  // Add an effect to synchronize overnight status between time and duration fields
  React.useEffect(() => {
    const time = form.watch('time');
    const duration = form.watch('duration');

    if (time === 'overnight' && duration !== 'overnight') {
      form.setValue('duration', 'overnight');
    } else if (duration === 'overnight' && time !== 'overnight') {
      form.setValue('time', 'overnight');
    }
  }, [form.watch('time'), form.watch('duration')]);

  // Fetch active clients for client dropdown
  const { data: clientList = [], isSuccess: clientsLoaded } = useQuery({
    queryKey: ['/api/clients'],
    select: (data: any) => data.filter((c: Client) => c.isActive),
  });

  // Fetch active walkers for walker dropdown
  const { data: walkerList = [] } = useQuery({
    queryKey: ['/api/walkers'],
    select: (data: any) => data.filter((w: Walker) => w.isActive),
  });

  // If we are in edit mode and have a clientId from defaultValues, we need to find the proper user.id
  React.useEffect(() => {
    if (walkId && defaultValues && clientsLoaded) {
      // Debug the form default values and initial state
      console.log("Default values provided:", defaultValues);
      console.log("Form values after initialization:", form.getValues());

      // Handle client selection (map clientDetails.id to user.id)
      if (defaultValues.clientId) {
        console.log("Looking for client with clientDetails.id =", defaultValues.clientId);

        // Find the client user ID based on the clientDetails.id
        // Log all clients and the client ID we're looking for
        console.log("All available clients:", clientList);
        console.log("Looking for client with clientDetails.id =", defaultValues.clientId);

        const matchingClient = clientList.find(
          (client: Client) => client.clientDetails?.id === defaultValues.clientId
        );

        if (matchingClient) {
          console.log("Found matching client:", matchingClient);
          console.log("Setting client ID to:", matchingClient.id);

          // Explicitly update the clientId field with a slight delay
          // This ensures React has time to process all updates
          setTimeout(() => {
            form.setValue('clientId', matchingClient.id);
            console.log("Client ID set to:", form.getValues().clientId);
          }, 100);
        } else {
          console.log("No matching client found for clientDetails.id", defaultValues.clientId);
        }
      }
    }
  }, [clientsLoaded, defaultValues, walkId, form, clientList]);

  // Track selected client information for fetching pets
  const selectedClientId = form.watch("clientId");
  const selectedClient = clientList.find((client: Client) => client.id === selectedClientId);

  // Pet state & selection logic
  const [petList, setPetList] = React.useState<Pet[]>([]);

  // Fetch pets directly using client details ID (not the user ID)
  const { data: petData = [], isSuccess: petsLoaded } = useQuery({
    queryKey: [`/api/clients/${selectedClient?.clientDetails?.id}/pets`],
    enabled: !!selectedClient?.clientDetails?.id,
  });

  // Log pet data for debugging
  React.useEffect(() => {
    if (petsLoaded && selectedClient?.clientDetails?.id) {
      console.log(`Pets loaded for client ID ${selectedClient.clientDetails.id}:`, petData);
    }
  }, [petData, petsLoaded, selectedClient]);

  // Process pets when data is loaded
  React.useEffect(() => {
    console.log("Pet data received:", petData);

    if (petsLoaded && Array.isArray(petData)) {
      // Filter for active pets only
      const activePets = petData.filter((pet: Pet) => pet.isActive === true);
      console.log("Active pets filtered:", activePets);

      // Update pet list
      setPetList(activePets);

      // Handle pet selection (either select specific pet in edit mode or all pets by default)
      if (activePets.length > 0) {
        // If we're editing and have a specific pet ID in defaultValues, select those pets
        if (walkId && defaultValues?.petIds && defaultValues.petIds.length > 0) {
          // Make sure to explicitly set the pet IDs in the form to preserve them
          form.setValue('petIds', defaultValues.petIds);
          console.log("Setting pet selection from defaultValues:", defaultValues.petIds);
        } else {
          // Otherwise, select all pets by default (for new walks)
          const petIds = activePets.map((pet: Pet) => pet.id);
          form.setValue('petIds', petIds);
          console.log("Auto-selected all pet IDs:", petIds);
        }
      }
    } else {
      setPetList([]);
    }
  }, [petData, petsLoaded, selectedClientId, form, walkId, defaultValues?.petIds]);

  // Create or update a walk
  const walkMutation = useMutation({
    mutationFn: async (data: WalkFormValues) => {
      let endpoint = '/api/walks';
      let method = 'POST';

      if (walkId) {
        endpoint = `/api/walks/${walkId}`;
        method = 'PUT';
      }

      // Get the selected client details to use the correct clientId (client details ID)
      const selectedClient = clientList.find((c: Client) => c.id === data.clientId);
      if (!selectedClient || !selectedClient.clientDetails) {
        throw new Error("Invalid client selection or missing client details");
      }

      // Create payload with petIds - but only use first petId since API only supports one
      const { petIds, ...restData } = data;

      if (!petIds || petIds.length === 0) {
        throw new Error("Please select at least one pet for this walk");
      }

      // Handle date format without timezone complications
      const date = data.date;
      const formattedDate = date ? 
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : 
        '';

      console.log(`Selected date in local timezone: ${date}, Formatted for API: ${formattedDate}`);


      // Log all selected pets for debugging purposes
      console.log("Selected pets:", petIds, "Using primary pet:", petIds[0]);

      // Create the payload for the API
      const payload = {
        ...restData,
        clientId: selectedClient.clientDetails.id, // Use the client details ID!
        date: formattedDate, // Convert Date object to string format
        petId: petIds[0], // For now, API only supports first pet (we'll handle multiple pets in a future update)
        duration: data.duration === 'overnight' ? 'overnight' : data.duration,
        billingAmount: data.billingAmount, // Include billing amount
        // For walker ID, find the correct walker and use their walkerDetails.id
        walkerId: data.walkerId ? 
          walkerList.find((w: Walker) => w.id === data.walkerId)?.walkerDetails?.id : 
          undefined,
        // Store all pet IDs as string for future reference, even though API will only use the first one
        allPetIds: petIds.join(','),
        repeatWeekly: data.repeatWeekly || false,
        numberOfWeeks: data.repeatWeekly ? data.numberOfWeeks : null
      };

      console.log("Walker mapping:", walkerList.map((w: Walker) => `User ID: ${w.id} -> Walker ID: ${w.walkerDetails?.id}`));
      console.log("Original walkerId:", data.walkerId);
      console.log("Mapped to walkerDetails.id:", payload.walkerId);
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));
      console.log("Making " + method + " request to " + endpoint + " with data:", payload);
      const response = await apiRequest(method, endpoint, payload);

      // After the update/create operation, get the updated walk to ensure we have the latest state
      if (method === 'PUT') {
        await queryClient.invalidateQueries({ queryKey: [`/api/walks/${walkId}`] });
      }

      return response;
    },
    onSuccess: () => {
      toast({
        title: walkId ? "Walk Updated" : "Walk Scheduled",
        description: walkId 
          ? "The walk has been updated successfully." 
          : "The walk has been scheduled successfully.",
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/walks/upcoming'] });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      // Enhanced error logging
      console.error("Error saving walk:", error);

      // Extract more detailed error information if available
      let errorMessage = "There was an error saving the walk. Please try again.";

      if (error.response) {
        console.error("Error response:", error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: WalkFormValues) {
    console.log("Form data:", data);
    walkMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Client Selection */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientList.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pet Selection */}
          <FormField
            control={form.control}
            name="petIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pets</FormLabel>
                <FormDescription>
                  Select one or more pets for this walk
                </FormDescription>
                <div className="flex flex-col gap-2">
                  {petList.length > 0 ? (
                    petList.map((pet: Pet) => (
                      <div key={pet.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(pet.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Allow multiple pet selection
                              field.onChange([...field.value || [], pet.id]);
                            } else {
                              field.onChange(
                                field.value?.filter((value) => value !== pet.id) || []
                              );
                            }
                          }}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm italic text-muted-foreground">
                      {selectedClientId 
                        ? "No active pets found for this client. Please add a pet first." 
                        : "Please select a client first"}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Walker Selection */}
          <FormField
            control={form.control}
            name="walkerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Walker (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    // If value is "0", set walkerId to undefined (unassigned)
                    field.onChange(value === "0" ? undefined : parseInt(value, 10));
                  }}
                  value={field.value?.toString() || "0"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select walker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Unassigned</SelectItem>
                    {walkerList.map((walker: Walker) => (
                      <SelectItem key={walker.id} value={walker.id.toString()}>
                        {walker.firstName} {walker.lastName} (ID: {walker.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "EEEE, MMMM d, yyyy")
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

            {/* Time Selection */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem 
                          key={slot.value} 
                          value={slot.value}
                          disabled={form.watch('duration') === 'overnight' && slot.value !== 'overnight'}
                        >
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Walk Duration */}
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value === 'overnight' ? value : parseInt(value, 10));
                  }}
                  value={field.value?.toString() || "20"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="20" disabled={form.watch('time') === 'overnight'}>20 minutes</SelectItem>
                    <SelectItem value="30" disabled={form.watch('time') === 'overnight'}>30 minutes</SelectItem>
                    <SelectItem value="60" disabled={form.watch('time') === 'overnight'}>60 minutes</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billing Amount */}
          <FormField
            control={form.control}
            name="billingAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Amount ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    placeholder="Enter billing amount" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                    value={field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormDescription>
                  Amount to bill for this walk
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any special instructions for this walk" 
                    className="resize-none text-lg min-h-[150px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Repeat Weekly Option */}
          <FormField
            control={form.control}
            name="repeatWeekly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Repeat Weekly</FormLabel>
                  <FormDescription>
                    Schedule this walk for the same day and time each week
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Number of Weeks (only shown if repeatWeekly is checked) */}
          {form.watch('repeatWeekly') && (
            <FormField
              control={form.control}
              name="numberOfWeeks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Weeks</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2"
                      max="52"
                      placeholder="Leave blank for no end date"
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : null;
                        field.onChange(value);
                      }}
                      value={field.value === null || field.value === undefined ? '' : field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose how many weeks this walk should repeat (between 2 and 52 weeks), or leave blank for no set end date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Form Buttons */}
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
            disabled={walkMutation.isPending}
          >
            {walkMutation.isPending ? (
              <>Saving...</>
            ) : walkId ? (
              <>Update Walk</>
            ) : (
              <>Schedule Walk</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}