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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const weekdays = [
  "monday", 
  "tuesday", 
  "wednesday", 
  "thursday", 
  "friday", 
  "saturday", 
  "sunday"
];

const timeSlots = [
  "Not Available",
  "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
];

type AvailabilitySchedule = {
  [key: string]: [string, string] | null;
};

// Walker form schema combining user and walker details
const walkerFormSchema = z.object({
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
  walker: z.object({
    bio: z.string().optional(),
    availability: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    color: z.string().default("#4f46e5").optional(),
  }),
});

type WalkerFormValues = z.infer<typeof walkerFormSchema>;

interface WalkerFormProps {
  onSuccess?: () => void;
  defaultValues?: WalkerFormValues;
  walkerId?: number;
}

export default function WalkerForm({ 
  onSuccess, 
  defaultValues,
  walkerId
}: WalkerFormProps) {
  const { toast } = useToast();
  
  // State for availability schedule
  const [availabilitySchedule, setAvailabilitySchedule] = useState<AvailabilitySchedule>({
    monday: ["8:00", "16:00"],
    tuesday: ["8:00", "16:00"],
    wednesday: ["8:00", "16:00"],
    thursday: ["8:00", "16:00"],
    friday: ["8:00", "16:00"],
    saturday: null,
    sunday: null,
  });
  
  const form = useForm<WalkerFormValues>({
    resolver: zodResolver(walkerFormSchema),
    defaultValues: defaultValues || {
      user: {
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
      },
      walker: {
        bio: "",
        availability: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        color: "#4f46e5",
      },
    },
  });

  // Parse availability from default values if available
  useEffect(() => {
    if (defaultValues?.walker.availability) {
      try {
        const parsedAvailability = JSON.parse(defaultValues.walker.availability);
        setAvailabilitySchedule(parsedAvailability);
      } catch (e) {
        console.error("Failed to parse availability:", e);
      }
    }
  }, [defaultValues]);

  const createWalkerMutation = useMutation({
    mutationFn: async (data: WalkerFormValues) => {
      // Set availability from our schedule state
      data.walker.availability = JSON.stringify(availabilitySchedule);
      
      if (walkerId) {
        // Update existing walker
        return apiRequest("PUT", `/api/walkers/${walkerId}`, data);
      } else {
        // Create new walker
        return apiRequest("POST", "/api/walkers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/walkers"] });
      toast({
        title: walkerId ? "Walker updated" : "Walker created",
        description: walkerId ? "Walker has been updated successfully." : "New walker has been added successfully.",
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
          description: `Failed to ${walkerId ? "update" : "create"} walker: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  function onSubmit(data: WalkerFormValues) {
    createWalkerMutation.mutate(data);
  }
  
  // Function to update availability schedule
  const updateAvailability = (day: string, startOrEnd: "start" | "end", value: string) => {
    setAvailabilitySchedule(prev => {
      const newSchedule = {...prev};
      
      if (value === "Not Available") {
        newSchedule[day] = null;
      } else {
        // Initialize day if it doesn't exist or is currently null
        if (!newSchedule[day]) {
          newSchedule[day] = ["8:00", "16:00"];
        }
        
        // Update the appropriate time
        if (startOrEnd === "start") {
          newSchedule[day] = [value, newSchedule[day]?.[1] || "16:00"];
        } else {
          newSchedule[day] = [newSchedule[day]?.[0] || "8:00", value];
        }
      }
      
      return newSchedule;
    });
  };

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
          
          {/* Address information moved up after phone */}
          <h3 className="text-sm font-medium text-slate-700 pt-2">Address Information</h3>
          
          <FormField
            control={form.control}
            name="walker.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="walker.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="walker.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="walker.zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Zip Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {!walkerId && (
            <>
              <h3 className="text-sm font-medium text-slate-700 pt-2">Account Information</h3>
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
          
          <h3 className="text-sm font-medium text-slate-700 pt-4">Professional Information</h3>
          
          <FormField
            control={form.control}
            name="walker.bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of experience with dogs" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="walker.color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calendar Color</FormLabel>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded border" 
                    style={{ backgroundColor: field.value }}
                  />
                  <FormControl>
                    <Input 
                      type="color" 
                      {...field} 
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Choose a color for this walker's appointments in the schedule view
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <FormLabel>Weekly Availability</FormLabel>
            <FormDescription>
              Set your available time periods for each day of the week. Select "Not Available" for days you cannot work.
            </FormDescription>
            
            <div className="space-y-3">
              {weekdays.map(day => (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="capitalize">{day}</Label>
                  
                  <Select 
                    value={availabilitySchedule[day] ? availabilitySchedule[day]![0] : "Not Available"}
                    onValueChange={(value) => updateAvailability(day, "start", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={`${day}-start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">to</span>
                    <Select 
                      value={availabilitySchedule[day] ? availabilitySchedule[day]![1] : "Not Available"}
                      onValueChange={(value) => updateAvailability(day, "end", value)}
                      disabled={!availabilitySchedule[day]}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={`${day}-end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            disabled={createWalkerMutation.isPending}
          >
            {createWalkerMutation.isPending ? (
              <>Saving...</>
            ) : walkerId ? (
              <>Update Walker</>
            ) : (
              <>Add Walker</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
