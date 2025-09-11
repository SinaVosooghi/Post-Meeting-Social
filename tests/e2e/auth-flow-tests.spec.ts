import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests - Jump.ai Challenge', () => {
  test('Sign in page loads correctly', async ({ page }) => {
    await page.goto('/auth/signin');

    // Verify sign in page elements
    await expect(page.locator('h1')).toContainText('Welcome to Post-Meeting Social');
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Sign in with LinkedIn')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/06-signin-page.png', fullPage: true });
  });

  test('OAuth buttons are clickable', async ({ page }) => {
    await page.goto('/auth/signin');

    // Test Google OAuth button
    await page.click('text=Continue with Google');
    // Should redirect to Google OAuth (we'll mock this)

    // Test LinkedIn OAuth button
    try {
      await page.goto('/auth/signin', { waitUntil: 'networkidle' });
    } catch (error) {
      // Retry once for Firefox
      await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
    }
    await page.click('text=Sign in with LinkedIn');
    // Should redirect to LinkedIn OAuth (we'll mock this)

    await page.screenshot({ path: 'tests/screenshots/07-oauth-buttons.png', fullPage: true });
  });

  test('Unauthenticated user sees sign-in prompts', async ({ page }) => {
    await page.goto('/');

    // Verify sign-in prompts are shown
    await expect(page.locator('text=Sign In to Generate Posts')).toBeVisible();
    await expect(page.locator('text=Sign In to Generate Email')).toBeVisible();

    // Click sign-in button
    await page.click('text=Sign In to Generate Posts');
    await expect(page).toHaveURL(/.*auth.*signin.*/);

    await page.screenshot({ path: 'tests/screenshots/08-signin-prompt.png', fullPage: true });
  });

  test('Demo page shows LinkedIn connection', async ({ page }) => {
    await page.goto('/demo');

    // Verify LinkedIn connection elements
    await expect(page.locator('button:has-text("Connect LinkedIn")')).toBeVisible();
    await expect(page.locator('text=LinkedIn OAuth')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/09-linkedin-connection.png', fullPage: true });
  });

  test('Settings page shows OAuth configuration', async ({ page }) => {
    await page.goto('/settings');

    // Verify settings page elements
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('h2:has-text("Social Media Connections")')).toBeVisible();
    await expect(page.locator('h2:has-text("Bot Settings")')).toBeVisible();
    await expect(page.locator('h3:has-text("LinkedIn")').first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/10-settings-page.png', fullPage: true });
  });
});
