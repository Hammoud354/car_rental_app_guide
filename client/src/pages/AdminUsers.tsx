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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Trash2, Crown, FileText, Home, Zap, Info, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: "",
    email: "",
    name: "",
    phone: "",
    country: "",
    password: "",
  });
  const [passwordError, setPasswordError] = useState("");

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
      toast.success(`User ${data.isInternal ? 'granted' : 'revoked'} internal access`);
      utils.admin.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to toggle internal flag");
    },
  });

  // Add user mutation
  const addUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      utils.admin.listUsers.invalidate();
      setIsAddUserDialogOpen(false);
      setNewUserData({
        username: "",
        email: "",
        name: "",
        phone: "",
        country: "",
        password: "",
      });
      setPasswordError("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create user");
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
    toggleInternalMutation.mutate({ userId, isInternal: !currentValue });
  };

  const handleAddUser = () => {
    if (!newUserData.username || !newUserData.email) {
      toast.error("Username and email are required");
      return;
    }
    
    if (!newUserData.password) {
      setPasswordError("Password is required");
      return;
    }
    
    if (newUserData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    
    setPasswordError("");
    addUserMutation.mutate(newUserData);
  };

  const nonInternalUsers = users?.filter(u => !u.isInternal && u.role !== 'super_admin') || [];
  const internalUsers = users?.filter(u => u.isInternal) || [];

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
        <div className="flex gap-2 flex-wrap">
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
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. The user will receive a welcome email with login instructions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username"
                    value={newUserData.username}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, username: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newUserData.name}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newUserData.phone}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    value={newUserData.country}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, country: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (min 8 characters)"
                    value={newUserData.password}
                    onChange={(e) => {
                      setNewUserData({ ...newUserData, password: e.target.value });
                      setPasswordError("");
                    }}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={false}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Internal User Access (Bypass Subscription Limits)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-4">
          <div className="space-y-2">
            <p><strong>What are Internal Users?</strong></p>
            <p>• Internal users bypass all subscription limits (unlimited vehicles, clients, team members)</p>
            <p>• Use the toggle switch next to any user to enable/disable this feature</p>
            <p>• Super Admin users automatically have unlimited access</p>
          </div>
          
          <div className="pt-3 border-t border-blue-200">
            <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Stats
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white bg-opacity-60 rounded p-2">
                <p className="text-xs text-blue-700">Total Users</p>
                <p className="text-lg font-bold text-blue-900">{users?.length || 0}</p>
              </div>
              <div className="bg-white bg-opacity-60 rounded p-2">
                <p className="text-xs text-blue-700">With Internal Access</p>
                <p className="text-lg font-bold text-green-600">{internalUsers.length}</p>
              </div>
              <div className="bg-white bg-opacity-60 rounded p-2">
                <p className="text-xs text-blue-700">Without Internal Access</p>
                <p className="text-lg font-bold text-orange-600">{nonInternalUsers.length}</p>
              </div>
            </div>
          </div>
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
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1 cursor-help">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span>Internal</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Toggle to grant/revoke unlimited access</p>
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
                      <TableCell className="text-center">
                        {u.role === "super_admin" ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Super Admin always has unlimited access</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <Switch
                                    checked={u.isInternal || false}
                                    onCheckedChange={() => handleToggleInternal(u.id, u.isInternal || false)}
                                    disabled={toggleInternalMutation.isPending}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{u.isInternal ? "Click to revoke internal access" : "Click to grant internal access"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
          <p>• All role changes and internal access toggles are enforced server-side</p>
          <p>• Internal user toggles are logged for audit purposes</p>
        </CardContent>
      </Card>
    </div>
  );
}
