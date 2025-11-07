-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "daily_quota" INTEGER NOT NULL DEFAULT 20,
    "max_length_sec" INTEGER NOT NULL DEFAULT 60,
    "style_prompt" TEXT NOT NULL DEFAULT '',
    "cpm_override" DOUBLE PRECISION,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "script_text" TEXT NOT NULL DEFAULT '',
    "voice_path" TEXT,
    "video_path" TEXT,
    "platform_video_id" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "review_source" TEXT,
    "review_message" TEXT,
    "telegram_message_id" TEXT,
    "preview_caption" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "content_id" INTEGER,
    "error" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDaily" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "watch_minutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue_brl" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSnapshot" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "estimated_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costs_api" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costs_infra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "FinanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDaily_platform_channel_id_date_key" ON "MetricDaily"("platform", "channel_id", "date");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
