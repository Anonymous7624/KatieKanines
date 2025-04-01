import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, DownloadIcon, PieChartIcon, BarChart3Icon, TrendingUpIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Walk {
  id: number;
  clientName: string;
  petName: string;
  walkerName?: string;
  date: string;
  time: string;
  duration: number;
  status: string;
}

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState("last30");

  const { data: walks = [], isLoading } = useQuery({
    queryKey: ["/api/walks"],
  });

  // Process data for reports
  const getFilteredWalks = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (reportPeriod) {
      case "last7":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "last30":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "last90":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }
    
    return walks.filter((walk: Walk) => {
      const walkDate = new Date(walk.date);
      return walkDate >= cutoffDate;
    });
  };

  const filteredWalks = getFilteredWalks();
  
  // Calculate statistics
  const totalWalks = filteredWalks.length;
  const completedWalks = filteredWalks.filter((walk: Walk) => walk.status === "completed").length;
  const scheduledWalks = filteredWalks.filter((walk: Walk) => walk.status === "scheduled").length;
  const cancelledWalks = filteredWalks.filter((walk: Walk) => walk.status === "cancelled").length;
  
  const totalWalkDuration = filteredWalks.reduce((sum: number, walk: Walk) => {
    return walk.status === "completed" ? sum + walk.duration : sum;
  }, 0);
  
  const averageWalkDuration = completedWalks > 0 
    ? Math.round(totalWalkDuration / completedWalks) 
    : 0;

  // Prepare data for charts
  const statusChartData = [
    { name: "Completed", value: completedWalks },
    { name: "Scheduled", value: scheduledWalks },
    { name: "Cancelled", value: cancelledWalks },
  ];
  
  const COLORS = ["#4338ca", "#eab308", "#ef4444"];
  
  // Group walks by walker
  const walkerWalks: Record<string, number> = {};
  filteredWalks.forEach((walk: Walk) => {
    if (walk.status === "completed" && walk.walkerName) {
      walkerWalks[walk.walkerName] = (walkerWalks[walk.walkerName] || 0) + 1;
    }
  });
  
  const walkerChartData = Object.entries(walkerWalks).map(([name, value]) => ({
    name,
    walks: value,
  })).sort((a, b) => b.walks - a.walks).slice(0, 5); // Top 5 walkers
  
  // Group walks by date for trend chart
  const walksByDate: Record<string, number> = {};
  filteredWalks.forEach((walk: Walk) => {
    const dateStr = formatDate(walk.date);
    walksByDate[dateStr] = (walksByDate[dateStr] || 0) + 1;
  });
  
  const trendChartData = Object.entries(walksByDate)
    .map(([date, count]) => ({ date, walks: count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <MainLayout pageTitle="Reports">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Select 
                defaultValue={reportPeriod} 
                onValueChange={(value) => setReportPeriod(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Walks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalWalks}</div>
                  <p className="text-sm text-slate-500 mt-1">
                    {completedWalks} completed, {scheduledWalks} scheduled, {cancelledWalks} cancelled
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{averageWalkDuration} min</div>
                  <p className="text-sm text-slate-500 mt-1">
                    Total duration: {totalWalkDuration} minutes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalWalks > 0 ? Math.round((completedWalks / totalWalks) * 100) : 0}%
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {cancelledWalks} cancelled walks
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="walkers">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Walker Performance
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUpIcon className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Walk Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <Skeleton className="h-[300px] w-[300px] rounded-full" />
                    </div>
                  ) : totalWalks === 0 ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-slate-500">No data available for the selected period</p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="walkers">
              <Card>
                <CardHeader>
                  <CardTitle>Top Walker Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : walkerChartData.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-slate-500">No walker data available for the selected period</p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={walkerChartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="walks" fill="#4338ca" name="Completed Walks" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Walk Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : trendChartData.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-slate-500">No trend data available for the selected period</p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendChartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            // Show fewer x-axis labels for readability
                            tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="walks"
                            stroke="#4338ca"
                            activeDot={{ r: 8 }}
                            name="Number of Walks"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
