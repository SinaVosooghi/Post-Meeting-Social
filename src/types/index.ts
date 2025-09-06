/**
 * TYPE SYSTEM ENTRY POINT
 *
 * This file serves as the main entry point for all type definitions.
 * All types are defined in master-interfaces.ts and re-exported here
 * for backward compatibility and clean imports.
 *
 * 🎯 Usage:
 * import { FinancialAdvisor, ClientMeeting } from '@/types';
 *
 * 🔄 Migration:
 * - All types are now centralized in master-interfaces.ts
 * - This file provides clean re-exports
 * - No type definitions should be added here
 */

// Re-export all interfaces from master-interfaces
// ============================================================================
// CENTRALIZED TYPE EXPORTS - ORGANIZED BY DOMAIN
// ============================================================================
// This file serves as the single source of truth for all type exports.
// All types are defined in master-interfaces.ts and re-exported here.

// Foundation Types
export type {
  Branded,
  ID,
  AdvisorID,
  MeetingID,
  ContentID,
  ComplianceID,
  UserID,
  BotID,
  PostID,
  ISODate,
  NonEmptyString,
  Json,
  Lazy,
  DeepPartial,
  NonNullable,
  Optional,
  Required,
  Ok,
  Err,
  Result,
} from './master-interfaces';

// Financial Advisory Domain
export type {
  FinancialAdvisor,
  ComplianceSettings,
  RegulatoryRequirements,
  FirmSettings,
  SocialMediaSettings,
} from './master-interfaces';

// Meeting & Recording Domain
export type {
  ClientMeeting,
  ClientRelationship,
  CommunicationPreferences,
  ComplianceFlags,
  RecordingDetails,
  TranscriptSpeaker,
  TranscriptSegment,
  TranscriptSummary,
} from './master-interfaces';

// Recall.ai Integration Domain
export type {
  RecallBot,
  BotConfiguration,
  BotError,
  RecallBotApi,
  RecallTranscriptApi,
  ApiResponse,
  RecallApiResponse,
} from './master-interfaces';

// Content Generation Domain
export type {
  GeneratedContent,
  SocialMediaPost,
  GeneratePostsRequest,
  GeneratePostsResponse,
  ContentGenerationResponse,
  GeneratePostOptions,
  GeneratedPostUtility,
} from './master-interfaces';

// Google Calendar Integration Domain
export type {
  GoogleCalendarConfig,
  CalendarEvent,
  CalendarAttendee,
  GoogleCalendarItem,
} from './master-interfaces';

// UI Component Types
export type {
  BadgeProps,
  ButtonProps,
  TextareaProps,
  MeetingPostCardProps,
  ProvidersProps,
} from './master-interfaces';

// Utility & Library Types
export type { LogLevel, LogContext, LogEntry } from './master-interfaces';

// Enums
export {
  SocialPlatform,
  ContentTone,
  ContentLength,
  ContentType,
  MeetingPlatform,
  MeetingPlatformType,
  CalendarProvider,
  BotStatus,
  RecordingStatus,
  TranscriptStatus,
  PublishingStatus,
  ComplianceStatus,
  ValidationType,
  ValidationStatus,
  JobType,
  JobPriority,
  JobStatus,
  HealthStatus,
  NotificationType,
  RiskTolerance,
  FirmType,
  ComplianceFramework,
  RelationshipType,
  RiskProfile,
  InvestmentExperience,
  RegulatoryStatus,
  PrivacyLevel,
  ContactMethod,
  RiskLevel,
  BotJoinStatus,
} from './master-interfaces';

// Type Guards
export { isOk, isErr, isMeeting } from './master-interfaces';

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// These aliases maintain compatibility during migration
// They will be removed in a future version

// Note: All types are already exported above in their respective domain sections
// This section is kept for future backward compatibility needs
