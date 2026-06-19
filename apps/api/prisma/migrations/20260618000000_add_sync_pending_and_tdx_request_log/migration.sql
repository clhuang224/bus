-- AlterEnum
ALTER TYPE "AppLocaleType" ADD VALUE IF NOT EXISTS 'ja';
ALTER TYPE "AppLocaleType" ADD VALUE IF NOT EXISTS 'ko';
ALTER TYPE "SyncStatusType" ADD VALUE IF NOT EXISTS 'pending';

-- AlterTable
ALTER TABLE "sync_run" ADD COLUMN "resume_after_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tdx_request_log" (
    "id" UUID NOT NULL,
    "sync_run_id" UUID,
    "resource" "SyncResourceType",
    "method" VARCHAR(10) NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER,
    "request_bytes" INTEGER NOT NULL DEFAULT 0,
    "response_bytes" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,

    CONSTRAINT "tdx_request_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_run_resume_after_at_idx" ON "sync_run"("resume_after_at");

-- CreateIndex
CREATE INDEX "tdx_request_log_sync_run_id_idx" ON "tdx_request_log"("sync_run_id");

-- CreateIndex
CREATE INDEX "tdx_request_log_requested_at_idx" ON "tdx_request_log"("requested_at");

-- CreateIndex
CREATE INDEX "tdx_request_log_resource_requested_at_idx" ON "tdx_request_log"("resource", "requested_at");

-- AddForeignKey
ALTER TABLE "tdx_request_log" ADD CONSTRAINT "tdx_request_log_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "sync_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;
