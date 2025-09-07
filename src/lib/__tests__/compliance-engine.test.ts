/**
 * Tests for Compliance Engine
 * Post-Meeting Social Media Content Generator
 */

import {
  validateContentCompliance,
  quickComplianceCheck,
  generateComplianceDisclaimers,
} from '../compliance-engine';
import type { AdvisorID } from '@/types/master-interfaces';
import { RiskLevel, ValidationType, ValidationStatus } from '@/types/master-interfaces';

// Mock logger
jest.mock('@/lib/logger', () => ({
  complianceLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Compliance Engine', () => {
  describe('quickComplianceCheck', () => {
    const testCases = [
      {
        name: 'Investment advice detection',
        content: 'I recommend buying Apple stock',
        expectedIssues: ['Content may contain investment advice'],
        expectedRiskLevel: RiskLevel.HIGH,
      },
      {
        name: 'Client name detection',
        content: 'Had a meeting with John Smith',
        expectedIssues: ['Content may contain client names'],
        expectedRiskLevel: RiskLevel.CRITICAL,
      },
      {
        name: 'Performance claims detection',
        content: 'Our portfolio returned 15% last year',
        expectedIssues: ['Content may contain performance claims'],
        expectedRiskLevel: RiskLevel.MEDIUM,
      },
      {
        name: 'Guarantee language detection',
        content: 'This investment is guaranteed to make money',
        expectedIssues: ['Content may contain guarantee language'],
        expectedRiskLevel: RiskLevel.HIGH,
      },
      {
        name: 'Clean content',
        content: 'Had a productive meeting about financial planning',
        expectedIssues: [],
        expectedRiskLevel: RiskLevel.LOW,
      },
    ];

    testCases.forEach(({ name, content, expectedIssues, expectedRiskLevel }) => {
      it(`should detect ${name}`, () => {
        const result = quickComplianceCheck(content);

        expect(result.isCompliant).toBe(expectedIssues.length === 0);
        expect(result.issues).toEqual(expect.arrayContaining(expectedIssues));
        expect(result.riskLevel).toBe(expectedRiskLevel);
      });
    });

    it('should handle empty content', () => {
      const result = quickComplianceCheck('');

      expect(result.isCompliant).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should handle null content', () => {
      const result = quickComplianceCheck(null as unknown as string);

      expect(result.isCompliant).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
    });
  });

  describe('generateComplianceDisclaimers', () => {
    it('should generate disclaimers for investment advice', () => {
      const content = 'I recommend buying Tesla stock';
      const disclaimers = generateComplianceDisclaimers(content);

      expect(disclaimers).toContain(
        'This is not investment advice. Please consult with a qualified financial advisor.'
      );
    });

    it('should generate disclaimers for performance claims', () => {
      const content = 'Our portfolio returned 20% last year';
      const disclaimers = generateComplianceDisclaimers(content);

      expect(disclaimers).toContain('Past performance does not guarantee future results.');
    });

    it('should generate disclaimers for guarantees', () => {
      const content = 'This investment is guaranteed to make money';
      const disclaimers = generateComplianceDisclaimers(content);

      expect(disclaimers).toContain('No investment is guaranteed. All investments carry risk.');
    });

    it('should generate multiple disclaimers for complex content', () => {
      const content =
        'I recommend buying Apple stock. Our portfolio returned 15% last year and this investment is guaranteed to make money.';
      const disclaimers = generateComplianceDisclaimers(content);

      expect(disclaimers).toHaveLength(3);
      expect(disclaimers).toContain(
        'This is not investment advice. Please consult with a qualified financial advisor.'
      );
      expect(disclaimers).toContain('Past performance does not guarantee future results.');
      expect(disclaimers).toContain('No investment is guaranteed. All investments carry risk.');
    });

    it('should not generate disclaimers for clean content', () => {
      const content = 'Had a productive meeting about financial planning';
      const disclaimers = generateComplianceDisclaimers(content);

      expect(disclaimers).toHaveLength(0);
    });

    it('should handle empty content', () => {
      const disclaimers = generateComplianceDisclaimers('');
      expect(disclaimers).toHaveLength(0);
    });
  });

  describe('validateContentCompliance', () => {
    it('should validate content with investment advice', async () => {
      const content = 'I recommend buying Apple stock. It will definitely go up 20% this year.';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.id).toBeDefined();
      expect(result.contentId).toBeDefined();
      expect(result.advisorId).toBe(advisorId);
      expect(result.validationType).toBe(ValidationType.PRE_PUBLICATION);
      expect(result.status).toBe(ValidationStatus.REJECTED);
      expect(result.riskAssessment.overallRiskScore).toBeGreaterThan(50);
      expect(result.contentModifications.injectedDisclaimers.length).toBeGreaterThan(0);
      expect(result.complianceChecks.finraCompliance.passed).toBe(false);
    });

    it('should validate content with client names', async () => {
      const content = 'Had a great meeting with John Smith about his retirement planning.';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.status).toBe(ValidationStatus.REJECTED);
      expect(result.riskAssessment.overallRiskScore).toBeGreaterThan(50);
      expect(result.contentModifications.removedContent).toContain(
        'Remove or anonymize client names'
      );
      expect(result.complianceChecks.clientPrivacyCompliance.passed).toBe(false);
    });

    it('should validate clean content', async () => {
      const content =
        'Had a productive meeting today discussing general financial planning principles.';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.status).toBe(ValidationStatus.APPROVED);
      expect(result.riskAssessment.overallRiskScore).toBeLessThan(30);
      expect(result.complianceChecks.finraCompliance.passed).toBe(true);
      expect(result.complianceChecks.secCompliance.passed).toBe(true);
    });

    it('should handle content with multiple compliance issues', async () => {
      const content =
        'I recommend buying Tesla stock to John Smith. Our portfolio returned 25% last year and this investment is guaranteed to make money.';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.status).toBe(ValidationStatus.REJECTED);
      expect(result.riskAssessment.overallRiskScore).toBeGreaterThan(90);
      expect(result.complianceChecks.finraCompliance.issues.length).toBeGreaterThan(1);
      expect(result.contentModifications.injectedDisclaimers.length).toBeGreaterThan(1);
    });

    it('should generate audit trail for compliance validation', async () => {
      const content = 'Test content for audit trail';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.length).toBeGreaterThan(0);
      expect(result.auditTrail[0].performedBy).toBeDefined();
      expect(result.auditTrail[0].action).toBe('created');
    });

    it('should handle empty content', async () => {
      const content = '';
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.status).toBe(ValidationStatus.APPROVED);
      expect(result.riskAssessment.overallRiskScore).toBeLessThan(30);
    });

    it('should handle null content', async () => {
      const content = null as unknown as string;
      const advisorId = 'advisor-123' as AdvisorID;

      const result = await validateContentCompliance(content, advisorId);

      expect(result.status).toBe(ValidationStatus.APPROVED);
      expect(result.riskAssessment.overallRiskScore).toBeLessThan(30);
    });
  });
});
