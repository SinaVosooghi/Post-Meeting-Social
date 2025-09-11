/**
 * Compliance Engine
 * Post-Meeting Social Media Content Generator
 *
 * Implements FINRA/SEC compliance validation for financial advisor content
 * Aligned with ComplianceValidation and ComplianceResult interfaces
 */

import type {
  ComplianceValidation,
  ComplianceResult,
  ComplianceAuditEntry,
  RiskAssessment,
  ContentModifications,
  ApprovalWorkflow,
  ComplianceID,
  ContentID,
  AdvisorID,
  MeetingID,
} from '@/types/master-interfaces';
import { RiskLevel, ValidationType, ValidationStatus } from '@/types/master-interfaces';
import { authLogger as complianceLogger } from './logger';

// ============================================================================
// COMPLIANCE RULES & REGULATIONS
// ============================================================================

/**
 * FINRA compliance rules for social media content
 */
const FINRA_RULES = {
  // Rule 2210: Communications with the Public
  COMMUNICATIONS_WITH_PUBLIC: {
    id: 'FINRA_2210',
    description: 'Communications with the Public must be fair and balanced',
    keywords: ['guaranteed', 'guarantee', 'promise', 'assured', 'certain'],
    severity: 'high' as const,
  },

  // Rule 2211: Communications with the Public About Variable Life Insurance and Variable Annuities
  VARIABLE_INSURANCE: {
    id: 'FINRA_2211',
    description: 'Variable insurance communications must include required disclosures',
    keywords: ['variable annuity', 'variable life', 'insurance'],
    severity: 'high' as const,
  },

  // Rule 2212: Communications with the Public About Variable Life Insurance and Variable Annuities
  INVESTMENT_ADVICE: {
    id: 'FINRA_2212',
    description: 'Investment advice must include appropriate disclaimers',
    keywords: ['buy', 'sell', 'invest', 'recommend', 'suggest'],
    severity: 'critical' as const,
  },

  // Rule 2213: Communications with the Public About Variable Life Insurance and Variable Annuities
  PERFORMANCE_CLAIMS: {
    id: 'FINRA_2213',
    description: 'Performance claims must be substantiated and include disclaimers',
    keywords: ['return', 'performance', 'yield', 'gain', 'profit'],
    severity: 'high' as const,
  },

  // Rule 2214: Communications with the Public About Variable Life Insurance and Variable Annuities
  TESTIMONIALS: {
    id: 'FINRA_2214',
    description: 'Testimonials must include required disclosures',
    keywords: ['testimonial', 'review', 'client said', 'customer'],
    severity: 'medium' as const,
  },
};

/**
 * SEC compliance rules for social media content
 */
const SEC_RULES = {
  // Rule 17a-4: Records to be Preserved
  RECORD_KEEPING: {
    id: 'SEC_17a4',
    description: 'All communications must be properly recorded and preserved',
    keywords: ['record', 'preserve', 'maintain'],
    severity: 'high' as const,
  },

  // Rule 17a-3: Records to be Made
  RECORD_MAKING: {
    id: 'SEC_17a3',
    description: 'All communications must be properly recorded',
    keywords: ['record', 'document', 'log'],
    severity: 'high' as const,
  },

  // Rule 17a-8: Customer Account Information
  CUSTOMER_PRIVACY: {
    id: 'SEC_17a8',
    description: 'Customer information must be protected and not disclosed',
    keywords: ['client', 'customer', 'account', 'personal'],
    severity: 'critical' as const,
  },

  // Rule 17a-9: Customer Account Information
  CUSTOMER_CONSENT: {
    id: 'SEC_17a9',
    description: 'Customer consent required for certain communications',
    keywords: ['consent', 'permission', 'authorization'],
    severity: 'high' as const,
  },
};

/**
 * State regulation compliance rules
 */
const STATE_RULES = {
  // California Consumer Privacy Act
  CCPA: {
    id: 'STATE_CCPA',
    description: 'California Consumer Privacy Act compliance',
    keywords: ['california', 'ccpa', 'privacy'],
    severity: 'high' as const,
  },

  // New York State regulations
  NY_STATE: {
    id: 'STATE_NY',
    description: 'New York State financial regulations',
    keywords: ['new york', 'ny', 'state'],
    severity: 'medium' as const,
  },
};

// ============================================================================
// COMPLIANCE VALIDATION ENGINE
// ============================================================================

/**
 * Main compliance validation engine
 */
export class ComplianceEngine {
  private static instance: ComplianceEngine;

  static getInstance(): ComplianceEngine {
    if (!this.instance) {
      this.instance = new ComplianceEngine();
    }
    return this.instance;
  }

  /**
   * Validate content for compliance
   */
  async validateContent(
    content: string,
    advisorId: AdvisorID,
    meetingId?: MeetingID
  ): Promise<ComplianceValidation> {
    const validationId = this.generateComplianceId();
    const contentId = this.generateContentId();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    complianceLogger.info(`Starting compliance validation for content: ${contentId}`);

    // Run all compliance checks
    const finraCompliance = await this.validateFINRACompliance(content);
    const secCompliance = await this.validateSECCompliance(content);
    const firmPolicyCompliance = await this.validateFirmPolicyCompliance(content, advisorId);
    const clientPrivacyCompliance = await this.validateClientPrivacyCompliance(content);
    const stateRegulationCompliance = await this.validateStateRegulationCompliance(content);

    // Calculate overall risk assessment
    const riskAssessment = this.calculateRiskAssessment([
      finraCompliance,
      secCompliance,
      firmPolicyCompliance,
      clientPrivacyCompliance,
      stateRegulationCompliance,
    ]);

    // Determine overall validation status
    const status = this.determineValidationStatus([
      finraCompliance,
      secCompliance,
      firmPolicyCompliance,
      clientPrivacyCompliance,
      stateRegulationCompliance,
    ]);

    // Generate content modifications if needed
    const contentModifications = this.generateContentModifications(content, [
      finraCompliance,
      secCompliance,
      firmPolicyCompliance,
      clientPrivacyCompliance,
      stateRegulationCompliance,
    ]);

    // Create approval workflow
    const approvalWorkflow = this.createApprovalWorkflow(riskAssessment, status);

    // Create audit trail
    const auditTrail = this.createAuditTrail(validationId, 'created', 'system');

    const validation: ComplianceValidation = {
      id: validationId,
      contentId,
      advisorId,
      meetingId,
      validationType: ValidationType.PRE_PUBLICATION,
      status,
      complianceChecks: {
        finraCompliance,
        secCompliance,
        firmPolicyCompliance,
        clientPrivacyCompliance,
        stateRegulationCompliance,
      },
      riskAssessment,
      contentModifications,
      approvalWorkflow,
      auditTrail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    complianceLogger.info(`Compliance validation completed: ${validationId}, Status: ${status}`);

    return validation;
  }

  /**
   * Validate FINRA compliance
   */
  private async validateFINRACompliance(content: string): Promise<ComplianceResult> {
    const issues: string[] = [];
    const ruleViolations: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check each FINRA rule
    for (const [, rule] of Object.entries(FINRA_RULES)) {
      const hasViolation = rule.keywords.some(keyword =>
        content?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasViolation) {
        issues.push(rule.description);
        ruleViolations.push(rule.id);
        recommendations.push(`Review content for ${rule.description.toLowerCase()}`);

        if (rule.severity === 'critical') {
          severity = 'critical';
        } else if (rule.severity === 'high' && severity !== 'critical') {
          severity = 'high';
        } else if (rule.severity === 'medium' && severity === 'low') {
          severity = 'medium';
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity,
      recommendations,
      ruleViolations,
      requiredActions: issues.length > 0 ? ['Review and address compliance issues'] : [],
    };
  }

  /**
   * Validate SEC compliance
   */
  private async validateSECCompliance(content: string): Promise<ComplianceResult> {
    const issues: string[] = [];
    const ruleViolations: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check each SEC rule
    for (const [, rule] of Object.entries(SEC_RULES)) {
      const hasViolation = rule.keywords.some(keyword =>
        content?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasViolation) {
        issues.push(rule.description);
        ruleViolations.push(rule.id);
        recommendations.push(`Review content for ${rule.description.toLowerCase()}`);

        if (rule.severity === 'critical') {
          severity = 'critical';
        } else if (rule.severity === 'high' && severity !== 'critical') {
          severity = 'high';
        } else if (rule.severity === 'medium' && severity === 'low') {
          severity = 'medium';
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity,
      recommendations,
      ruleViolations,
      requiredActions: issues.length > 0 ? ['Review and address compliance issues'] : [],
    };
  }

  /**
   * Validate firm policy compliance
   */
  private async validateFirmPolicyCompliance(
    _content: string,
    _advisorId: AdvisorID
  ): Promise<ComplianceResult> {
    // TODO: Implement firm-specific policy validation
    // This would typically check against the advisor's firm policies

    return {
      passed: true,
      issues: [],
      severity: 'low',
      recommendations: [],
      ruleViolations: [],
      requiredActions: [],
    };
  }

  /**
   * Validate client privacy compliance
   */
  private async validateClientPrivacyCompliance(content: string): Promise<ComplianceResult> {
    const issues: string[] = [];
    const ruleViolations: string[] = [];
    const recommendations: string[] = [];

    // Check for client names (basic pattern matching)
    const clientNamePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const clientNames = content?.match(clientNamePattern);

    if (clientNames && clientNames.length > 0) {
      issues.push('Content may contain client names');
      ruleViolations.push('CLIENT_PRIVACY_001');
      recommendations.push('Remove or anonymize client names before publishing');
    }

    // Check for sensitive financial information
    const sensitivePatterns = [
      /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{9}\b/g, // SSN without dashes
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        issues.push('Content may contain sensitive financial information');
        ruleViolations.push('CLIENT_PRIVACY_002');
        recommendations.push('Remove sensitive financial information before publishing');
        break;
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: issues.length > 0 ? 'critical' : 'low',
      recommendations,
      ruleViolations,
    };
  }

  /**
   * Validate state regulation compliance
   */
  private async validateStateRegulationCompliance(content: string): Promise<ComplianceResult> {
    const issues: string[] = [];
    const ruleViolations: string[] = [];
    const recommendations: string[] = [];

    // Check each state rule
    for (const [, rule] of Object.entries(STATE_RULES)) {
      const hasViolation = rule.keywords.some(keyword =>
        content?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasViolation) {
        issues.push(rule.description);
        ruleViolations.push(rule.id);
        recommendations.push(`Review content for ${rule.description.toLowerCase()}`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      severity: issues.length > 0 ? 'medium' : 'low',
      recommendations,
      ruleViolations,
    };
  }

  /**
   * Calculate overall risk assessment
   */
  private calculateRiskAssessment(complianceResults: ComplianceResult[]): RiskAssessment {
    const criticalIssues = complianceResults.filter(r => r.severity === 'critical').length;
    const highIssues = complianceResults.filter(r => r.severity === 'high').length;
    const mediumIssues = complianceResults.filter(r => r.severity === 'medium').length;
    const lowIssues = complianceResults.filter(r => r.severity === 'low').length;

    let riskLevel: RiskLevel;
    if (criticalIssues > 0) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (highIssues > 0) {
      riskLevel = RiskLevel.HIGH;
    } else if (mediumIssues > 0) {
      riskLevel = RiskLevel.MEDIUM;
    } else {
      riskLevel = RiskLevel.LOW;
    }

    const riskScore = Math.min(
      100,
      criticalIssues * 40 + highIssues * 25 + mediumIssues * 15 + lowIssues * 5
    );

    return {
      overallRiskScore: riskScore,
      riskFactors: complianceResults.filter(r => !r.passed).flatMap(r => r.issues),
      mitigationRequired: riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH,
    };
  }

  /**
   * Determine overall validation status
   */
  private determineValidationStatus(complianceResults: ComplianceResult[]): ValidationStatus {
    const criticalIssues = complianceResults.filter(r => r.severity === 'critical').length;
    const highIssues = complianceResults.filter(r => r.severity === 'high').length;
    const failedChecks = complianceResults.filter(r => !r.passed).length;

    if (criticalIssues > 0) {
      return ValidationStatus.REJECTED;
    } else if (highIssues > 0 || failedChecks > 2) {
      return ValidationStatus.REQUIRES_MODIFICATION;
    } else if (failedChecks > 0) {
      return ValidationStatus.PENDING;
    } else {
      return ValidationStatus.APPROVED;
    }
  }

  /**
   * Generate content modifications
   */
  private generateContentModifications(
    content: string,
    complianceResults: ComplianceResult[]
  ): ContentModifications {
    const modifications: string[] = [];
    const disclaimers: string[] = [];
    const requiredChanges: string[] = [];

    // Add disclaimers based on compliance issues
    const hasInvestmentAdvice = complianceResults.some(r =>
      r.ruleViolations.includes('FINRA_2212')
    );

    if (hasInvestmentAdvice) {
      disclaimers.push(
        'This is not investment advice. Please consult with a qualified financial advisor.'
      );
    }

    const hasPerformanceClaims = complianceResults.some(r =>
      r.ruleViolations.includes('FINRA_2213')
    );

    if (hasPerformanceClaims) {
      disclaimers.push('Past performance does not guarantee future results.');
    }

    // Add required changes based on compliance issues
    const hasClientNames = complianceResults.some(r =>
      r.ruleViolations.includes('CLIENT_PRIVACY_001')
    );

    if (hasClientNames) {
      requiredChanges.push('Remove or anonymize client names');
    }

    const hasSensitiveInfo = complianceResults.some(r =>
      r.ruleViolations.includes('CLIENT_PRIVACY_002')
    );

    if (hasSensitiveInfo) {
      requiredChanges.push('Remove sensitive financial information');
    }

    return {
      originalContent: content,
      modifiedContent: content, // TODO: Implement content modification suggestions
      injectedDisclaimers: disclaimers,
      removedContent: requiredChanges,
      addedWarnings: modifications,
    };
  }

  /**
   * Create approval workflow
   */
  private createApprovalWorkflow(
    riskAssessment: RiskAssessment,
    status: ValidationStatus
  ): ApprovalWorkflow {
    const requiresApproval =
      riskAssessment.overallRiskScore > 70 || status === ValidationStatus.REQUIRES_MODIFICATION;

    return {
      approvedBy: undefined,
      approvedAt: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
      escalatedTo: requiresApproval ? 'compliance-team' : undefined,
      escalationReason: requiresApproval ? 'High risk content requires review' : undefined,
    };
  }

  /**
   * Create audit trail entry
   */
  private createAuditTrail(
    validationId: ComplianceID,
    action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'modified' | 'escalated',
    performedBy: string
  ): ComplianceAuditEntry[] {
    return [
      {
        id: `audit-${Date.now()}`,
        action,
        performedBy,
        performedAt: new Date().toISOString(),
        details: `Compliance validation ${action}`,
      },
    ];
  }

  /**
   * Generate compliance ID
   */
  private generateComplianceId(): ComplianceID {
    return `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ComplianceID;
  }

  /**
   * Generate content ID
   */
  private generateContentId(): ContentID {
    return `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ContentID;
  }
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Validate content for compliance (main entry point)
 */
export async function validateContentCompliance(
  content: string,
  advisorId: AdvisorID,
  meetingId?: MeetingID
): Promise<ComplianceValidation> {
  const engine = ComplianceEngine.getInstance();
  return engine.validateContent(content, advisorId, meetingId);
}

/**
 * Quick compliance check for basic validation
 */
export function quickComplianceCheck(content: string): {
  isCompliant: boolean;
  issues: string[];
  riskLevel: RiskLevel;
} {
  const issues: string[] = [];
  let riskLevel: RiskLevel = RiskLevel.LOW;

  // Check for investment advice
  const investmentKeywords = ['buy', 'sell', 'invest', 'recommend', 'suggest'];
  const hasInvestmentAdvice = investmentKeywords.some(keyword =>
    content?.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasInvestmentAdvice) {
    issues.push('Content may contain investment advice');
    riskLevel = RiskLevel.HIGH;
  }

  // Check for client names
  const clientNamePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const hasClientNames = clientNamePattern.test(content || '');

  if (hasClientNames) {
    issues.push('Content may contain client names');
    riskLevel = RiskLevel.CRITICAL;
  }

  // Check for performance claims
  const performanceKeywords = ['return', 'performance', 'yield', 'gain', 'profit'];
  const hasPerformanceClaims = performanceKeywords.some(keyword =>
    content?.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasPerformanceClaims) {
    issues.push('Content may contain performance claims');
    if (riskLevel === RiskLevel.LOW) {
      riskLevel = RiskLevel.MEDIUM;
    }
  }

  // Check for guarantee language
  const guaranteeKeywords = ['guarantee', 'guaranteed', 'promise', 'assure', 'certain'];
  const hasGuaranteeLanguage = guaranteeKeywords.some(keyword =>
    content?.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasGuaranteeLanguage) {
    issues.push('Content may contain guarantee language');
    if (riskLevel === RiskLevel.LOW) {
      riskLevel = RiskLevel.HIGH;
    }
  }

  return {
    isCompliant: issues.length === 0,
    issues,
    riskLevel,
  };
}

/**
 * Generate compliance disclaimers
 */
export function generateComplianceDisclaimers(content: string): string[] {
  const disclaimers: string[] = [];

  // Check for investment advice
  const investmentKeywords = ['buy', 'sell', 'invest', 'recommend', 'suggest'];
  const hasInvestmentAdvice = investmentKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasInvestmentAdvice) {
    disclaimers.push(
      'This is not investment advice. Please consult with a qualified financial advisor.'
    );
  }

  // Check for performance claims
  const performanceKeywords = ['return', 'performance', 'yield', 'gain', 'profit'];
  const hasPerformanceClaims = performanceKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasPerformanceClaims) {
    disclaimers.push('Past performance does not guarantee future results.');
  }

  // Check for guarantees
  const guaranteeKeywords = ['guaranteed', 'guarantee', 'promise', 'assured', 'certain'];
  const hasGuarantees = guaranteeKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasGuarantees) {
    disclaimers.push('No investment is guaranteed. All investments carry risk.');
  }

  return disclaimers;
}
