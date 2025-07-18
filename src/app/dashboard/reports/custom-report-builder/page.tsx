
import { Wrench } from "lucide-react";
import { CustomizableDashboard } from "@/features/analytics/CustomizableDashboard";

export default async function CustomReportBuilderPage() {
    // In a real application, you would fetch the user's saved dashboard layout
    // and report configurations from Firestore here based on the logged-in user's ID.
    // For this example, we'll pass empty initial data to the client component.
    const initialLayout = [];
    const initialReports = {};

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Custom Report Builder</h1>
                    <p className="text-muted-foreground mt-1">
                        Build your own dashboard by creating and arranging reports.
                    </p>
                </div>
            </div>
            <CustomizableDashboard 
                initialLayout={initialLayout} 
                initialReports={initialReports} 
            />
        </div>
    );
}
