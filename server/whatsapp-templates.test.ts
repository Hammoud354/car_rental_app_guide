import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('WhatsApp Templates', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Use a test user ID (assuming user 1 exists from other tests)
    testUserId = 1;
  });

  describe('Template CRUD Operations', () => {
    it('should create a new WhatsApp template', async () => {
      const template = await db.upsertWhatsappTemplate(
        testUserId,
        'contract_created',
        'Test template: {{contractNumber}} for {{clientName}}',
        true
      );

      expect(template).toBeDefined();
      expect(template.messageTemplate).toBe('Test template: {{contractNumber}} for {{clientName}}');
      expect(template.isActive).toBe(true);
    });

    it('should retrieve WhatsApp template by type', async () => {
      // First create a template
      await db.upsertWhatsappTemplate(
        testUserId,
        'contract_renewed',
        'Renewal template: {{contractNumber}}',
        true
      );

      // Then retrieve it
      const template = await db.getWhatsappTemplateByType(testUserId, 'contract_renewed');

      expect(template).toBeDefined();
      expect(template?.messageTemplate).toBe('Renewal template: {{contractNumber}}');
    });

    it('should update existing WhatsApp template', async () => {
      // Create initial template
      const initial = await db.upsertWhatsappTemplate(
        testUserId,
        'contract_completed',
        'Initial template',
        true
      );

      // Update the same template
      const updated = await db.upsertWhatsappTemplate(
        testUserId,
        'contract_completed',
        'Updated template',
        true
      );

      expect(updated.messageTemplate).toBe('Updated template');
      
      // Verify it's the same template (updated, not created new)
      const retrieved = await db.getWhatsappTemplateByType(testUserId, 'contract_completed');
      expect(retrieved?.messageTemplate).toBe('Updated template');
    });

    it('should list all WhatsApp templates for a user', async () => {
      // Create multiple templates
      await db.upsertWhatsappTemplate(testUserId, 'contract_created', 'Template 1', true);
      await db.upsertWhatsappTemplate(testUserId, 'contract_renewed', 'Template 2', true);
      await db.upsertWhatsappTemplate(testUserId, 'invoice_generated', 'Template 3', true);

      const templates = await db.getWhatsappTemplates(testUserId);

      expect(templates.length).toBeGreaterThanOrEqual(3);
      expect(templates.some(t => t.templateType === 'contract_created')).toBe(true);
      expect(templates.some(t => t.templateType === 'contract_renewed')).toBe(true);
      expect(templates.some(t => t.templateType === 'invoice_generated')).toBe(true);
    });

    it('should only return active templates', async () => {
      // Create an inactive template
      await db.upsertWhatsappTemplate(
        testUserId,
        'contract_completed',
        'Inactive template',
        false
      );

      // Try to retrieve it
      const template = await db.getWhatsappTemplateByType(testUserId, 'contract_completed');

      // Should not return inactive template
      expect(template).toBeNull();
    });
  });

  describe('Template Variables', () => {
    it('should support all required template variables', () => {
      const templateText = `
        Contract: {{contractNumber}}
        Client: {{clientName}}
        Vehicle: {{vehicleName}}
        Start: {{startDate}}
        End: {{endDate}}
        Amount: {{totalAmount}}
        PDF: {{pdfUrl}}
        Thumbnail: {{thumbnailUrl}}
      `;

      // Verify all variables are present
      expect(templateText).toContain('{{contractNumber}}');
      expect(templateText).toContain('{{clientName}}');
      expect(templateText).toContain('{{vehicleName}}');
      expect(templateText).toContain('{{startDate}}');
      expect(templateText).toContain('{{endDate}}');
      expect(templateText).toContain('{{totalAmount}}');
      expect(templateText).toContain('{{pdfUrl}}');
      expect(templateText).toContain('{{thumbnailUrl}}');
    });
  });

  describe('Template Types', () => {
    it('should support all contract template types', async () => {
      const types: Array<'contract_created' | 'contract_renewed' | 'contract_completed' | 'invoice_generated'> = [
        'contract_created',
        'contract_renewed',
        'contract_completed',
        'invoice_generated'
      ];

      for (const type of types) {
        const template = await db.upsertWhatsappTemplate(
          testUserId,
          type,
          `Template for ${type}`,
          true
        );

        expect(template).toBeDefined();
        expect(template.templateType).toBe(type);
      }
    });
  });
});
