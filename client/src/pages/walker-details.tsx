import { useParams } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import WalkerDetails from "@/components/walkers/WalkerDetails";

export default function WalkerDetailsPage() {
  const params = useParams<{ id: string }>();
  const walkerId = parseInt(params.id, 10);

  // Debug logging
  console.log("Walker details page - walkerId from URL:", params.id);
  console.log("Walker details page - parsed walkerId:", walkerId);

  if (isNaN(walkerId)) {
    return (
      <MainLayout pageTitle="Walker Not Found">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-red-500">Invalid Walker ID</h2>
              <p className="mt-2 text-sm text-slate-500">
                The walker ID provided is not valid.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Walker Details">
      <WalkerDetails walkerId={walkerId} />
    </MainLayout>
  );
}
