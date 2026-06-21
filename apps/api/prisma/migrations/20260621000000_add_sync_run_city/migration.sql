-- CreateTable
CREATE TABLE "sync_run_city" (
    "id" UUID NOT NULL,
    "sync_run_id" UUID NOT NULL,
    "city" "CityNameType" NOT NULL,
    "status" "SyncStatusType" NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "records_read" INTEGER NOT NULL DEFAULT 0,
    "records_created" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_deactivated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_run_city_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_run_city_sync_run_id_city_key" ON "sync_run_city"("sync_run_id", "city");

-- CreateIndex
CREATE INDEX "sync_run_city_sync_run_id_status_idx" ON "sync_run_city"("sync_run_id", "status");

-- AddForeignKey
ALTER TABLE "sync_run_city" ADD CONSTRAINT "sync_run_city_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "sync_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
