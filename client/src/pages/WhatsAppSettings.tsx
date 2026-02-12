import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Save, Loader2, ChevronRight, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";

const templateTypes = [
  {
    type: 'contract_created' as const,
    title: 'Contract Created',
    description: 'Message sent when a new rental contract is created',
    defaultTemplate: `New Contract Created!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
📅 Period: {{startDate}} - {{endDate}}
💰 Total: {{totalAmount}}

📄 Download Contract PDF:
{{pdfUrl}}

{{thumbnailUrl}}`
  },
  {
    type: 'contract_renewed' as const,
    title: 'Contract Renewed',
    description: 'Message sent when a rental contract is renewed',
    defaultTemplate: `Contract Renewed!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
📅 New End Date: {{endDate}}
💰 Additional Amount: {{totalAmount}}

📄 Download Updated Contract:
{{pdfUrl}}`
  },
  {
    type: 'contract_completed' as const,
    title: 'Contract Completed',
    description: 'Message sent when a rental contract is completed',
    defaultTemplate: `Contract Completed!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
✅ Return Date: {{endDate}}
💰 Final Amount: {{totalAmount}}

Thank you for choosing our service!`
  },
  {
    type: 'invoice_generated' as const,
    title: 'Invoice Generated',
    description: 'Message sent when an invoice is generated',
    defaultTemplate: `Invoice Generated!

📋 Invoice: {{invoiceNumber}}
👤 Client: {{clientName}}
💰 Amount: {{totalAmount}}
📅 Due Date: {{dueDate}}

📄 Download Invoice:
{{pdfUrl}}`
  }
];

const availableVariables = [
  { var: '{{contractNumber}}', desc: 'Contract number' },
  { var: '{{clientName}}', desc: 'Client full name' },
  { var: '{{vehicleName}}', desc: 'Vehicle brand and model' },
  { var: '{{startDate}}', desc: 'Rental start date' },
  { var: '{{endDate}}', desc: 'Rental end date' },
  { var: '{{totalAmount}}', desc: 'Total amount' },
  { var: '{{pdfUrl}}', desc: 'PDF download URL' },
  { var: '{{thumbnailUrl}}', desc: 'Contract thumbnail URL' },
  { var: '{{invoiceNumber}}', desc: 'Invoice number (invoices only)' },
  { var: '{{dueDate}}', desc: 'Due date (invoices only)' },
];

export default function WhatsAppSettings() {
  const { data: templates, isLoading, refetch } = trpc.whatsappTemplates.list.useQuery();
  const upsertTemplate = trpc.whatsappTemplates.upsert.useMutation();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (templates) {
      const data: Record<string, string> = {};
      templateTypes.forEach(tt => {
        const existing = templates.find(t => t.templateType === tt.type);
        data[tt.type] = existing?.messageTemplate || tt.defaultTemplate;
      });
      setFormData(data);
    }
  }, [templates]);

  const handleSave = async (templateType: string) => {
    setIsSaving(true);
    try {
      await upsertTemplate.mutateAsync({
        templateType: templateType as any,
        messageTemplate: formData[templateType],
        isActive: true,
      });

      toast.success("Template saved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (templateType: string) => {
    const template = templateTypes.find(t => t.type === templateType);
    if (template) {
      setFormData({
        ...formData,
        [templateType]: template.defaultTemplate,
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/">
            <span className="hover:text-foreground cursor-pointer">Overview</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/settings">
            <span className="hover:text-foreground cursor-pointer">Settings</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">WhatsApp Templates</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            WhatsApp Message Templates
          </h1>
          <p className="text-gray-600 mt-2">
            Customize the messages sent when sharing contracts via WhatsApp
          </p>
        </div>

        {/* Available Variables Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Available Variables
            </CardTitle>
            <CardDescription>
              Use these variables in your templates - they will be replaced with actual values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableVariables.map((v) => (
                <div key={v.var} className="flex flex-col">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {v.var}
                  </code>
                  <span className="text-xs text-muted-foreground mt-1">{v.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Editors */}
        {templateTypes.map((template) => (
          <Card key={template.type} className="mb-6">
            <CardHeader>
              <CardTitle>{template.title}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`template-${template.type}`}>Message Template</Label>
                <Textarea
                  id={`template-${template.type}`}
                  value={formData[template.type] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [template.type]: e.target.value })
                  }
                  rows={10}
                  className="font-mono text-sm mt-2"
                  placeholder={template.defaultTemplate}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(template.type)}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Template
                </Button>
                <Button
                  onClick={() => handleReset(template.type)}
                  variant="outline"
                >
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
