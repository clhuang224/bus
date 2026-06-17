-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AppLocaleType" AS ENUM ('zh-TW', 'en');

-- CreateEnum
CREATE TYPE "BearingType" AS ENUM ('east', 'west', 'south', 'north', 'southeast', 'northeast', 'southwest', 'northwest');

-- CreateEnum
CREATE TYPE "CityNameType" AS ENUM ('Taipei', 'NewTaipei', 'Taoyuan', 'Taichung', 'Tainan', 'Kaohsiung', 'Keelung', 'Hsinchu', 'HsinchuCounty', 'MiaoliCounty', 'ChanghuaCounty', 'NantouCounty', 'YunlinCounty', 'ChiayiCounty', 'Chiayi', 'PingtungCounty', 'YilanCounty', 'HualienCounty', 'TaitungCounty', 'KinmenCounty', 'PenghuCounty', 'LienchiangCounty');

-- CreateEnum
CREATE TYPE "DirectionType" AS ENUM ('go', 'return', 'loop', 'shuttle', 'unknown');

-- CreateEnum
CREATE TYPE "RouteShapeSource" AS ENUM ('encoded_polyline', 'geometry', 'stop_positions');

-- CreateEnum
CREATE TYPE "SyncResourceType" AS ENUM ('routes', 'stops', 'stations', 'shapes');

-- CreateEnum
CREATE TYPE "SyncStatusType" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "favorite_route_stop" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "subroute_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "direction" "DirectionType" NOT NULL,
    "stop_sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator" (
    "id" UUID NOT NULL,
    "tdx_operator_id" VARCHAR(64) NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "phone" VARCHAR(50),
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_operator" (
    "route_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,

    CONSTRAINT "route_operator_pkey" PRIMARY KEY ("route_id","operator_id")
);

-- CreateTable
CREATE TABLE "route_shape" (
    "id" UUID NOT NULL,
    "subroute_id" UUID NOT NULL,
    "source" "RouteShapeSource" NOT NULL,
    "path" JSONB NOT NULL,
    "encoded_polyline" TEXT,
    "geometry" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_shape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stop" (
    "id" UUID NOT NULL,
    "subroute_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "tdx_route_id" VARCHAR(64) NOT NULL,
    "city" "CityNameType" NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_ja" VARCHAR(100),
    "name_ko" VARCHAR(100),
    "departure_zh_tw" VARCHAR(100) NOT NULL,
    "departure_en" VARCHAR(100),
    "departure_ja" VARCHAR(100),
    "departure_ko" VARCHAR(100),
    "destination_zh_tw" VARCHAR(100) NOT NULL,
    "destination_en" VARCHAR(100),
    "destination_ja" VARCHAR(100),
    "destination_ko" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_group" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "tdx_station_group_id" VARCHAR(64) NOT NULL,
    "city" "CityNameType" NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_ja" VARCHAR(100),
    "name_ko" VARCHAR(100),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "tdx_station_id" VARCHAR(64) NOT NULL,
    "station_group_id" UUID,
    "city" "CityNameType" NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_ja" VARCHAR(100),
    "name_ko" VARCHAR(100),
    "address_zh_tw" VARCHAR(255),
    "address_en" VARCHAR(255),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "bearing" "BearingType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "tdx_stop_id" VARCHAR(64) NOT NULL,
    "station_id" UUID,
    "city" "CityNameType" NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_ja" VARCHAR(100),
    "name_ko" VARCHAR(100),
    "address_zh_tw" VARCHAR(255),
    "address_en" VARCHAR(255),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "bearing" "BearingType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subroute" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "tdx_subroute_id" VARCHAR(64) NOT NULL,
    "route_id" UUID NOT NULL,
    "direction" "DirectionType" NOT NULL,
    "name_zh_tw" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "name_ja" VARCHAR(100),
    "name_ko" VARCHAR(100),
    "departure_zh_tw" VARCHAR(100) NOT NULL,
    "departure_en" VARCHAR(100),
    "departure_ja" VARCHAR(100),
    "departure_ko" VARCHAR(100),
    "destination_zh_tw" VARCHAR(100) NOT NULL,
    "destination_en" VARCHAR(100),
    "destination_ja" VARCHAR(100),
    "destination_ko" VARCHAR(100),
    "first_bus_time" VARCHAR(10),
    "last_bus_time" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_at" TIMESTAMP(3),
    "tdx_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subroute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_error" (
    "id" UUID NOT NULL,
    "sync_run_id" UUID NOT NULL,
    "resource" "SyncResourceType" NOT NULL,
    "tdx_uuid" VARCHAR(64),
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_run" (
    "id" UUID NOT NULL,
    "resource" "SyncResourceType" NOT NULL,
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

    CONSTRAINT "sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_setting" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "locale" "AppLocaleType" NOT NULL DEFAULT 'zh-TW',
    "is_google_analytics_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" UUID NOT NULL,
    "uuid" VARCHAR(64) NOT NULL,
    "plate_number" VARCHAR(50) NOT NULL,
    "city" "CityNameType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_route_stop_uuid_key" ON "favorite_route_stop"("uuid");

-- CreateIndex
CREATE INDEX "favorite_route_stop_route_id_idx" ON "favorite_route_stop"("route_id");

-- CreateIndex
CREATE INDEX "favorite_route_stop_subroute_id_idx" ON "favorite_route_stop"("subroute_id");

-- CreateIndex
CREATE INDEX "favorite_route_stop_stop_id_idx" ON "favorite_route_stop"("stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_route_stop_user_id_route_id_subroute_id_stop_id_di_key" ON "favorite_route_stop"("user_id", "route_id", "subroute_id", "stop_id", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "operator_tdx_operator_id_key" ON "operator"("tdx_operator_id");

-- CreateIndex
CREATE INDEX "route_operator_operator_id_idx" ON "route_operator"("operator_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_shape_subroute_id_key" ON "route_shape"("subroute_id");

-- CreateIndex
CREATE INDEX "route_stop_stop_id_idx" ON "route_stop"("stop_id");

-- CreateIndex
CREATE INDEX "route_stop_subroute_id_sequence_idx" ON "route_stop"("subroute_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "route_stop_subroute_id_sequence_key" ON "route_stop"("subroute_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "route_uuid_key" ON "route"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "route_city_tdx_route_id_key" ON "route"("city", "tdx_route_id");

-- CreateIndex
CREATE UNIQUE INDEX "station_group_uuid_key" ON "station_group"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "station_group_city_tdx_station_group_id_key" ON "station_group"("city", "tdx_station_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "station_uuid_key" ON "station"("uuid");

-- CreateIndex
CREATE INDEX "station_station_group_id_idx" ON "station"("station_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "station_city_tdx_station_id_key" ON "station"("city", "tdx_station_id");

-- CreateIndex
CREATE UNIQUE INDEX "stop_uuid_key" ON "stop"("uuid");

-- CreateIndex
CREATE INDEX "stop_station_id_idx" ON "stop"("station_id");

-- CreateIndex
CREATE UNIQUE INDEX "stop_city_tdx_stop_id_key" ON "stop"("city", "tdx_stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "subroute_uuid_key" ON "subroute"("uuid");

-- CreateIndex
CREATE INDEX "subroute_route_id_idx" ON "subroute"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "subroute_route_id_direction_tdx_subroute_id_key" ON "subroute"("route_id", "direction", "tdx_subroute_id");

-- CreateIndex
CREATE INDEX "sync_error_sync_run_id_idx" ON "sync_error"("sync_run_id");

-- CreateIndex
CREATE INDEX "sync_error_resource_idx" ON "sync_error"("resource");

-- CreateIndex
CREATE INDEX "sync_run_resource_status_idx" ON "sync_run"("resource", "status");

-- CreateIndex
CREATE INDEX "sync_run_created_at_idx" ON "sync_run"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_setting_user_id_key" ON "user_setting"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_uuid_key" ON "user"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_uuid_key" ON "vehicle"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_city_plate_number_key" ON "vehicle"("city", "plate_number");

-- AddForeignKey
ALTER TABLE "favorite_route_stop" ADD CONSTRAINT "favorite_route_stop_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_route_stop" ADD CONSTRAINT "favorite_route_stop_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_route_stop" ADD CONSTRAINT "favorite_route_stop_subroute_id_fkey" FOREIGN KEY ("subroute_id") REFERENCES "subroute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_route_stop" ADD CONSTRAINT "favorite_route_stop_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_operator" ADD CONSTRAINT "route_operator_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_operator" ADD CONSTRAINT "route_operator_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_shape" ADD CONSTRAINT "route_shape_subroute_id_fkey" FOREIGN KEY ("subroute_id") REFERENCES "subroute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_subroute_id_fkey" FOREIGN KEY ("subroute_id") REFERENCES "subroute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station" ADD CONSTRAINT "station_station_group_id_fkey" FOREIGN KEY ("station_group_id") REFERENCES "station_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop" ADD CONSTRAINT "stop_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subroute" ADD CONSTRAINT "subroute_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_error" ADD CONSTRAINT "sync_error_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "sync_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_setting" ADD CONSTRAINT "user_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
