"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, ArrowLeft, Shield, AlertCircle, Edit2, X } from "lucide-react";
import Link from "next/link";
import { logAdminAction } from "@/lib/admin-logger";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";
import { createClient } from "@/lib/supabase/client";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("admin");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Edit State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("event_organizer");

  useEffect(() => {
    checkCurrentUser();
    fetchUsers();
  }, []);

  const checkCurrentUser = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      const { data } = await supabase.from('user_roles').select('role').eq('id', session.user.id).single();
      if (data) setCurrentUserRole(data.role);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch users");
      }
    } catch (e) {
      toast.error("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRole("event_organizer");
    setEditingUser(null);
    setIsFormOpen(false);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword(""); // don't load password, leave blank unless they want to change it
    setRole(user.role);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, email: string) => {
    confirmDelete("Admin account", async () => {
      const loadingToast = toast.loading("Deleting account...");
      
      try {
        const res = await fetch(`/api/admin/users?id=${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          logAdminAction("Deleted Admin Account", `Deleted account: ${email}`);
          toast.success("Account deleted successfully!", { id: loadingToast });
          fetchUsers();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to delete account", { id: loadingToast });
        }
      } catch (e) {
        toast.error("An error occurred", { id: loadingToast });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingUser ? "Updating account..." : "Creating account...");
    
    try {
      let url = '/api/admin/users';
      let method = 'POST';
      let bodyData: any = { email, role };
      
      if (password) {
        bodyData.password = password;
      }
      
      if (editingUser) {
        method = 'PUT';
        bodyData.id = editingUser.id;
      } else {
         if (!password) {
             toast.error("Password is required for new accounts", { id: loadingToast });
             setIsSubmitting(false);
             return;
         }
         bodyData.password = password;
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      
      if (res.ok) {
        logAdminAction(editingUser ? "Updated Admin Account" : "Created Admin Account", 
          `${editingUser ? 'Updated' : 'Created'} ${role} account: ${email}`);
        toast.success(`Account ${editingUser ? 'updated' : 'created'} successfully!`, { id: loadingToast });
        resetForm();
        fetchUsers();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || `Failed to ${editingUser ? 'update' : 'create'} account`, { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading Users...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-background border border-border/50 hover:bg-muted transition-colors shadow-sm text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Admin Accounts
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all"
        >
          {isFormOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isFormOpen ? "Cancel" : "Add Account"}
        </button>
      </div>

      {currentUserRole !== 'super_admin' && (
        <div className="p-4 rounded-xl border border-warning/50 bg-warning/10 text-warning font-semibold flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p>You are logged in as an Admin. You can only create or delete Event Organizer accounts.</p>
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="border border-border/50 rounded-2xl p-6 bg-card/50 backdrop-blur-md shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4 text-foreground">{editingUser ? `Edit Account: ${editingUser.email}` : "Add New Account"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-foreground">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-foreground">{editingUser ? "New Password (Optional)" : "Password"}</label>
              <input required={!editingUser} type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-foreground">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none">
                {currentUserRole === 'super_admin' && (
                  <>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                  </>
                )}
                <option value="event_organizer">Event Organizer</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4 gap-3 border-t border-border/50 mt-6">
            {editingUser && (
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 py-2 bg-background border border-border/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors shadow-sm"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all"
            >
              {isSubmitting ? "Saving..." : (editingUser ? "Save Changes" : "Create Account")}
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="border border-border/50 rounded-2xl p-12 bg-card/50 backdrop-blur-md text-center flex flex-col items-center justify-center text-muted-foreground shadow-sm">
          <Shield className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg text-foreground">No admin accounts found</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border/50 rounded-2xl bg-card/50 backdrop-blur-md shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/50">
                <th className="p-4 font-semibold text-foreground">Email</th>
                <th className="p-4 font-semibold text-foreground">Role</th>
                <th className="p-4 font-semibold text-foreground">Created At</th>
                <th className="p-4 font-semibold text-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSuperAdmin = user.role === 'super_admin';
                const isEventOrg = user.role === 'event_organizer';
                const isSelf = user.id === currentUserId;
                
                // Can only delete if not self, AND if current user is super admin OR (current user is admin and target is event_organizer)
                const canDelete = !isSelf && (
                  currentUserRole === 'super_admin' || 
                  (currentUserRole === 'admin' && isEventOrg)
                );

                return (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{user.email} {isSelf && <span className="ml-2 text-xs bg-primary/20 text-primary font-bold px-2 py-1 rounded-full border border-primary/20">You</span>}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        isSuperAdmin ? 'bg-danger/10 text-danger border-danger/20' :
                        isEventOrg ? 'bg-warning/10 text-warning border-warning/20' : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {canDelete && (
                        <div className="flex items-center justify-end gap-2 opacity-50 hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(user)} 
                            className="p-2 bg-background border border-border/50 text-foreground hover:bg-muted rounded-lg transition-colors shadow-sm"
                            title="Edit account"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, user.email)} 
                            className="p-2 bg-danger/10 border border-transparent text-danger hover:bg-danger hover:text-danger-foreground rounded-lg transition-colors shadow-sm"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
