import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetails from "@/pages/client-details";
import Walkers from "@/pages/walkers";
import WalkerDetails from "@/pages/walker-details";
import Schedule from "@/pages/schedule";
import Messages from "@/pages/messages";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ClientView from "@/pages/client-view";
import WalkerView from "@/pages/walker-view";
import ApiDocumentation from "@/pages/api-documentation";
import WalkDetailsPage from "@/pages/walk-details";
import Billing from "@/pages/billing";
import BillingTest from "@/pages/billing-test";
import { useState } from "react";

// Define our user context type
type UserRole = 'admin' | 'client' | 'walker' | null;

function Router() {
  // In a real app, this would come from authentication
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // Function to switch between roles (for demo purposes)
  const switchRole = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <Switch>
      {/* Admin view routes */}
      <Route path="/" component={() => <Dashboard switchRole={switchRole} userRole={userRole} />} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetails} />
      <Route path="/walkers" component={Walkers} />
      <Route path="/walkers/:id" component={WalkerDetails} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/messages" component={Messages} />
      <Route path="/billing" component={Billing} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/api-documentation" component={ApiDocumentation} />
      <Route path="/walks/:id" component={WalkDetailsPage} />
      <Route path="/billing-test" component={BillingTest} />
      
      {/* Client view route */}
      <Route path="/client-view" component={() => <ClientView switchRole={switchRole} />} />
      
      {/* Walker view route */}
      <Route path="/walker-view" component={() => <WalkerView switchRole={switchRole} />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
