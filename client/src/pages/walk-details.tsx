import { useRoute } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import WalkDetails from "@/components/walks/WalkDetails";

export default function WalkDetailsPage() {
  const [, params] = useRoute("/walks/:id");
  const walkId = params ? parseInt(params.id, 10) : 0;

  return (
    <MainLayout pageTitle="Walk Details">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <WalkDetails walkId={walkId} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}