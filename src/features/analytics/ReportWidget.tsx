
"use client";

import React from "react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Download, Settings, GripVertical } from "lucide-react";
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
        { name: "INP-HB", value: 40, fill: "hsl(var(--chart-1))" },
        { name: "UFHB", value: 30, fill: "hsl(var(--chart-2))" },
        { name: "CSI", value: 20, fill: "hsl(var(--chart-3))" },
    ],
    companies: [
        { name: "Tech", value: 15, fill: "hsl(var(--chart-1))" },
        { name: "Finance", value: 12, fill: "hsl(var(--chart-2))" },
        { name: "Agro", value: 8, fill: "hsl(var(--chart-3))" },
    ],
    applications: [
        { name: "Jan", value: 50, fill: "hsl(var(--chart-1))" },
        { name: "Feb", value: 65, fill: "hsl(var(--chart-2))" },
        { name: "Mar", value: 80, fill: "hsl(var(--chart-3))" },
    ],
};

const renderColorfulLegendText = (value: string, entry: any) => {
  const { color } = entry;
  return <span style={{ color }}>{value}</span>;
};


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
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={'80%'} />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" formatter={renderColorfulLegendText} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case "count":
                const total = data.reduce((sum, item) => sum + item.value, 0);
                return (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-5xl font-bold">{total}</p>
                    </div>
                );
            default:
                return <div>Invalid visualization type</div>;
        }
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 drag-handle cursor-move">
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
                             <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Report
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {renderVisualization()}
            </CardContent>
        </Card>
    );
};
