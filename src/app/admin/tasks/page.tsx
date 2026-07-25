"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, CheckSquare, Edit2, Trash2, Calendar, Clock, User, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  assignee_email: string | null;
  creator_id: string;
  creator_email: string | null;
  created_at: string;
}

interface TaskComment {
  id: string;
  user_email: string;
  user_name?: string;
  user_avatar?: string;
  content: string;
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
  
  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to task updates and comments
    const channel = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, payload => {
        if (isModalOpen && editingTask) {
          fetchComments(editingTask.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        fetchTasks();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isModalOpen, editingTask]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/admin/tasks?t=${Date.now()}`, { cache: 'no-store' });
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
    setPriority("medium");
    setDueDate("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setAssigneeId(task.assignee_id || "");
    setStatus(task.status);
    setPriority(task.priority || "medium");
    setDueDate(task.due_date ? task.due_date.substring(0, 10) : "");
    setIsModalOpen(true);
    fetchComments(task.id);
  };

  const fetchComments = async (taskId: string) => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/admin/tasks/comments?taskId=${taskId}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      toast.error("Failed to load comments");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !editingTask) return;
    
    setIsSendingComment(true);
    try {
      const res = await fetch("/api/admin/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: editingTask.id, content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment("");
      } else {
        toast.error("Failed to post comment");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSendingComment(false);
    }
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
      const payload: any = { 
        title, 
        description, 
        assignee_id: assigneeId, 
        status, 
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      };
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
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchTasks();
        toast.error("Failed to update status");
      }
    } catch (e) {
      fetchTasks();
      toast.error("An error occurred");
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== newStatus) {
        updateTaskStatus(draggedTaskId, newStatus);
      }
    }
    setDraggedTaskId(null);
  };

  if (loading) return <div className="p-8 font-bold text-center text-foreground">Loading Tasks...</div>;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  
  const completionPercentage = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* HEADER & PROGRESS */}
      <div className="flex flex-col gap-6">
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-3/4 bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="w-full md:w-1/4 flex justify-between items-center text-sm font-semibold text-muted-foreground">
            <span>{doneTasks.length} of {tasks.length} tasks done</span>
            <span className="text-primary font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* TO DO COLUMN */}
        <div 
          className="space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-sm border-t-2 border-t-muted">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
              To Do
            </h2>
            <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-lg">{todoTasks.length}</span>
          </div>
          <div className="min-h-[200px] space-y-3">
            {todoTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditModal(task)} 
                onDelete={() => handleDelete(task.id)} 
                onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
              />
            ))}
            {todoTasks.length === 0 && (
              <div className="border-2 border-dashed border-border/50 rounded-xl h-24 flex items-center justify-center text-muted-foreground text-sm font-medium">
                Drop tasks here
              </div>
            )}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div 
          className="space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in_progress')}
        >
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-warning/30 rounded-xl p-3 shadow-sm border-t-2 border-t-warning">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
              In Progress
            </h2>
            <span className="bg-warning/20 text-warning text-xs font-bold px-2 py-1 rounded-lg">{inProgressTasks.length}</span>
          </div>
          <div className="min-h-[200px] space-y-3">
            {inProgressTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditModal(task)} 
                onDelete={() => handleDelete(task.id)}
                onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="border-2 border-dashed border-warning/30 rounded-xl h-24 flex items-center justify-center text-warning/50 text-sm font-medium">
                Drop tasks here
              </div>
            )}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div 
          className="space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'done')}
        >
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-md border border-success/30 rounded-xl p-3 shadow-sm border-t-2 border-t-success">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Done
            </h2>
            <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-lg">{doneTasks.length}</span>
          </div>
          <div className="min-h-[200px] space-y-3">
            {doneTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={() => openEditModal(task)} 
                onDelete={() => handleDelete(task.id)}
                onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
              />
            ))}
            {doneTasks.length === 0 && (
              <div className="border-2 border-dashed border-success/30 rounded-xl h-24 flex items-center justify-center text-success/50 text-sm font-medium">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-card border border-border/50 rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh] ${editingTask ? 'max-w-5xl' : 'max-w-lg'} animate-in zoom-in-95 duration-200`}>
            
            {/* Form Section */}
            <div className={`flex flex-col ${editingTask ? 'md:w-1/2 border-b md:border-b-0 md:border-r border-border/50' : 'w-full'}`}>
              <div className="p-6 border-b border-border/50 bg-muted/20">
                <h2 className="text-xl font-bold">{editingTask ? "Edit Task" : "Create New Task"}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Title</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="E.g. Review ban appeals" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1">Description</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional details..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Assignee</label>
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-1">Due Date (Optional)</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
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

            {/* Comments Section (Only visible when editing) */}
            {editingTask && (
              <div className="flex flex-col md:w-1/2 bg-muted/10">
                <div className="p-4 border-b border-border/50 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Task Discussion</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px]">
                  {isLoadingComments ? (
                    <div className="text-center text-sm text-muted-foreground animate-pulse mt-10">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground mt-10">No comments yet. Start the discussion!</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-background border border-border/50 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          {c.user_avatar ? (
                            <img src={c.user_avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover shadow-sm border border-border/50" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold border border-border/50">
                              {(c.user_name || c.user_email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-bold">{c.user_name ? c.user_name : c.user_email.split('@')[0]}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(c.created_at), "MMM d, HH:mm")}</span>
                        </div>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-background border-t border-border/50">
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSendingComment || !newComment.trim()}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onDragStart }: any) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger/20 text-danger border-danger/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className="bg-card/60 backdrop-blur-xl border border-border/50 p-4 rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
          {task.priority || 'Medium'}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-card/90 backdrop-blur-sm p-1 rounded-lg border border-border/50 shadow-sm z-10">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mb-2 pr-6">{task.title}</h3>
      
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-snug">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? 'text-danger' : 'text-muted-foreground'}`}>
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(task.due_date), 'MMM d')}
            </div>
          )}
        </div>
        
        {/* Avatar */}
        <div className="flex items-center gap-2">
          {task.assignee_email ? (
            <div 
              className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background shadow-sm"
              title={task.assignee_email}
            >
              {task.assignee_email.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border-2 border-border/50 shadow-sm" title="Unassigned">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
