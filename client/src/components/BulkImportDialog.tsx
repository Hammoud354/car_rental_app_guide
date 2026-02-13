import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { parseVehicleImport, parseClientImport, generateVehicleTemplate, generateClientTemplate, type ImportResult, type VehicleImportRow, type ClientImportRow } from "@shared/csvImport";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "vehicles" | "clients";
  onImport: (data: any[]) => Promise<{ results: Array<{ success: boolean; error?: string }> }>;
}

export function BulkImportDialog({ open, onOpenChange, type, onImport }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportResult<any> | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<Array<{ success: boolean; error?: string }> | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseResult(null);
    setImportResults(null);

    // Read and parse CSV
    const text = await selectedFile.text();
    const result = type === "vehicles" 
      ? parseVehicleImport(text)
      : parseClientImport(text);
    
    setParseResult(result);
  };

  const handleImport = async () => {
    if (!parseResult || !parseResult.success) return;

    setImporting(true);
    try {
      const result = await onImport(parseResult.data);
      setImportResults(result.results);
    } catch (error: any) {
      console.error("Import failed:", error);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = type === "vehicles" 
      ? generateVehicleTemplate()
      : generateClientTemplate();
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setImportResults(null);
    onOpenChange(false);
  };

  const successCount = importResults?.filter(r => r.success).length || 0;
  const failCount = importResults?.filter(r => !r.success).length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import {type === "vehicles" ? "Vehicles" : "Clients"}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple {type} at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template Button */}
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>

          {/* File Upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "Click to upload CSV file"}
              </p>
            </label>
          </div>

          {/* Parse Errors */}
          {parseResult && !parseResult.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Found {parseResult.errors.length} error(s):</div>
                <ul className="list-disc list-inside space-y-1">
                  {parseResult.errors.slice(0, 5).map((error, i) => (
                    <li key={i} className="text-sm">
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <li className="text-sm">... and {parseResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Parse Warnings */}
          {parseResult && parseResult.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {parseResult.warnings.map((warning, i) => (
                    <li key={i} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parseResult && parseResult.success && !importResults && (
            <div>
              <h4 className="font-semibold mb-2">Preview ({parseResult.data.length} rows)</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {type === "vehicles" ? (
                          <>
                            <th className="p-2 text-left">Brand</th>
                            <th className="p-2 text-left">Model</th>
                            <th className="p-2 text-left">Year</th>
                            <th className="p-2 text-left">License Plate</th>
                          </>
                        ) : (
                          <>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Phone</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.data.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} className="border-t">
                          {type === "vehicles" ? (
                            <>
                              <td className="p-2">{row.brand}</td>
                              <td className="p-2">{row.model}</td>
                              <td className="p-2">{row.year}</td>
                              <td className="p-2">{row.licensePlate}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">{row.name}</td>
                              <td className="p-2">{row.email || "-"}</td>
                              <td className="p-2">{row.phone || "-"}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <Alert variant={failCount === 0 ? "default" : "destructive"}>
              {failCount === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">
                  Import Complete: {successCount} succeeded, {failCount} failed
                </div>
                {failCount > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {importResults.filter(r => !r.success).slice(0, 5).map((result, i) => (
                      <li key={i} className="text-sm">{result.error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResults ? "Close" : "Cancel"}
          </Button>
          {parseResult && parseResult.success && !importResults && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${parseResult.data.length} ${type}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
