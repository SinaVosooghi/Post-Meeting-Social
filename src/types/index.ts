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
export * from './master-interfaces';

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// These aliases maintain compatibility during migration
// They will be removed in a future version

// Re-export commonly used types for convenience
export type {
  // Core domain types
  FinancialAdvisor,
  ClientMeeting,
  RecallBot,
  GeneratedContent,
  SocialMediaPost,
  ComplianceValidation,

  // Enums
  SocialPlatform,
  BotStatus,
  ContentTone,
  ContentLength,
  MeetingPlatform,
  PublishingStatus,

  // Utility types
  Result,
  Ok,
  Err,
  ID,
  AdvisorID,
  MeetingID,
  ContentID,
  ComplianceID,
  UserID,
  BotID,
  PostID,

  // API types
  ApiResponse,
  ApiError,
  ApiMetadata,
} from './master-interfaces';
