// Simple toast hook for notifications
import { useState } from "react";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    // Simple alert-based toast for now
    // In production, you'd use a proper toast library like sonner or react-hot-toast
    const message = `${props.title}${props.description ? `\n${props.description}` : ""}`;
    if (props.variant === "destructive") {
      alert(`❌ ${message}`);
    } else {
      alert(`✓ ${message}`);
    }
    setToasts((prev) => [...prev, props]);
  };

  return { toast };
}
