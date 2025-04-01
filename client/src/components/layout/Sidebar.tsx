import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole?: 'admin' | 'client' | 'walker' | null;
  switchRole?: (role: 'admin' | 'client' | 'walker' | null) => void;
}

export default function Sidebar({ 
  isOpen, 
  setIsOpen,
  userRole = 'admin',
  switchRole
}: SidebarProps) {
  const [location] = useLocation();

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0" // Always show on large screens
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-pink-light">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
            </svg>
            <span className="text-xl font-bold text-brown-dark">Katie's Canines</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {/* Using divs inside Link components to avoid nesting <a> tags */}
          
          <Link href="/">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </div>
          </Link>

          <Link href="/schedule">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/schedule") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/schedule") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </div>
          </Link>

          <Link href="/billing">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/billing") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/billing") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Billing
            </div>
          </Link>

          <Link href="/clients">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/clients") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/clients") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Clients
            </div>
          </Link>

          <Link href="/walkers">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/walkers") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/walkers") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Walkers
            </div>
          </Link>

          <Link href="/messages">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/messages") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/messages") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </div>
          </Link>

          <Link href="/reports">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/reports") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/reports") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reports
            </div>
          </Link>

          <Link href="/settings">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/settings") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/settings") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </Link>
          
          <Link href="/api-documentation">
            <div 
              onClick={closeSidebar}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group cursor-pointer",
                isActive("/api-documentation") 
                  ? "text-white bg-primary" 
                  : "text-brown-dark hover:bg-pink-light/30"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={cn(
                "h-5 w-5 mr-3", 
                isActive("/api-documentation") ? "text-white" : "text-primary"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              API Documentation
            </div>
          </Link>
        </nav>

        {/* User profile */}
        <div className="border-t border-pink-light p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-pink-light flex items-center justify-center text-primary font-bold">
                SJ
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-brown-dark">Sarah Johnson</p>
              <p className="text-xs font-medium text-brown-medium">Admin</p>
            </div>
            <div className="ml-auto">
              <button className="text-brown-medium hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
