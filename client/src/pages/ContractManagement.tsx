import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Settings, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ContractTemplateEditor from "@/components/ContractTemplateEditor";
// File upload will be handled via tRPC mutation to server

export default function ContractManagement() {
  const [isUploading, setIsUploading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const uploadTemplateMutation = trpc.contractTemplate.uploadTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template uploaded successfully!");
      setTemplateFile(null);
      setTemplateName("");
      setShowEditor(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload template");
    },
  });

  const { data: template, isLoading: isLoadingTemplate } = trpc.contractTemplate.getTemplate.useQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPG, PNG, GIF)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setTemplateFile(file);
  };

  const handleUploadTemplate = async () => {
    if (!templateFile || !templateName) {
      toast.error("Please select a file and enter a template name");
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64 for transmission
      const fileBuffer = await templateFile.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:${templateFile.type};base64,${base64}`;

      // Get template dimensions
      let width = 800;
      let height = 1000;

      if (templateFile.type === "application/pdf") {
        // For PDFs, use standard A4 dimensions
        width = 595;
        height = 842;
      } else {
        // For images, get actual dimensions
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            width = img.width;
            height = img.height;
            resolve(null);
          };
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });
      }

      // Save template metadata to database
      await uploadTemplateMutation.mutateAsync({
        templateName,
        templateUrl: dataUrl,
        templateType: templateFile.type === "application/pdf" ? "pdf" : "image",
        templateWidth: width,
        templateHeight: height,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload template. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and configure your rental contract template with custom fields
        </p>
      </div>

      {/* Template Status */}
      {!template ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No contract template uploaded yet. Upload your template to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Template Active</p>
                <p className="text-sm text-green-700">{template.templateName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">
                  {template.fields?.length || 0} fields configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Template Section */}
      {!template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Contract Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Standard Rental Agreement 2026"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div>
              <Label>Template File (PDF or Image)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="template-file"
                />
                <label htmlFor="template-file" className="cursor-pointer">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">
                    {templateFile ? templateFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF or image (JPG, PNG, GIF) up to 10MB
                  </p>
                </label>
              </div>
            </div>

            <Button
              onClick={handleUploadTemplate}
              disabled={isUploading || !templateFile || !templateName}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload Template"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Editor Section */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Template Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractTemplateEditor
              templateUrl={template.templateUrl}
              templateWidth={template.templateWidth}
              templateHeight={template.templateHeight}
              templateId={template.id}
              onSave={() => {
                toast.success("Template fields updated!");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Template Preview */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 border-2 border-gray-300 rounded-lg overflow-auto max-h-96">
              <img
                src={template.templateUrl}
                alt="Contract Template"
                className="w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Field Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use these field names when creating fields in the template editor:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Client Information</p>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-2 py-1 rounded">client_name</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">client_phone</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">client_address</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">client_license</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Rental Information</p>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-2 py-1 rounded">vehicle_make</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">vehicle_model</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">rental_start_date</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">rental_end_date</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Pricing Information</p>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-2 py-1 rounded">daily_rate</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">total_amount</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">discount</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">final_amount</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Additional Fields</p>
              <ul className="text-sm space-y-1">
                <li><code className="bg-muted px-2 py-1 rounded">contract_number</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">contract_date</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">signature_line</code></li>
                <li><code className="bg-muted px-2 py-1 rounded">terms_conditions</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
