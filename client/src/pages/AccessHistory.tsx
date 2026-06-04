import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { History, ArrowLeft, Search, ShieldCheck, Car, FileText, Users, Receipt, Wrench, BarChart2, TrendingUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const moduleIcon = (page: string) => {
  const p = (page || "").toLowerCase();
  if (p.includes("vehicle") || p.includes("fleet")) return <Car className="h-3.5 w-3.5" />;
  if (p.includes("contract") || p.includes("reservation")) return <FileText className="h-3.5 w-3.5" />;
  if (p.includes("customer") || p.includes("client")) return <Users className="h-3.5 w-3.5" />;
  if (p.includes("invoice")) return <Receipt className="h-3.5 w-3.5" />;
  if (p.includes("maintenance")) return <Wrench className="h-3.5 w-3.5" />;
  if (p.includes("analytic")) return <BarChart2 className="h-3.5 w-3.5" />;
  if (p.includes("financial") || p.includes("profit")) return <TrendingUp className="h-3.5 w-3.5" />;
  return <ShieldCheck className="h-3.5 w-3.5" />;
};

const actionColor = (action: string) => {
  const a = (action || "").toLowerCase();
  if (a.includes("delete")) return "text-red-600 border-red-200 bg-red-50";
  if (a.includes("edit") || a.includes("updat")) return "text-amber-600 border-amber-200 bg-amber-50";
  if (a.includes("emergency")) return "text-red-700 border-red-300 bg-red-100";
  return "text-blue-600 border-blue-200 bg-blue-50";
};

export default function AccessHistory() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data: logs, isLoading } = trpc.privacy.getAccessLogs.useQuery({ limit: 200 });

  const filtered = (logs || []).filter((log: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.adminName || "").toLowerCase().includes(q) ||
      (log.adminUsername || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.pageAccessed || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setLocation("/privacy-settings")}
          data-testid="button-back-privacy"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access History</h1>
          <p className="text-sm text-gray-500 mt-0.5">All administrator access sessions and actions on your account</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: (logs || []).length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Today", value: (logs || []).filter((l: any) => l.timestamp && new Date(l.timestamp).toDateString() === new Date().toDateString()).length, color: "text-green-600", bg: "bg-green-50" },
          { label: "This Week", value: (logs || []).filter((l: any) => l.timestamp && (Date.now() - new Date(l.timestamp).getTime()) < 7 * 86400000).length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Unique Admins", value: new Set((logs || []).map((l: any) => l.adminId)).size, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                Access Log
              </CardTitle>
              <CardDescription>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search admin, action…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8 text-sm h-8"
                data-testid="input-search-logs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <History className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No access records yet</p>
              <p className="text-xs mt-1">Administrator access activity will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paged.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  data-testid={`log-row-${log.id}`}
                >
                  <div className={cn("rounded-lg p-1.5 mt-0.5 border", actionColor(log.action || ""))}>
                    {moduleIcon(log.pageAccessed || log.action || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 truncate">
                        {log.adminName || log.adminUsername || "Administrator"}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", actionColor(log.action || ""))}
                      >
                        {log.action || "Access"}
                      </Badge>
                      {log.pageAccessed && log.pageAccessed !== log.action && (
                        <span className="text-xs text-gray-400 capitalize">{log.pageAccessed}</span>
                      )}
                    </div>
                    {log.reason && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        <span className="font-medium">Reason:</span> {log.reason}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {log.timestamp && (
                        <span>{format(new Date(log.timestamp), "MMM d, yyyy 'at' HH:mm")}</span>
                      )}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      {log.sessionId && <span className="font-mono truncate max-w-[120px]">{log.sessionId}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
