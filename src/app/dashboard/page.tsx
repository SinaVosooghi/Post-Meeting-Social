'use client';

/**
 * Dashboard Page
 * Shows meetings and allows posting to LinkedIn
 */

import { useSession, signOut } from 'next-auth/react';
import { MeetingPostCard } from '@/components/MeetingPostCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import type { ClientMeeting } from '@/types/master-interfaces';
import {
  MeetingPlatform,
  RecordingStatus,
  TranscriptStatus,
  RiskLevel,
  RiskTolerance,
  FirmType,
  ComplianceFramework,
  RelationshipType,
  RiskProfile,
  InvestmentExperience,
} from '@/types/master-interfaces';

// Mock meetings data (replace with real data fetch)
const MOCK_MEETINGS: ClientMeeting[] = [
  {
    id: 'meeting-1',
    advisorId: 'advisor-123',
    calendarEventId: 'cal-1',
    title: 'Investment Strategy Review',
    description: 'Quarterly portfolio review and investment strategy discussion',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    meetingUrl: 'https://meet.google.com/mock-1',
    platform: MeetingPlatform.GOOGLE_MEET,

    clientRelationship: {
      clientId: 'client-123',
      relationshipType: RelationshipType.CLIENT,
      riskProfile: RiskProfile.MODERATE,
      investmentExperience: InvestmentExperience.INTERMEDIATE,
      regulatoryStatus: 'retail',
      communicationPreferences: {
        allowSocialMedia: true,
        privacyLevel: 'public',
        consentToRecord: true,
        dataRetentionConsent: true,
        preferredContactMethod: 'email',
      },
    },

    complianceFlags: {
      containsSensitiveData: false,
      requiresLegalReview: false,
      hasInvestmentAdvice: true,
      needsDisclaimer: true,
      riskLevel: RiskLevel.MEDIUM,
      topicsDiscussed: ['portfolio review', 'market outlook', 'investment strategy'],
    },

    recordingDetails: {
      botId: 'bot-123',
      recordingStatus: RecordingStatus.COMPLETED,
      transcriptStatus: TranscriptStatus.COMPLETED,
      transcript: 'Mock transcript content for investment strategy review...',
      recordingUrl: 'https://storage.example.com/recording-1.mp4',
      transcriptUrl: 'https://storage.example.com/transcript-1.txt',
      duration: 3600,
      participantCount: 2,
    },

    createdAt: new Date(),
    updatedAt: new Date(),

    advisor: {
      id: 'advisor-123',
      userId: 'user-123',
      firmName: 'Example Wealth Management',
      licenseNumbers: {
        series7: '1234567',
        series66: '7654321',
        stateRegistrations: ['NY', 'CA'],
        crd: '123456',
      },
      complianceSettings: {
        riskToleranceThreshold: RiskTolerance.MEDIUM,
        requiredDisclosures: ['investment disclaimer'],
        approvedHashtags: ['WealthManagement', 'FinancialPlanning'],
        restrictedTopics: ['specific stocks', 'guarantees'],
        autoApprovalThreshold: 80,
        contentReviewRequired: true,
        supervisorApprovalRequired: false,
      },
      regulatoryRequirements: {
        finraRegistered: true,
        secRegistered: true,
        stateRequirements: ['NY fiduciary', 'CA fiduciary'],
        recordKeepingPeriod: 7,
        complianceOfficer: 'Jane Smith',
        lastComplianceReview: new Date(),
      },
      firmSettings: {
        firmType: FirmType.RIA,
        aum: 500000000,
        clientCount: 200,
        complianceFramework: ComplianceFramework.MULTIPLE,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 'meeting-2',
    advisorId: 'advisor-123',
    calendarEventId: 'cal-2',
    title: 'Retirement Planning Session',
    description: '401(k) optimization and retirement timeline planning',
    startTime: new Date(Date.now() - 7200000),
    endTime: new Date(Date.now() - 3600000),
    meetingUrl: 'https://meet.google.com/mock-2',
    platform: MeetingPlatform.GOOGLE_MEET,

    clientRelationship: {
      clientId: 'client-456',
      relationshipType: RelationshipType.CLIENT,
      riskProfile: RiskProfile.CONSERVATIVE,
      investmentExperience: InvestmentExperience.BEGINNER,
      regulatoryStatus: 'retail',
      communicationPreferences: {
        allowSocialMedia: true,
        privacyLevel: 'connections_only',
        consentToRecord: true,
        dataRetentionConsent: true,
        preferredContactMethod: 'email',
      },
    },

    complianceFlags: {
      containsSensitiveData: false,
      requiresLegalReview: false,
      hasInvestmentAdvice: true,
      needsDisclaimer: true,
      riskLevel: RiskLevel.LOW,
      topicsDiscussed: ['retirement planning', '401k', 'tax strategy'],
    },

    recordingDetails: {
      botId: 'bot-456',
      recordingStatus: RecordingStatus.COMPLETED,
      transcriptStatus: TranscriptStatus.COMPLETED,
      transcript: 'Mock transcript content for retirement planning...',
      recordingUrl: 'https://storage.example.com/recording-2.mp4',
      transcriptUrl: 'https://storage.example.com/transcript-2.txt',
      duration: 3600,
      participantCount: 2,
    },

    createdAt: new Date(),
    updatedAt: new Date(),

    advisor: {
      id: 'advisor-123',
      userId: 'user-123',
      firmName: 'Example Wealth Management',
      licenseNumbers: {
        series7: '1234567',
        series66: '7654321',
        stateRegistrations: ['NY', 'CA'],
        crd: '123456',
      },
      complianceSettings: {
        riskToleranceThreshold: RiskTolerance.MEDIUM,
        requiredDisclosures: ['investment disclaimer'],
        approvedHashtags: ['WealthManagement', 'FinancialPlanning'],
        restrictedTopics: ['specific stocks', 'guarantees'],
        autoApprovalThreshold: 80,
        contentReviewRequired: true,
        supervisorApprovalRequired: false,
      },
      regulatoryRequirements: {
        finraRegistered: true,
        secRegistered: true,
        stateRequirements: ['NY fiduciary', 'CA fiduciary'],
        recordKeepingPeriod: 7,
        complianceOfficer: 'Jane Smith',
        lastComplianceReview: new Date(),
      },
      firmSettings: {
        firmType: FirmType.RIA,
        aum: 500000000,
        clientCount: 200,
        complianceFramework: ComplianceFramework.MULTIPLE,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access the dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Recent Meetings</h1>
          <Button
            variant="outline"
            onClick={() => {
              void signOut({ callbackUrl: '/auth/signin' });
            }}
          >
            Sign Out
          </Button>
        </div>

        <div className="space-y-6">
          {MOCK_MEETINGS.map(meeting => (
            <MeetingPostCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </div>
    </div>
  );
}
