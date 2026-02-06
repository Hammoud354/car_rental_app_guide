import { useState, useEffect } from "react";
import MinimalLayout from "@/components/MinimalLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { FileText, Download, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  
  // Check URL for invoice parameter and open it automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice');
    if (invoiceId) {
      setSelectedInvoice(parseInt(invoiceId));
      // Clear the URL parameter after opening
      window.history.replaceState({}, '', '/invoices');
    }
  }, []);

  const { data: invoices, isLoading } = trpc.invoices.list.useQuery();
  const { data: invoiceDetails, isLoading: isLoadingDetails, error: detailsError } = trpc.invoices.getById.useQuery(
    { invoiceId: selectedInvoice! },
    { enabled: !!selectedInvoice }
  );
  const { data: companyProfile } = trpc.company.getProfile.useQuery();

  const updatePaymentMutation = trpc.invoices.updatePaymentStatus.useMutation({
    onSuccess: () => {
      trpc.useUtils().invoices.list.invalidate();
      trpc.useUtils().invoices.getById.invalidate();
      setPaymentStatus("");
      setPaymentMethod("");
    },
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    if (statusFilter === "all") return true;
    return invoice.paymentStatus === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Paid", icon: CheckCircle, className: "bg-green-100 text-green-800" },
      overdue: { label: "Overdue", icon: AlertCircle, className: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", icon: XCircle, className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${invoiceDetails?.invoiceNumber || "invoice"}.pdf`);
  };

  const handleUpdatePayment = () => {
    if (!selectedInvoice || !paymentStatus) return;

    updatePaymentMutation.mutate({
      invoiceId: selectedInvoice,
      paymentStatus: paymentStatus as "pending" | "paid" | "overdue" | "cancelled",
      paymentMethod: paymentMethod || undefined,
    });
  };

  return (
    <MinimalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage billing and payments</p>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium">Filter by Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading invoices...</p>
            </CardContent>
          </Card>
        ) : filteredInvoices && filteredInvoices.length > 0 ? (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.paymentStatus)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </p>
                        <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        {invoice.paidAt && (
                          <p>
                            Paid On: {new Date(invoice.paidAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold">${parseFloat(invoice.totalAmount).toFixed(2)}</p>
                      <Button
                        onClick={() => setSelectedInvoice(invoice.id)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No invoices found</p>
            </CardContent>
          </Card>
        )}

        {/* Invoice Details Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-muted-foreground">Loading invoice details...</p>
              </div>
            ) : detailsError ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-red-500">Error loading invoice: {detailsError.message}</p>
              </div>
            ) : !invoiceDetails ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-muted-foreground">Invoice not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Invoice Content for PDF Export */}
                <div id="invoice-content" className="bg-white p-8 space-y-6">
                  {/* Company Header */}
                  {companyProfile && (
                    <div className="flex justify-between items-start border-b pb-6">
                      <div className="space-y-2">
                        {companyProfile.logoUrl && (
                          <img
                            src={companyProfile.logoUrl}
                            alt="Company Logo"
                            className="h-16 object-contain"
                          />
                        )}
                        <h2 className="text-2xl font-bold">{companyProfile.companyName}</h2>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {companyProfile.address && <p>{companyProfile.address}</p>}
                          {companyProfile.city && companyProfile.country && (
                            <p>
                              {companyProfile.city}, {companyProfile.country}
                            </p>
                          )}
                          {companyProfile.phone && <p>Phone: {companyProfile.phone}</p>}
                          {companyProfile.email && <p>Email: {companyProfile.email}</p>}
                          {companyProfile.taxId && <p>Tax ID: {companyProfile.taxId}</p>}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <h1 className="text-3xl font-bold">INVOICE</h1>
                        <p className="text-lg font-semibold">{invoiceDetails.invoiceNumber}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Invoice Date:{" "}
                            {new Date(invoiceDetails.invoiceDate).toLocaleDateString()}
                          </p>
                          <p>
                            Due Date: {new Date(invoiceDetails.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoice Status */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      {getStatusBadge(invoiceDetails.paymentStatus)}
                    </div>
                    {invoiceDetails.paymentMethod && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium">{invoiceDetails.paymentMethod}</p>
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Itemized Charges</h3>
                    <table className="w-full table-fixed">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-2 font-medium w-1/2">Description</th>
                          <th className="pb-2 font-medium text-right w-1/6 px-4">Quantity</th>
                          <th className="pb-2 font-medium text-right w-1/6 px-4">Unit Price</th>
                          <th className="pb-2 font-medium text-right w-1/6 px-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoiceDetails.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td className="py-3">{item.description}</td>
                            <td className="py-3 text-right px-4">
                              {parseFloat(item.quantity).toFixed(2)}
                            </td>
                            <td className="py-3 text-right px-4">
                              ${parseFloat(item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-medium px-4">
                              ${parseFloat(item.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        ${parseFloat(invoiceDetails.subtotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (11%):</span>
                      <span className="font-medium">
                        ${parseFloat(invoiceDetails.taxAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${parseFloat(invoiceDetails.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoiceDetails.notes && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Notes:</p>
                      <p className="text-sm">{invoiceDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 border-t pt-4">
                  <Button onClick={handleExportPDF} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button onClick={() => window.print()} variant="outline" className="flex-1">
                    Print Invoice
                  </Button>
                </div>

                {/* Payment Status Update */}
                {invoiceDetails.paymentStatus !== "paid" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Update Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Payment Method (Optional)
                          </label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={handleUpdatePayment}
                        disabled={!paymentStatus || updatePaymentMutation.isPending}
                        className="w-full"
                      >
                        {updatePaymentMutation.isPending ? "Updating..." : "Update Payment Status"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MinimalLayout>
  );
}
