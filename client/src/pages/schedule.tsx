import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarPlus, 
  Calendar as CalendarIcon, 
  EyeIcon, 
  Grid, 
  XIcon, 
  ArrowUpDown, 
  Search,
  User,
  Users,
  PawPrint,
  CalendarDays,
  CheckCircle2,
  Share,
  Printer,
  SendHorizontal,
  MessageSquare
} from "lucide-react";
import Calendar from "@/components/dashboard/Calendar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import WalkForm from "@/components/walks/WalkForm";
import WeekAtAGlance from "@/components/schedule/WeekAtAGlance";
import { formatDate, formatTime, normalizeDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Walk {
  id: number;
  clientName: string;
  petName: string;
  allPetNames?: string; // Added field for all pet names
  walkerName?: string;
  walkerId?: number;
  date: string;
  time: string;
  duration: number;
  status: string;
  isGroupWalk: boolean;
}

interface Walker {
  id: number;
  firstName: string;
  lastName: string;
  color: string;
}

type SortKey = 'date' | 'time' | 'clientName' | 'petName' | 'walkerName' | 'duration' | 'status';
type SortDirection = 'ascending' | 'descending';

export default function Schedule() {
  const [showWalkForm, setShowWalkForm] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterWalker, setFilterWalker] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingWalkId, setEditingWalkId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: walks = [], isLoading, isError } = useQuery<Walk[]>({
    queryKey: ["/api/walks"],
  });
  
  const { data: walkers = [] } = useQuery<Walker[]>({
    queryKey: ["/api/walkers"],
  });

  // Function to request sort by column
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort walks
  const getFilteredAndSortedWalks = (status: string) => {
    let filteredWalks = [...walks].filter((walk: Walk) => walk.status === status);
    
    // Apply date filter if set and not "all"
    if (filterDate && filterDate !== "all") {
      filteredWalks = filteredWalks.filter((walk: Walk) => normalizeDate(walk.date) === normalizeDate(filterDate));
    }
    
    // Apply walker filter if set and not "all"
    if (filterWalker && filterWalker !== "all") {
      if (filterWalker === "unassigned") {
        // Filter for walks with no assigned walker
        filteredWalks = filteredWalks.filter((walk: Walk) => 
          !walk.walkerName
        );
      } else {
        // Filter for walks with the specified walker
        filteredWalks = filteredWalks.filter((walk: Walk) => 
          walk.walkerName && walk.walkerName.split(' ')[0].toLowerCase() === filterWalker.toLowerCase()
        );
      }
    }
    
    // Apply client filter if set and not "all"
    if (filterClient && filterClient !== "all") {
      filteredWalks = filteredWalks.filter((walk: Walk) => 
        walk.clientName.toLowerCase() === filterClient.toLowerCase()
      );
    }
    
    // Apply search term filter if set
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredWalks = filteredWalks.filter((walk: Walk) => 
        walk.clientName.toLowerCase().includes(searchLower) || 
        walk.petName.toLowerCase().includes(searchLower) ||
        (walk.allPetNames && walk.allPetNames.toLowerCase().includes(searchLower)) ||
        (walk.walkerName && walk.walkerName.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort the filtered walks
    if (sortConfig !== null) {
      filteredWalks.sort((a: Walk, b: Walk) => {
        // Handle safely accessing potentially undefined properties
        const valueA = a[sortConfig.key] ?? '';
        const valueB = b[sortConfig.key] ?? '';
        
        if (valueA < valueB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort by date and time
      filteredWalks.sort((a: Walk, b: Walk) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    return filteredWalks;
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterDate(null);
    setFilterWalker(null);
    setFilterClient(null);
    setSearchTerm("");
    setSortConfig(null);
  };
  
  // Filter by specific client
  const filterByClient = (client: string) => {
    setFilterClient(client);
  };

  // Filter by specific date
  const filterByDate = (date: string) => {
    console.log(`Filtering walks by date: ${date}`);
    // Ensure date is normalized to YYYY-MM-DD format using our utility function
    const normalizedDate = normalizeDate(date);
    console.log(`Normalized date for filtering: ${normalizedDate}`);
    setFilterDate(normalizedDate);
  };

  // Filter by specific walker and optionally by date
  const filterByWalker = (walker: string, date?: string) => {
    setFilterWalker(walker);
    
    // If a date was provided, also set the date filter
    if (date) {
      // Ensure date is normalized to YYYY-MM-DD format using our utility function
      const normalizedDate = normalizeDate(date);
      console.log(`Filtering by walker: ${walker} and date: ${normalizedDate}`);
      setFilterDate(normalizedDate);
    }
  };

  // When filter parameters change, switch to list view
  useEffect(() => {
    if (filterDate || filterWalker || filterClient) {
      setView("list");
    }
  }, [filterDate, filterWalker, filterClient]);

  // Function to mark a walk as complete
  const handleMarkComplete = async (walkId: number) => {
    try {
      // Mark the walk as completed and set isPaid to false to indicate it needs payment
      await apiRequest('PUT', `/api/walks/${walkId}`, { 
        status: 'completed',
        isPaid: false
      });
      
      // Show a success notification
      toast({
        title: "Walk Completed",
        description: "The walk has been marked as completed and is now pending payment.",
        variant: "default"
      });
      
      // Invalidate the walks cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
    } catch (error) {
      console.error('Error marking walk as complete:', error);
      
      // Show an error notification
      toast({
        title: "Error",
        description: "Failed to mark the walk as completed. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to update walk properties
  const handleUpdateWalk = async (walkId: number, updatedFields: Partial<Walk>) => {
    try {
      await apiRequest('PUT', `/api/walks/${walkId}`, updatedFields);
      
      toast({
        title: "Walk Updated",
        description: "The walk has been successfully updated.",
        variant: "default"
      });
      
      // Reset the editing state
      setEditingWalkId(null);
      
      // Invalidate the walks cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/walks'] });
    } catch (error) {
      console.error('Error updating walk:', error);
      
      toast({
        title: "Error",
        description: "Failed to update the walk. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
    }
  };
  
  // Function to get day of week from date string
  const getDayOfWeek = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };
  
  // Function to open the schedule print view
  const openSchedulePrintView = (walks: Walk[]) => {
    // Create a new window with appropriate size
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open a new window. Please check your browser settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Get any additional client data we might need
    const walkersWithAddresses = walkers; // In a real app, we'd fetch more data if needed

    // Build the HTML content
    let content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Katie's Canines - Walk Schedule</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2 {
            color: #9333ea;
          }
          h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #9333ea;
            padding-bottom: 10px;
          }
          h2 {
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .walk-card {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .walk-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .walk-time {
            font-weight: bold;
            color: #9333ea;
          }
          .walk-duration {
            background-color: #9333ea;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
          }
          .walk-details {
            margin: 10px 0;
          }
          .walk-details div {
            margin-bottom: 5px;
          }
          .walk-notes {
            font-style: italic;
            background-color: #fffde7;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
            border-left: 3px solid #ffd54f;
          }
          .buttons {
            text-align: center;
            margin-top: 30px;
          }
          .print-btn, .sms-btn {
            background-color: #9333ea;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
          }
          .print-btn:hover, .sms-btn:hover {
            background-color: #7928ca;
          }
          @media print {
            .buttons {
              display: none;
            }
            body {
              padding: 0;
              font-size: 12px;
            }
            .walk-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>Katie's Canines - Walk Schedule</h1>
    `;
    
    // Group walks by date
    const walksByDate = walks.reduce((acc, walk) => {
      if (!acc[walk.date]) {
        acc[walk.date] = [];
      }
      acc[walk.date].push(walk);
      return acc;
    }, {});
    
    // Sort dates
    const sortedDates = Object.keys(walksByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Generate content for each date
    sortedDates.forEach(date => {
      const formattedDate = formatDate(date);
      const dayOfWeek = getDayOfWeek(date);
      
      content += `<h2>${dayOfWeek}, ${formattedDate}</h2>`;
      
      // Sort walks by time
      const sortedWalks = walksByDate[date].sort((a, b) => 
        a.time.localeCompare(b.time)
      );
      
      // Add each walk
      sortedWalks.forEach(walk => {
        content += `
          <div class="walk-card">
            <div class="walk-header">
              <span class="walk-time">${formatTime(walk.time)}</span>
              <span class="walk-duration">${walk.duration} min</span>
            </div>
            <div class="walk-details">
              <div><strong>Pet:</strong> ${walk.allPetNames || walk.petName}</div>
              <div><strong>Client:</strong> ${walk.clientName}</div>
              <div><strong>Walker:</strong> ${walk.walkerName || "Unassigned"}</div>
              <div><strong>Address:</strong> 123 Main St, Anytown, NY 12345</div>
            </div>
            ${walk.notes ? `<div class="walk-notes">${walk.notes}</div>` : ''}
          </div>
        `;
      });
    });
    
    // Add print and SMS buttons
    content += `
        <div class="buttons">
          <button class="print-btn" onclick="window.print()">
            Print Schedule
          </button>
          <button class="sms-btn" onclick="sendSMS()">
            Send via SMS
          </button>
        </div>
        <script>
          function sendSMS() {
            window.alert('SMS functionality would be implemented here. This would send the schedule to the selected walker.');
          }
        </script>
      </body>
      </html>
    `;
    
    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <MainLayout pageTitle="Schedule">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Week at a Glance */}
          <WeekAtAGlance 
            onDayClick={filterByDate} 
            onWalkerClick={filterByWalker} 
            onTotalClick={filterByDate}
          />

          {/* Active Filters */}
          {((filterDate && filterDate !== "all") || 
            (filterWalker && filterWalker !== "all") || 
            (filterClient && filterClient !== "all") || 
            searchTerm) && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <div className="text-sm font-medium">Active Filters:</div>
              {filterDate && filterDate !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date: {formatDate(filterDate)}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1" 
                    onClick={() => setFilterDate(null)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filterWalker && filterWalker !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Walker: {filterWalker}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1" 
                    onClick={() => setFilterWalker(null)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filterClient && filterClient !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Client: {filterClient}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1" 
                    onClick={() => setFilterClient(null)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: {searchTerm}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1" 
                    onClick={() => setSearchTerm("")}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Walk Creation Form */}
          {showWalkForm && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Schedule New Walk</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowWalkForm(false)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WalkForm onSuccess={() => setShowWalkForm(false)} />
              </CardContent>
            </Card>
          )}
          
          {/* Schedule View Controls */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex space-x-2">
                  <Button 
                    variant={view === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("list")}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    List View
                  </Button>
                  <Button 
                    variant={view === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("calendar")}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Calendar View
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => openSchedulePrintView(getFilteredAndSortedWalks("scheduled"))}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Send Schedule
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search walks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={() => setShowWalkForm(!showWalkForm)}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule New Walk
                  </Button>
                </div>
              </div>

              {view === "calendar" ? (
                <Calendar />
              ) : (
                <Tabs defaultValue="upcoming">
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>
                  
                  {/* Filter Controls for List View */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4">
                    {/* Walker Filter */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">Filter by Walker</label>
                      <Select
                        value={filterWalker || ""}
                        onValueChange={(value) => {
                          if (!value) setFilterWalker(null);
                          else if (value === "all") setFilterWalker("all");
                          else if (value === "unassigned") setFilterWalker("unassigned");
                          else setFilterWalker(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Walker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Walkers</SelectItem>
                          <SelectItem value="unassigned" className="text-red-500">Unassigned</SelectItem>
                          {Array.from(new Set(walks.map(walk => 
                            walk.walkerName ? walk.walkerName.split(' ')[0] : null
                          )))
                          .filter(Boolean)
                          .sort()
                          .map((walker) => (
                            <SelectItem key={walker} value={walker!}>{walker}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Date Filter */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">Filter by Date</label>
                      <Select
                        value={filterDate || ""}
                        onValueChange={(value) => {
                          if (!value) setFilterDate(null);
                          else if (value === "all") setFilterDate("all");
                          else setFilterDate(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          {Array.from(new Set(walks.map(walk => walk.date)))
                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                            .map((date) => (
                              <SelectItem key={date} value={date}>{formatDate(date)}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Client Filter */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium">Filter by Client</label>
                      <Select
                        value={filterClient || ""}
                        onValueChange={(value) => {
                          if (!value) setFilterClient(null);
                          else if (value === "all") setFilterClient("all");
                          else setFilterClient(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clients</SelectItem>
                          {Array.from(new Set(walks.map(walk => walk.clientName)))
                            .sort()
                            .map((client) => (
                              <SelectItem key={client} value={client}>{client}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <TabsContent value="upcoming" className="mt-4">
                    {renderWalkTable(
                      getFilteredAndSortedWalks("scheduled"),
                      isLoading,
                      isError
                    )}
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    {renderWalkTable(
                      getFilteredAndSortedWalks("completed"),
                      isLoading,
                      isError
                    )}
                  </TabsContent>
                  <TabsContent value="cancelled" className="mt-4">
                    {renderWalkTable(
                      getFilteredAndSortedWalks("cancelled"),
                      isLoading,
                      isError
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );

  function renderWalkTable(filteredWalks: Walk[], isLoading: boolean, isError: boolean) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </div>
          
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, j) => (
                <Skeleton key={j} className="h-12" />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading schedule. Please try again later.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Day
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>
                Date {sortConfig?.key === 'date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('time')}>
                Time {sortConfig?.key === 'time' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('clientName')}>
                Client {sortConfig?.key === 'clientName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('petName')}>
                Pet {sortConfig?.key === 'petName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('walkerName')}>
                Walker {sortConfig?.key === 'walkerName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('duration')}>
                Duration {sortConfig?.key === 'duration' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('status')}>
                Status {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWalks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No walks found in this category.
                </TableCell>
              </TableRow>
            ) : (
              filteredWalks.map((walk: Walk) => (
                <TableRow 
                  key={walk.id} 
                  className="hover:bg-gray-50"
                >
                  {/* Day of Week Cell */}
                  <TableCell>{getDayOfWeek(walk.date)}</TableCell>
                  
                  {/* Editable Date Cell */}
                  <TableCell>
                    {editingWalkId === walk.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[160px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(walk.date)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent 
                            mode="single"
                            selected={new Date(walk.date)}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                const formattedDate = format(date, 'yyyy-MM-dd');
                                handleUpdateWalk(walk.id, { date: formattedDate });
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div 
                        className="cursor-pointer hover:underline" 
                        onClick={() => setEditingWalkId(walk.id)}
                        title="Click to edit date"
                      >
                        {formatDate(walk.date)}
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Editable Time Cell */}
                  <TableCell>
                    {editingWalkId === walk.id ? (
                      <Select
                        defaultValue={walk.time}
                        onValueChange={(value) => {
                          handleUpdateWalk(walk.id, { time: value });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00:00">9:00 AM</SelectItem>
                          <SelectItem value="09:30:00">9:30 AM</SelectItem>
                          <SelectItem value="10:00:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00:00">11:00 AM</SelectItem>
                          <SelectItem value="12:00:00">12:00 PM</SelectItem>
                          <SelectItem value="13:00:00">1:00 PM</SelectItem>
                          <SelectItem value="14:00:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00:00">3:00 PM</SelectItem>
                          <SelectItem value="15:30:00">3:30 PM</SelectItem>
                          <SelectItem value="16:00:00">4:00 PM</SelectItem>
                          <SelectItem value="17:00:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00:00">6:00 PM</SelectItem>
                          <SelectItem value="19:00:00">7:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        className="cursor-pointer hover:underline" 
                        onClick={() => setEditingWalkId(walk.id)}
                        title="Click to edit time"
                      >
                        {formatTime(walk.time)}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>{walk.clientName}</TableCell>
                  <TableCell>{walk.allPetNames || walk.petName}</TableCell>
                  
                  {/* Editable Walker Cell */}
                  <TableCell>
                    {editingWalkId === walk.id ? (
                      <Select
                        defaultValue={walk.walkerId ? walk.walkerId.toString() : ""}
                        onValueChange={(value) => {
                          const walkerId = parseInt(value);
                          const selectedWalker = walkers.find((w: Walker) => w.id === walkerId);
                          handleUpdateWalk(walk.id, { 
                            walkerId,
                            walkerName: selectedWalker ? `${selectedWalker.firstName} ${selectedWalker.lastName}` : undefined
                          });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select walker" />
                        </SelectTrigger>
                        <SelectContent>
                          {walkers.map((walker: Walker) => (
                            <SelectItem key={walker.id} value={walker.id.toString()}>
                              {walker.firstName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        className={`cursor-pointer hover:underline ${!walk.walkerName ? "text-red-500 font-medium" : ""}`}
                        onClick={() => setEditingWalkId(walk.id)}
                        title="Click to assign walker"
                      >
                        {walk.walkerName ? walk.walkerName.split(' ')[0] : "Unassigned"}
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Editable Duration Cell */}
                  <TableCell>
                    {editingWalkId === walk.id ? (
                      <Select
                        defaultValue={walk.duration.toString()}
                        onValueChange={(value) => {
                          handleUpdateWalk(walk.id, { duration: parseInt(value) });
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                          <SelectItem value="90">90 min</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        className="cursor-pointer hover:underline" 
                        onClick={() => setEditingWalkId(walk.id)}
                        title="Click to edit duration"
                      >
                        {walk.duration} min
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Editable Status Cell */}
                  <TableCell>
                    {editingWalkId === walk.id ? (
                      <Select
                        defaultValue={walk.status}
                        onValueChange={(value) => {
                          const isPaidChange = value === "completed" ? { isPaid: false } : {};
                          handleUpdateWalk(walk.id, { 
                            status: value,
                            ...isPaidChange
                          });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingWalkId(walk.id)}
                        title="Click to change status"
                      >
                        {getStatusBadge(walk.status)}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingWalkId === walk.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Done Editing"
                          onClick={() => setEditingWalkId(null)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                      ) : (
                        <>
                          {walk.status === "scheduled" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Mark as Complete"
                              onClick={() => handleMarkComplete(walk.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View Details"
                            onClick={() => window.location.href = `/walks/${walk.id}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
}
