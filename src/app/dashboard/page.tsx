/**
 * Dashboard Page
 * Shows meetings and allows posting to LinkedIn
 */

import { auth } from '@/lib/auth';
import { MeetingPostCard } from '@/components/MeetingPostCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

import {
  ClientMeeting,
  MeetingPlatform,
  RecordingStatus,
  TranscriptStatus,
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
      relationshipType: 'client',
      riskProfile: 'moderate',
      investmentExperience: 'intermediate',
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
      riskLevel: 'medium',
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
        riskToleranceThreshold: 'medium',
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
        firmType: 'ria',
        aum: 500000000,
        clientCount: 200,
        complianceFramework: 'multiple',
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
      relationshipType: 'client',
      riskProfile: 'conservative',
      investmentExperience: 'beginner',
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
      riskLevel: 'low',
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
        riskToleranceThreshold: 'medium',
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
        firmType: 'ria',
        aum: 500000000,
        clientCount: 200,
        complianceFramework: 'multiple',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

async function DashboardContent() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please sign in to access the dashboard.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Recent Meetings</h1>

      <div className="space-y-6">
        {MOCK_MEETINGS.map(meeting => (
          <MeetingPostCard
            key={meeting.id}
            meeting={meeting}
            onPublish={async post => {
              console.log('Published post:', post);
              // Add real post handling here
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <DashboardContent />
    </div>
  );
}
