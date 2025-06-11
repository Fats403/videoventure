import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CreatePageContent from "@/components/create/CreatePageContent";

// Loading component for Suspense fallback
function CreatePageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Loading create page...</p>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<CreatePageLoading />}>
      <CreatePageContent />
    </Suspense>
  );
}
