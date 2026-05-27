import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Trash2, Edit, Shield, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function UserManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    role: "user" as "user" | "admin",
  });

  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast({ title: t("users.roleUpdated") });
      refetch();
    },
    onError: (error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast({ title: t("users.userDeleted") });
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      country: user.country || "",
      role: user.role || "user",
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate({ userId: selectedUser.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            {t("users.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("users.subtitle")}
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="h-4 w-4 mr-1" />
          {t("users.superAdminOnly")}
        </Badge>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {users?.map((user) => (
          <div key={user.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{user.name || user.username}</div>
              <Select
                value={user.role || "user"}
                onValueChange={(value) =>
                  handleRoleChange(user.id, value as "user" | "admin")
                }
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {t("users.user")}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {t("users.admin")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{t("users.username")}: {user.username}</div>
              {user.email && <div>{t("users.email")}: {user.email}</div>}
              {user.phone && <div>{t("users.phone")}: {user.phone}</div>}
              {user.country && <div>{t("users.country")}: {user.country}</div>}
              <div>{t("users.created")}: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleEditClick(user)}>
                <Edit className="h-3 w-3 mr-1" /> {t("common.edit")}
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteClick(user)}>
                <Trash2 className="h-3 w-3 mr-1" /> {t("common.delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="border rounded-lg hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.id")}</TableHead>
              <TableHead>{t("users.username")}</TableHead>
              <TableHead>{t("users.name")}</TableHead>
              <TableHead>{t("users.email")}</TableHead>
              <TableHead>{t("users.phone")}</TableHead>
              <TableHead>{t("users.country")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("users.created")}</TableHead>
              <TableHead className="text-right">{t("users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>{user.country || "-"}</TableCell>
                <TableCell>
                  <Select
                    value={user.role || "user"}
                    onValueChange={(value) =>
                      handleRoleChange(user.id, value as "user" | "admin")
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t("users.user")}
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {t("users.admin")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
            <DialogDescription>
              {t("users.editUserSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("users.name")}</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">{t("users.email")}</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("users.phone")}</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="country">{t("users.country")}</Label>
              <Input
                id="country"
                value={editForm.country}
                onChange={(e) =>
                  setEditForm({ ...editForm, country: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement update user mutation
                toast({ title: t("users.featureComingSoon"), description: t("users.updateFunctionalitySoon") });
                setEditDialogOpen(false);
              }}
            >
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.deleteUser")}</DialogTitle>
            <DialogDescription>
              {t("users.deleteConfirm", { name: selectedUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? t("users.deleting") : t("users.deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
