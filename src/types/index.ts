/**
 * Comprehensive TypeScript Type Definitions
 * Post-Meeting Social Media Content Generator
 * 
 * This file defines all interfaces, types, and schemas used throughout the application.
 * Strict typing ensures type safety and enables advanced IDE features.
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/**
 * User account information with OAuth provider details
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly image: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly accounts: Account[];
  readonly meetings: Meeting[];
  readonly automations: Automation[];
  readonly settings: UserSettings;
}

/**
 * OAuth account information for various providers
 */
export interface Account {
  readonly id: string;
  readonly userId: string;
  readonly type: AccountType;
  readonly provider: OAuthProvider;
  readonly providerAccountId: string;
  readonly refresh_token: string | null;
  readonly access_token: string | null;
  readonly expires_at: number | null;
  readonly token_type: string | null;
  readonly scope: string | null;
  readonly id_token: string | null;
  readonly session_state: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Meeting record with transcript and generated content
 */
export interface Meeting {
  readonly id: string;
  readonly userId: string;
  readonly calendarEventId: string;
  readonly title: string;
  readonly description: string | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly attendees: MeetingAttendee[];
  readonly platform: MeetingPlatform;
  readonly meetingUrl: string;
  readonly recallBotId: string | null;
  readonly transcript: string | null;
  readonly transcriptStatus: TranscriptStatus;
  readonly generatedPosts: GeneratedPost[];
  readonly followUpEmail: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: User;
}

/**
 * Meeting attendee information
 */
export interface MeetingAttendee {
  readonly id: string;
  readonly meetingId: string;
  readonly name: string;
  readonly email: string;
  readonly isOrganizer: boolean;
  readonly responseStatus: AttendeeResponseStatus;
}

/**
 * AI-generated social media post
 */
export interface GeneratedPost {
  readonly id: string;
  readonly meetingId: string;
  readonly platform: SocialPlatform;
  readonly content: string;
  readonly hashtags: string[];
  readonly status: PostStatus;
  readonly publishedAt: Date | null;
  readonly automationId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly meeting: Meeting;
  readonly automation: Automation | null;
}

/**
 * User automation configuration
 */
export interface Automation {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly description: string | null;
  readonly platform: SocialPlatform;
  readonly isActive: boolean;
  readonly prompt: string;
  readonly settings: AutomationSettings;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: User;
  readonly generatedPosts: GeneratedPost[];
}

/**
 * User settings and preferences
 */
export interface UserSettings {
  readonly id: string;
  readonly userId: string;
  readonly botJoinMinutesBefore: number;
  readonly autoGeneratePosts: boolean;
  readonly autoPublishPosts: boolean;
  readonly defaultPrompt: string;
  readonly notificationPreferences: NotificationPreferences;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: User;
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export enum AccountType {
  OAUTH = 'oauth',
  EMAIL = 'email',
  CREDENTIALS = 'credentials'
}

export enum OAuthProvider {
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook'
}

export enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google-meet',
  MICROSOFT_TEAMS = 'microsoft-teams',
  OTHER = 'other'
}

export enum TranscriptStatus {
  PENDING = 'pending',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NOT_AVAILABLE = 'not-available'
}

export enum AttendeeResponseStatus {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
  NEEDS_ACTION = 'needsAction'
}

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Automation-specific settings
 */
export interface AutomationSettings {
  readonly maxPosts: number;
  readonly includeHashtags: boolean;
  readonly includeEmojis: boolean;
  readonly tone: ContentTone;
  readonly length: ContentLength;
  readonly publishImmediately: boolean;
  readonly scheduleDelay: number; // minutes after meeting ends
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  readonly email: boolean;
  readonly browser: boolean;
  readonly meetingStarted: boolean;
  readonly transcriptReady: boolean;
  readonly postsGenerated: boolean;
  readonly postsPublished: boolean;
}

export enum ContentTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  ENTHUSIASTIC = 'enthusiastic',
  INFORMATIVE = 'informative'
}

export enum ContentLength {
  SHORT = 'short',    // ~100 characters
  MEDIUM = 'medium',  // ~200 characters
  LONG = 'long'       // ~280 characters
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Google Calendar Event from Google Calendar API
 */
export interface GoogleCalendarEvent {
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
  readonly attendees?: GoogleCalendarAttendee[];
  readonly conferenceData?: {
    readonly entryPoints?: Array<{
      readonly entryPointType: string;
      readonly uri: string;
      readonly label?: string;
    }>;
  };
  readonly htmlLink: string;
  readonly status: string;
  readonly transparency?: string;
}

/**
 * Google Calendar Attendee
 */
export interface GoogleCalendarAttendee {
  readonly email: string;
  readonly displayName?: string;
  readonly organizer?: boolean;
  readonly responseStatus: string;
}

/**
 * Recall.ai Bot information
 */
export interface RecallBot {
  readonly id: string;
  readonly meeting_url: string;
  readonly bot_name?: string;
  readonly status: RecallBotStatus;
  readonly media_retention_end?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export enum RecallBotStatus {
  JOINING = 'joining',
  JOINED = 'joined',
  RECORDING = 'recording',
  DONE = 'done',
  FAILED = 'failed'
}

/**
 * Recall.ai Transcript
 */
export interface RecallTranscript {
  readonly id: string;
  readonly bot_id: string;
  readonly media_url?: string;
  readonly transcript?: RecallTranscriptSegment[];
  readonly status: string;
  readonly created_at: string;
}

/**
 * Recall.ai Transcript Segment
 */
export interface RecallTranscriptSegment {
  readonly speaker: string;
  readonly text: string;
  readonly timestamp: number;
  readonly confidence: number;
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
// REQUEST/RESPONSE TYPES
// ============================================================================

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
  readonly followUpEmail?: string;
  readonly metadata: {
    readonly tokensUsed: number;
    readonly processingTimeMs: number;
    readonly model: string;
  };
}

/**
 * API Request to publish a post
 */
export interface PublishPostRequest {
  readonly postId: string;
  readonly platform: SocialPlatform;
  readonly scheduledFor?: Date;
}

/**
 * API Response for post publishing
 */
export interface PublishPostResponse {
  readonly success: boolean;
  readonly platformPostId?: string;
  readonly publishedAt?: Date;
  readonly error?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props for Meeting Card component
 */
export interface MeetingCardProps {
  readonly meeting: Meeting;
  readonly onToggleBot: (meetingId: string, enabled: boolean) => void;
  readonly onViewDetails: (meetingId: string) => void;
  readonly className?: string;
}

/**
 * Props for Generated Post component
 */
export interface GeneratedPostProps {
  readonly post: GeneratedPost;
  readonly onCopy: (content: string) => void;
  readonly onPublish: (postId: string, platform: SocialPlatform) => void;
  readonly onEdit: (postId: string, newContent: string) => void;
  readonly className?: string;
}

/**
 * Props for Automation Config component
 */
export interface AutomationConfigProps {
  readonly automation: Automation | null;
  readonly onSave: (settings: Partial<Automation>) => void;
  readonly onDelete?: (automationId: string) => void;
  readonly platforms: SocialPlatform[];
  readonly className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API Error response structure
 */
export interface ApiError {
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
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
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly metadata?: Record<string, unknown>;
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
  readonly lastUpdated: Date | null;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid Meeting
 */
export const isMeeting = (value: unknown): value is Meeting => {
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
 * Type guard to check if a value is a valid GeneratedPost
 */
export const isGeneratedPost = (value: unknown): value is GeneratedPost => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'content' in value &&
    'platform' in value &&
    'status' in value
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
// BRANDED TYPES FOR ADDITIONAL TYPE SAFETY
// ============================================================================

/**
 * Branded type for User IDs to prevent mixing with other string IDs
 */
export type UserId = string & { readonly __brand: 'UserId' };

/**
 * Branded type for Meeting IDs
 */
export type MeetingId = string & { readonly __brand: 'MeetingId' };

/**
 * Branded type for Post IDs
 */
export type PostId = string & { readonly __brand: 'PostId' };

/**
 * Branded type for Bot IDs
 */
export type BotId = string & { readonly __brand: 'BotId' };

/**
 * Helper function to create branded UserId
 */
export const createUserId = (id: string): UserId => id as UserId;

/**
 * Helper function to create branded MeetingId
 */
export const createMeetingId = (id: string): MeetingId => id as MeetingId;

/**
 * Helper function to create branded PostId
 */
export const createPostId = (id: string): PostId => id as PostId;

/**
 * Helper function to create branded BotId
 */
export const createBotId = (id: string): BotId => id as BotId;
