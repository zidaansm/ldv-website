"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, X, Trash2, Users, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type Event = {
  id: string;
  title: string;
  participants: number;
  form_schema?: any[];
};

type Registration = {
  id: string;
  form_data: Record<string, string>;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function ManageRegistrantsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch Event
    const { data: eventData } = await supabase
      .from("events")
      .select("id, title, participants, form_schema")
      .eq("id", eventId)
      .single();
    
    if (eventData) setEvent(eventData);

    // Fetch Registrations
    const { data: regData } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (regData) setRegistrations(regData);
    setLoading(false);
  };

  const handleUpdateStatus = async (regId: string, newStatus: "approved" | "rejected", currentStatus: string) => {
    const loadingToast = toast.loading(`Marking as ${newStatus}...`);
    
    // 1. Update registration status
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: newStatus })
      .eq("id", regId);

    if (error) {
      toast.error(`Failed to update status`, { id: loadingToast });
      return;
    }

    // 2. Adjust participants count
    if (event) {
      let newCount = event.participants;
      if (newStatus === "approved" && currentStatus !== "approved") {
        newCount += 1;
      } else if (newStatus !== "approved" && currentStatus === "approved") {
        newCount = Math.max(0, newCount - 1);
      }

      if (newCount !== event.participants) {
        await supabase.from("events").update({ participants: newCount }).eq("id", event.id);
        setEvent({ ...event, participants: newCount });
      }
    }

    // 3. Send Notification Email
    const reg = registrations.find(r => r.id === regId);
    if (reg && reg.form_data?.email && event) {
      toast.loading("Sending notification email...", { id: loadingToast });
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: reg.form_data.email,
            status: newStatus,
            eventTitle: event.title,
            discordUsername: reg.form_data.discord_username || reg.form_data["Discord Username"] || ""
          })
        });
      } catch (err) {
        console.error("Failed to send email notification", err);
      }
    }

    toast.success(`Participant ${newStatus}!`, { id: loadingToast });
    fetchData();
  };

  const handleDelete = async (id: string, status: string) => {
    confirmDelete("registration", async () => {
      const loadingToast = toast.loading("Deleting registration...");
      const { error } = await supabase.from("event_registrations").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to delete", { id: loadingToast });
      } else {
        // Decrement participant count if it was approved
        if (status === "approved" && event) {
          const newCount = Math.max(0, event.participants - 1);
          await supabase.from("events").update({ participants: newCount }).eq("id", event.id);
          setEvent({ ...event, participants: newCount });
        }
        toast.success("Deleted successfully!", { id: loadingToast });
        fetchData();
      }
    });
  };

  const handleExportCSV = () => {
    if (!event) return;
    const columns = formFields.map(f => f.label);
    const headers = [...columns, "Registration Date", "Status"];

    const rows = registrations.map(reg => {
      const rowData = columns.map(col => reg.form_data?.[col] || "");
      rowData.push(new Date(reg.created_at).toLocaleString());
      rowData.push(reg.status);
      return rowData.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.title.replace(/\s+/g, '_').toLowerCase()}_registrants.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading registrants...</div>;
  if (!event) return <div className="p-8 font-bold text-center">Event not found.</div>;

  const formFields = event.form_schema?.length ? event.form_schema : [{ label: "Discord Username" }];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Manage Registrants
            </h1>
            <p className="text-muted-foreground font-medium">Event: {event.title} • {event.participants} Approved</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["all", "pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl font-bold text-sm capitalize transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? "bg-primary text-primary-foreground neo-border neo-shadow-sm" 
                : "bg-muted text-muted-foreground hover:bg-muted/80 neo-border"
            }`}
          >
            {tab}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs">
              {tab === "all" ? registrations.length : registrations.filter(r => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="neo-border rounded-2xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b-2 border-[var(--border)]">
                {formFields.map((f: any, i: number) => (
                  <th key={i} className="p-4 font-bold">{f.label}</th>
                ))}
                <th className="p-4 font-bold">Registration Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.filter(reg => activeTab === "all" || reg.status === activeTab).map((reg) => (
                <tr key={reg.id} className="border-b-2 border-[var(--border)] last:border-0 hover:bg-muted/50 transition-colors">
                  {formFields.map((f: any, i: number) => {
                    const value = reg.form_data?.[f.label];
                    const isImage = f.type === "image" || (value && typeof value === 'string' && value.startsWith('http') && value.includes('supabase'));
                    return (
                      <td key={i} className={i === 0 ? "p-4 font-bold text-primary" : "p-4 font-medium"}>
                        {isImage && value ? (
                          <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-2">
                            <span className="w-8 h-8 rounded bg-muted/50 overflow-hidden flex items-center justify-center neo-border">
                              <img src={value} alt="Upload" className="w-full h-full object-cover" />
                            </span>
                            View Image
                          </a>
                        ) : (
                          value || "-"
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(reg.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                      reg.status === 'approved' ? 'bg-success/20 text-success' :
                      reg.status === 'rejected' ? 'bg-danger/20 text-danger' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {reg.status !== "approved" && (
                        <button 
                          onClick={() => handleUpdateStatus(reg.id, "approved", reg.status)} 
                          className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      {reg.status !== "rejected" && (
                        <button 
                          onClick={() => handleUpdateStatus(reg.id, "rejected", reg.status)} 
                          className="p-2 text-warning hover:bg-warning/10 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(reg.id, reg.status)} 
                        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.filter(reg => activeTab === "all" || reg.status === activeTab).length === 0 && (
                <tr>
                  <td colSpan={formFields.length + 3} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-bold text-lg">No registrations yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
