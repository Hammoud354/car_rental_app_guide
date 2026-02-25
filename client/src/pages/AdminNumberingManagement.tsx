import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Edit2, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminNumberingManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [migrationFormData, setMigrationFormData] = useState({
    contractNumber: "",
    invoiceNumber: "",
    reason: "",
  });

  // Fetch all users' numbering status
  const { data: usersNumberingStatus, isLoading: isLoadingUsers, refetch: refetchUsers } = 
    trpc.numbering.getAllUsersNumberingStatus.useQuery();

  // Fetch audit trail for selected user
  const { data: auditTrail, isLoading: isLoadingAudit, refetch: refetchAudit } = 
    trpc.numbering.getUserAuditTrail.useQuery(
      { userId: selectedUserId || 0, limit: 50 },
      { enabled: !!selectedUserId }
    );

  // Mutations for migrations
  const migrateContractMutation = trpc.numbering.migrateContractNumber.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Contract number migrated successfully" });
      refetchUsers();
      setMigrationFormData({ ...migrationFormData, contractNumber: "" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const migrateInvoiceMutation = trpc.numbering.migrateInvoiceNumber.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Invoice number migrated successfully" });
      refetchUsers();
      setMigrationFormData({ ...migrationFormData, invoiceNumber: "" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleMigrateContract = async () => {
    if (!selectedUserId || !migrationFormData.contractNumber || !migrationFormData.reason) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    await migrateContractMutation.mutateAsync({
      userId: selectedUserId,
      startingNumber: parseInt(migrationFormData.contractNumber),
      reason: migrationFormData.reason,
    });
  };

  const handleMigrateInvoice = async () => {
    if (!selectedUserId || !migrationFormData.invoiceNumber || !migrationFormData.reason) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    await migrateInvoiceMutation.mutateAsync({
      userId: selectedUserId,
      startingNumber: parseInt(migrationFormData.invoiceNumber),
      reason: migrationFormData.reason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <button
          onClick={() => setLocation("/dashboard")}
          className="hover:text-foreground transition-colors font-medium text-blue-600 hover:underline"
        >
          Dashboard
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Numbering Management</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Numbering Management</h1>
          <p className="text-muted-foreground mt-2">Manage contract and invoice numbering for all users</p>
        </div>
        <Button onClick={() => refetchUsers()} disabled={isLoadingUsers} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Users Numbering Status Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users Numbering Status</CardTitle>
              <CardDescription>View and manage numbering for all users</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Last Contract #</TableHead>
                        <TableHead>Next Contract #</TableHead>
                        <TableHead>Last Invoice #</TableHead>
                        <TableHead>Next Invoice #</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersNumberingStatus && usersNumberingStatus.length > 0 ? (
                        usersNumberingStatus.map((user: any) => (
                          <TableRow key={user.userId}>
                            <TableCell className="font-mono">{user.userId}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="font-mono">{user.lastContractNumber}</TableCell>
                            <TableCell className="font-mono text-blue-600 font-bold">{user.nextContractNumber}</TableCell>
                            <TableCell className="font-mono">{user.lastInvoiceNumber}</TableCell>
                            <TableCell className="font-mono text-blue-600 font-bold">{user.nextInvoiceNumber}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserId(user.userId);
                                      refetchAudit();
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Manage Numbering for {user.username}</DialogTitle>
                                    <DialogDescription>
                                      Migrate contract or invoice numbers for this user
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-6">
                                    {/* Contract Number Migration */}
                                    <div className="space-y-4 border-b pb-4">
                                      <h3 className="font-semibold">Contract Number Migration</h3>
                                      <div className="grid gap-4">
                                        <div>
                                          <Label htmlFor="contract-number">New Starting Number</Label>
                                          <Input
                                            id="contract-number"
                                            type="number"
                                            min="0"
                                            value={migrationFormData.contractNumber}
                                            onChange={(e) =>
                                              setMigrationFormData({
                                                ...migrationFormData,
                                                contractNumber: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., 500"
                                            className="border-red-500"
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Current: {user.lastContractNumber} | Next will be: {user.nextContractNumber}
                                          </p>
                                        </div>
                                        <div>
                                          <Label htmlFor="contract-reason">Reason for Migration</Label>
                                          <Textarea
                                            id="contract-reason"
                                            value={migrationFormData.reason}
                                            onChange={(e) =>
                                              setMigrationFormData({
                                                ...migrationFormData,
                                                reason: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., Legacy system migration"
                                            className="border-red-500"
                                          />
                                        </div>
                                        <Button
                                          onClick={handleMigrateContract}
                                          disabled={migrateContractMutation.isPending}
                                        >
                                          {migrateContractMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          )}
                                          Migrate Contract Number
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Invoice Number Migration */}
                                    <div className="space-y-4">
                                      <h3 className="font-semibold">Invoice Number Migration</h3>
                                      <div className="grid gap-4">
                                        <div>
                                          <Label htmlFor="invoice-number">New Starting Number</Label>
                                          <Input
                                            id="invoice-number"
                                            type="number"
                                            min="0"
                                            value={migrationFormData.invoiceNumber}
                                            onChange={(e) =>
                                              setMigrationFormData({
                                                ...migrationFormData,
                                                invoiceNumber: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., 1000"
                                            className="border-red-500"
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Current: {user.lastInvoiceNumber} | Next will be: {user.nextInvoiceNumber}
                                          </p>
                                        </div>
                                        <div>
                                          <Label htmlFor="invoice-reason">Reason for Migration</Label>
                                          <Textarea
                                            id="invoice-reason"
                                            value={migrationFormData.reason}
                                            onChange={(e) =>
                                              setMigrationFormData({
                                                ...migrationFormData,
                                                reason: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., Legacy system migration"
                                            className="border-red-500"
                                          />
                                        </div>
                                        <Button
                                          onClick={handleMigrateInvoice}
                                          disabled={migrateInvoiceMutation.isPending}
                                        >
                                          {migrateInvoiceMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          )}
                                          Migrate Invoice Number
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Numbering Audit Trail</CardTitle>
              <CardDescription>
                {selectedUserId ? `Audit trail for user ${selectedUserId}` : "Select a user to view audit trail"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedUserId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Go to "All Users" tab and click "Manage" on a user to view their audit trail
                </div>
              ) : isLoadingAudit ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Sequential</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditTrail && auditTrail.length > 0 ? (
                        auditTrail.map((entry: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                {entry.numberType}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                                {entry.action}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono">{entry.generatedNumber}</TableCell>
                            <TableCell className="font-mono">{entry.sequentialNumber}</TableCell>
                            <TableCell className="text-sm">
                              {entry.actorUsername ? `${entry.actorUsername} (ID: ${entry.actorId})` : "System"}
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">{entry.reason || "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No audit trail found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
