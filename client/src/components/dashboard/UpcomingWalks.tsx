import { useQuery } from "@tanstack/react-query";
import { formatTime } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Walk {
  id: number;
  clientName: string;
  petName: string;
  walkerName?: string;
  date: string;
  time: string;
  status: string;
}

export default function UpcomingWalks() {
  const { data: walks = [], isLoading, isError } = useQuery<Walk[]>({
    queryKey: ["/api/walks/upcoming"],
  });

  if (isLoading) {
    return (
      <div>
        <ul className="divide-y divide-border">
          {[...Array(4)].map((_, index) => (
            <li key={index} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="ml-4 h-5 w-20" />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-4 flex justify-end">
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="p-6 text-center">
          <div className="inline-block p-3 rounded-full bg-pink-light/50 text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-brown-dark mb-2">Unable to Load Walks</h3>
          <p className="text-brown-medium">There was a problem loading the scheduled walks. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {walks && walks.length === 0 ? (
        <div className="text-center py-6">
          <div className="inline-block p-3 rounded-full bg-accent text-accent-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-brown-medium mb-2">No walks scheduled for today.</p>
          <p className="text-brown-medium/70">Click the button below to schedule a new walk.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {walks && walks.map((walk: Walk) => (
            <li key={walk.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-pink-light flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {walk.petName.substring(0, 1) + (walk.petName.split(' ')[1] ? walk.petName.split(' ')[1].substring(0, 1) : '')}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg font-medium text-brown-dark">{walk.petName}</div>
                    <div className="text-brown-medium">
                      Walker: <span className="font-medium">{walk.walkerName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-secondary text-brown-dark">
                    {formatTime(walk.time)}
                  </span>
                  <Link href={`/walks/${walk.id}`}>
                    <div className="ml-5 text-primary hover:text-primary/80 font-medium cursor-pointer">
                      Details
                    </div>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-6 flex justify-end">
        <Link href="/schedule">
          <Button size="lg" className="rounded-full px-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Walk
          </Button>
        </Link>
      </div>
    </div>
  );
}
