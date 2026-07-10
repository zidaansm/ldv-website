"use client";

import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: any;
  formData: Record<string, string>;
  setFormData: (data: any) => void;
  handleFileChange: (fieldLabel: string, file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  selectedEvent,
  formData,
  setFormData,
  handleFileChange,
  onSubmit,
  isSubmitting,
}: EventRegistrationModalProps) {
  const modalRef = useFocusTrap(isOpen, onClose);

  if (!isOpen || !selectedEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-card neo-border neo-shadow-sm rounded-2xl p-6 md:p-8 max-w-md w-full animate-in zoom-in-95 duration-200"
      >
        <h2 id="modal-title" className="text-2xl font-bold mb-2">Register for {selectedEvent.title}</h2>
        <p className="text-muted-foreground text-sm mb-6">Please complete the following required information to register.</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {(selectedEvent.form_schema?.length ? selectedEvent.form_schema : [{ id: "discord_username", label: "Discord Username", type: "text", required: true }]).map((field: any) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block font-bold text-sm mb-1">
                {field.label} {field.required && <span className="text-danger">*</span>}
              </label>
              {field.type === "image" ? (
                <input 
                  id={field.id}
                  required={field.required}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(field.label, e.target.files?.[0] || null)}
                  className="w-full neo-border rounded-lg px-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
              ) : (
                <input 
                  id={field.id}
                  required={field.required}
                  type={field.type || "text"}
                  value={formData[field.label] || ""}
                  onChange={(e) => {
                    const newData = { ...formData };
                    newData[field.label] = e.target.value;
                    setFormData(newData);
                  }}
                  className="w-full neo-border rounded-lg px-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-bold neo-border rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-bold neo-border rounded-xl bg-primary text-primary-foreground neo-press disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
