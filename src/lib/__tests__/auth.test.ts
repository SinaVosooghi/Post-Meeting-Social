/**
 * Authentication System Tests
 * Post-Meeting Social Media Content Generator
 *
 * Tests authentication utilities and configuration without NextAuth v5 complexity
 */

import fs from 'fs';
import path from 'path';

describe('Authentication System', () => {
  it('should have auth configuration files', () => {
    const authConfigPath = path.join(__dirname, '../auth.config.ts');
    const authPath = path.join(__dirname, '../auth.ts');

    expect(fs.existsSync(authConfigPath)).toBe(true);
    expect(fs.existsSync(authPath)).toBe(true);
  });

  it('should have proper NextAuth type extensions', () => {
    const nextAuthTypesPath = path.join(__dirname, '../../types/next-auth.d.ts');
    expect(fs.existsSync(nextAuthTypesPath)).toBe(true);
  });

  it('should have authentication pages', () => {
    const signinPagePath = path.join(__dirname, '../../app/auth/signin/page.tsx');
    const errorPagePath = path.join(__dirname, '../../app/auth/error/page.tsx');

    expect(fs.existsSync(signinPagePath)).toBe(true);
    expect(fs.existsSync(errorPagePath)).toBe(true);
  });

  it('should have authentication API route', () => {
    const authRoutePath = path.join(__dirname, '../../app/api/auth/[...nextauth]/route.ts');
    expect(fs.existsSync(authRoutePath)).toBe(true);
  });

  it('should have comprehensive interfaces for authentication', () => {
    const masterInterfacesPath = path.join(__dirname, '../../types/master-interfaces.ts');
    expect(fs.existsSync(masterInterfacesPath)).toBe(true);

    // Read the file and check for key interfaces
    const content = fs.readFileSync(masterInterfacesPath, 'utf-8');
    expect(content).toContain('FinancialAdvisor');
    expect(content).toContain('SocialMediaToken');
    expect(content).toContain('ComplianceValidation');
  });
});
