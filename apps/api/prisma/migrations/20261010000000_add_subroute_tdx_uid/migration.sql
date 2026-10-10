-- AlterTable
ALTER TABLE "subroute" ADD COLUMN "tdx_subroute_uid" VARCHAR(64);

-- Backfill existing rows. Sync builds subroute uuid as "<SubRouteUID>-<Direction>".
UPDATE "subroute" SET "tdx_subroute_uid" = regexp_replace("uuid", '-[0-9]+$', '');

-- AlterTable
ALTER TABLE "subroute" ALTER COLUMN "tdx_subroute_uid" SET NOT NULL;
