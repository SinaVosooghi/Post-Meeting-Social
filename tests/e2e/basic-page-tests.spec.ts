import { test, expect } from '@playwright/test';
import { mockNextAuthSession, createMockGoogleSession } from './auth-helper';

test.describe('Basic Page Tests - Jump.ai Challenge', () => {
  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');

    // Verify main heading
    await expect(page.locator('h1')).toContainText('Post-Meeting Social Content Generator');

    // Verify key elements are visible
    await expect(page.locator('text=Transform your meeting transcripts')).toBeVisible();
    await expect(page.locator('text=✅ Phase 1: Core AI Functionality Demo')).toBeVisible();

    // Take screenshot for proof
    await page.screenshot({ path: 'tests/screenshots/01-landing-page.png', fullPage: true });
  });

  test('Navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Test direct navigation to pages (no auth required)
    await page.goto('/demo');
    await expect(page).toHaveURL('/demo');
    await expect(page.locator('h1')).toContainText('Post-Meeting Social Media Generator');

    await page.goto('/calendar');
    await expect(page).toHaveURL('/calendar');

    await page.goto('/meetings');
    await expect(page).toHaveURL('/meetings');

    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');

    await page.screenshot({ path: 'tests/screenshots/02-navigation.png', fullPage: true });
  });

  test('Demo page loads with correct elements', async ({ page }) => {
    await page.goto('/demo');

    // Verify demo page elements
    await expect(page.locator('h1')).toContainText('Post-Meeting Social Media Generator');
    await expect(page.locator('text=Complete workflow demonstration')).toBeVisible();
    await expect(page.locator('text=Step 1: Generate AI Content')).toBeVisible();
    await expect(page.locator('text=Step 2: Publish to LinkedIn')).toBeVisible();

    // Verify buttons are present
    await expect(page.locator('text=Generate LinkedIn Post')).toBeVisible();
    await expect(page.locator('button:has-text("Publish to LinkedIn")')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/03-demo-page.png', fullPage: true });
  });

  test('Home page content generation UI works', async ({ page }) => {
    await page.goto('/');

    // Verify transcript textarea is present
    await expect(page.locator('textarea[id="transcript"]')).toBeVisible();

    // Verify meeting context is displayed
    await expect(page.locator('text=Meeting Context:')).toBeVisible();
    await expect(page.locator('text=Title: Q4 Portfolio Review with Sarah Johnson')).toBeVisible();

    // Verify action buttons are present
    await expect(page.locator('text=Generate Social Posts')).toBeVisible();
    await expect(page.locator('text=Sign In to Generate Email')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/04-home-page-ui.png', fullPage: true });
  });

  test('Mobile responsiveness works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Transform your meeting transcripts')).toBeVisible();

    // Test mobile navigation (direct navigation since no auth)
    await page.goto('/demo');
    await expect(page).toHaveURL('/demo');

    await page.screenshot({ path: 'tests/screenshots/05-mobile-layout.png', fullPage: true });
  });
});
