/**
 * MASTER INTERFACES - Post-Meeting Social Media Generator
 * Comprehensive TypeScript definitions aligned with MASTER_ARCHITECTURE.md
 * 
 * This file contains ALL interfaces needed for the Jump.ai challenge implementation.
 * Every interface maps directly to components in our production architecture.
 */

// ============================================================================
// FINANCIAL ADVISORY DOMAIN ENTITIES (Architecture-Aligned)
// ============================================================================

/**
 * Financial Advisor with compliance settings and regulatory context
 * Maps to: Financial Advisory Domain section in MASTER_ARCHITECTURE.md
 */
export interface FinancialAdvisor {
  readonly id: string;
  readonly userId: string;
  readonly firmName: string;
  readonly licenseNumbers: {
    readonly series7?: string;
    readonly series66?: string;
    readonly stateRegistrations: readonly string[];
    readonly crd?: string; // Central Registration Depository
  };
  readonly complianceSettings: {
    readonly riskToleranceThreshold: 'low' | 'medium' | 'high';
    readonly requiredDisclosures: readonly string[];
    readonly approvedHashtags: readonly string[];
    readonly restrictedTopics: readonly string[];
    readonly autoApprovalThreshold: number; // 0-100 risk score
    readonly contentReviewRequired: boolean;
    readonly supervisorApprovalRequired: boolean;
  };
  readonly regulatoryRequirements: {
    readonly finraRegistered: boolean;
    readonly secRegistered: boolean;
    readonly stateRequirements: readonly string[];
    readonly recordKeepingPeriod: number; // in years
    readonly complianceOfficer?: string;
    readonly lastComplianceReview: Date;
  };
  readonly firmSettings: {
    readonly firmType: 'ria' | 'broker_dealer' | 'hybrid' | 'bank';
    readonly aum: number; // Assets under management
    readonly clientCount: number;
    readonly complianceFramework: 'finra' | 'sec' | 'state' | 'multiple';
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Enhanced client meeting with regulatory context and privacy controls
 * Maps to: Meeting Management + Compliance Layer in architecture
 */
export interface ClientMeeting {
  readonly id: string;
  readonly advisorId: string;
  readonly calendarEventId: string;
  readonly title: string;
  readonly description: string | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly meetingUrl: string;
  readonly platform: MeetingPlatform;
  
  // Client relationship context
  readonly clientRelationship: {
    readonly clientId: string;
    readonly relationshipType: 'prospect' | 'client' | 'former_client';
    readonly riskProfile: 'conservative' | 'moderate' | 'aggressive';
    readonly investmentExperience: 'beginner' | 'intermediate' | 'advanced';
    readonly regulatoryStatus: 'retail' | 'accredited' | 'institutional';
    readonly communicationPreferences: {
      readonly allowSocialMedia: boolean;
      readonly privacyLevel: 'public' | 'connections_only' | 'private';
      readonly consentToRecord: boolean;
      readonly dataRetentionConsent: boolean;
      readonly preferredContactMethod: 'email' | 'phone' | 'text' | 'portal';
    };
  };
  
  // Compliance flags for content generation
  readonly complianceFlags: {
    readonly containsSensitiveData: boolean;
    readonly requiresLegalReview: boolean;
    readonly hasInvestmentAdvice: boolean;
    readonly needsDisclaimer: boolean;
    readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
    readonly topicsDiscussed: readonly string[];
  };
  
  // Meeting recording and transcription
  readonly recordingDetails: {
    readonly botId: string | null;
    readonly recordingStatus: RecordingStatus;
    readonly transcriptStatus: TranscriptStatus;
    readonly transcript: string | null;
    readonly recordingUrl: string | null;
    readonly transcriptUrl: string | null;
    readonly duration: number | null; // in seconds
    readonly participantCount: number | null;
  };
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly advisor: FinancialAdvisor;
}

/**
 * Comprehensive compliance validation with audit trail
 * Maps to: Compliance Engine in MASTER_ARCHITECTURE.md
 */
export interface ComplianceValidation {
  readonly id: string;
  readonly contentId: string;
  readonly advisorId: string;
  readonly meetingId?: string;
  readonly validationType: 'pre_publication' | 'post_publication' | 'audit' | 'manual_review';
  readonly status: 'pending' | 'approved' | 'rejected' | 'requires_modification' | 'under_review';
  
  // Comprehensive compliance checks
  readonly complianceChecks: {
    readonly finraCompliance: ComplianceResult;
    readonly secCompliance: ComplianceResult;
    readonly firmPolicyCompliance: ComplianceResult;
    readonly clientPrivacyCompliance: ComplianceResult;
    readonly stateRegulationCompliance: ComplianceResult;
  };
  
  // Risk assessment
  readonly riskAssessment: {
    readonly overallRiskScore: number; // 0-100
    readonly riskFactors: readonly string[];
    readonly mitigationRequired: boolean;
    readonly reviewerComments?: string;
  };
  
  // Content modifications
  readonly contentModifications: {
    readonly originalContent: string;
    readonly modifiedContent?: string;
    readonly injectedDisclaimers: readonly string[];
    readonly removedContent: readonly string[];
    readonly addedWarnings: readonly string[];
  };
  
  // Approval workflow
  readonly approvalWorkflow: {
    readonly approvedBy?: string;
    readonly approvedAt?: Date;
    readonly reviewedBy?: string;
    readonly reviewedAt?: Date;
    readonly escalatedTo?: string;
    readonly escalationReason?: string;
  };
  
  // Complete audit trail
  readonly auditTrail: readonly ComplianceAuditEntry[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
  readonly performedAt: Date;
  readonly details: string;
  readonly previousState?: string;
  readonly newState?: string;
  readonly reason?: string;
}

// ============================================================================
// SOCIAL MEDIA PUBLISHING (Architecture-Aligned)
// ============================================================================

/**
 * Enhanced social media publishing with compliance integration
 * Maps to: Social Media Publishing Architecture in MASTER_ARCHITECTURE.md
 */
export interface SocialMediaPost {
  readonly id: string;
  readonly meetingId: string;
  readonly advisorId: string;
  readonly platform: SocialPlatform;
  readonly contentType: 'post' | 'article' | 'story' | 'reel';
  
  // Content details
  readonly content: {
    readonly originalContent: string;
    readonly finalContent: string;
    readonly hashtags: readonly string[];
    readonly mentions: readonly string[];
    readonly mediaUrls: readonly string[];
    readonly linkPreview?: LinkPreview;
  };
  
  // Publishing details
  readonly publishingDetails: {
    readonly status: PublishingStatus;
    readonly scheduledFor?: Date;
    readonly publishedAt?: Date;
    readonly platformPostId?: string;
    readonly impressions?: number;
    readonly engagement?: SocialEngagement;
    readonly reach?: number;
  };
  
  // Compliance integration
  readonly complianceValidationId: string;
  readonly complianceStatus: 'pending' | 'approved' | 'rejected' | 'requires_review';
  
  // Error handling and retries
  readonly publishingAttempts: readonly PublishingAttempt[];
  readonly lastError?: string;
  readonly retryCount: number;
  readonly maxRetries: number;
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Social media platform OAuth token management
 * Maps to: OAuth Flow & Token Management in architecture
 */
export interface SocialMediaToken {
  readonly id: string;
  readonly userId: string;
  readonly platform: SocialPlatform;
  readonly tokenType: 'access' | 'refresh' | 'page_access';
  
  // Token details (encrypted at rest)
  readonly encryptedToken: string;
  readonly tokenScope: readonly string[];
  readonly expiresAt: Date;
  readonly refreshToken?: string;
  readonly refreshExpiresAt?: Date;
  
  // Platform-specific details
  readonly platformDetails: {
    readonly userId?: string;
    readonly username?: string;
    readonly pageId?: string; // For Facebook pages
    readonly pageName?: string;
    readonly permissions: readonly string[];
  };
  
  // Token health monitoring
  readonly healthStatus: 'healthy' | 'expiring_soon' | 'expired' | 'revoked' | 'error';
  readonly lastValidated: Date;
  readonly lastRefreshed?: Date;
  readonly refreshCount: number;
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Publishing attempt tracking for error handling
 */
export interface PublishingAttempt {
  readonly id: string;
  readonly attemptNumber: number;
  readonly attemptedAt: Date;
  readonly status: 'success' | 'failed' | 'rate_limited' | 'auth_error' | 'content_rejected';
  readonly responseData?: Record<string, unknown>;
  readonly errorMessage?: string;
  readonly retryAfter?: Date;
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

// ============================================================================
// CALENDAR & MEETING BOT INTEGRATION (Architecture-Aligned)
// ============================================================================

/**
 * Enhanced calendar event with bot integration
 * Maps to: Meeting Management in MASTER_ARCHITECTURE.md
 */
export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly timeZone: string;
  readonly location: string;
  readonly meetingUrl: string;
  readonly provider: CalendarProvider;
  readonly calendarId: string;
  
  // Attendee management
  readonly attendees: readonly CalendarAttendee[];
  readonly organizer: CalendarAttendee;
  readonly maxAttendees?: number;
  
  // Meeting properties
  readonly isRecurring: boolean;
  readonly recurrencePattern?: RecurrencePattern;
  readonly status: 'confirmed' | 'tentative' | 'cancelled';
  readonly visibility: 'default' | 'public' | 'private' | 'confidential';
  
  // Bot integration
  readonly botSettings: {
    readonly enableBot: boolean;
    readonly botJoinMinutesBefore: number;
    readonly recordingEnabled: boolean;
    readonly transcriptionEnabled: boolean;
    readonly autoGenerateContent: boolean;
  };
  
  // Client context (for financial advisors)
  readonly clientContext?: {
    readonly isClientMeeting: boolean;
    readonly clientIds: readonly string[];
    readonly meetingType: 'consultation' | 'review' | 'planning' | 'onboarding' | 'check_in';
    readonly confidentialityLevel: 'standard' | 'high' | 'restricted';
  };
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Enhanced calendar attendee with financial context
 */
export interface CalendarAttendee {
  readonly email: string;
  readonly name: string;
  readonly responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  readonly isOrganizer: boolean;
  readonly isOptional: boolean;
  readonly role?: 'advisor' | 'client' | 'prospect' | 'colleague' | 'compliance_officer';
  readonly clientId?: string; // If this attendee is a client
}

/**
 * Meeting recurrence pattern
 */
export interface RecurrencePattern {
  readonly frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  readonly interval: number;
  readonly daysOfWeek?: readonly number[]; // 0-6, Sunday = 0
  readonly endDate?: Date;
  readonly occurrences?: number;
}

/**
 * Enhanced Recall.ai bot with comprehensive tracking
 * Maps to: Recording & Transcription in MASTER_ARCHITECTURE.md
 */
export interface RecallBot {
  readonly id: string;
  readonly externalBotId: string; // Recall.ai bot ID
  readonly meetingId: string;
  readonly meetingUrl: string;
  readonly status: BotStatus;
  
  // Bot configuration
  readonly config: {
    readonly botName: string;
    readonly recordAudio: boolean;
    readonly recordVideo: boolean;
    readonly recordScreen: boolean;
    readonly transcriptionEnabled: boolean;
    readonly realTimeTranscription: boolean;
    readonly webhookUrl: string | null;
    readonly joinMinutesBefore: number;
    readonly autoLeaveAfterMinutes?: number;
  };
  
  // Scheduling and timing
  readonly scheduledAt: Date;
  readonly joinedAt: Date | null;
  readonly startedRecordingAt: Date | null;
  readonly endedAt: Date | null;
  readonly actualDuration: number | null; // in seconds
  
  // Recording outputs
  readonly outputs: {
    readonly recordingUrl: string | null;
    readonly transcriptUrl: string | null;
    readonly summaryUrl: string | null;
    readonly participantCount: number | null;
    readonly recordingSize: number | null; // in bytes
    readonly transcriptWordCount: number | null;
  };
  
  // Platform detection and metadata
  readonly meetingPlatform: 'zoom' | 'google-meet' | 'microsoft-teams' | 'webex' | 'other';
  readonly platformMetadata: {
    readonly meetingId?: string;
    readonly hostEmail?: string;
    readonly meetingPassword?: string;
    readonly waitingRoomEnabled?: boolean;
  };
  
  // Error handling and retries
  readonly errors: readonly BotError[];
  readonly retryCount: number;
  readonly lastError?: string;
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Bot error tracking for resilience
 */
export interface BotError {
  readonly id: string;
  readonly errorType: 'join_failed' | 'recording_failed' | 'transcription_failed' | 'network_error' | 'auth_error';
  readonly errorMessage: string;
  readonly errorCode?: string;
  readonly occurredAt: Date;
  readonly resolved: boolean;
  readonly resolution?: string;
}

/**
 * Comprehensive meeting transcript with AI processing
 * Maps to: AI Content Generation in MASTER_ARCHITECTURE.md
 */
export interface MeetingTranscript {
  readonly id: string;
  readonly botId: string;
  readonly meetingId: string;
  readonly advisorId: string;
  
  // Raw transcript data
  readonly rawTranscript: string;
  readonly processedTranscript: string;
  readonly confidence: number; // 0-1
  readonly language: string;
  readonly duration: number; // in seconds
  readonly wordCount: number;
  
  // Speaker identification and segments
  readonly speakers: readonly TranscriptSpeaker[];
  readonly segments: readonly TranscriptSegment[];
  readonly speakerCount: number;
  
  // AI-enhanced content
  readonly aiAnalysis: {
    readonly summary: string;
    readonly keyPoints: readonly string[];
    readonly actionItems: readonly string[];
    readonly decisions: readonly string[];
    readonly nextSteps: readonly string[];
    readonly sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    readonly topics: readonly string[];
    readonly riskFlags: readonly string[];
  };
  
  // Content generation readiness
  readonly contentGenerationReady: boolean;
  readonly compliancePreCheck: {
    readonly sensitiveDataDetected: boolean;
    readonly investmentAdviceDetected: boolean;
    readonly clientNamesDetected: readonly string[];
    readonly riskLevel: 'low' | 'medium' | 'high';
  };
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
// AI CONTENT GENERATION (Architecture-Aligned)
// ============================================================================

/**
 * Enhanced AI content generation request with compliance context
 * Maps to: AI Content Generation in MASTER_ARCHITECTURE.md
 */
export interface GenerateContentRequest {
  readonly transcriptId: string;
  readonly advisorId: string;
  readonly meetingContext: {
    readonly meetingId: string;
    readonly meetingTitle: string;
    readonly attendees: readonly string[];
    readonly duration: number;
    readonly platform: MeetingPlatform;
    readonly clientContext?: ClientContext;
  };
  
  // Content generation settings
  readonly contentSettings: {
    readonly platforms: readonly SocialPlatform[];
    readonly maxPosts: number;
    readonly tone: ContentTone;
    readonly length: ContentLength;
    readonly includeHashtags: boolean;
    readonly includeEmojis: boolean;
    readonly includeCallToAction: boolean;
  };
  
  // Compliance requirements
  readonly complianceRequirements: {
    readonly requireDisclaimers: boolean;
    readonly riskTolerance: 'low' | 'medium' | 'high';
    readonly restrictedTopics: readonly string[];
    readonly requiredDisclosures: readonly string[];
    readonly clientPrivacyLevel: 'public' | 'connections_only' | 'private';
  };
  
  // Automation settings
  readonly automationSettings: {
    readonly autoPublish: boolean;
    readonly scheduleDelay: number; // in minutes
    readonly requireApproval: boolean;
    readonly notifyOnGeneration: boolean;
  };
}

/**
 * AI-generated content with compliance validation
 * Maps to: Generated content with compliance checking
 */
export interface GeneratedContent {
  readonly id: string;
  readonly requestId: string;
  readonly advisorId: string;
  readonly meetingId: string;
  readonly platform: SocialPlatform;
  
  // Content details
  readonly content: {
    readonly originalContent: string;
    readonly finalContent: string;
    readonly hashtags: readonly string[];
    readonly mentions: readonly string[];
    readonly callToAction?: string;
    readonly mediaRecommendations: readonly MediaRecommendation[];
  };
  
  // AI generation metadata
  readonly aiMetadata: {
    readonly model: string;
    readonly promptVersion: string;
    readonly tokensUsed: number;
    readonly processingTimeMs: number;
    readonly confidence: number; // 0-1
    readonly reasoning: string;
    readonly alternatives: readonly string[];
  };
  
  // Compliance status
  readonly complianceStatus: 'pending' | 'approved' | 'rejected' | 'requires_modification';
  readonly complianceValidationId?: string;
  readonly riskScore: number; // 0-100
  readonly complianceFlags: readonly string[];
  
  // Publishing status
  readonly publishingStatus: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  readonly publishedPostId?: string;
  readonly publishingError?: string;
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
  readonly privacySettings: {
    readonly allowPublicMention: boolean;
    readonly allowSocialMediaReference: boolean;
    readonly requiresAnonymization: boolean;
  };
  readonly communicationPreferences: {
    readonly preferredTone: ContentTone;
    readonly topicsOfInterest: readonly string[];
    readonly avoidTopics: readonly string[];
  };
}

// ============================================================================
// JOB QUEUE & ASYNC PROCESSING (Architecture-Aligned)
// ============================================================================

/**
 * Job queue system for async processing
 * Maps to: Async Processing & Reliability in MASTER_ARCHITECTURE.md
 */
export interface JobDefinition {
  readonly id: string;
  readonly type: JobType;
  readonly priority: 'low' | 'normal' | 'high' | 'critical';
  readonly payload: JobPayload;
  
  // Scheduling
  readonly scheduledFor: Date;
  readonly delay: number; // in milliseconds
  readonly maxAttempts: number;
  readonly backoffStrategy: 'fixed' | 'exponential' | 'linear';
  
  // Execution tracking
  readonly status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  readonly attempts: readonly JobAttempt[];
  readonly currentAttempt: number;
  readonly lastAttemptAt?: Date;
  readonly completedAt?: Date;
  
  // Dependencies and relationships
  readonly dependsOn: readonly string[]; // Other job IDs
  readonly tags: readonly string[];
  readonly userId: string;
  readonly advisorId?: string;
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Job attempt tracking for retry logic
 */
export interface JobAttempt {
  readonly attemptNumber: number;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly status: 'running' | 'completed' | 'failed';
  readonly errorMessage?: string;
  readonly errorStack?: string;
  readonly processingTimeMs?: number;
  readonly retryAfter?: Date;
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
  readonly meetingId: string;
  readonly meetingUrl: string;
  readonly scheduledTime: Date;
  readonly botConfig: BotConfiguration;
}

export interface ContentGenerationPayload {
  readonly type: 'content_generation';
  readonly transcriptId: string;
  readonly advisorId: string;
  readonly contentSettings: GenerateContentRequest['contentSettings'];
  readonly complianceRequirements: GenerateContentRequest['complianceRequirements'];
}

export interface ComplianceValidationPayload {
  readonly type: 'compliance_validation';
  readonly contentId: string;
  readonly advisorId: string;
  readonly validationType: 'pre_publication' | 'post_publication' | 'audit';
  readonly urgency: 'low' | 'normal' | 'high';
}

export interface SocialPublishingPayload {
  readonly type: 'social_publishing';
  readonly contentId: string;
  readonly platform: SocialPlatform;
  readonly scheduledFor?: Date;
  readonly retryConfig: RetryConfiguration;
}

export interface EmailGenerationPayload {
  readonly type: 'email_generation';
  readonly transcriptId: string;
  readonly templateType: 'follow_up' | 'summary' | 'action_items' | 'thank_you';
  readonly recipients: readonly string[];
}

// ============================================================================
// SYSTEM MONITORING & HEALTH (Architecture-Aligned)
// ============================================================================

/**
 * System health monitoring for all services
 * Maps to: Monitoring & Alerting in MASTER_ARCHITECTURE.md
 */
export interface SystemHealth {
  readonly timestamp: Date;
  readonly overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  readonly services: readonly ServiceHealth[];
  readonly metrics: SystemMetrics;
  readonly alerts: readonly SystemAlert[];
}

/**
 * Individual service health status
 */
export interface ServiceHealth {
  readonly service: 'database' | 'redis' | 'openai' | 'recall_ai' | 'google_calendar' | 'linkedin' | 'facebook';
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  readonly responseTime: number; // in milliseconds
  readonly uptime: number; // percentage
  readonly lastChecked: Date;
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
  readonly userId?: string;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: Date;
  readonly resolvedAt?: Date;
  readonly createdAt: Date;
}

// ============================================================================
// CONFIGURATION & SETTINGS (Architecture-Aligned)
// ============================================================================

/**
 * Enhanced user settings with financial advisor context
 */
export interface UserSettings {
  readonly id: string;
  readonly userId: string;
  readonly advisorId: string;
  
  // Bot and automation settings
  readonly botSettings: {
    readonly defaultJoinMinutesBefore: number;
    readonly autoScheduleBots: boolean;
    readonly enableRecording: boolean;
    readonly enableTranscription: boolean;
    readonly autoGenerateContent: boolean;
    readonly autoPublishContent: boolean;
  };
  
  // Content generation preferences
  readonly contentPreferences: {
    readonly defaultTone: ContentTone;
    readonly defaultLength: ContentLength;
    readonly includeHashtagsByDefault: boolean;
    readonly includeEmojisByDefault: boolean;
    readonly preferredPlatforms: readonly SocialPlatform[];
    readonly customPromptTemplate?: string;
  };
  
  // Compliance and approval settings
  readonly complianceSettings: {
    readonly requireManualApproval: boolean;
    readonly autoApprovalThreshold: number; // 0-100 risk score
    readonly notifyOnComplianceIssues: boolean;
    readonly defaultDisclaimers: readonly string[];
    readonly restrictedHashtags: readonly string[];
  };
  
  // Notification preferences
  readonly notificationSettings: {
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
  };
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Automation configuration for content generation
 */
export interface AutomationConfiguration {
  readonly id: string;
  readonly userId: string;
  readonly advisorId: string;
  readonly name: string;
  readonly description: string;
  readonly isActive: boolean;
  
  // Trigger conditions
  readonly triggers: {
    readonly onMeetingEnd: boolean;
    readonly onTranscriptReady: boolean;
    readonly onSchedule: ScheduleTrigger | null;
    readonly onMeetingType: readonly string[];
    readonly onClientType: readonly string[];
  };
  
  // Content generation rules
  readonly contentRules: {
    readonly platforms: readonly SocialPlatform[];
    readonly maxPostsPerMeeting: number;
    readonly contentTypes: readonly ContentType[];
    readonly customPrompts: Record<SocialPlatform, string>;
    readonly hashtagStrategy: 'auto' | 'predefined' | 'none';
    readonly predefinedHashtags: readonly string[];
  };
  
  // Approval and publishing
  readonly approvalWorkflow: {
    readonly requireApproval: boolean;
    readonly approvers: readonly string[];
    readonly autoPublishAfterApproval: boolean;
    readonly publishDelay: number; // in minutes
  };
  
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
// ENUMS & CONSTANTS (Architecture-Aligned)
// ============================================================================

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram'
}

export enum ContentTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  ENTHUSIASTIC = 'enthusiastic',
  INFORMATIVE = 'informative',
  AUTHORITATIVE = 'authoritative'
}

export enum ContentLength {
  SHORT = 'short',     // 50-150 chars
  MEDIUM = 'medium',   // 150-500 chars
  LONG = 'long'        // 500+ chars
}

export enum ContentType {
  INSIGHT = 'insight',
  TIP = 'tip',
  STORY = 'story',
  ANNOUNCEMENT = 'announcement',
  EDUCATIONAL = 'educational',
  MARKET_UPDATE = 'market_update'
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google-meet',
  MICROSOFT_TEAMS = 'microsoft-teams',
  WEBEX = 'webex',
  OTHER = 'other'
}

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  EXCHANGE = 'exchange',
  OTHER = 'other'
}

export enum BotStatus {
  SCHEDULED = 'scheduled',
  JOINING = 'joining',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RecordingStatus {
  NOT_STARTED = 'not_started',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum TranscriptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NOT_AVAILABLE = 'not_available'
}

export enum PublishingStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum JobType {
  BOT_SCHEDULING = 'bot_scheduling',
  CONTENT_GENERATION = 'content_generation',
  COMPLIANCE_VALIDATION = 'compliance_validation',
  SOCIAL_PUBLISHING = 'social_publishing',
  EMAIL_GENERATION = 'email_generation',
  TRANSCRIPT_PROCESSING = 'transcript_processing',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}

export enum NotificationType {
  BOT_SCHEDULED = 'bot_scheduled',
  RECORDING_STARTED = 'recording_started',
  TRANSCRIPT_READY = 'transcript_ready',
  CONTENT_GENERATED = 'content_generated',
  COMPLIANCE_REVIEW_NEEDED = 'compliance_review_needed',
  CONTENT_PUBLISHED = 'content_published',
  SYSTEM_ALERT = 'system_alert',
  ERROR_NOTIFICATION = 'error_notification'
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

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
 * Cache configuration for performance optimization
 */
export interface CacheConfiguration {
  readonly ttl: number; // in seconds
  readonly maxSize: number; // in bytes
  readonly strategy: 'lru' | 'lfu' | 'fifo';
  readonly namespace: string;
  readonly compression: boolean;
}

// ============================================================================
// API RESPONSE TYPES (Architecture-Aligned)
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
  readonly resetAt: Date;
  readonly retryAfter?: number; // in seconds
}
