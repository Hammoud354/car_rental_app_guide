import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Car, FileText, DollarSign, Wrench, Crown, TrendingUp,
  Activity, CreditCard, UserPlus, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, Clock, Shield
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: any; color: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trend.value}
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const { data: analytics, isLoading } = trpc.admin.getPlatformAnalytics.useQuery(undefined, {
    enabled: user?.role === "super_admin",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return <Redirect to="/dashboard" />;
  }

  const u = analytics?.users || {} as any;
  const v = analytics?.vehicles || {} as any;
  const c = analytics?.clients || {} as any;
  const inv = analytics?.invoices || {} as any;
  const maint = analytics?.maintenance || {} as any;

  const totalVehicles = Number(v.total || 0);
  const totalRevenue = Number(inv.total_revenue || 0);
  const paidRevenue = Number(inv.paid_revenue || 0);
  const pendingRevenue = Number(inv.pending_revenue || 0);
  const overdueRevenue = Number(inv.overdue_revenue || 0);
  const maintenanceCost = Number(maint.total_cost || 0);
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-7 w-7 text-yellow-500" />
            CEO Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide analytics and business intelligence</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/user-management">
            <Button variant="outline" size="sm"><Users className="h-4 w-4 mr-1.5" />Users</Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline" size="sm"><Shield className="h-4 w-4 mr-1.5" />Audit</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-500">Loading analytics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={Number(u.total || 0)}
              subtitle={`${Number(u.new_30d || 0)} new this month`}
              icon={Users}
              color="bg-blue-600"
              trend={Number(u.new_30d || 0) > 0 ? { value: `${u.new_30d} new`, positive: true } : undefined}
            />
            <StatCard
              title="Fleet Size"
              value={totalVehicles}
              subtitle={`${Number(v.rented || 0)} currently rented`}
              icon={Car}
              color="bg-indigo-600"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              subtitle={`${Number(inv.total || 0)} invoices`}
              icon={DollarSign}
              color="bg-emerald-600"
            />
            <StatCard
              title="Maintenance Cost"
              value={formatCurrency(maintenanceCost)}
              subtitle={`${Number(maint.total || 0)} records`}
              icon={Wrench}
              color="bg-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{Number(u.active_7d || 0)}</p>
                    <p className="text-xs text-blue-600 font-medium">Active (7d)</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{Number(u.active_30d || 0)}</p>
                    <p className="text-xs text-green-600 font-medium">Active (30d)</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <ProgressBar label="Internal Users" value={Number(u.internal || 0)} max={Number(u.total || 1)} color="bg-blue-500" />
                  <ProgressBar label="Regular Users" value={Number(u.regular || 0) - Number(u.internal || 0)} max={Number(u.total || 1)} color="bg-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-indigo-600" />
                  Fleet Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar label="Available" value={Number(v.available || 0)} max={totalVehicles} color="bg-emerald-500" />
                <ProgressBar label="Rented" value={Number(v.rented || 0)} max={totalVehicles} color="bg-blue-500" />
                <ProgressBar label="In Maintenance" value={Number(v.in_maintenance || 0)} max={totalVehicles} color="bg-amber-500" />
                <ProgressBar label="Out of Service" value={Number(v.out_of_service || 0)} max={totalVehicles} color="bg-red-500" />
                <div className="pt-2 border-t border-gray-100 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Utilization Rate</span>
                    <span className="font-bold text-gray-900">
                      {totalVehicles > 0 ? Math.round((Number(v.rented || 0) / totalVehicles) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar label="Collected" value={paidRevenue} max={totalRevenue || 1} color="bg-emerald-500" />
                <ProgressBar label="Pending" value={pendingRevenue} max={totalRevenue || 1} color="bg-amber-500" />
                <ProgressBar label="Overdue" value={overdueRevenue} max={totalRevenue || 1} color="bg-red-500" />
                <div className="pt-2 border-t border-gray-100 mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Collection Rate</span>
                    <span className={`font-bold ${collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {collectionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Net (Revenue - Maint.)</span>
                    <span className="font-bold text-gray-900">{formatCurrency(paidRevenue - maintenanceCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-violet-600" />
                  Subscription Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(analytics?.subscriptionBreakdown || []).length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No subscription data yet</p>
                ) : (
                  <div className="space-y-3">
                    {(analytics?.subscriptionBreakdown || []).map((item: any, i: number) => {
                      const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                      const totalUsers = (analytics?.subscriptionBreakdown || []).reduce((sum: number, s: any) => sum + Number(s.user_count), 0);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{item.plan_name}</span>
                              <span className="text-sm text-gray-500">
                                {item.user_count} user{Number(item.user_count) !== 1 ? 's' : ''}
                                {Number(item.price) > 0 && ` · $${item.price}/mo`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full ${colors[i % colors.length]} rounded-full`}
                                style={{ width: `${totalUsers > 0 ? (Number(item.user_count) / totalUsers) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Est. Monthly Recurring Revenue</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency((analytics?.subscriptionBreakdown || []).reduce(
                            (sum: number, s: any) => sum + Number(s.user_count) * Number(s.price || 0), 0
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Top Users by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(analytics?.topUsers || []).length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No user data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs text-center">Vehicles</TableHead>
                        <TableHead className="text-xs text-center">Clients</TableHead>
                        <TableHead className="text-xs text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics?.topUsers || []).map((u: any, i: number) => (
                        <TableRow key={u.id}>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'
                              }`}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{u.name || u.username}</p>
                                <p className="text-[10px] text-gray-400">@{u.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{u.vehicles}</TableCell>
                          <TableCell className="text-center text-sm">{u.clients}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(u.revenue || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(analytics?.recentSignups || []).length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No signups yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Joined</TableHead>
                        <TableHead className="text-xs">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics?.recentSignups || []).map((signup: any) => (
                        <TableRow key={signup.id}>
                          <TableCell className="py-2">
                            <p className="text-sm font-medium text-gray-900">{signup.name || signup.username}</p>
                            <p className="text-[10px] text-gray-400">@{signup.username}</p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{signup.email || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {new Date(signup.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(signup.lastSignedIn).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {(analytics?.monthlyGrowth || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Monthly Signup Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-32">
                  {(analytics?.monthlyGrowth || []).reverse().map((m: any, i: number) => {
                    const maxSignups = Math.max(...(analytics?.monthlyGrowth || []).map((g: any) => Number(g.signups)));
                    const height = maxSignups > 0 ? (Number(m.signups) / maxSignups) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-700">{m.signups}</span>
                        <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: '100px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {m.month.split('-')[1]}/{m.month.split('-')[0].slice(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Platform Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Total Clients</p>
                      <p className="text-xl font-bold">{Number(c.total || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total Invoices</p>
                      <p className="text-xl font-bold">{Number(inv.total || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Avg Revenue / User</p>
                      <p className="text-xl font-bold">
                        {Number(u.total || 0) > 0 ? formatCurrency(totalRevenue / Number(u.total)) : '$0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Profit Margin</p>
                      <p className="text-xl font-bold">
                        {totalRevenue > 0 ? Math.round(((paidRevenue - maintenanceCost) / totalRevenue) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
