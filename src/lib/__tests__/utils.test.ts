/**
 * Tests for Core Utility Functions
 * Post-Meeting Social Media Content Generator
 */

import {
  cn,
  isDefined,
  isNonEmptyString,
  isValidEmail,
  isValidUrl,
  formatDate,
  formatRelativeTime,
  isFutureDate,
  addMinutes,
  capitalize,
  truncate,
  toKebabCase,
  toCamelCase,
  getInitials,
  uniqueBy,
  chunk,
  shuffle,
  pick,
  omit,
  handleError,
  createApiError,
  delay,
  retry,
  withTimeout,
} from '../utils';

describe('Styling Utilities', () => {
  describe('cn', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('')).toBe('');
    });
  });
});

describe('Type Validation Utilities', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('test')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
    });

    it('should return false for empty or non-string values', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('://invalid')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
    });
  });
});

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('December');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });

    it('should throw error for invalid dates', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date provided to formatDate');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for very recent dates', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should return minutes ago for recent dates', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should throw error for invalid dates', () => {
      expect(() => formatRelativeTime('invalid-date')).toThrow(
        'Invalid date provided to formatRelativeTime'
      );
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
      expect(isFutureDate(pastDate)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isFutureDate('invalid-date')).toBe(false);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes correctly', () => {
      const date = new Date('2023-12-25T12:00:00Z');
      const result = addMinutes(date, 30);
      expect(result.getMinutes()).toBe(30);
    });
  });
});

describe('String Utilities', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      expect(truncate('This is a long string', 10, '---')).toBe('This is---');
    });
  });

  describe('toKebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(toKebabCase('CamelCase')).toBe('camel-case');
      expect(toKebabCase('snake_case')).toBe('snake-case');
      expect(toKebabCase('Space Case')).toBe('space-case');
    });
  });

  describe('toCamelCase', () => {
    it('should convert to camelCase', () => {
      expect(toCamelCase('kebab-case')).toBe('kebabCase');
      expect(toCamelCase('Space Case')).toBe('spaceCase');
    });
  });

  describe('getInitials', () => {
    it('should extract initials from names', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Mary Jane Watson')).toBe('MJ');
      expect(getInitials('Single')).toBe('S');
      expect(getInitials('')).toBe('');
    });

    it('should respect maxInitials parameter', () => {
      expect(getInitials('John Doe Smith', 3)).toBe('JDS');
      expect(getInitials('John Doe Smith', 1)).toBe('J');
    });
  });
});

describe('Array Utilities', () => {
  describe('uniqueBy', () => {
    it('should remove duplicates based on key function', () => {
      const items = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John Duplicate' },
      ];
      const unique = uniqueBy(items, item => item.id);
      expect(unique).toHaveLength(2);
      expect(unique[0]?.name).toBe('John');
    });
  });

  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      const items = [1, 2, 3, 4, 5, 6];
      const chunks = chunk(items, 2);
      expect(chunks).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('should handle remainder items', () => {
      const items = [1, 2, 3, 4, 5];
      const chunks = chunk(items, 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should throw error for invalid chunk size', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow('Chunk size must be positive');
    });
  });

  describe('shuffle', () => {
    it('should return array with same length', () => {
      const items = [1, 2, 3, 4, 5];
      const shuffled = shuffle(items);
      expect(shuffled).toHaveLength(items.length);
      expect(shuffled).toEqual(expect.arrayContaining(items));
    });

    it('should not mutate original array', () => {
      const items = [1, 2, 3, 4, 5];
      const original = [...items];
      shuffle(items);
      expect(items).toEqual(original);
    });
  });
});

describe('Object Utilities', () => {
  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);
      expect(picked).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = omit(obj, ['b', 'd']);
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });
});

describe('Error Utilities', () => {
  describe('handleError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = handleError(error);
      expect(result).toEqual({
        message: 'Test error',
        code: 'Error',
      });
    });

    it('should handle string errors', () => {
      const result = handleError('String error');
      expect(result).toEqual({
        message: 'String error',
      });
    });

    it('should handle unknown errors', () => {
      const result = handleError({ unknown: 'error' });
      expect(result.message).toBe('Unknown error occurred');
    });
  });

  describe('createApiError', () => {
    it('should create standardized API error', () => {
      const error = createApiError('Test error', 'TEST_ERROR', 400);
      expect(error).toEqual({
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });
  });
});

describe('Async Utilities', () => {
  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('retry', () => {
    it('should retry failed function', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'Success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('Success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes in time', async () => {
      const promise = Promise.resolve('Success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('Success');
    });

    it('should reject if timeout is reached', async () => {
      const promise = delay(200).then(() => 'Success');

      await expect(withTimeout(promise, 100, 'Timeout!')).rejects.toThrow('Timeout!');
    });
  });
});
