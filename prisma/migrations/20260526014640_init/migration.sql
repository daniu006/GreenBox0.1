-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "fcmTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "minTemperature" DOUBLE PRECISION NOT NULL,
    "maxTemperature" DOUBLE PRECISION NOT NULL,
    "minHumidity" DOUBLE PRECISION NOT NULL,
    "maxHumidity" DOUBLE PRECISION NOT NULL,
    "lightHours" DOUBLE PRECISION NOT NULL,
    "minWaterLevel" DOUBLE PRECISION NOT NULL,
    "minSoilMoisture" DOUBLE PRECISION,
    "wateringFrequency" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plants" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "boxId" INTEGER NOT NULL,
    "plantId" INTEGER NOT NULL,
    "nickname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" SERIAL NOT NULL,
    "userPlantId" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "soilMoisture" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lightHours" DOUBLE PRECISION NOT NULL,
    "waterLevel" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "histories" (
    "id" SERIAL NOT NULL,
    "userPlantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "soilMoisture" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lightHours" DOUBLE PRECISION NOT NULL,
    "waterLevel" DOUBLE PRECISION NOT NULL,
    "estimatedHealth" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistics" (
    "id" SERIAL NOT NULL,
    "userPlantId" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "avgTemperature" DOUBLE PRECISION NOT NULL,
    "avgHumidity" DOUBLE PRECISION NOT NULL,
    "avgLightHours" DOUBLE PRECISION NOT NULL,
    "avgWaterLevel" DOUBLE PRECISION NOT NULL,
    "avgSoilMoisture" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedHealth" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "userPlantId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_photos" (
    "id" SERIAL NOT NULL,
    "userPlantId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aiAnalysis" JSONB,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" SERIAL NOT NULL,
    "plantId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "step" INTEGER,
    "image" TEXT,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_code_key" ON "boxes"("code");

-- CreateIndex
CREATE INDEX "boxes_userId_idx" ON "boxes"("userId");

-- CreateIndex
CREATE INDEX "user_plants_userId_idx" ON "user_plants"("userId");

-- CreateIndex
CREATE INDEX "user_plants_boxId_idx" ON "user_plants"("boxId");

-- CreateIndex
CREATE INDEX "user_plants_plantId_idx" ON "user_plants"("plantId");

-- CreateIndex
CREATE INDEX "readings_userPlantId_idx" ON "readings"("userPlantId");

-- CreateIndex
CREATE INDEX "readings_timestamp_idx" ON "readings"("timestamp");

-- CreateIndex
CREATE INDEX "histories_userPlantId_date_idx" ON "histories"("userPlantId", "date");

-- CreateIndex
CREATE INDEX "statistics_userPlantId_idx" ON "statistics"("userPlantId");

-- CreateIndex
CREATE UNIQUE INDEX "statistics_userPlantId_week_key" ON "statistics"("userPlantId", "week");

-- CreateIndex
CREATE INDEX "alerts_userPlantId_idx" ON "alerts"("userPlantId");

-- CreateIndex
CREATE INDEX "alerts_resolved_idx" ON "alerts"("resolved");

-- CreateIndex
CREATE INDEX "plant_photos_userPlantId_idx" ON "plant_photos"("userPlantId");

-- CreateIndex
CREATE INDEX "guides_plantId_idx" ON "guides"("plantId");

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "user_plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "user_plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistics" ADD CONSTRAINT "statistics_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "user_plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "user_plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_userPlantId_fkey" FOREIGN KEY ("userPlantId") REFERENCES "user_plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
