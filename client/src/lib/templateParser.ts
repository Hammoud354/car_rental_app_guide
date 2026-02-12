/**
 * Template variable parser for WhatsApp messages
 * Replaces template variables like {{contractNumber}} with actual values
 */

export interface TemplateVariables {
  contractNumber?: string;
  clientName?: string;
  vehicleName?: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  invoiceNumber?: string;
  dueDate?: string;
}

/**
 * Parse template string and replace variables with actual values
 * @param template - Template string with variables in {{variable}} format
 * @param variables - Object containing variable values
 * @returns Parsed string with variables replaced
 */
export function parseTemplate(template: string, variables: TemplateVariables): string {
  let result = template;

  // Replace each variable if it exists
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });

  // Remove any remaining unreplaced variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  return result;
}

/**
 * Get default template for a specific type
 * @param templateType - Type of template
 * @returns Default template string
 */
export function getDefaultTemplate(
  templateType: 'contract_created' | 'contract_renewed' | 'contract_completed' | 'invoice_generated'
): string {
  const templates = {
    contract_created: `New Contract Created!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
📅 Period: {{startDate}} - {{endDate}}
💰 Total: {{totalAmount}}

📄 Download Contract PDF:
{{pdfUrl}}

{{thumbnailUrl}}`,
    contract_renewed: `Contract Renewed!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
📅 New End Date: {{endDate}}
💰 Additional Amount: {{totalAmount}}

📄 Download Updated Contract:
{{pdfUrl}}`,
    contract_completed: `Contract Completed!

📋 Contract: {{contractNumber}}
👤 Client: {{clientName}}
🚗 Vehicle: {{vehicleName}}
✅ Return Date: {{endDate}}
💰 Final Amount: {{totalAmount}}

Thank you for choosing our service!`,
    invoice_generated: `Invoice Generated!

📋 Invoice: {{invoiceNumber}}
👤 Client: {{clientName}}
💰 Amount: {{totalAmount}}
📅 Due Date: {{dueDate}}

📄 Download Invoice:
{{pdfUrl}}`
  };

  return templates[templateType];
}

/**
 * Format date for template display
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatTemplateDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format currency for template display
 * @param amount - Amount as number or string
 * @param currency - Currency symbol (default: $)
 * @returns Formatted currency string
 */
export function formatTemplateCurrency(amount: number | string, currency: string = '$'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${currency}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
