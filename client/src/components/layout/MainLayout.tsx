import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  pageTitle: string;
  userRole?: 'admin' | 'client' | 'walker' | null;
  switchRole?: (role: 'admin' | 'client' | 'walker' | null) => void;
}

export default function MainLayout({ 
  children, 
  pageTitle,
  userRole = 'admin',
  switchRole
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans antialiased">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-600 hover:text-primary-600 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        userRole={userRole}
        switchRole={switchRole}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                  {pageTitle}
                </h2>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Walk
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Role switcher - now visible on all pages */}
        {switchRole && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-2 py-2">
                <button 
                  onClick={() => switchRole('admin')}
                  role="tab" 
                  aria-selected={userRole === 'admin'} 
                  className={`py-2 px-4 rounded-md font-medium whitespace-nowrap transition-colors ${
                    userRole === 'admin' 
                      ? 'bg-pink-light text-brown-dark font-semibold border-2 border-primary' 
                      : 'text-brown-medium hover:bg-slate-100'
                  }`}
                >
                  Admin View
                </button>
                <button 
                  onClick={() => switchRole('client')}
                  role="tab" 
                  aria-selected={userRole === 'client'} 
                  className={`py-2 px-4 rounded-md font-medium whitespace-nowrap transition-colors ${
                    userRole === 'client' 
                      ? 'bg-pink-light text-brown-dark font-semibold border-2 border-primary' 
                      : 'text-brown-medium hover:bg-slate-100'
                  }`}
                >
                  Client View
                </button>
                <button 
                  onClick={() => switchRole('walker')}
                  role="tab" 
                  aria-selected={userRole === 'walker'} 
                  className={`py-2 px-4 rounded-md font-medium whitespace-nowrap transition-colors ${
                    userRole === 'walker' 
                      ? 'bg-pink-light text-brown-dark font-semibold border-2 border-primary' 
                      : 'text-brown-medium hover:bg-slate-100'
                  }`}
                >
                  Walker View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
