import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Home,
  Users,
  BarChart3,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const WHISH_PHONE_NUMBER = "+961 76 354 131";

export default function AdminPaymentRequests() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; id: number; username: string; plan: string; amount: string } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: number; username: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [approveNotes, setApproveNotes] = useState("");

  const { data: requests = [], isLoading, refetch } = trpc.subscription.getWhishPaymentRequests.useQuery(undefined, {
    enabled: user?.role === "super_admin",
    refetchInterval: 30000,
  });

  const approveMutation = trpc.subscription.approveWhishPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment approved and subscription activated!");
      setApproveDialog(null);
      setApproveNotes("");
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to approve payment"),
  });

  const rejectMutation = trpc.subscription.rejectWhishPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment rejected and user notified.");
      setRejectDialog(null);
      setRejectNotes("");
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to reject payment"),
  });

  if (!user || user.role !== "super_admin") {
    return <Redirect to="/dashboard" />;
  }

  const filtered = (requests as any[]).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.transactionId?.toLowerCase().includes(q) ||
      r.user?.username?.toLowerCase().includes(q) ||
      r.user?.companyName?.toLowerCase().includes(q) ||
      r.tier?.displayName?.toLowerCase().includes(q)
    );
  });

  const pending = filtered.filter((r: any) => r.status === "pending");
  const reviewed = filtered.filter((r: any) => r.status !== "pending");

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge>{status}</Badge>;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Whish Payment Requests</h1>
                <p className="text-sm text-gray-500">Review and approve subscription payments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" data-testid="link-admin-users"><Users className="h-4 w-4" /></Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Users</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin/analytics">
                    <Button variant="outline" size="sm" data-testid="link-admin-analytics"><BarChart3 className="h-4 w-4" /></Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Analytics</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" data-testid="link-dashboard"><Home className="h-4 w-4" /></Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Dashboard</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Pending Review</p>
                    <p className="text-3xl font-bold text-amber-900">
                      {(requests as any[]).filter((r: any) => r.status === "pending").length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Approved</p>
                    <p className="text-3xl font-bold text-green-900">
                      {(requests as any[]).filter((r: any) => r.status === "approved").length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Your Whish Number</p>
                    <p className="text-base font-mono font-bold text-gray-900">{WHISH_PHONE_NUMBER}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Update in SubscriptionPlans.tsx</p>
                  </div>
                  <Wallet className="h-8 w-8 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by user, TX ID, plan..."
                      className="pl-8 w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>No payment requests found</p>
                </div>
              ) : (
                <>
                  {pending.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending — Requires Action</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pending.map((r: any) => (
                            <TableRow key={r.id} className="bg-amber-50/30">
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{r.user?.username || `User #${r.userId}`}</p>
                                  {r.user?.companyName && <p className="text-xs text-gray-500">{r.user.companyName}</p>}
                                  {r.user?.email && <p className="text-xs text-gray-400">{r.user.email}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{r.tier?.displayName || `Tier #${r.tierId}`}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold">${r.amount}</TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{r.transactionId}</span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy HH:mm") : "—"}
                              </TableCell>
                              <TableCell>{statusBadge(r.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => setApproveDialog({ open: true, id: r.id, username: r.user?.username || `User #${r.userId}`, plan: r.tier?.displayName || "plan", amount: r.amount })}
                                        data-testid={`button-approve-${r.id}`}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve & activate subscription</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => { setRejectDialog({ open: true, id: r.id, username: r.user?.username || `User #${r.userId}` }); setRejectNotes(""); }}
                                        data-testid={`button-reject-${r.id}`}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reject payment request</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}

                  {reviewed.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previously Reviewed</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reviewed.map((r: any) => (
                            <TableRow key={r.id} className="opacity-75">
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{r.user?.username || `User #${r.userId}`}</p>
                                  {r.user?.companyName && <p className="text-xs text-gray-500">{r.user.companyName}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{r.tier?.displayName || `Tier #${r.tierId}`}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold">${r.amount}</TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{r.transactionId}</span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : "—"}
                              </TableCell>
                              <TableCell>{statusBadge(r.status)}</TableCell>
                              <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!approveDialog?.open} onOpenChange={() => { setApproveDialog(null); setApproveNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Approve Payment
            </DialogTitle>
            <DialogDescription>
              Approve <strong>{approveDialog?.username}</strong>'s payment of <strong>${approveDialog?.amount}</strong> for the <strong>{approveDialog?.plan}</strong> plan. Their subscription will be activated immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="approve-notes">Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Any internal notes..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={2}
                data-testid="textarea-approve-notes"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setApproveDialog(null); setApproveNotes(""); }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => approveDialog && approveMutation.mutate({ id: approveDialog.id, notes: approveNotes || undefined })}
                disabled={approveMutation.isPending}
                data-testid="button-confirm-approve"
              >
                {approveMutation.isPending ? "Approving..." : "Approve & Activate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectDialog?.open} onOpenChange={() => { setRejectDialog(null); setRejectNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Reject Payment
            </DialogTitle>
            <DialogDescription>
              Reject <strong>{rejectDialog?.username}</strong>'s payment request. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="reject-notes">Reason for rejection *</Label>
              <Textarea
                id="reject-notes"
                placeholder="e.g. Transaction ID not found, incorrect amount, etc."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                data-testid="textarea-reject-notes"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setRejectDialog(null); setRejectNotes(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => rejectDialog && rejectNotes.trim() && rejectMutation.mutate({ id: rejectDialog.id, notes: rejectNotes })}
                disabled={!rejectNotes.trim() || rejectMutation.isPending}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
