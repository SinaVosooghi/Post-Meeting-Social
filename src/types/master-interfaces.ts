/**
 * 🏗️ MASTER INTERFACES - Post-Meeting Social Media Generator
 *
 * Single source of truth for ALL type definitions.
 * Aligned with MASTER_ARCHITECTURE.md and INTERFACE_ARCHITECTURE_MAPPING.md
 *
 * 🎯 Cursor AI Context:
 * - All types are here, organized by domain
 * - Use these for all implementation
 * - Reference architecture docs for business context
 *
 * 🔄 Elixir Migration Ready:
 * - Types map 1:1 to Phoenix Contexts
 * - See INTERFACE_ARCHITECTURE_MAPPING.md for details
 *
 * 📁 Structure:
 * 0. Foundation Types (Branded IDs, Utilities, Results)
 * 1. Financial Advisory Domain
 * 2. Meeting & Recording Domain
 * 3. AI Content & Publishing Domain
 * 4. Compliance Domain
 * 5. Infrastructure & Operations
 * 6. External API Facades
 * 7. Enums & Constants
 * 8. UI Component Types
 * 9. Utility & Library Types
 * 10. Type Guards & Utilities
 * 11. Deprecations (Temporary aliases)
 */

import type { Session } from 'next-auth';

// ============================================================================
// 0. FOUNDATION TYPES (Branded IDs, Utilities, Results)
// ============================================================================

/**
 * Branded type for additional type safety
 */
export type Branded<T, B extends string> = T & { __brand: B };

/**
 * Core ID types with branding to prevent mixing
 */
export type ID = Branded<string, 'id'>;
export type AdvisorID = Branded<ID, 'advisor'>;
export type MeetingID = Branded<ID, 'meeting'>;
export type ContentID = Branded<ID, 'content'>;
export type ComplianceID = Branded<ID, 'compliance'>;
export type UserID = Branded<ID, 'user'>;
export type BotID = Branded<ID, 'bot'>;
export type PostID = Branded<ID, 'post'>;

/**
 * Common type aliases
 */
export type ISODate = string; // 2025-09-05T19:00:00.000Z
export type NonEmptyString = string & { __nonEmpty: true };
export type Json = unknown;

/**
 * Result pattern for better error handling
 */
export type Ok<T> = { ok: true; value: T };
export type Err<E extends string = string> = { ok: false; error: E; cause?: unknown };
export type Result<T, E extends string = string> = Ok<T> | Err<E>;

// ============================================================================
// 1. FINANCIAL ADVISORY DOMAIN
// ============================================================================

/**
 * Financial Advisor with compliance settings and regulatory context
 * Maps to: Financial Advisory Domain section in MASTER_ARCHITECTURE.md
 */
export interface FinancialAdvisor {
  readonly id: AdvisorID;
  readonly userId: UserID;
  readonly firmName: NonEmptyString;
  readonly licenseNumbers: {
    readonly series7?: string;
    readonly series66?: string;
    readonly stateRegistrations: readonly string[];
    readonly crd?: string; // Central Registration Depository
  };
  readonly complianceSettings: ComplianceSettings;
  readonly regulatoryRequirements: RegulatoryRequirements;
  readonly firmSettings: FirmSettings;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Compliance settings for financial advisors
 */
export interface ComplianceSettings {
  readonly riskToleranceThreshold: 'low' | 'medium' | 'high';
  readonly requiredDisclosures: readonly string[];
  readonly approvedHashtags: readonly string[];
  readonly restrictedTopics: readonly string[];
  readonly autoApprovalThreshold: number; // 0-100
  readonly contentReviewRequired: boolean;
  readonly supervisorApprovalRequired: boolean;
}

/**
 * Regulatory requirements for financial advisors
 */
export interface RegulatoryRequirements {
  readonly finraRegistered: boolean;
  readonly secRegistered: boolean;
  readonly stateRequirements: readonly string[];
  readonly recordKeepingPeriod: number; // in years
  readonly complianceOfficer?: string;
  readonly lastComplianceReview: ISODate;
}

/**
 * Firm settings and context
 */
export interface FirmSettings {
  readonly firmType: 'ria' | 'broker_dealer' | 'hybrid' | 'bank';
  readonly aum: number; // Assets under management
  readonly clientCount: number;
  readonly complianceFramework: 'finra' | 'sec' | 'state' | 'multiple';
}

// ============================================================================
// 2. MEETING & RECORDING DOMAIN
// ============================================================================

/**
 * Enhanced client meeting with regulatory context and privacy controls
 * Maps to: Meeting Management + Compliance Layer in architecture
 */
export interface ClientMeeting {
  readonly id: MeetingID;
  readonly advisorId: AdvisorID;
  readonly calendarEventId: string;
  readonly title: NonEmptyString;
  readonly description: string | null;
  readonly startTime: ISODate;
  readonly endTime: ISODate;
  readonly meetingUrl: string;
  readonly platform: MeetingPlatform;
  readonly clientRelationship: ClientRelationship;
  readonly complianceFlags: ComplianceFlags;
  readonly recordingDetails: RecordingDetails;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Client relationship context for meetings
 */
export interface ClientRelationship {
  readonly clientId: string;
  readonly relationshipType: 'prospect' | 'client' | 'former_client';
  readonly riskProfile: 'conservative' | 'moderate' | 'aggressive';
  readonly investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  readonly regulatoryStatus: 'retail' | 'accredited' | 'institutional';
  readonly communicationPreferences: CommunicationPreferences;
}

/**
 * Communication preferences for clients
 */
export interface CommunicationPreferences {
  readonly allowSocialMedia: boolean;
  readonly privacyLevel: 'public' | 'connections_only' | 'private';
  readonly consentToRecord: boolean;
  readonly dataRetentionConsent: boolean;
  readonly preferredContactMethod: 'email' | 'phone' | 'text' | 'portal';
}

/**
 * Compliance flags for content generation
 */
export interface ComplianceFlags {
  readonly containsSensitiveData: boolean;
  readonly requiresLegalReview: boolean;
  readonly hasInvestmentAdvice: boolean;
  readonly needsDisclaimer: boolean;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly topicsDiscussed: readonly string[];
}

/**
 * Recording and transcription details
 */
export interface RecordingDetails {
  readonly botId: BotID | null;
  readonly recordingStatus: RecordingStatus;
  readonly transcriptStatus: TranscriptStatus;
  readonly transcript: string | null;
  readonly recordingUrl: string | null;
  readonly transcriptUrl: string | null;
  readonly duration: number | null; // in seconds
  readonly participantCount: number | null;
}

/**
 * Enhanced Recall.ai bot with comprehensive tracking
 * Maps to: Recording & Transcription in MASTER_ARCHITECTURE.md
 */
export interface RecallBot {
  readonly id: BotID;
  readonly externalBotId: string; // Recall.ai bot ID
  readonly meetingId: MeetingID;
  readonly meetingUrl: string;
  readonly status: BotStatus;
  readonly config: BotConfiguration;
  readonly scheduledAt: ISODate;
  readonly joinedAt: ISODate | null;
  readonly startedRecordingAt: ISODate | null;
  readonly endedAt: ISODate | null;
  readonly outputs: BotOutputs;
  readonly meetingPlatform: MeetingPlatformType;
  readonly errors: readonly BotError[];
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Bot configuration for meeting recording
 */
export interface BotConfiguration {
  readonly botName: string;
  readonly recordAudio: boolean;
  readonly recordVideo: boolean;
  readonly recordScreen: boolean;
  readonly transcriptionEnabled: boolean;
  readonly realTimeTranscription: boolean;
  readonly webhookUrl: string | null;
  readonly joinMinutesBefore: number;
  readonly autoLeaveAfterMinutes?: number;
  readonly customInstructions?: string;
}

/**
 * Bot configuration type alias for backward compatibility
 */
export type BotConfig = BotConfiguration;

/**
 * Bot recording outputs
 */
export interface BotOutputs {
  readonly recordingUrl: string | null;
  readonly transcriptUrl: string | null;
  readonly summaryUrl: string | null;
  readonly participantCount: number | null;
  readonly recordingSize: number | null; // in bytes
  readonly transcriptWordCount: number | null;
}

/**
 * Bot error tracking for resilience
 */
export interface BotError {
  readonly id: string;
  readonly errorType:
    | 'join_failed'
    | 'recording_failed'
    | 'transcription_failed'
    | 'network_error'
    | 'auth_error';
  readonly errorMessage: string;
  readonly errorCode?: string;
  readonly occurredAt: ISODate;
  readonly resolved: boolean;
  readonly resolution?: string;
}

/**
 * Comprehensive meeting transcript with AI processing
 * Maps to: AI Content Generation in MASTER_ARCHITECTURE.md
 */
export interface MeetingTranscript {
  readonly id: string;
  readonly botId: BotID;
  readonly meetingId: MeetingID;
  readonly advisorId: AdvisorID;
  readonly rawTranscript: string;
  readonly processedTranscript: string;
  readonly confidence: number; // 0-1
  readonly language: string;
  readonly duration: number; // in seconds
  readonly wordCount: number;
  readonly speakers: readonly TranscriptSpeaker[];
  readonly segments: readonly TranscriptSegment[];
  readonly speakerCount: number;
  readonly aiAnalysis: AIAnalysis;
  readonly contentGenerationReady: boolean;
  readonly compliancePreCheck: CompliancePreCheck;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * AI analysis of meeting transcript
 */
export interface AIAnalysis {
  readonly summary: string;
  readonly keyPoints: readonly string[];
  readonly actionItems: readonly string[];
  readonly decisions: readonly string[];
  readonly nextSteps: readonly string[];
  readonly sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  readonly topics: readonly string[];
  readonly riskFlags: readonly string[];
}

/**
 * Compliance pre-check for content generation
 */
export interface CompliancePreCheck {
  readonly sensitiveDataDetected: boolean;
  readonly investmentAdviceDetected: boolean;
  readonly clientNamesDetected: readonly string[];
  readonly riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Transcript speaker with role identification
 */
export interface TranscriptSpeaker {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly role: 'advisor' | 'client' | 'prospect' | 'colleague' | 'unknown';
  readonly speakingTime: number; // in seconds
  readonly wordCount: number;
  readonly confidence: number; // 0-1
}

/**
 * Individual transcript segment with timing and confidence
 */
export interface TranscriptSegment {
  readonly id: string;
  readonly speaker: string;
  readonly speakerRole: 'advisor' | 'client' | 'prospect' | 'colleague' | 'unknown';
  readonly text: string;
  readonly startTime: number; // in seconds
  readonly endTime: number; // in seconds
  readonly confidence: number; // 0-1
  readonly isRedacted: boolean; // If PII was removed
  readonly originalText?: string; // Before redaction
}

// ============================================================================
// 3. AI CONTENT & PUBLISHING DOMAIN
// ============================================================================

/**
 * Enhanced AI content generation request with compliance context
 * Maps to: AI Content Generation in MASTER_ARCHITECTURE.md
 */
export interface GenerateContentRequest {
  readonly transcriptId: string;
  readonly advisorId: AdvisorID;
  readonly meetingContext: MeetingContext;
  readonly contentSettings: ContentSettings;
  readonly complianceRequirements: ComplianceRequirements;
  readonly automationSettings: AutomationSettings;
}

/**
 * Meeting context for content generation
 */
export interface MeetingContext {
  readonly meetingId: MeetingID;
  readonly meetingTitle: string;
  readonly attendees: readonly string[];
  readonly duration: number;
  readonly platform: MeetingPlatform;
  readonly clientContext?: ClientContext;
}

/**
 * Content generation settings
 */
export interface ContentSettings {
  readonly platforms: readonly SocialPlatform[];
  readonly maxPosts: number;
  readonly tone: ContentTone;
  readonly length: ContentLength;
  readonly includeHashtags: boolean;
  readonly includeEmojis: boolean;
  readonly includeCallToAction: boolean;
}

/**
 * Compliance requirements for content generation
 */
export interface ComplianceRequirements {
  readonly requireDisclaimers: boolean;
  readonly riskTolerance: 'low' | 'medium' | 'high';
  readonly restrictedTopics: readonly string[];
  readonly requiredDisclosures: readonly string[];
  readonly clientPrivacyLevel: 'public' | 'connections_only' | 'private';
}

/**
 * Automation settings for content generation
 */
export interface AutomationSettings {
  readonly autoPublish: boolean;
  readonly scheduleDelay: number; // in minutes
  readonly requireApproval: boolean;
  readonly notifyOnGeneration: boolean;
}

/**
 * AI-generated content with compliance validation
 * Maps to: Generated content with compliance checking
 */
export interface GeneratedContent {
  readonly id: ContentID;
  readonly requestId: string;
  readonly advisorId: AdvisorID;
  readonly meetingId: MeetingID;
  readonly platform: SocialPlatform;
  readonly content: ContentDetails;
  readonly aiMetadata: AIMetadata;
  readonly complianceStatus: ComplianceStatus;
  readonly publishingStatus: PublishingStatus;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Content details for generated posts
 */
export interface ContentDetails {
  readonly originalContent: string;
  readonly finalContent: string;
  readonly hashtags: readonly string[];
  readonly mentions: readonly string[];
  readonly callToAction?: string;
  readonly mediaRecommendations: readonly MediaRecommendation[];
}

/**
 * AI generation metadata
 */
export interface AIMetadata {
  readonly model: string;
  readonly promptVersion: string;
  readonly tokensUsed: number;
  readonly processingTimeMs: number;
  readonly confidence: number; // 0-1
  readonly reasoning: string;
  readonly alternatives: readonly string[];
}

/**
 * Media recommendation for social posts
 */
export interface MediaRecommendation {
  readonly type: 'image' | 'video' | 'document' | 'infographic';
  readonly description: string;
  readonly suggestedContent: string;
  readonly dimensions?: { width: number; height: number };
  readonly stockPhotoQuery?: string;
}

/**
 * Client context for content generation
 */
export interface ClientContext {
  readonly clientId: string;
  readonly relationshipType: 'prospect' | 'client' | 'former_client';
  readonly privacySettings: PrivacySettings;
  readonly communicationPreferences: CommunicationPreferences;
}

/**
 * Privacy settings for clients
 */
export interface PrivacySettings {
  readonly allowPublicMention: boolean;
  readonly allowSocialMediaReference: boolean;
  readonly requiresAnonymization: boolean;
}

/**
 * Enhanced social media publishing with compliance integration
 * Maps to: Social Media Publishing Architecture in MASTER_ARCHITECTURE.md
 */
export interface SocialMediaPost {
  readonly id: PostID;
  readonly meetingId: MeetingID;
  readonly advisorId: AdvisorID;
  readonly platform: SocialPlatform;
  readonly contentType: ContentType;
  readonly content: PostContent;
  readonly publishingDetails: PublishingDetails;
  readonly complianceValidationId: ComplianceID;
  readonly publishingAttempts: readonly PublishingAttempt[];
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Post content details
 */
export interface PostContent {
  readonly originalContent: string;
  readonly finalContent: string;
  readonly hashtags: readonly string[];
  readonly mentions: readonly string[];
  readonly mediaUrls: readonly string[];
  readonly linkPreview?: LinkPreview;
}

/**
 * Publishing details for social posts
 */
export interface PublishingDetails {
  readonly status: PublishingStatus;
  readonly scheduledFor?: ISODate;
  readonly publishedAt?: ISODate;
  readonly platformPostId?: string;
  readonly impressions?: number;
  readonly engagement?: SocialEngagement;
  readonly reach?: number;
}

/**
 * Social media engagement metrics
 */
export interface SocialEngagement {
  readonly likes: number;
  readonly comments: number;
  readonly shares: number;
  readonly clicks: number;
  readonly saves?: number; // LinkedIn specific
  readonly reactions?: Record<string, number>; // Facebook specific
}

/**
 * Link preview for social posts
 */
export interface LinkPreview {
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl?: string;
  readonly siteName?: string;
}

/**
 * Publishing attempt tracking for error handling
 */
export interface PublishingAttempt {
  readonly id: string;
  readonly attemptNumber: number;
  readonly attemptedAt: ISODate;
  readonly status: 'success' | 'failed' | 'rate_limited' | 'auth_error' | 'content_rejected';
  readonly responseData?: Record<string, unknown>;
  readonly errorMessage?: string;
  readonly retryAfter?: ISODate;
}

/**
 * Social media platform OAuth token management
 * Maps to: OAuth Flow & Token Management in architecture
 */
export interface SocialMediaToken {
  readonly id: string;
  readonly userId: UserID;
  readonly platform: SocialPlatform;
  readonly tokenType: 'access' | 'refresh' | 'page_access';
  readonly encryptedToken: string;
  readonly tokenScope: readonly string[];
  readonly expiresAt: ISODate;
  readonly refreshToken?: string;
  readonly refreshExpiresAt?: ISODate;
  readonly platformDetails: PlatformDetails;
  readonly healthStatus: 'healthy' | 'expiring_soon' | 'expired' | 'revoked' | 'error';
  readonly lastValidated: ISODate;
  readonly lastRefreshed?: ISODate;
  readonly refreshCount: number;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Platform-specific details for OAuth tokens
 */
export interface PlatformDetails {
  readonly userId?: string;
  readonly username?: string;
  readonly pageId?: string; // For Facebook pages
  readonly pageName?: string;
  readonly permissions: readonly string[];
}

// ============================================================================
// 4. COMPLIANCE DOMAIN
// ============================================================================

/**
 * Comprehensive compliance validation with audit trail
 * Maps to: Compliance Engine in MASTER_ARCHITECTURE.md
 */
export interface ComplianceValidation {
  readonly id: ComplianceID;
  readonly contentId: ContentID;
  readonly advisorId: AdvisorID;
  readonly meetingId?: MeetingID;
  readonly validationType: ValidationType;
  readonly status: ValidationStatus;
  readonly complianceChecks: ComplianceChecks;
  readonly riskAssessment: RiskAssessment;
  readonly contentModifications: ContentModifications;
  readonly approvalWorkflow: ApprovalWorkflow;
  readonly auditTrail: readonly ComplianceAuditEntry[];
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Individual compliance check result
 */
export interface ComplianceResult {
  readonly passed: boolean;
  readonly issues: readonly string[];
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recommendations: readonly string[];
  readonly ruleViolations: readonly string[];
  readonly requiredActions: readonly string[];
}

/**
 * Compliance audit trail entry
 */
export interface ComplianceAuditEntry {
  readonly id: string;
  readonly action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'modified' | 'escalated';
  readonly performedBy: string;
  readonly performedAt: ISODate;
  readonly details: string;
  readonly previousState?: string;
  readonly newState?: string;
  readonly reason?: string;
}

/**
 * Comprehensive compliance checks
 */
export interface ComplianceChecks {
  readonly finraCompliance: ComplianceResult;
  readonly secCompliance: ComplianceResult;
  readonly firmPolicyCompliance: ComplianceResult;
  readonly clientPrivacyCompliance: ComplianceResult;
  readonly stateRegulationCompliance: ComplianceResult;
}

/**
 * Risk assessment for compliance
 */
export interface RiskAssessment {
  readonly overallRiskScore: number; // 0-100
  readonly riskFactors: readonly string[];
  readonly mitigationRequired: boolean;
  readonly reviewerComments?: string;
}

/**
 * Content modifications for compliance
 */
export interface ContentModifications {
  readonly originalContent: string;
  readonly modifiedContent?: string;
  readonly injectedDisclaimers: readonly string[];
  readonly removedContent: readonly string[];
  readonly addedWarnings: readonly string[];
}

/**
 * Approval workflow for compliance
 */
export interface ApprovalWorkflow {
  readonly approvedBy?: string;
  readonly approvedAt?: ISODate;
  readonly reviewedBy?: string;
  readonly reviewedAt?: ISODate;
  readonly escalatedTo?: string;
  readonly escalationReason?: string;
}

// ============================================================================
// 5. INFRASTRUCTURE & OPERATIONS
// ============================================================================

/**
 * Job queue system for async processing
 * Maps to: Async Processing & Reliability in MASTER_ARCHITECTURE.md
 */
export interface JobDefinition {
  readonly id: ID;
  readonly type: JobType;
  readonly priority: JobPriority;
  readonly payload: JobPayload;
  readonly scheduledFor: ISODate;
  readonly delay: number; // in milliseconds
  readonly maxAttempts: number;
  readonly backoffStrategy: 'fixed' | 'exponential' | 'linear';
  readonly status: JobStatus;
  readonly attempts: readonly JobAttempt[];
  readonly currentAttempt: number;
  readonly lastAttemptAt?: ISODate;
  readonly completedAt?: ISODate;
  readonly dependsOn: readonly string[]; // Other job IDs
  readonly tags: readonly string[];
  readonly userId: UserID;
  readonly advisorId?: AdvisorID;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Job attempt tracking for retry logic
 */
export interface JobAttempt {
  readonly attemptNumber: number;
  readonly startedAt: ISODate;
  readonly completedAt?: ISODate;
  readonly status: 'running' | 'completed' | 'failed';
  readonly errorMessage?: string;
  readonly errorStack?: string;
  readonly processingTimeMs?: number;
  readonly retryAfter?: ISODate;
}

/**
 * Job payload types for different job categories
 */
export type JobPayload =
  | BotSchedulingPayload
  | ContentGenerationPayload
  | ComplianceValidationPayload
  | SocialPublishingPayload
  | EmailGenerationPayload;

export interface BotSchedulingPayload {
  readonly type: 'bot_scheduling';
  readonly meetingId: MeetingID;
  readonly meetingUrl: string;
  readonly scheduledTime: ISODate;
  readonly botConfig: BotConfiguration;
}

export interface ContentGenerationPayload {
  readonly type: 'content_generation';
  readonly transcriptId: string;
  readonly advisorId: AdvisorID;
  readonly contentSettings: ContentSettings;
  readonly complianceRequirements: ComplianceRequirements;
}

export interface ComplianceValidationPayload {
  readonly type: 'compliance_validation';
  readonly contentId: ContentID;
  readonly advisorId: AdvisorID;
  readonly validationType: 'pre_publication' | 'post_publication' | 'audit';
  readonly urgency: 'low' | 'normal' | 'high';
}

export interface SocialPublishingPayload {
  readonly type: 'social_publishing';
  readonly contentId: ContentID;
  readonly platform: SocialPlatform;
  readonly scheduledFor?: ISODate;
  readonly retryConfig: RetryConfiguration;
}

export interface EmailGenerationPayload {
  readonly type: 'email_generation';
  readonly transcriptId: string;
  readonly templateType: 'follow_up' | 'summary' | 'action_items' | 'thank_you';
  readonly recipients: readonly string[];
}

/**
 * Retry configuration for resilient operations
 */
export interface RetryConfiguration {
  readonly maxAttempts: number;
  readonly backoffStrategy: 'fixed' | 'exponential' | 'linear';
  readonly initialDelay: number; // in milliseconds
  readonly maxDelay: number; // in milliseconds
  readonly jitter: boolean;
  readonly retryableErrors: readonly string[];
}

/**
 * System health monitoring for all services
 * Maps to: Monitoring & Alerting in MASTER_ARCHITECTURE.md
 */
export interface SystemHealth {
  readonly timestamp: ISODate;
  readonly overallStatus: HealthStatus;
  readonly services: readonly ServiceHealth[];
  readonly metrics: SystemMetrics;
  readonly alerts: readonly SystemAlert[];
}

/**
 * Individual service health status
 */
export interface ServiceHealth {
  readonly service:
    | 'database'
    | 'redis'
    | 'openai'
    | 'recall_ai'
    | 'google_calendar'
    | 'linkedin'
    | 'facebook';
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  readonly responseTime: number; // in milliseconds
  readonly uptime: number; // percentage
  readonly lastChecked: ISODate;
  readonly errorRate: number; // percentage
  readonly details: {
    readonly apiQuotaRemaining?: number;
    readonly connectionPoolSize?: number;
    readonly queueDepth?: number;
    readonly cacheHitRate?: number;
  };
}

/**
 * System-wide metrics and KPIs
 */
export interface SystemMetrics {
  readonly activeUsers: number;
  readonly activeMeetings: number;
  readonly pendingJobs: number;
  readonly completedJobsToday: number;
  readonly failedJobsToday: number;
  readonly averageProcessingTime: number; // in milliseconds
  readonly apiCallsToday: {
    readonly openai: number;
    readonly recallAi: number;
    readonly googleCalendar: number;
    readonly linkedin: number;
    readonly facebook: number;
  };
  readonly complianceStats: {
    readonly postsValidatedToday: number;
    readonly autoApprovedToday: number;
    readonly manualReviewRequired: number;
    readonly complianceViolations: number;
  };
}

/**
 * System alerts and notifications
 */
export interface SystemAlert {
  readonly id: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly category: 'performance' | 'security' | 'compliance' | 'integration' | 'system';
  readonly message: string;
  readonly details: string;
  readonly service?: string;
  readonly userId?: UserID;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: ISODate;
  readonly resolvedAt?: ISODate;
  readonly createdAt: ISODate;
}

/**
 * Enhanced user settings with financial advisor context
 */
export interface UserSettings {
  readonly id: string;
  readonly userId: UserID;
  readonly advisorId: AdvisorID;
  readonly botSettings: BotSettings;
  readonly contentPreferences: ContentPreferences;
  readonly complianceSettings: ComplianceSettings;
  readonly notificationSettings: NotificationSettings;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Bot and automation settings
 */
export interface BotSettings {
  readonly defaultJoinMinutesBefore: number;
  readonly autoScheduleBots: boolean;
  readonly enableRecording: boolean;
  readonly enableTranscription: boolean;
  readonly autoGenerateContent: boolean;
  readonly autoPublishContent: boolean;
}

/**
 * Content generation preferences
 */
export interface ContentPreferences {
  readonly defaultTone: ContentTone;
  readonly defaultLength: ContentLength;
  readonly includeHashtagsByDefault: boolean;
  readonly includeEmojisByDefault: boolean;
  readonly preferredPlatforms: readonly SocialPlatform[];
  readonly customPromptTemplate?: string;
}

/**
 * Notification preferences
 */
export interface NotificationSettings {
  readonly emailNotifications: boolean;
  readonly smsNotifications: boolean;
  readonly inAppNotifications: boolean;
  readonly notificationTypes: readonly NotificationType[];
  readonly quietHours: {
    readonly enabled: boolean;
    readonly startTime: string; // HH:MM format
    readonly endTime: string;
    readonly timeZone: string;
  };
}

/**
 * Automation configuration for content generation
 */
export interface AutomationConfiguration {
  readonly id: string;
  readonly userId: UserID;
  readonly advisorId: AdvisorID;
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly triggers: AutomationTriggers;
  readonly contentRules: ContentRules;
  readonly approvalWorkflow: ApprovalWorkflow;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/**
 * Automation trigger conditions
 */
export interface AutomationTriggers {
  readonly onMeetingEnd: boolean;
  readonly onTranscriptReady: boolean;
  readonly onSchedule: ScheduleTrigger | null;
  readonly onMeetingType: readonly string[];
  readonly onClientType: readonly string[];
}

/**
 * Content generation rules
 */
export interface ContentRules {
  readonly platforms: readonly SocialPlatform[];
  readonly maxPostsPerMeeting: number;
  readonly contentTypes: readonly ContentType[];
  readonly customPrompts: Record<SocialPlatform, string>;
  readonly hashtagStrategy: 'auto' | 'predefined' | 'none';
  readonly predefinedHashtags: readonly string[];
}

/**
 * Schedule-based automation trigger
 */
export interface ScheduleTrigger {
  readonly frequency: 'daily' | 'weekly' | 'monthly';
  readonly time: string; // HH:MM format
  readonly daysOfWeek?: readonly number[]; // For weekly
  readonly dayOfMonth?: number; // For monthly
  readonly timeZone: string;
}

// ============================================================================
// 6. EXTERNAL API FACADES (Normalized shapes)
// ============================================================================

/**
 * LinkedIn API Response Types
 */
export interface LinkedInTokenResponse {
  readonly access_token: string;
  readonly expires_in: number;
  readonly refresh_token?: string;
  readonly scope: string;
}

export interface LinkedInProfileResponse {
  readonly id: string;
  readonly firstName: {
    readonly localized: {
      readonly [key: string]: string;
    };
  };
  readonly lastName: {
    readonly localized: {
      readonly [key: string]: string;
    };
  };
  readonly profilePicture?: {
    readonly displayImage: string;
    readonly elements: Array<{
      readonly identifiers: Array<{
        readonly identifier: string;
      }>;
    }>;
  };
}

export interface LinkedInPostResponse {
  readonly id: string;
  readonly activity: string;
}

export interface LinkedInPostStatsResponse {
  readonly numLikes: number;
  readonly numComments: number;
  readonly numShares: number;
  readonly numClicks: number;
  readonly numSaves: number;
}

/**
 * LinkedIn API normalized types
 */
export interface LinkedInPostRequest {
  readonly text: string;
  readonly mediaUrl?: string;
  readonly visibility: 'public' | 'connections';
}

/**
 * Google Calendar API normalized types
 */
export interface GoogleCalendarEventRequest {
  readonly summary: string;
  readonly description?: string;
  readonly start: DateTimeWithTimeZone;
  readonly end: DateTimeWithTimeZone;
  readonly attendees?: readonly CalendarAttendee[];
}

export interface DateTimeWithTimeZone {
  readonly dateTime: string;
  readonly timeZone: string;
}

export interface CalendarAttendee {
  readonly email: string;
  readonly name: string;
  readonly responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  readonly isOrganizer: boolean;
  readonly isOptional: boolean;
  readonly role?: 'advisor' | 'client' | 'prospect' | 'colleague' | 'compliance_officer';
  readonly clientId?: string;
}

/**
 * Raw Recall.ai Bot payload (snake_case) from their REST API
 */
export interface RecallBotApi {
  readonly id: string;
  readonly meeting_url: string;
  readonly status: 'scheduled' | 'joining' | 'recording' | 'completed' | 'failed';
  readonly bot_name?: string;
  readonly created_at: string;
  readonly started_at?: string | null;
  readonly ended_at?: string | null;
  readonly recording_url?: string | null;
  readonly transcript_url?: string | null;
  readonly record_audio?: boolean;
  readonly record_video?: boolean;
  readonly record_screen?: boolean;
  readonly webhook_url?: string | null;
  readonly duration?: number | null;
  readonly participant_count?: number | null;
  readonly transcript_word_count?: number | null;
}

/**
 * Raw Recall.ai transcript payload (snake_case) from their REST API
 */
export interface RecallTranscriptApiSegment {
  readonly speaker: string;
  readonly text: string;
  readonly start_time: number;
  readonly end_time: number;
  readonly confidence?: number;
}

export interface RecallTranscriptApi {
  readonly meeting_id: string;
  readonly transcript: string;
  readonly speakers?: readonly string[];
  readonly segments?: readonly RecallTranscriptApiSegment[];
  readonly summary?: string | null;
  readonly key_points?: readonly string[];
  readonly action_items?: readonly string[];
  readonly duration?: number;
  readonly word_count?: number;
  readonly language?: string;
  readonly created_at: string;
}

/**
 * OpenAI Chat Completion Response
 */
export interface OpenAIResponse {
  readonly id: string;
  readonly object: string;
  readonly created: number;
  readonly model: string;
  readonly choices: Array<{
    readonly index: number;
    readonly message: {
      readonly role: string;
      readonly content: string;
    };
    readonly finish_reason: string;
  }>;
  readonly usage: {
    readonly prompt_tokens: number;
    readonly completion_tokens: number;
    readonly total_tokens: number;
  };
}

// ============================================================================
// 7. ENUMS & CONSTANTS
// ============================================================================

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
}

export enum ContentTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  ENTHUSIASTIC = 'enthusiastic',
  INFORMATIVE = 'informative',
  AUTHORITATIVE = 'authoritative',
}

export enum ContentLength {
  SHORT = 'short', // 50-150 chars
  MEDIUM = 'medium', // 150-500 chars
  LONG = 'long', // 500+ chars
}

export enum ContentType {
  INSIGHT = 'insight',
  TIP = 'tip',
  STORY = 'story',
  ANNOUNCEMENT = 'announcement',
  EDUCATIONAL = 'educational',
  MARKET_UPDATE = 'market_update',
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google-meet',
  MICROSOFT_TEAMS = 'microsoft-teams',
  WEBEX = 'webex',
  OTHER = 'other',
}

export enum MeetingPlatformType {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google-meet',
  MICROSOFT_TEAMS = 'microsoft-teams',
  WEBEX = 'webex',
  OTHER = 'other',
}

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  EXCHANGE = 'exchange',
  OTHER = 'other',
}

export enum BotStatus {
  SCHEDULED = 'scheduled',
  JOINING = 'joining',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RecordingStatus {
  NOT_STARTED = 'not_started',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TranscriptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NOT_AVAILABLE = 'not_available',
}

export enum PublishingStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ComplianceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_MODIFICATION = 'requires_modification',
}

export enum ValidationType {
  PRE_PUBLICATION = 'pre_publication',
  POST_PUBLICATION = 'post_publication',
  AUDIT = 'audit',
  MANUAL_REVIEW = 'manual_review',
}

export enum ValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_MODIFICATION = 'requires_modification',
  UNDER_REVIEW = 'under_review',
}

export enum JobType {
  BOT_SCHEDULING = 'bot_scheduling',
  CONTENT_GENERATION = 'content_generation',
  COMPLIANCE_VALIDATION = 'compliance_validation',
  SOCIAL_PUBLISHING = 'social_publishing',
  EMAIL_GENERATION = 'email_generation',
  TRANSCRIPT_PROCESSING = 'transcript_processing',
  SYSTEM_MAINTENANCE = 'system_maintenance',
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  MAINTENANCE = 'maintenance',
}

export enum NotificationType {
  BOT_SCHEDULED = 'bot_scheduled',
  RECORDING_STARTED = 'recording_started',
  TRANSCRIPT_READY = 'transcript_ready',
  CONTENT_GENERATED = 'content_generated',
  COMPLIANCE_REVIEW_NEEDED = 'compliance_review_needed',
  CONTENT_PUBLISHED = 'content_published',
  SYSTEM_ALERT = 'system_alert',
  ERROR_NOTIFICATION = 'error_notification',
}

// Risk and Compliance Enums
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskTolerance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum FirmType {
  RIA = 'ria',
  BROKER_DEALER = 'broker_dealer',
  HYBRID = 'hybrid',
  BANK = 'bank',
}

export enum ComplianceFramework {
  FINRA = 'finra',
  SEC = 'sec',
  STATE = 'state',
  MULTIPLE = 'multiple',
}

export enum RelationshipType {
  PROSPECT = 'prospect',
  CLIENT = 'client',
  FORMER_CLIENT = 'former_client',
}

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export enum InvestmentExperience {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum RegulatoryStatus {
  RETAIL = 'retail',
  ACCREDITED = 'accredited',
  INSTITUTIONAL = 'institutional',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  CONNECTIONS_ONLY = 'connections_only',
  PRIVATE = 'private',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  PORTAL = 'portal',
}

export enum MeetingParticipantRole {
  ADVISOR = 'advisor',
  CLIENT = 'client',
  PROSPECT = 'prospect',
  COLLEAGUE = 'colleague',
  COMPLIANCE_OFFICER = 'compliance_officer',
  UNKNOWN = 'unknown',
}

export enum BotJoinStatus {
  PENDING = 'pending',
  JOINING = 'joining',
  JOINED = 'joined',
  FAILED = 'failed',
  LEFT = 'left',
}

// ============================================================================
// 8. UI COMPONENT TYPES
// ============================================================================

/**
 * UI Component Props - Re-exported from component files for centralization
 */

/**
 * Badge component props
 */
export interface BadgeProps {
  readonly variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  readonly className?: string;
  readonly children?: unknown;
}

/**
 * Button component props
 */
export interface ButtonProps {
  readonly variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  readonly size?: 'default' | 'sm' | 'lg' | 'icon';
  readonly className?: string;
  readonly children?: unknown;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

/**
 * Textarea component props
 */
export interface TextareaProps {
  readonly value?: string;
  readonly onChange?: (e: unknown) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly cols?: number;
}

/**
 * Meeting Post Card component props
 */
export interface MeetingPostCardProps {
  readonly key?: string;
  readonly meeting: ClientMeeting;
  readonly className?: string;
}

/**
 * Providers component props
 */
export interface ProvidersProps {
  readonly children: unknown;
  readonly session?: Session | null;
}

// ============================================================================
// 9. UTILITY & LIBRARY TYPES
// ============================================================================

/**
 * Logger utility types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  readonly [key: string]: unknown;
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: LogContext;
  readonly error?: Error;
}

/**
 * Content generation utility types
 */
export interface GeneratePostOptions {
  readonly meeting: ClientMeeting;
  readonly platform: SocialPlatform;
  readonly tone?: 'professional' | 'casual' | 'educational';
  readonly includeHashtags?: boolean;
}

export interface GeneratedPostUtility {
  readonly content: string;
  readonly hashtags: string[];
  readonly riskScore: number;
  readonly issues: string[];
}

/**
 * Google Calendar utility types
 */
export interface GoogleCalendarAttendee {
  readonly email?: string;
  readonly displayName?: string;
  readonly responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  readonly organizer?: boolean;
  readonly optional?: boolean;
}

export interface GoogleCalendarItem {
  readonly id: string;
  readonly summary: string;
  readonly description?: string;
  readonly start: {
    readonly dateTime?: string;
    readonly date?: string;
    readonly timeZone?: string;
  };
  readonly end: {
    readonly dateTime?: string;
    readonly date?: string;
    readonly timeZone?: string;
  };
  readonly attendees?: readonly GoogleCalendarAttendee[];
  readonly location?: string;
  readonly meetingUrl?: string;
  readonly platform?: MeetingPlatform;
}

// ============================================================================
// 10. TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard for Result pattern
 */
export const isOk = <T, E extends string = string>(r: Result<T, E>): r is Ok<T> => r.ok;

/**
 * Type guard for Result pattern
 */
export const isErr = <T, E extends string = string>(r: Result<T, E>): r is Err<E> => !r.ok;

/**
 * Type guard to check if a value is a valid ClientMeeting
 */
export const isMeeting = (value: unknown): value is ClientMeeting => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'startTime' in value &&
    'endTime' in value
  );
};

/**
 * Type guard to check if a value is a valid GeneratedContent
 */
export const isGeneratedContent = (value: unknown): value is GeneratedContent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'content' in value &&
    'platform' in value &&
    'complianceStatus' in value
  );
};

/**
 * Type guard to check if a value is a valid ApiError
 */
export const isApiError = (value: unknown): value is ApiError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'code' in value &&
    'timestamp' in value
  );
};

// ============================================================================
// 9. API RESPONSE TYPES
// ============================================================================

/**
 * Standardized API response format
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly metadata: ApiMetadata;
}

/**
 * Recall.ai API response structure
 */
export interface RecallApiResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly message?: string;
}

/**
 * API Request to generate social media posts
 */
export interface GeneratePostsRequest {
  readonly transcript: string;
  readonly meetingContext: {
    readonly title: string;
    readonly attendees: string[];
    readonly duration: number; // minutes
    readonly platform: MeetingPlatform;
  };
  readonly automationSettings: AutomationSettings;
}

/**
 * API Response with generated posts
 */
export interface GeneratePostsResponse {
  readonly posts: Array<{
    readonly platform: SocialPlatform;
    readonly content: string;
    readonly hashtags: string[];
    readonly reasoning: string;
  }>;
  readonly metadata: {
    readonly totalPosts: number;
    readonly processingTime: number;
    readonly model: string;
  };
}

/**
 * Google Calendar configuration
 */
export interface GoogleCalendarConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
}

/**
 * Calendar event attendee
 */
export interface CalendarAttendee {
  readonly email: string;
  readonly name: string;
  readonly responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  readonly isOrganizer: boolean;
  readonly isOptional: boolean;
  readonly role: 'advisor' | 'client' | 'prospect' | 'colleague';
}

/**
 * Calendar event representation
 */
export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly attendees: CalendarAttendee[];
  readonly location: string;
  readonly meetingUrl: string;
  readonly provider: CalendarProvider;
  readonly calendarId: string;
  readonly isRecurring: boolean;
  readonly status: 'confirmed' | 'tentative' | 'cancelled';
  readonly visibility: 'default' | 'public' | 'private';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * API response for content generation
 */
export interface ContentGenerationResponse {
  readonly success: boolean;
  readonly data?: GeneratedContent;
  readonly error?: { message: string };
}

/**
 * API error with detailed information
 */
export interface ApiError {
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly requestId: string;
  readonly stack?: string; // Only in development
}

/**
 * API response metadata
 */
export interface ApiMetadata {
  readonly timestamp: string;
  readonly requestId: string;
  readonly processingTimeMs: number;
  readonly version: string;
  readonly rateLimit?: RateLimitInfo;
  readonly cacheStatus?: 'hit' | 'miss' | 'stale';
  readonly complianceChecked: boolean;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: ISODate;
  readonly retryAfter?: number; // in seconds
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/**
 * Form validation error structure
 */
export interface FormError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Loading state for async operations
 */
export interface LoadingState {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly lastUpdated: ISODate | null;
}

// ============================================================================
// 11. DEPRECATIONS (Temporary aliases)
// ============================================================================

/**
 * @deprecated Use GeneratedContent instead - remove after migration
 */
export type SocialPost = GeneratedContent;

/**
 * @deprecated Use ClientMeeting instead - remove after migration
 */
export type Meeting = ClientMeeting;

/**
 * @deprecated Use GeneratedContent instead - remove after migration
 */
export type GeneratedPost = GeneratedContent;

/**
 * @deprecated Use UserSettings instead - remove after migration
 */
export type LegacyUserSettings = UserSettings;

/**
 * @deprecated Use AutomationConfiguration instead - remove after migration
 */
export type Automation = AutomationConfiguration;

// ============================================================================
// DEEPSEEK REVIEW - MISSING UTILITY TYPES
// ============================================================================

/**
 * Simplified audit entry for general use
 * Maps to: Audit trail in compliance workflows
 */
export interface AuditEntry {
  readonly timestamp: Date;
  readonly action: string;
  readonly userId: string;
  readonly details: Record<string, unknown>;
}

/**
 * Simplified compliance check for general use
 * Maps to: Individual compliance rule validation
 */
export interface ComplianceCheck {
  readonly ruleId: string;
  readonly description: string;
  readonly passed: boolean;
  readonly details?: string;
}

/**
 * Simplified compliance validation for basic use cases
 * Maps to: Basic compliance validation workflow
 * Note: Use the comprehensive ComplianceValidation interface for production
 */
export interface SimpleComplianceValidation {
  readonly id: string;
  readonly contentId: string;
  readonly advisorId: string;
  readonly validationType: 'auto' | 'manual';
  readonly status: 'passed' | 'failed' | 'requires_review';
  readonly checks: ComplianceCheck[];
  readonly modifications: string[];
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly auditTrail: AuditEntry[];
}
