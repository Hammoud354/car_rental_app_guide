import { useState, useEffect, useCallback } from "react";
import SidebarLayout from "@/components/SidebarLayout";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createSanitizedPdfClone, cleanupSanitizedClone, validateNoModernCss } from "@/lib/pdfSanitizerEngine";
import { convertUSDToLBP, calculateVAT, formatLBP, formatUSD } from "@shared/currency";

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

  // Fetch company settings for exchange rate
  const { data: settings } = trpc.settings.get.useQuery();
  const exchangeRate = settings?.exchangeRateLbpToUsd ? Number(settings.exchangeRateLbpToUsd) : 89700;

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
  const { data: companyProfile } = trpc.company.getProfile.useQuery();

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
      const element = document.getElementById("invoice-content");
      if (!element) {
        console.error("Invoice content element not found");
        toast.error("Could not find invoice content to export");
        return;
      }

      toast.info("Generating PDF...");
      
      // Store original styles
      const originalOverflow = element.style.overflow;
      const originalHeight = element.style.height;
      const originalMaxHeight = element.style.maxHeight;
      
      // Temporarily make element fully visible for capture
      element.style.overflow = 'visible';
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      
      // Create a PDF-safe clone with all OKLCH colors converted to RGB/HEX
      const safeClone = await createSanitizedPdfClone(element);
      
      // Make the clone visible with same dimensions as original
      safeClone.style.position = 'static';
      safeClone.style.left = '0';
      safeClone.style.top = '0';
      safeClone.style.overflow = 'visible';
      safeClone.style.height = 'auto';
      safeClone.style.maxHeight = 'none';
      
      try {
        // Wait a moment for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use html2canvas to capture the SAFE CLONE (not the original)
        const canvas = await html2canvas(safeClone, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        
        // Restore original styles
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
        element.style.maxHeight = originalMaxHeight;
        
        // Clean up the safe clone
        cleanupSanitizedClone(safeClone);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Handle multi-page PDFs if content is too long
        const pageHeight = 297; // A4 height in mm
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${invoiceDetails?.invoiceNumber || "invoice"}.pdf`);
        toast.success("PDF exported successfully");
      } catch (innerError: any) {
        // Clean up the safe clone even if there's an error
        cleanupSanitizedClone(safeClone);
        // Restore original styles
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
        element.style.maxHeight = originalMaxHeight;
        throw innerError;
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <SidebarLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-gray-600">Manage billing and payments</p>
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
              <p className="text-center text-gray-600">Loading invoices...</p>
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
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-2xl font-bold">{formatUSD(parseFloat(invoice.totalAmount))}</p>
                        <p className="text-sm text-gray-600">{formatLBP(convertUSDToLBP(parseFloat(invoice.totalAmount), exchangeRate))}</p>
                      </div>
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
              <p className="text-center text-gray-600">No invoices found</p>
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
              <div className="space-y-6">
                {/* Invoice Content for PDF Export */}
                <div id="invoice-content" className="bg-white text-black p-8 space-y-6 print:block">
                  {/* Company Header */}
                  <div className="flex justify-between items-start border-b pb-6">
                    <div className="space-y-2">
                      {companyProfile?.logoUrl && (
                        <img
                          src={companyProfile.logoUrl}
                          alt="Company Logo"
                          className="h-16 object-contain"
                        />
                      )}
                      <h2 className="text-2xl font-bold">
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
                      <h1 className="text-3xl font-bold">INVOICE</h1>
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
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Itemized Charges</h3>
                    <table className="w-full table-fixed">
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

                  {/* Totals */}
                  <div className="border-t-2 pt-6 space-y-4 mt-6">
                    {/* USD Amounts */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal (USD):</span>
                        <span className="font-medium tracking-wider">
                          {formatUSD(parseFloat(invoiceDetails.subtotal))}
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Tax/VAT 11% (USD):</span>
                        <span className="font-medium tracking-wider">
                          {formatUSD(parseFloat(invoiceDetails.taxAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t-2 pt-3 mt-2">
                        <span>Total (USD):</span>
                        <span className="tracking-wider">{formatUSD(parseFloat(invoiceDetails.totalAmount))}</span>
                      </div>
                    </div>

                    {/* LBP Amounts */}
                    <div className="bg-gray-50 p-5 rounded-lg space-y-3 border-2 border-primary mt-4">
                      <p className="text-xs text-gray-500 mb-3">Lebanese Pounds (LBP) at rate {exchangeRate.toLocaleString()} LBP/USD</p>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal (LBP):</span>
                        <span className="font-medium tracking-wider">
                          {formatLBP(convertUSDToLBP(parseFloat(invoiceDetails.subtotal), exchangeRate))}
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Tax/VAT 11% (LBP):</span>
                        <span className="font-medium tracking-wider">
                          {formatLBP(convertUSDToLBP(parseFloat(invoiceDetails.taxAmount), exchangeRate))}
                        </span>
                      </div>
                      <div className="flex justify-between text-xl font-bold border-t-2 border-primary pt-3 mt-2">
                        <span>Total (LBP):</span>
                        <span className="tracking-wider">{formatLBP(convertUSDToLBP(parseFloat(invoiceDetails.totalAmount), exchangeRate))}</span>
                      </div>
                    </div>
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
                <div className="flex gap-3 border-t pt-4">
                  <Button 
                    onClick={() => {
                      if (!invoiceDetails) {
                        toast.error("No invoice selected");
                        return;
                      }
                      
                      // Use company phone number from settings
                      if (!settings?.phone) {
                        toast.error("Company phone number not set in settings");
                        return;
                      }
                      
                      // Format phone number for WhatsApp (remove spaces, dashes, parentheses)
                      const phoneNumber = settings.phone.replace(/[\s\-\(\)]/g, '');
                      
                      // Create WhatsApp message
                      const message = `New Invoice Generated!\n\n💳 Invoice: ${invoiceDetails.invoiceNumber}\n👤 Client: ${invoiceDetails.clientName}\n📅 Date: ${new Date(invoiceDetails.invoiceDate).toLocaleDateString()}\n💰 Amount: $${parseFloat(invoiceDetails.totalAmount).toFixed(2)} (USD)\n💵 Amount: ${convertUSDToLBP(parseFloat(invoiceDetails.totalAmount), exchangeRate).toLocaleString()} LBP\n📄 Status: ${invoiceDetails.paymentStatus.toUpperCase()}`;
                      
                      // Encode message for URL
                      const encodedMessage = encodeURIComponent(message);
                      
                      // Open WhatsApp with pre-filled message
                      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                    }} 
                    variant="outline" 
                    className="flex-1 print:hidden"
                  >
                    💬 Send via WhatsApp
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end print:hidden">
                  <Button 
                    onClick={() => {
                      const printContent = document.getElementById('invoice-content');
                      if (!printContent) {
                        toast.error("Invoice content not found");
                        return;
                      }
                      
                      // Create a new window for printing
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) {
                        toast.error("Please allow popups to print");
                        return;
                      }
                      
                      // Write the invoice content to the new window with styles
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Invoice ${invoiceDetails.invoiceNumber}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                              * { margin: 0; padding: 0; box-sizing: border-box; }
                              body { font-family: Arial, sans-serif; padding: 32px; background: white; }
                              @media print {
                                body { padding: 0; }
                                @page { margin: 0.5in; }
                              }
                              table { border-collapse: collapse; width: 100%; }
                              th, td { text-align: left; padding: 12px; }
                              thead tr { border-bottom: 2px solid #000; }
                              tbody tr { border-bottom: 1px solid #e5e7eb; }
                              .border-b { border-bottom: 1px solid #e5e7eb; }
                              .border-b-2 { border-bottom: 2px solid #000; }
                              .border-t-2 { border-top: 2px solid #000; }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                          </body>
                        </html>
                      `);
                      
                      printWindow.document.close();
                      
                      // Wait for Tailwind CDN and content to load, then print
                      printWindow.onload = () => {
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 1000);
                      };
                    }} 
                    variant="outline"
                  >
                    🖨️ Print Invoice
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        toast.info("Generating PDF...");
                        
                        const element = document.getElementById('invoice-content');
                        if (!element) {
                          toast.error("Invoice content not found");
                          return;
                        }
                        
                        const html2pdf = (await import('html2pdf.js')).default;
                        
                        const opt = {
                          margin: 10,
                          filename: `${invoiceDetails?.invoiceNumber || 'invoice'}.pdf`,
                          image: { type: 'jpeg' as const, quality: 0.98 },
                          html2canvas: { scale: 2 },
                          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                        };
                        
                        await html2pdf().set(opt).from(element).save();
                        toast.success("PDF downloaded successfully!");
                      } catch (error: any) {
                        console.error("PDF export error:", error);
                        toast.error(`Failed to export PDF: ${error.message || 'Unknown error'}`);
                      }
                    }} 
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
                      <div className="grid grid-cols-2 gap-4">
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
    </SidebarLayout>
  );
}
