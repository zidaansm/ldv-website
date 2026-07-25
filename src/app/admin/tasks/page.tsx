"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, CheckSquare, Edit2, Trash2, ArrowRight, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee_id: string | null;
  assignee_email: string | null;
  creator_id: string;
  creator_email: string | null;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState("todo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/admin/tasks");
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
        setUsers(data.users || []);
      } else {
        toast.error(data.error || "Failed to load tasks");
      }
    } catch (e) {
      toast.error("An error occurred while loading tasks");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setStatus("todo");
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setAssigneeId(task.assignee_id || "");
    setStatus(task.status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const loadingToast = toast.loading(editingTask ? "Updating task..." : "Creating task...");
    
    try {
      const method = editingTask ? "PUT" : "POST";
      const payload: any = { title, description, assignee_id: assigneeId, status };
      if (editingTask) payload.id = editingTask.id;

      const res = await fetch("/api/admin/tasks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Task ${editingTask ? "updated" : "created"}!`, { id: loadingToast });
        fetchTasks();
        closeModal();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save task", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        toast.success("Status updated!", { id: loadingToast });
        fetchTasks();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update status", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred", { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    const loadingToast = toast.loading("Deleting task...");
    try {
      const res = await fetch(`/api/admin/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted!", { id: loadingToast });
        fetchTasks();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete task", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred", { id: loadingToast });
    }
  };

  if (loading) return <div className="p-8 font-bold text-center text-foreground">Loading Tasks...</div>;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            <CheckSquare className="w-8 h-8 text-primary" />
            Task Management
          </h1>
          <p className="text-muted-foreground mt-1">Organize and assign work to your team.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* TO DO COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm">
            <h2 className="font-bold text-foreground">To Do</h2>
            <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-lg">{todoTasks.length}</span>
          </div>
          {todoTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => openEditModal(task)} 
              onDelete={() => handleDelete(task.id)} 
              onMoveRight={() => updateTaskStatus(task.id, 'in_progress')}
            />
          ))}
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-warning/30 rounded-xl p-3 shadow-sm border-t-2 border-t-warning">
            <h2 className="font-bold text-foreground">In Progress</h2>
            <span className="bg-warning/20 text-warning text-xs font-bold px-2 py-1 rounded-lg">{inProgressTasks.length}</span>
          </div>
          {inProgressTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => openEditModal(task)} 
              onDelete={() => handleDelete(task.id)}
              onMoveLeft={() => updateTaskStatus(task.id, 'todo')} 
              onMoveRight={() => updateTaskStatus(task.id, 'done')}
            />
          ))}
        </div>

        {/* DONE COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-success/30 rounded-xl p-3 shadow-sm border-t-2 border-t-success">
            <h2 className="font-bold text-foreground">Done</h2>
            <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-lg">{doneTasks.length}</span>
          </div>
          {doneTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => openEditModal(task)} 
              onDelete={() => handleDelete(task.id)}
              onMoveLeft={() => updateTaskStatus(task.id, 'in_progress')}
            />
          ))}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-muted/20">
              <h2 className="text-xl font-bold">{editingTask ? "Edit Task" : "Create New Task"}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="E.g. Review ban appeals" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional details..." />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Assignee (Optional)</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                  <option value="">-- Unassigned --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2 font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-semibold bg-primary text-primary-foreground rounded-xl shadow-md disabled:opacity-50 hover:opacity-90 transition-all">
                  {isSubmitting ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMoveLeft, onMoveRight }: any) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-semibold text-foreground line-clamp-2">{task.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-card/80 backdrop-blur-sm p-1 rounded-lg border border-border/50 shadow-sm">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          {task.assignee_email ? (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold border border-primary/20">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]" title={task.assignee_email}>{task.assignee_email.split('@')[0]}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Unassigned</span>
          )}
        </div>
        
        <div className="flex gap-1">
          {onMoveLeft && (
            <button onClick={onMoveLeft} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Move Left">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          {onMoveRight && (
            <button onClick={onMoveRight} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Move Right">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
