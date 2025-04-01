import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, normalizeDate } from "@/lib/utils";

interface Walk {
  id: number;
  date: string;
  walkerId?: number | null;
  walkerName?: string;
  status: string;
  walkerColor?: string;
}

interface WalkerCount {
  id: number | null;
  name: string;
  count: number;
  color?: string;
}

interface DayData {
  date: Date;
  dateString: string; // ISO date string format YYYY-MM-DD
  formattedDate: string;
  isToday: boolean;
  walkerCounts: WalkerCount[];
  totalWalks: number;
}

interface WeekAtAGlanceProps {
  onDayClick?: (date: string) => void;
  onWalkerClick?: (walkerName: string, date?: string) => void;
  onTotalClick?: (date: string) => void;
}

export default function WeekAtAGlance({ 
  onDayClick, 
  onWalkerClick, 
  onTotalClick 
}: WeekAtAGlanceProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  
  // Initialize to show Monday as the first day of the week
  const [startDate, setStartDate] = useState(() => {
    // Start with current date
    const today = new Date();
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = today.getDay();
    // Calculate how many days to go back to get to the most recent Monday
    // If today is Monday (1), we go back 0 days; if Sunday (0), we go back 6 days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    // Create a new date for the Monday of this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);
    return monday;
  });

  const { data: walks = [] } = useQuery<Walk[]>({
    queryKey: ["/api/walks"],
    refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
  });

  // Move back 7 days
  const goToPreviousWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() - 7);
    setStartDate(newStartDate);
  };

  // Move forward 7 days
  const goToNextWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + 7);
    setStartDate(newStartDate);
  };

  // Get week data when walks are loaded or start date changes
  useEffect(() => {
    if (walks.length > 0) {
      const today = new Date();
      const weekDataArray: DayData[] = [];

      // Define days of the week for reference
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Use the startDate as our reference point
      const refDate = new Date(startDate);
      
      console.log(`Starting with reference date: ${refDate.toString()} (a ${daysOfWeek[refDate.getDay()]})`);
      
      // Generate exactly 7 days starting from the current startDate
      for (let i = 0; i < 7; i++) {
        // Create a new date for this day using the startDate
        const currentDate = new Date(refDate);
        currentDate.setDate(refDate.getDate() + i);
        
        // Format the date as YYYY-MM-DD for comparison with walk dates
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Format the date for display
        const formattedDate = formatDate(currentDate);
        const isToday = currentDate.toDateString() === today.toDateString();
        
        // Determine the actual day of week (0-6, where 0 is Sunday)
        const dayOfWeek = currentDate.getDay();
        const dayName = daysOfWeek[dayOfWeek];
        
        console.log(`Processing day: ${dateString}, which is a ${dayName} (day index: ${dayOfWeek})`);
        
        // Get walks for this exact date string 
        const dayWalks = walks.filter((walk: Walk) => {
          // Normalize walk date to YYYY-MM-DD format using our utility function
          const normalizedWalkDate = normalizeDate(walk.date);
          
          // Simple string comparison with the ISO date string - include both scheduled and completed walks
          const matches = normalizedWalkDate === dateString && (walk.status === "scheduled" || walk.status === "completed");
          
          if (matches) {
            console.log(`MATCH: Walk on ${normalizedWalkDate} is on a ${dayName} with status ${walk.status}`);
          }
          
          return matches;
        });

        // Log all walks found for this date
        console.log(`Found ${dayWalks.length} walks for ${dateString}:`, dayWalks);

        // Count walks by walker, only tracking total walks
        const walkerMap = new Map<number | null, { 
          name: string, 
          count: number, 
          color?: string 
        }>();
        
        dayWalks.forEach((walk: Walk) => {
          const id = walk.walkerId || null;
          const name = walk.walkerName ? walk.walkerName.split(' ')[0] : "Unassigned";
          const color = walk.walkerColor;
          
          if (walkerMap.has(id)) {
            const current = walkerMap.get(id)!;
            walkerMap.set(id, { 
              name, 
              count: current.count + 1,
              color: current.color || color
            });
          } else {
            walkerMap.set(id, { 
              name, 
              count: 1,
              color
            });
          }
        });

        // Convert map to array
        const walkerCounts: WalkerCount[] = Array.from(walkerMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
          color: data.color
        }));

        // Sort by count descending (walkers with most walks first)
        walkerCounts.sort((a, b) => b.count - a.count);

        weekDataArray.push({
          date: currentDate, // Using our date variable
          dateString,
          formattedDate,
          isToday,
          walkerCounts,
          totalWalks: dayWalks.length
        });
      }

      setWeekData(weekDataArray);
    }
  }, [walks, startDate]);

  // Handle day header click
  const handleDayClick = (day: DayData) => {
    if (onDayClick) {
      // Use the consistent dateString directly - it's already in YYYY-MM-DD format
      console.log(`Clicking on day: ${day.dateString}`);
      onDayClick(day.dateString);
    }
  };

  // Handle walker name click
  const handleWalkerClick = (day: DayData, walker: WalkerCount) => {
    if (onWalkerClick) {
      // Pass both walker name and date when clicking on a walker in a specific day
      console.log(`Clicking on walker: ${walker.name} for day: ${day.dateString}`);
      onWalkerClick(walker.name, day.dateString);
    }
  };

  // Handle total walks click
  const handleTotalClick = (day: DayData) => {
    if (onTotalClick) {
      // Use the dateString directly - it's already in YYYY-MM-DD format
      console.log(`Clicking on total for day: ${day.dateString}`);
      onTotalClick(day.dateString);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 flex flex-row justify-between items-center">
        <CardTitle>Weekly View</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-2">
          {weekData.map((day) => (
            <Card 
              key={day.dateString + "-" + day.date.getTime()} 
              className={`border flex-1 ${day.isToday ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}
            >
              <CardHeader className="py-2 px-3">
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 rounded p-1"
                  onClick={() => handleDayClick(day)}
                >
                  <div className="text-sm font-semibold">
                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-600">
                    {day.formattedDate}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="space-y-2">
                  {day.walkerCounts.map((walker) => (
                    <div 
                      key={`${day.dateString}-${walker.id}`} 
                      className="flex flex-col space-y-1 text-xs cursor-pointer hover:bg-gray-50 rounded p-1"
                      onClick={() => handleWalkerClick(day, walker)}
                      style={{ 
                        borderLeft: walker.color ? `3px solid ${walker.color}` : undefined,
                        paddingLeft: walker.color ? '0.5rem' : undefined 
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span 
                          className="truncate max-w-[70%] font-medium"
                          style={{ color: walker.color || 'inherit' }}
                        >
                          {walker.name}
                        </span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {walker.count}
                        </Badge>
                      </div>

                    </div>
                  ))}
                  {day.walkerCounts.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-2">No walks</div>
                  )}
                  {day.totalWalks > 0 && (
                    <div 
                      className="border-t border-gray-200 pt-1 mt-2 text-center cursor-pointer hover:bg-gray-50 rounded-b"
                      onClick={() => handleTotalClick(day)}
                    >
                      <span className="text-lg font-medium">{day.totalWalks}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}