import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  KeyIcon, 
  BellIcon, 
  UserIcon, 
  ShieldIcon,
  BuildingIcon,
  WalletIcon,
  SendIcon,
  CheckIcon
} from "lucide-react";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  newWalk: z.boolean().default(true),
  walkCancelled: z.boolean().default(true),
  walkCompleted: z.boolean().default(true),
  clientMessages: z.boolean().default(true),
  walkerMessages: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "admin@katiescanines.com",
      phone: "555-123-4567",
      companyName: "Katie's Canines Dog Walking",
      address: "123 Main Street",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      newWalk: true,
      walkCancelled: true,
      walkCompleted: true,
      clientMessages: true,
      walkerMessages: true,
      marketingEmails: false,
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been updated successfully.",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    setIsChangingPassword(false);
  };

  return (
    <MainLayout pageTitle="Settings">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="profile">
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="business">
                <BuildingIcon className="h-4 w-4 mr-2" />
                Business
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <BellIcon className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <ShieldIcon className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Update your profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-xl">
                      SJ
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline">Upload New Picture</Button>
                      <p className="text-sm text-slate-500">
                        JPG, GIF or PNG. Max size 2MB.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Update your business details and address information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                      <div className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                This will appear on invoices and client communications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>
                    Configure payment methods and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 border rounded-lg">
                      <WalletIcon className="h-8 w-8 text-slate-500 mr-4" />
                      <div className="flex-1">
                        <h3 className="font-medium">Credit Card</h3>
                        <p className="text-sm text-slate-500">Visa ending in 4242</p>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                    
                    <div className="flex items-center p-4 border rounded-lg border-dashed">
                      <Button variant="outline">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Enable or disable all email notifications
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium">Walk Notifications</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="newWalk"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>New Walk Scheduled</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!notificationForm.watch("emailNotifications")}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="walkCancelled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Walk Cancelled</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!notificationForm.watch("emailNotifications")}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="walkCompleted"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Walk Completed</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!notificationForm.watch("emailNotifications")}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium">Message Notifications</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="clientMessages"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>New Client Messages</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!notificationForm.watch("emailNotifications")}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="walkerMessages"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>New Walker Messages</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!notificationForm.watch("emailNotifications")}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <FormField
                          control={notificationForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Marketing Emails</FormLabel>
                                <FormDescription>
                                  Receive updates about new features and promotions
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!notificationForm.watch("emailNotifications")}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="submit">Save Preferences</Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isChangingPassword ? (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsChangingPassword(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Change Password</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <KeyIcon className="h-6 w-6 text-slate-500 mr-4" />
                        <div>
                          <h3 className="font-medium">Password</h3>
                          <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsChangingPassword(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <SendIcon className="h-6 w-6 text-slate-500 mr-4" />
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="h-6 w-6 text-slate-500 mr-4" />
                      <div>
                        <h3 className="font-medium">Active Sessions</h3>
                        <p className="text-sm text-slate-500">Manage your active sessions</p>
                      </div>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    These actions are permanent and cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h3 className="font-medium text-red-600">Delete Account</h3>
                      <p className="text-sm text-red-500 mt-1">
                        Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
                      </p>
                      <Button variant="destructive" className="mt-4">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

// Add missing icon components
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
