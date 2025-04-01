import { useParams } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import ClientDetails from "@/components/clients/ClientDetails";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id, 10);

  if (isNaN(clientId)) {
    return (
      <MainLayout pageTitle="Client Not Found">
        <div className="p-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-red-500">Invalid Client ID</h2>
              <p className="mt-2 text-sm text-slate-500">
                The client ID provided is not valid.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Client Details">
      <ClientDetails clientId={clientId} />
    </MainLayout>
  );
}
