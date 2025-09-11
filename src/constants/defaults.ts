/**
 * Default values for various settings and configurations
 * 
 * This module provides consistent default values across the application
 * to ensure type safety and reduce duplication.
 */

import { ContentTone, ContentLength } from '../types/master-interfaces';

/**
 * Default automation settings for content generation
 */
export const DEFAULT_AUTOMATION_SETTINGS = {
  autoPublish: false,
  requireApproval: true,
  notifyOnGeneration: false,
  scheduleDelay: 0, // in minutes
} as const;

/**
 * Default content generation settings
 * These are used when the UI needs generation-specific settings
 */
export const DEFAULT_CONTENT_GENERATION_SETTINGS = {
  maxPosts: 3,
  includeHashtags: true,
  includeEmojis: false,
  tone: ContentTone.PROFESSIONAL,
  length: ContentLength.MEDIUM,
  publishImmediately: false,
} as const;

/**
 * Default bot settings for meeting automation
 */
export const DEFAULT_BOT_SETTINGS = {
  defaultJoinMinutesBefore: 5,
  autoScheduleBots: false,
  enableRecording: true,
  enableTranscription: true,
  maxConcurrentBots: 3,
  joinMinutesBefore: 5,
  autoSchedule: false,
  maxConcurrentBots: 3,
} as const;
