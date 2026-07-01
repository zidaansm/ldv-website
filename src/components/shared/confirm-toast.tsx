import toast from "react-hot-toast";

export const confirmDelete = (itemName: string, onConfirm: () => void) => {
  toast.remove("delete-confirm");
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-in slide-in-from-top-2" : "animate-out slide-out-to-top-2 fade-out"
        } max-w-sm w-full bg-card shadow-lg rounded-2xl pointer-events-auto flex flex-col gap-4 p-5 neo-border`}
        style={{
          boxShadow: '4px 4px 0px 0px var(--border)'
        }}
      >
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Confirm Deletion
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            Are you sure you want to delete this {itemName}? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-bold transition-colors neo-border"
            onClick={() => toast.remove(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-xl text-sm font-bold transition-colors neo-border"
            onClick={() => {
              toast.remove(t.id);
              onConfirm();
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ),
    { duration: Infinity, id: 'delete-confirm' }
  );
};
