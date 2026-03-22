import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserFilter } from "@/contexts/UserFilterContext";
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
import { toast } from "sonner";
import { printElement, exportElementToPDF } from "@/lib/printUtils";
import { convertUSDToLBP, calculateVAT, formatLBP, formatUSD } from "@shared/currency";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Invoices() {
  const { user } = useAuth();
  const { selectedUserId: selectedTargetUserId, setSelectedUserId: setSelectedTargetUserId, isSuperAdmin } = useUserFilter();
  const utils = trpc.useUtils();
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

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleWhatsAppPdf = async () => {
    if (!invoiceDetails) { toast.error("No invoice selected"); return; }
    if (!companyProfile?.phone) { toast.error("Company phone number not set in settings"); return; }
    if (isSendingWhatsApp) return;

    setIsSendingWhatsApp(true);
    let offscreen: HTMLDivElement | null = null;
    try {
      toast.info("Generating invoice PDF… Please wait");

      const source = document.getElementById("invoice-content");
      if (!source) { toast.error("Invoice content not found"); return; }

      // Clone into an off-screen container so the full height is captured,
      // not just the visible portion of the scrollable modal.
      offscreen = document.createElement("div");
      offscreen.style.cssText = [
        "position:fixed",
        "left:-9999px",
        "top:0",
        "width:794px",       // A4 at 96dpi
        "height:auto",
        "overflow:visible",
        "background:#ffffff",
        "z-index:-1",
        "font-family:inherit",
      ].join(";");

      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.cssText = "width:794px;height:auto;overflow:visible;background:#ffffff;padding:32px;box-sizing:border-box;";
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Brief pause so styles settle
      await new Promise(r => setTimeout(r, 120));

      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: offscreen.scrollHeight,
        windowWidth: 794,
      });

      document.body.removeChild(offscreen);
      offscreen = null;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth() - 20;
      const pdfH = pdf.internal.pageSize.getHeight() - 20;
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const scaledH = canvas.height * ratio;

      if (scaledH <= pdfH) {
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, canvas.width * ratio, scaledH);
      } else {
        let yPos = 0;
        while (yPos < canvas.height) {
          if (yPos > 0) pdf.addPage();
          const sliceH = Math.min(canvas.height - yPos, pdfH / ratio);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceH;
          slice.getContext("2d")!.drawImage(canvas, 0, yPos, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          pdf.addImage(slice.toDataURL("image/png"), "PNG", 10, 10, canvas.width * ratio, sliceH * ratio);
          yPos += sliceH;
        }
      }

      pdf.save(`Invoice-${invoiceDetails.invoiceNumber}.pdf`);

      const phoneNumber = companyProfile.phone.replace(/[\s\-\(\)]/g, "");
      const localAmount = (parseFloat(invoiceDetails.totalAmount) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const message = `Hello,\n\nPlease find attached the invoice PDF for your rental.\n\n📄 Invoice: ${invoiceDetails.invoiceNumber}\n👤 Client: ${invoiceDetails.clientName}\n📅 Date: ${new Date(invoiceDetails.invoiceDate).toLocaleDateString()}\n💰 Amount: $${parseFloat(invoiceDetails.totalAmount).toFixed(2)} USD (${localAmount} ${localCurrencyCode})\n📋 Status: ${invoiceDetails.paymentStatus.toUpperCase()}\n\n(PDF has been downloaded to your device — please attach it to this message)`;

      toast.success("PDF downloaded! Opening WhatsApp…");
      setTimeout(() => window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank"), 800);
    } catch (err: any) {
      console.error("WhatsApp PDF error:", err);
      toast.error(`Failed to generate PDF: ${err.message || "Unknown error"}`);
    } finally {
      if (offscreen && document.body.contains(offscreen)) document.body.removeChild(offscreen);
      setIsSendingWhatsApp(false);
    }
  };

  // Fetch company settings for exchange rate and VAT rate
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: companyProfile } = trpc.company.getProfile.useQuery();
  const vatRate = companyProfile?.vatRate ? Number(companyProfile.vatRate) : 11;
  const exchangeRate = companyProfile?.exchangeRate ? Number(companyProfile.exchangeRate) : 1;
  const localCurrencyCode = companyProfile?.localCurrencyCode || 'USD';

  // Fetch all users for Super Admin
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isSuperAdmin,
  });
  
  const { data: invoices, isLoading } = trpc.invoices.list.useQuery(
    selectedTargetUserId ? { filterUserId: selectedTargetUserId } : undefined
  );
  const { data: invoiceDetails, isLoading: isLoadingDetails, error: detailsError } = trpc.invoices.getById.useQuery(
    { invoiceId: selectedInvoice! },
    { enabled: !!selectedInvoice }
  );

  // Initialize payment status when invoice details are loaded
  useEffect(() => {
    if (invoiceDetails) {
      setPaymentStatus(invoiceDetails.paymentStatus);
      setPaymentMethod(invoiceDetails.paymentMethod || "");
    }
  }, [invoiceDetails]);

  const updatePaymentMutation = trpc.invoices.updatePaymentStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment status updated successfully");
      utils.invoices.list.invalidate();
      utils.invoices.getById.invalidate();
      setPaymentStatus("");
      setPaymentMethod("");
      setSelectedInvoice(null); // Close the dialog
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update payment status");
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
    try {
      toast.info("Generating PDF...");
      const success = await exportElementToPDF(
        "invoice-content",
        `${invoiceDetails?.invoiceNumber || "invoice"}.pdf`
      );
      if (success) {
        toast.success("PDF exported successfully");
      } else {
        toast.error("Could not find invoice content to export");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
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
    <>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage billing and payments</p>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
              <label className="text-sm font-medium">Filter by Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
              <p className="text-center text-gray-600">Loading invoices...</p>
            </CardContent>
          </Card>
        ) : filteredInvoices && filteredInvoices.length > 0 ? (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-base sm:text-lg">{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.paymentStatus)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
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
                    <div className="sm:text-right space-y-2 w-full sm:w-auto">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold">{formatUSD(parseFloat(invoice.totalAmount))}</p>
                        {localCurrencyCode !== 'USD' && exchangeRate !== 1 && (
                          <p className="text-sm text-gray-600">
                            {(parseFloat(invoice.totalAmount) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrencyCode}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => setSelectedInvoice(invoice.id)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
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
              <p className="text-center text-gray-600">No invoices found</p>
            </CardContent>
          </Card>
        )}

        {/* Invoice Details Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-gray-600">Loading invoice details...</p>
              </div>
            ) : detailsError ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-red-500">Error loading invoice: {detailsError.message}</p>
              </div>
            ) : !invoiceDetails ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-gray-600">Invoice not found</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto flex-1">
                {/* Invoice Content for PDF Export */}
                <div id="invoice-content" className="bg-white text-black p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 print:block text-sm sm:text-base">
                  {/* Company Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-2 sm:pb-3 gap-2">
                    <div className="space-y-2">
                      {companyProfile?.logoUrl && (
                        <img
                          src={companyProfile.logoUrl}
                          alt="Company Logo"
                          className="h-16 object-contain"
                        />
                      )}
                      <h2 className="text-lg sm:text-2xl font-bold">
                        {companyProfile?.companyName || settings?.companyName || "Company Name"}
                      </h2>
                      {companyProfile && (
                        <div className="text-sm text-gray-600 space-y-1">
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
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-bold">INVOICE</h1>
                      <p className="text-lg font-semibold">{invoiceDetails.invoiceNumber}</p>
                      <div className="text-sm text-gray-600 space-y-1">
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

                  {/* Bill To Section */}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-600">BILL TO:</p>
                    <div className="text-base">
                      <p className="font-semibold">{invoiceDetails.clientName}</p>
                      {invoiceDetails.clientPhone && (
                        <p className="text-sm text-gray-600">Phone: {invoiceDetails.clientPhone}</p>
                      )}
                      {invoiceDetails.clientEmail && (
                        <p className="text-sm text-gray-600">Email: {invoiceDetails.clientEmail}</p>
                      )}
                      {invoiceDetails.clientAddress && (
                        <p className="text-sm text-gray-600">Address: {invoiceDetails.clientAddress}</p>
                      )}
                      {invoiceDetails.clientLicenseNumber && (
                        <p className="text-sm text-gray-600">License #: {invoiceDetails.clientLicenseNumber}</p>
                      )}
                      {invoiceDetails.clientNationality && (
                        <p className="text-sm text-gray-600">Nationality: {invoiceDetails.clientNationality}</p>
                      )}
                      {invoiceDetails.contractId && (
                        <p className="text-sm text-gray-600">Contract: {invoiceDetails.contractId}</p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Status */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      {getStatusBadge(invoiceDetails.paymentStatus)}
                    </div>
                    {invoiceDetails.paymentMethod && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium">{invoiceDetails.paymentMethod}</p>
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Itemized Charges</h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="w-full min-w-[600px]">
                      <thead className="border-b-2">
                        <tr className="text-left">
                          <th className="pb-3 font-medium w-1/2">Description</th>
                          <th className="pb-3 font-medium text-right w-1/6 px-6">Number of Days</th>
                          <th className="pb-3 font-medium text-right w-1/6 px-6">Unit Price</th>
                          <th className="pb-3 font-medium text-right w-1/6 px-6">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoiceDetails.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td className="py-4">{item.description}</td>
                            <td className="py-4 text-right px-6 tracking-wider">
                              {parseFloat(item.quantity).toFixed(2)}
                            </td>
                            <td className="py-4 text-right px-6 tracking-wider">
                              ${parseFloat(item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-4 text-right font-medium px-6 tracking-wider">
                              ${parseFloat(item.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t-2 pt-3 space-y-2 mt-3">
                    {/* USD Amounts */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal (USD):</span>
                        <span className="font-medium tracking-wider">
                          {formatUSD(parseFloat(invoiceDetails.subtotal))}
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Tax/VAT {vatRate}% (USD):</span>
                        <span className="font-medium tracking-wider">
                          {formatUSD(parseFloat(invoiceDetails.taxAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t-2 pt-3 mt-2">
                        <span>Total (USD):</span>
                        <span className="tracking-wider">{formatUSD(parseFloat(invoiceDetails.totalAmount))}</span>
                      </div>
                    </div>

                    {/* Local Currency Amounts */}
                    {localCurrencyCode !== 'USD' && exchangeRate !== 1 && (
                      <div className="bg-gray-50 p-3 rounded-lg space-y-1 border-2 border-primary mt-2">
                        <p className="text-xs text-gray-500 mb-3">{companyProfile?.country || 'Local'} ({localCurrencyCode}) at rate {exchangeRate.toFixed(4)} {localCurrencyCode}/USD</p>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600">Subtotal ({localCurrencyCode}):</span>
                          <span className="font-medium tracking-wider">
                            {(parseFloat(invoiceDetails.subtotal) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrencyCode}
                          </span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600">Tax/VAT {vatRate}% ({localCurrencyCode}):</span>
                          <span className="font-medium tracking-wider">
                            {(parseFloat(invoiceDetails.taxAmount) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrencyCode}
                          </span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t-2 border-primary pt-3 mt-2">
                          <span>Total ({localCurrencyCode}):</span>
                          <span className="tracking-wider">{(parseFloat(invoiceDetails.totalAmount) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {localCurrencyCode}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {invoiceDetails.notes && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">Notes:</p>
                      <p className="text-sm">{invoiceDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 border-t pt-3 mt-3 flex-wrap">
                  <Button
                    onClick={handleWhatsAppPdf}
                    disabled={isSendingWhatsApp}
                    variant="outline"
                    className="flex-1 min-w-[150px] print:hidden text-sm"
                  >
                    {isSendingWhatsApp ? "Generating PDF…" : "💬 Send PDF via WhatsApp"}
                  </Button>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 justify-end print:hidden flex-wrap">
                  <Button 
                    onClick={() => {
                      const success = printElement("invoice-content", `Invoice ${invoiceDetails?.invoiceNumber || ""}`);
                      if (!success) {
                        toast.error("Invoice content not found");
                      }
                    }} 
                    variant="outline"
                  >
                    🖨️ Print Invoice
                  </Button>
                  <Button 
                    onClick={handleExportPDF}
                    variant="outline"
                  >
                    📄 Export to PDF
                  </Button>
                </div>

                {/* Payment Status Update */}
                {invoiceDetails.paymentStatus !== "paid" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Update Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value)}>
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
                          <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
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
    </>
  );
}
