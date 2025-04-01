import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingWalks from "@/components/dashboard/UpcomingWalks";
import ClientsList from "@/components/dashboard/ClientsList";
import Calendar from "@/components/dashboard/Calendar";
import { Users, CalendarDays, Clock } from "lucide-react";
import ClientView from "./client-view";
import WalkerView from "./walker-view";

interface DashboardProps {
  switchRole?: (role: 'admin' | 'client' | 'walker' | null) => void;
  userRole?: 'admin' | 'client' | 'walker' | null;
}

export default function Dashboard({ switchRole, userRole = 'admin' }: DashboardProps) {
  // If the user is viewing as client or walker, show the appropriate view
  if (userRole === 'client') {
    return <ClientView switchRole={switchRole} />;
  }
  
  if (userRole === 'walker') {
    return <WalkerView switchRole={switchRole} />;
  }

  return (
    <MainLayout pageTitle="Dashboard" userRole={userRole} switchRole={switchRole}>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-brown-dark">Katie's Canines Dashboard</h1>
            <p className="text-brown-medium max-w-3xl">
              Welcome to your dog walking business management dashboard. Here you can monitor client details, walker assignments, and upcoming scheduled walks.
            </p>
          </div>
          
          {/* Stats overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            <StatsCard
              title="Total Clients"
              value="24"
              icon={<Users className="h-7 w-7" />}
              linkText="View all clients"
              linkHref="/clients"
            />
            
            <StatsCard
              title="Active Walkers"
              value="8"
              icon={<svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-7 w-7" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>}
              linkText="Manage walkers"
              linkHref="/walkers"
            />
            
            <StatsCard
              title="Walks Today"
              value="12"
              icon={<CalendarDays className="h-7 w-7" />}
              linkText="View schedule"
              linkHref="/schedule"
            />
            
            <StatsCard
              title="Pending Requests"
              value="5"
              icon={<Clock className="h-7 w-7" />}
              linkText="Process requests"
              linkHref="/schedule"
              colorClass="secondary"
            />
          </div>

          {/* Main sections grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-md border border-border">
              <h2 className="mb-4 text-brown-dark">Upcoming Walks</h2>
              <UpcomingWalks />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-border">
              <h2 className="mb-4 text-brown-dark">Recent Clients</h2>
              <ClientsList />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-border lg:col-span-2">
              <h2 className="mb-4 text-brown-dark">Monthly Schedule</h2>
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
