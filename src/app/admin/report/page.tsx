"use client";

import { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { format } from "date-fns";
import { Printer, RefreshCw, Trash2, Mail, CheckCircle, Clock, Users, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface Scorecards {
  totalViews30d: number;
  totalMenfess30d: number;
  totalCollaborations: number;
  totalStaff: number;
  completedTasks: number;
  pendingTasks: number;
  totalActions30d: number;
}

interface ReportData {
  scorecards: Scorecards;
  trendData: any[];
  productivityData: any[];
  taskData: any[];
}

const COLORS = ['#F2E8D5', '#6D071A', '#8c1a32', '#333333', '#1e1e1e'];

export default function ReportDashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/report");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        toast.error("Failed to fetch report data");
      }
    } catch (error) {
      toast.error("Error loading report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAnalytics = async () => {
    if (!confirm("Are you sure you want to clear page view data older than 6 months? This action cannot be undone.")) return;
    
    try {
      const res = await fetch("/api/admin/report", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: 6 })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Data cleared successfully");
      } else {
        toast.error(result.error || "Failed to clear data");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="report-container max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <FileText className="w-8 h-8 text-primary" />
            Monthly Report & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of the last 30 days ({format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'MMM dd')} - {format(new Date(), 'MMM dd, yyyy')})
          </p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button 
            onClick={fetchData}
            className="p-3 bg-secondary/50 text-secondary-foreground hover:bg-secondary rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            <Printer className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Scorecard 
          title="Total Visitors" 
          value={data.scorecards.totalViews30d} 
          icon={<Users className="w-6 h-6 text-primary" />} 
          subtitle="Last 30 Days"
        />
        <Scorecard 
          title="Menfess Received" 
          value={data.scorecards.totalMenfess30d} 
          icon={<Mail className="w-6 h-6 text-primary" />} 
          subtitle="Last 30 Days"
        />
        <Scorecard 
          title="Tasks Completed" 
          value={data.scorecards.completedTasks} 
          icon={<CheckCircle className="w-6 h-6 text-primary" />} 
          subtitle="All Time"
        />
        <Scorecard 
          title="Admin Actions" 
          value={data.scorecards.totalActions30d} 
          icon={<Clock className="w-6 h-6 text-primary" />} 
          subtitle="Last 30 Days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Engagement Trend */}
        <div className="lg:col-span-2 bg-card/40 border border-border/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6">Engagement Trend (Last 30 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                  stroke="#888888" fontSize={12}
                />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  labelFormatter={(val) => format(new Date(val as string), 'dd MMM yyyy')}
                />
                <Legend />
                <Line type="monotone" name="Page Views" dataKey="views" stroke="#F2E8D5" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Menfess" dataKey="menfess" stroke="#6D071A" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status */}
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6">Task Completion</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Leaderboard */}
        <div className="lg:col-span-3 bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Admin Productivity (Top 5 Active)</h3>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">Last 30 Days</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.productivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#888888" fontSize={12} />
                <YAxis dataKey="email" type="category" stroke="#888888" fontSize={12} width={150} tickFormatter={(val) => val.split('@')[0]} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                />
                <Bar dataKey="actions" name="Total Actions" fill="#F2E8D5" radius={[0, 4, 4, 0]}>
                  {
                    data.productivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#6D071A' : '#F2E8D5'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="pt-12 no-print flex justify-end">
        <button 
          onClick={handleClearAnalytics}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-danger transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Analytics Data (&gt; 6 months)
        </button>
      </div>

    </div>
  );
}

function Scorecard({ title, value, icon, subtitle }: { title: string, value: number | string, icon: React.ReactNode, subtitle: string }) {
  return (
    <div className="bg-card/40 border border-border/50 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
        <div className="w-32 h-32 scale-150">
          {icon}
        </div>
      </div>
      <div className="flex justify-between items-start">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="p-2 bg-secondary/50 rounded-lg">{icon}</div>
      </div>
      <div>
        <h3 className="text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {value}
        </h3>
        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
  );
}
