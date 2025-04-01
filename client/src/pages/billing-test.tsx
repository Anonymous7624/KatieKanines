import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function BillingTest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<{
    markCompleted: boolean;
    applyBalances: boolean;
  }>({
    markCompleted: false,
    applyBalances: false,
  });
  const [results, setResults] = useState<{
    markedCount?: number;
    appliedCount?: number;
  }>({});

  const handleMarkTestWalksCompleted = async () => {
    setIsLoading((prev) => ({ ...prev, markCompleted: true }));
    try {
      const response = await apiRequest(
        "POST",
        "/api/walks/mark-test-walks-completed"
      );
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });
      
      setResults((prev) => ({ ...prev, markedCount: data.markedCount }));
    } catch (error) {
      console.error("Error marking test walks as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark test walks as completed",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, markCompleted: false }));
    }
  };

  const handleApplyCompletedWalksToBalances = async () => {
    setIsLoading((prev) => ({ ...prev, applyBalances: true }));
    try {
      const response = await apiRequest(
        "POST",
        "/api/walks/apply-balances"
      );
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });
      
      setResults((prev) => ({ ...prev, appliedCount: data.count }));
    } catch (error) {
      console.error("Error applying walks to balances:", error);
      toast({
        title: "Error",
        description: "Failed to apply walks to client balances",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, applyBalances: false }));
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Billing System Test Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mark Test Walks as Completed</CardTitle>
            <CardDescription>
              Mark a few scheduled walks as completed to test the billing system.
              This will mark walks as completed but not yet applied to client balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleMarkTestWalksCompleted}
              disabled={isLoading.markCompleted}
              className="w-full"
            >
              {isLoading.markCompleted ? "Marking..." : "Mark Test Walks as Completed"}
            </Button>
            
            {results.markedCount !== undefined && (
              <p className="mt-4 text-sm">
                Marked {results.markedCount} walks as completed.
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Apply Walks to Client Balances</CardTitle>
            <CardDescription>
              Apply any completed walks to client balances that haven't been applied yet.
              This will update client balances based on the billing amount of completed walks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleApplyCompletedWalksToBalances}
              disabled={isLoading.applyBalances}
              className="w-full"
            >
              {isLoading.applyBalances ? "Applying..." : "Apply Walks to Client Balances"}
            </Button>
            
            {results.appliedCount !== undefined && (
              <p className="mt-4 text-sm">
                Applied {results.appliedCount} walks to client balances.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Testing Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>First, mark some scheduled walks as completed using the button above.</li>
              <li>Then, apply those completed walks to client balances using the second button.</li>
              <li>Navigate to the <a href="/billing" className="text-blue-500 hover:underline">Billing page</a> to see client balances.</li>
              <li>Or check a specific <a href="/clients" className="text-blue-500 hover:underline">Client page</a> to see their updated balance.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}