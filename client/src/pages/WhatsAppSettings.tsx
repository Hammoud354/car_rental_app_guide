import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Save, Loader2, ChevronRight, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function WhatsAppSettings() {
  const { t } = useTranslation();
  const { data: templates, isLoading, refetch } = trpc.whatsappTemplates.list.useQuery();
  const upsertTemplate = trpc.whatsappTemplates.upsert.useMutation();

  const templateTypes = [
    {
      type: 'contract_created' as const,
      title: t('whatsapp.contractCreated'),
      description: t('whatsapp.contractCreatedDesc'),
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
      title: t('whatsapp.contractRenewed'),
      description: t('whatsapp.contractRenewedDesc'),
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
      title: t('whatsapp.contractCompleted'),
      description: t('whatsapp.contractCompletedDesc'),
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
      title: t('whatsapp.invoiceGenerated'),
      description: t('whatsapp.invoiceGeneratedDesc'),
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
    { var: '{{contractNumber}}', desc: t('whatsapp.variable_contractNumber') },
    { var: '{{clientName}}', desc: t('whatsapp.variable_clientName') },
    { var: '{{vehicleName}}', desc: t('whatsapp.variable_vehicleName') },
    { var: '{{startDate}}', desc: t('whatsapp.variable_startDate') },
    { var: '{{endDate}}', desc: t('whatsapp.variable_endDate') },
    { var: '{{totalAmount}}', desc: t('whatsapp.variable_totalAmount') },
    { var: '{{pdfUrl}}', desc: t('whatsapp.variable_pdfUrl') },
    { var: '{{thumbnailUrl}}', desc: t('whatsapp.variable_thumbnailUrl') },
    { var: '{{invoiceNumber}}', desc: t('whatsapp.variable_invoiceNumber') },
    { var: '{{dueDate}}', desc: t('whatsapp.variable_dueDate') },
  ];

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

      toast.success(t("whatsapp.templateSaved"));
      refetch();
    } catch (error) {
      toast.error(t("whatsapp.failedSave"));
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
      <>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/">
            <span className="hover:text-foreground cursor-pointer">{t("common.overview")}</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/settings">
            <span className="hover:text-foreground cursor-pointer">{t("settings.title")}</span>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{t("whatsapp.title")}</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            {t("whatsapp.title")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("whatsapp.subtitle")}
          </p>
        </div>

        {/* Available Variables Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t("whatsapp.availableVariables")}
            </CardTitle>
            <CardDescription>
              {t("whatsapp.availableVariablesSubtitle")}
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
                <Label htmlFor={`template-${template.type}`}>{t("whatsapp.messageTemplate")}</Label>
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
                  {t("whatsapp.saveTemplate")}
                </Button>
                <Button
                  onClick={() => handleReset(template.type)}
                  variant="outline"
                >
                  {t("whatsapp.resetToDefault")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
