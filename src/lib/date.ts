/**
 * Date utility functions for consistent ISODate handling
 * 
 * This module provides utilities to convert various date formats
 * to ISODate strings as required by the master interfaces.
 */

/**
 * Converts a Date, string, or null/undefined value to an ISODate string
 * @param d - Date object, ISO string, or null/undefined
 * @returns ISO string representation of the date
 */
export const toISO = (d: Date | string | null | undefined): string => {
  if (d instanceof Date) {
    return d.toISOString();
  }
  if (typeof d === 'string') {
    // If it's already an ISO string, return it
    if (d.includes('T') && d.includes('Z')) {
      return d;
    }
    // Otherwise, parse it and convert to ISO
    return new Date(d).toISOString();
  }
  // For null/undefined, return current date
  return new Date().toISOString();
};

/**
 * Safely parses a date string and converts to ISODate
 * @param dateString - String that can be parsed as a date
 * @returns ISO string or current date if parsing fails
 */
export const parseToISO = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return new Date().toISOString();
  }
  try {
    return new Date(dateString).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Creates an ISODate string for a future time
 * @param hoursFromNow - Number of hours in the future
 * @returns ISO string for the future date
 */
export const futureISO = (hoursFromNow: number): string => {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
};

/**
 * Creates an ISODate string for a past time
 * @param hoursAgo - Number of hours in the past
 * @returns ISO string for the past date
 */
export const pastISO = (hoursAgo: number): string => {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
};
