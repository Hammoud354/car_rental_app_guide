import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface ExpiringDocumentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpiringDocumentsModal({ isOpen, onOpenChange }: ExpiringDocumentsModalProps) {
  const { data: expiringDocuments, isLoading } = trpc.dashboard.getExpiringDocuments.useQuery(undefined, {
    enabled: isOpen,
  });

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 7) return "bg-red-50 border-red-200";
    if (daysRemaining <= 14) return "bg-orange-50 border-orange-200";
    return "bg-gray-50 border-gray-200";
  };

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining <= 7) return { label: "Urgent", color: "bg-red-100 text-red-800" };
    if (daysRemaining <= 14) return { label: "Soon", color: "bg-orange-100 text-orange-800" };
    return { label: "Upcoming", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Expiring Documents
          </DialogTitle>
          <DialogDescription>
            Documents expiring within the next 30 days. Click on any document to take action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !expiringDocuments || expiringDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No documents expiring soon. Great job!</p>
            </div>
          ) : (
            expiringDocuments.map((doc, index) => {
              const urgency = getUrgencyBadge(doc.daysRemaining);
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getUrgencyColor(doc.daysRemaining)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{doc.documentType}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${urgency.color}`}>
                            {urgency.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {doc.vehicleName || doc.clientName}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <p className="font-medium">
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Days Remaining:
                            </span>
                            <p className={`font-medium ${
                              doc.daysRemaining <= 7 ? "text-red-600" :
                              doc.daysRemaining <= 14 ? "text-orange-600" :
                              "text-gray-600"
                            }`}>
                              {doc.daysRemaining} days
                            </p>
                          </div>
                        </div>
                        {doc.additionalInfo && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {doc.additionalInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      Renew
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
