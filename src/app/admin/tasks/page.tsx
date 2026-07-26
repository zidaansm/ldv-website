"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, CheckSquare, Edit2, Trash2, Calendar, Clock, User, Send, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_ids: string[];
  assignee_emails: string[];
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, (payload: any) => {
        if (isDetailModalOpen && selectedTask) {
          fetchComments(selectedTask.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_tasks' }, (payload: any) => {
        fetchTasks();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDetailModalOpen, selectedTask]);

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
    setSelectedTask(null);
    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setAssigneeIds(task.assignee_ids || []);
    setStatus(task.status);
    setPriority(task.priority || "medium");
    setDueDate(task.due_date ? task.due_date.substring(0, 10) : "");
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    fetchComments(task.id);
    setIsDetailModalOpen(true);
    setIsEditModalOpen(false);
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
    if (!newComment.trim() || !selectedTask) return;
    
    setIsSendingComment(true);
    try {
      const res = await fetch("/api/admin/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: selectedTask.id, content: newComment }),
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    if (selectedTask) {
      setIsDetailModalOpen(true); // Return to detail view if it was an edit
    } else {
      setSelectedTask(null);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const loadingToast = toast.loading(selectedTask ? "Updating task..." : "Creating task...");
    
    try {
      const method = selectedTask ? "PUT" : "POST";
      const payload: any = { 
        title, 
        description, 
        assignee_ids: assigneeIds, 
        status, 
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      };
      if (selectedTask) payload.id = selectedTask.id;

      const res = await fetch("/api/admin/tasks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Task ${selectedTask ? "updated" : "created"}!`, { id: loadingToast });
        fetchTasks();
        setIsEditModalOpen(false);
        // If it was an edit, return to detail view with updated task
        if (selectedTask) {
          const updatedTask = (await res.json()).task;
          // Optimistically update the selected task with the emails
          const newEmails = users.filter(u => assigneeIds.includes(u.id)).map(u => u.email);
          setSelectedTask({
            ...selectedTask,
            ...updatedTask,
            assignee_ids: assigneeIds,
            assignee_emails: newEmails
          });
          setIsDetailModalOpen(true);
        } else {
          setSelectedTask(null);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save task", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      const res = await fetch(`/api/admin/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        fetchTasks();
        if (selectedTask?.id === id) {
          setIsDetailModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete task");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggedTaskId, status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        fetchTasks(); // revert on failure
      }
    } catch (e) {
      toast.error("An error occurred");
      fetchTasks();
    }
    
    setDraggedTaskId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const completionPercentage = tasks.length === 0 ? 0 : Math.round((doneTasks.length / tasks.length) * 100);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-primary" />
              Task Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Collaborate and track progress with the team.</p>
          </div>
          
          <button 
            onClick={openAddModal}
            className="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-primary-foreground bg-primary rounded-xl shadow-neo transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-neo-sm active:translate-y-[6px] active:translate-x-[6px] active:shadow-none"
          >
            <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
            New Task
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
                onClick={() => openDetailModal(task)}
                onEdit={(e: any) => { e.stopPropagation(); openEditModal(task); }} 
                onDelete={(e: any) => handleDelete(task.id, e)} 
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
                onClick={() => openDetailModal(task)}
                onEdit={(e: any) => { e.stopPropagation(); openEditModal(task); }} 
                onDelete={(e: any) => handleDelete(task.id, e)} 
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
                onClick={() => openDetailModal(task)}
                onEdit={(e: any) => { e.stopPropagation(); openEditModal(task); }} 
                onDelete={(e: any) => handleDelete(task.id, e)} 
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

      {/* TASK DETAIL & DISCUSSION MODAL */}
      {isDetailModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Left: Task Details */}
            <div className="md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-border/50 overflow-y-auto custom-scrollbar">
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground leading-tight">{selectedTask.title}</h2>
                  <button onClick={closeDetailModal} className="p-2 hover:bg-muted rounded-full transition-colors self-start flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg uppercase font-bold tracking-wider">
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-lg uppercase font-bold tracking-wider border
                    ${selectedTask.priority === 'high' ? 'bg-danger/20 text-danger border-danger/30' : 
                      selectedTask.priority === 'low' ? 'bg-success/20 text-success border-success/30' : 
                      'bg-warning/20 text-warning border-warning/30'}
                  `}>
                    Priority: {selectedTask.priority || 'Medium'}
                  </span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {selectedTask.description || <span className="italic opacity-50">No description provided.</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-border/50 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assignee_emails && selectedTask.assignee_emails.length > 0 ? (
                        selectedTask.assignee_emails.map((email, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border/50 rounded-lg text-xs font-medium shadow-sm">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                              {email.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px]" title={email}>{email.split('@')[0]}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-4 h-4 opacity-50" />
                          <span className="italic">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Due Date</h4>
                    {selectedTask.due_date ? (
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(new Date(selectedTask.due_date), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No due date</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-start pt-4 border-t border-border/30">
                  <button onClick={() => openEditModal(selectedTask)} className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit Task Properties
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Comments Section */}
            <div className="flex flex-col md:w-1/2 bg-muted/10">
              <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-card/50">
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
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (FORM ONLY) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedTask ? "Edit Task" : "Create New Task"}</h2>
              <button onClick={closeEditModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[80vh]">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="E.g. Review ban appeals" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional details..." />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 flex justify-between items-end">
                    <span>Assignees</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{assigneeIds.length} selected</span>
                  </label>
                  <div className="w-full border border-border/50 rounded-lg p-2 bg-background max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                    {users.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2 italic">Loading users...</div>
                    ) : (
                      users.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={assigneeIds.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssigneeIds(prev => [...prev, u.id]);
                              } else {
                                setAssigneeIds(prev => prev.filter(id => id !== u.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary bg-background accent-primary"
                          />
                          <span className="text-sm font-medium">{u.email}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                  
                <div>
                  <label className="block text-sm font-semibold mb-1">Due Date (Optional)</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>

                <div className="flex justify-end pt-2 gap-3 border-t border-border/50 mt-4">
                  <button type="button" onClick={closeEditModal} className="px-5 py-2 font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-semibold bg-primary text-primary-foreground rounded-xl shadow-md disabled:opacity-50 hover:opacity-90 transition-all">
                    {isSubmitting ? "Saving..." : "Save Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onClick, onEdit, onDelete, onDragStart }: any) {
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
      onClick={onClick}
      className="bg-card/60 backdrop-blur-xl border border-border/50 p-4 rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-1"
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
          {task.priority || 'Medium'}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-card/90 backdrop-blur-sm p-1 rounded-lg border border-border/50 shadow-sm z-10" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Edit Properties">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors" title="Delete Task">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mb-2 pr-6 group-hover:text-primary transition-colors">{task.title}</h3>
      
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
        
        {/* Avatars for Assignees */}
        <div className="flex items-center">
          {task.assignee_emails && task.assignee_emails.length > 0 ? (
            <div className="flex -space-x-2">
              {task.assignee_emails.slice(0, 3).map((email: string, i: number) => (
                <div 
                  key={i}
                  className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-card shadow-sm z-10 relative hover:z-20 hover:scale-110 transition-transform"
                  title={email}
                >
                  {email.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignee_emails.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold border-2 border-card shadow-sm z-10 relative">
                  +{task.assignee_emails.length - 3}
                </div>
              )}
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
