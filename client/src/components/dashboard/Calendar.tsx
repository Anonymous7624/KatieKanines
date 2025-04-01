import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Walk {
  id: number;
  clientName: string;
  petName: string;
  date: string;
  time: string;
  status: string;
  isGroupWalk?: boolean;
}

interface CalendarState {
  currentMonth: Date;
  currentYear: Date;
}

export default function Calendar() {
  const [state, setState] = useState<CalendarState>({
    currentMonth: new Date(),
    currentYear: new Date()
  });

  const { data: walks, isLoading } = useQuery({
    queryKey: ["/api/walks"],
  });

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    setState(prevState => {
      const prevMonth = new Date(prevState.currentMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return {
        ...prevState,
        currentMonth: prevMonth,
        currentYear: prevMonth
      };
    });
  };

  const handleNextMonth = () => {
    setState(prevState => {
      const nextMonth = new Date(prevState.currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return {
        ...prevState,
        currentMonth: nextMonth,
        currentYear: nextMonth
      };
    });
  };

  const renderCalendar = () => {
    const today = new Date();
    const month = state.currentMonth.getMonth();
    const year = state.currentYear.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    
    const days = [];
    let date = 1;
    
    // Create calendar rows
    for (let i = 0; i < 6; i++) {
      const row = [];
      
      // Creating individual cells and filling them with data
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          // Empty cells before the first day
          row.push(<td key={`empty-${i}-${j}`} className="p-1 border border-slate-200 h-24 align-top"></td>);
        } else if (date > daysInMonth) {
          // Empty cells after the last day
          row.push(<td key={`empty-after-${i}-${j}`} className="p-1 border border-slate-200 h-24 align-top"></td>);
        } else {
          // Cells with dates
          const currentDate = new Date(year, month, date);
          const dateString = currentDate.toISOString().split('T')[0];
          
          const dayWalks = walks ? walks.filter((walk: Walk) => {
            const walkDate = new Date(walk.date).toISOString().split('T')[0];
            return walkDate === dateString;
          }) : [];
          
          row.push(
            <td key={date} className="p-1 border border-slate-200 h-24 align-top relative">
              <span 
                className={cn(
                  "inline-block w-6 h-6 text-center text-sm font-medium",
                  today.getDate() === date && 
                  today.getMonth() === month && 
                  today.getFullYear() === year
                    ? "bg-primary-600 text-white rounded-full"
                    : ""
                )}
              >
                {date}
              </span>
              
              {/* Walk events */}
              <div className="mt-1">
                {dayWalks.slice(0, 3).map((walk: Walk, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "mt-1 text-xs rounded p-1 truncate",
                      walk.isGroupWalk
                        ? "bg-secondary-100"
                        : "bg-primary-100"
                    )}
                  >
                    {`Walk - ${walk.petName}`}
                  </div>
                ))}
                {dayWalks.length > 3 && (
                  <div className="mt-1 text-xs text-slate-500 p-1">
                    +{dayWalks.length - 3} more
                  </div>
                )}
              </div>
              
              {date++}
            </td>
          );
        }
      }
      
      days.push(<tr key={i}>{row}</tr>);
      
      // Stop if we've reached the end of the month
      if (date > daysInMonth) {
        break;
      }
    }
    
    return days;
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-slate-900">Monthly Schedule</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="px-4 py-3 flex justify-center">
          <h2 className="text-xl font-semibold text-slate-900">
            {state.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sunday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Monday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tuesday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Wednesday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Thursday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Friday
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Saturday
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">
                    Loading calendar...
                  </td>
                </tr>
              ) : (
                renderCalendar()
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-4 py-3 bg-slate-50 sm:px-6 flex justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary-100 rounded-full mr-2"></span>
            <span className="text-xs text-slate-500">Regular Walk</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-secondary-100 rounded-full mr-2"></span>
            <span className="text-xs text-slate-500">Group Walk</span>
          </div>
        </div>
        <Button>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule New Walk
        </Button>
      </div>
    </div>
  );
}
