import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";

export const CitizenNotifications: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    api
      .getNotifications(filter, currentUser?.id)
      .then((response) => setNotifs(response.notifications || []))
      .catch((error) => toast.error(error.message || "Unable to load notifications."));
  }, [filter, currentUser?.id]);

  const filtered = notifs.filter((n) => filter === "all" || (!n.read && filter === "unread"));

  const markAllRead = () => {
    api
      .markAllNotificationsRead(currentUser?.id)
      .then(() => {
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      })
      .catch((error) => toast.error(error.message || "Unable to update notifications."));
  };

  const markRead = (id: number) => {
    api
      .markNotificationRead(id)
      .then(() => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))))
      .catch((error) => toast.error(error.message || "Unable to update notification."));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Registry Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official alerts, document requests, and legal status updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "unread" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Unread
            </button>
          </div>

          <button
            onClick={markAllRead}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-4 ${
              !n.read
                ? "bg-white border-slate-300 shadow-2xs ring-1 ring-slate-900/5"
                : "bg-slate-50/60 border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : n.type === "warning"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {n.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : n.type === "warning" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <span className="text-[11px] text-slate-400 block pt-1">{n.time}</span>
              </div>
            </div>

            {!n.read && (
              <button
                onClick={() => markRead(n.id)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
