import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, Trash2, Crown, FileText, Home, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Fetch all users
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "super_admin",
  });

  // Update user role mutation
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  // Delete user mutation
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  // Toggle internal flag mutation
  const toggleInternalMutation = trpc.admin.toggleUserInternal.useMutation({
    onSuccess: (data) => {
      toast.success(`User ${data.isInternal ? 'marked as' : 'unmarked as'} internal`);
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle internal flag");
    },
  });

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate({ userId });
    }
  };

  const handleToggleInternal = (userId: number, currentValue: boolean) => {
    const action = currentValue ? "remove internal access from" : "grant internal access to";
    if (window.confirm(`Are you sure you want to ${action} this user? This will ${currentValue ? 'enable' : 'disable'} subscription limit bypassing.`)) {
      toggleInternalMutation.mutate({ userId, isInternal: !currentValue });
    }
  };

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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Super Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, permissions, and subscription access
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Internal User Access
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Internal Users</strong> bypass all subscription limits (vehicles, clients, team members)</p>
          <p>• Use this feature to grant unlimited access to trusted team members or testing accounts</p>
          <p>• Toggle the <strong>Internal</strong> switch next to any user to enable/disable this feature</p>
          <p>• Super Admin users automatically have unlimited access and cannot be toggled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1 cursor-help">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span>Internal</span>
                              <Info className="h-3 w-3" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Toggle to bypass subscription limits</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className={u.isInternal ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.name || "-"}</TableCell>
                      <TableCell>{u.email || "-"}</TableCell>
                      <TableCell>
                        {u.role === "super_admin" ? (
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-yellow-600">Super Admin</span>
                          </div>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value as "user" | "admin")}
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(u.lastSignedIn).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={u.isInternal || false}
                                  onCheckedChange={() => handleToggleInternal(u.id, u.isInternal || false)}
                                  disabled={toggleInternalMutation.isPending || u.role === "super_admin"}
                                  className="cursor-pointer"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {u.role === "super_admin" 
                                ? "Super Admin always has unlimited access" 
                                : u.isInternal 
                                ? "Click to remove internal access" 
                                : "Click to grant internal access"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.isInternal && (
                            <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                              <Zap className="h-3 w-3" />
                              Internal
                            </Badge>
                          )}
                          {u.role !== "super_admin" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 space-y-2">
          <p>• You are the <strong>only Super Admin</strong> in the system</p>
          <p>• Super Admin role cannot be transferred or duplicated</p>
          <p>• Only you can promote users to Admin or demote them to User</p>
          <p>• Regular users and admins have no access to this panel</p>
          <p>• All role changes are enforced server-side for maximum security</p>
          <p>• Internal user toggles are logged and can be audited</p>
        </CardContent>
      </Card>
    </div>
  );
}
