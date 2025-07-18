
"use client";

import React from "react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv } from "@/lib/utils";

export type DataSource = "graduates" | "companies" | "applications";
export type Visualization = "bar" | "pie" | "count";

export interface Report {
    dataSource: DataSource;
    visualization: Visualization;
    title: string;
}

interface ReportWidgetProps {
    report: Report;
    onRemove: () => void;
}

// Mock data for demonstration purposes
const MOCK_DATA = {
    graduates: [
        { name: "INP-HB", value: 40 },
        { name: "UFHB", value: 30 },
        { name: "CSI", value: 20 },
    ],
    companies: [
        { name: "Tech", value: 15 },
        { name: "Finance", value: 12 },
        { name: "Agro", value: 8 },
    ],
    applications: [
        { name: "Jan", value: 50 },
        { name: "Feb", value: 65 },
        { name: "Mar", value: 80 },
    ],
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const ReportWidget = ({ report, onRemove }: ReportWidgetProps) => {
    const data = MOCK_DATA[report.dataSource];

    const handleExport = () => {
        exportToCsv(data, `${report.dataSource}_report.csv`);
    };

    const renderVisualization = () => {
        switch (report.visualization) {
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "pie":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                             <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="hsl(var(--primary))" />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "count":
                const total = data.reduce((sum, item) => sum + item.value, 0);
                return (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-4xl font-bold">{total}</p>
                    </div>
                );
            default:
                return <div>Invalid visualization type</div>;
        }
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
                    <CardDescription>{report.dataSource}</CardDescription>
                </div>
                 <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {renderVisualization()}
            </CardContent>
        </Card>
    );
};
