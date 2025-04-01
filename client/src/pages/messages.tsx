import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageForm from "@/components/messages/MessageForm";

export default function Messages() {
  // In a real app, the current user ID would come from auth context
  const currentUserId = 1; // Admin user ID
  
  return (
    <MainLayout pageTitle="Messages">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <Tabs defaultValue="clients">
                <TabsList>
                  <TabsTrigger value="clients">Messages with Clients</TabsTrigger>
                  <TabsTrigger value="walkers">Messages with Walkers</TabsTrigger>
                </TabsList>
                <TabsContent value="clients" className="mt-4">
                  <MessageForm currentUserId={currentUserId} userRole="admin" />
                </TabsContent>
                <TabsContent value="walkers" className="mt-4">
                  <MessageForm currentUserId={currentUserId} userRole="admin" />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
