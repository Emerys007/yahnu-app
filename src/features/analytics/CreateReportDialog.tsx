
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, BarChart, PieChart, Hash, ChevronLeft } from "lucide-react";
import { type Report, type DataSource, type Visualization } from "./ReportWidget";

interface CreateReportDialogProps {
    onAddReport: (report: Report) => void;
}

const dataSources: { value: DataSource, label: string }[] = [
    { value: "graduates", label: "Graduates" },
    { value: "companies", label: "Companies" },
    { value: "applications", label: "Job Applications" },
];

const visualizations: { value: Visualization, label: string, icon: React.ElementType }[] = [
    { value: "bar", label: "Bar Chart", icon: BarChart },
    { value: "pie", label: "Pie Chart", icon: PieChart },
    { value: "count", label: "Metric Count", icon: Hash },
];

export const CreateReportDialog = ({ onAddReport }: CreateReportDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
    const [selectedViz, setSelectedViz] = useState<Visualization | null>(null);

    const handleAddReport = () => {
        if (!selectedSource || !selectedViz) return;
        const newReport: Report = {
            dataSource: selectedSource,
            visualization: selectedViz,
            title: `${selectedSource.charAt(0).toUpperCase() + selectedSource.slice(1)} Report`,
        };
        onAddReport(newReport);
        reset();
    };

    const reset = () => {
        setIsOpen(false);
        setTimeout(() => {
            setStep(1);
            setSelectedSource(null);
            setSelectedViz(null);
        }, 200); // Delay reset to allow dialog to close smoothly
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                reset();
            } else {
                setIsOpen(true);
            }
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Report
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {step > 1 && (
                            <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={() => setStep(step - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {step === 1 ? "Select Data Source" : "Select Visualization"}
                    </DialogTitle>
                    <DialogDescription className={step > 1 ? "pl-10" : ""}>
                         {step === 1 ? "Choose the data you want to report on." : "Choose how you want to visualize your data."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {step === 1 && (
                         <Select onValueChange={(v) => setSelectedSource(v as DataSource)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a data source..." />
                            </SelectTrigger>
                            <SelectContent>
                                {dataSources.map(source => (
                                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {step === 2 && (
                         <div className="grid grid-cols-3 gap-4">
                            {visualizations.map(viz => (
                                <Button
                                    key={viz.value}
                                    variant={selectedViz === viz.value ? "default" : "outline"}
                                    className="h-24 flex-col gap-2"
                                    onClick={() => setSelectedViz(viz.value)}
                                >
                                    <viz.icon className="h-6 w-6" />
                                    {viz.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {step === 1 && <Button onClick={() => setStep(2)} disabled={!selectedSource}>Next</Button>}
                    {step === 2 && <Button onClick={handleAddReport} disabled={!selectedViz}>Add to Dashboard</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
