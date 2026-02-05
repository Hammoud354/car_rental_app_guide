import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, UserX, UserCog, ChevronLeft, Home } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AuditLogs() {
  const { user, loading } = useAuth();
  const [limit] = useState(100);
  const [offset] = useState(0);

  // Fetch audit logs
  const { data: logs, isLoading } = trpc.admin.getAuditLogs.useQuery(
    { limit, offset },
    { enabled: user?.role === "super_admin" }
  );

  // Redirect if not super admin
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return <Redirect to="/dashboard" />;
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "secondary" | "outline", icon: any }> = {
      role_change: { variant: "default", icon: UserCog },
      user_delete: { variant: "destructive", icon: UserX },
      user_create: { variant: "secondary", icon: UserCog },
    };

    const config = variants[action] || { variant: "outline" as const, icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {action.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Users
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-500" />
              Audit Logs
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete history of all administrative actions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.actorUsername}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.actorRole}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.targetUsername ? (
                          <span className="font-medium">{log.targetUsername}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{log.details}</p>
                      </TableCell>
                      <TableCell>
                        {log.previousState || log.newState ? (
                          <div className="text-xs space-y-1">
                            {log.previousState && (
                              <div>
                                <span className="font-semibold text-red-600">Before: </span>
                                <span className="font-mono">
                                  {JSON.stringify(log.previousState)}
                                </span>
                              </div>
                            )}
                            {log.newState && (
                              <div>
                                <span className="font-semibold text-green-600">After: </span>
                                <span className="font-mono">
                                  {JSON.stringify(log.newState)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No audit logs yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Admin actions will appear here once performed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Log Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>• All administrative actions are automatically logged</p>
          <p>• Logs include actor information, timestamps, and state changes</p>
          <p>• Audit logs cannot be modified or deleted</p>
          <p>• Use this data for compliance, security monitoring, and accountability</p>
          <p>• Logs are retained indefinitely for regulatory compliance</p>
        </CardContent>
      </Card>
    </div>
  );
}
