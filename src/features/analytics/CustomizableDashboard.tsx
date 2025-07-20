
"use client"

import React, { useState, useEffect, useRef } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2 } from "lucide-react";
import { ReportWidget, type Report as ReportType } from "./ReportWidget";
import { CreateReportDialog } from "./CreateReportDialog";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

type ReportMap = { [key: string]: ReportType };

interface CustomizableDashboardProps {
    initialLayout: Layout[];
    initialReports: ReportMap;
}

export const CustomizableDashboard = ({ initialLayout, initialReports }: CustomizableDashboardProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    const [layouts, setLayouts] = useState<{ lg: Layout[] }>({ lg: initialLayout });
    const [reports, setReports] = useState<ReportMap>(initialReports);
    const [isSaving, setIsSaving] = useState(false);
    const hasMounted = useRef(false);

    useEffect(() => {
        setIsMounted(true);
        // Load layout from DB on initial mount
        const loadDashboard = async () => {
            if (!user) return;
            const dashboardDocRef = doc(db, "dashboards", user.uid);
            const docSnap = await getDoc(dashboardDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setLayouts(data.layouts || { lg: [] });
                setReports(data.reports || {});
            }
            // Set hasMounted to true after the first attempt to load data
            hasMounted.current = true;
        };
        loadDashboard();
    }, [user]);

    const saveDashboard = async (newLayouts: { lg: Layout[] }, newReports: ReportMap) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const dashboardDocRef = doc(db, "dashboards", user.uid);
            await setDoc(dashboardDocRef, { layouts: newLayouts, reports: newReports });
            toast({
                title: "Dashboard Saved",
                description: "Your dashboard layout has been saved.",
            });
        } catch (error) {
            console.error("Error saving dashboard:", error);
            toast({
                title: "Error",
                description: "Could not save your dashboard layout.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const onLayoutChange = (layout: Layout[], allLayouts: { lg: Layout[] }) => {
        // Prevent saving on the very first layout change event which fires on mount
        if (!hasMounted.current || JSON.stringify(layouts.lg) === JSON.stringify(allLayouts.lg)) {
            return;
        }
        
        const cleanLayouts = {
            lg: allLayouts.lg.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
        };
        setLayouts(cleanLayouts);
        saveDashboard(cleanLayouts, reports);
    };

    const addReport = (report: ReportType) => {
        const reportId = `report-${Date.now()}`;
        
        // Safeguard: ensure the report data is valid before adding
        if (!report || !report.dataSource || !report.visualization) {
            toast({ title: "Error", description: "Cannot add an invalid report.", variant: "destructive" });
            return;
        }

        const newReports = { ...reports, [reportId]: report };
        
        const newLayoutItem: Layout = {
            i: reportId,
            x: (layouts.lg.length * 4) % 12, // Cascade new reports
            y: Infinity, // Puts it at the bottom
            w: 4,
            h: 2,
        };
        const newLayouts = { lg: [...layouts.lg, newLayoutItem] };

        setReports(newReports);
        setLayouts(newLayouts);
        saveDashboard(newLayouts, newReports);
    };

    const removeReport = (reportId: string) => {
        const newReports = { ...reports };
        delete newReports[reportId];

        const newLayouts = { lg: layouts.lg.filter(l => l.i !== reportId) };

        setReports(newReports);
        setLayouts(newLayouts);
        saveDashboard(newLayouts, newReports);
    };

    if (!isMounted) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <CreateReportDialog onAddReport={addReport} />
            </div>
             <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                onLayoutChange={onLayoutChange}
                isDraggable
                isResizable
                draggableHandle=".drag-handle"
            >
                {layouts.lg.map(item => (
                    <div key={item.i} className="bg-card rounded-lg shadow-sm p-2 flex flex-col">
                        {reports[item.i] ? (
                            <ReportWidget report={reports[item.i]} onRemove={() => removeReport(item.i)} />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-destructive">
                                <p className="font-semibold">Corrupted Report</p>
                                <p className="text-xs mb-2">This report's data is missing. You can remove it.</p>
                                <Button size="sm" variant="destructive" onClick={() => removeReport(item.i)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
};
