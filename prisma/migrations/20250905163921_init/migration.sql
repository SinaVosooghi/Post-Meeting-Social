-- CreateEnum
CREATE TYPE "public"."meeting_platform" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."transcript_status" AS ENUM ('PENDING', 'RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "public"."attendee_response_status" AS ENUM ('ACCEPTED', 'DECLINED', 'TENTATIVE', 'NEEDS_ACTION');

-- CreateEnum
CREATE TYPE "public"."social_platform" AS ENUM ('LINKEDIN', 'FACEBOOK', 'TWITTER');

-- CreateEnum
CREATE TYPE "public"."post_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."meetings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "platform" "public"."meeting_platform" NOT NULL DEFAULT 'ZOOM',
    "meetingUrl" TEXT NOT NULL,
    "recallBotId" TEXT,
    "transcript" TEXT,
    "transcriptStatus" "public"."transcript_status" NOT NULL DEFAULT 'PENDING',
    "followUpEmail" TEXT,
    "botEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_attendees" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "responseStatus" "public"."attendee_response_status" NOT NULL DEFAULT 'NEEDS_ACTION',

    CONSTRAINT "meeting_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."generated_posts" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "platform" "public"."social_platform" NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "status" "public"."post_status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "automationId" TEXT,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."automations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" "public"."social_platform" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "prompt" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botJoinMinutesBefore" INTEGER NOT NULL DEFAULT 5,
    "autoGeneratePosts" BOOLEAN NOT NULL DEFAULT true,
    "autoPublishPosts" BOOLEAN NOT NULL DEFAULT false,
    "defaultPrompt" TEXT NOT NULL DEFAULT 'Generate professional social media posts based on this meeting transcript. Focus on key insights and actionable takeaways.',
    "notificationPreferences" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_userId_calendarEventId_key" ON "public"."meetings"("userId", "calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_attendees_meetingId_email_key" ON "public"."meeting_attendees"("meetingId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "automations_userId_platform_key" ON "public"."automations"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_attendees" ADD CONSTRAINT "meeting_attendees_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."generated_posts" ADD CONSTRAINT "generated_posts_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."generated_posts" ADD CONSTRAINT "generated_posts_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "public"."automations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."automations" ADD CONSTRAINT "automations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
