-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `role` ENUM('PATIENT', 'NUTRITIONIST', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NULL,
    `height` DOUBLE NULL,
    `age` INTEGER NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `activityLevel` ENUM('SEDENTARY', 'MODERATE', 'HIGH') NOT NULL DEFAULT 'MODERATE',
    `workSchedule` VARCHAR(191) NULL,
    `usualSleepHours` DOUBLE NULL,
    `allergies` TEXT NULL,
    `intolerances` TEXT NULL,
    `dietaryPreferences` TEXT NULL,
    `mode` ENUM('AUTONOMOUS', 'SUPERVISED') NOT NULL DEFAULT 'AUTONOMOUS',
    `nutritionistId` VARCHAR(191) NULL,
    `inviteCode` VARCHAR(191) NULL,
    `targetCaloriesMin` INTEGER NULL,
    `targetCaloriesMax` INTEGER NULL,
    `targetProteinG` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Patient_userId_key`(`userId`),
    UNIQUE INDEX `Patient_inviteCode_key`(`inviteCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Nutritionist` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `specialty` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Nutritionist_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealPlan` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `nutritionistId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `targetCalMin` INTEGER NULL,
    `targetCalMax` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlannedMeal` (
    `id` VARCHAR(191) NOT NULL,
    `mealPlanId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT') NOT NULL,
    `description` TEXT NOT NULL,
    `colorTag` ENUM('BLUE_PROTEIN', 'ORANGE_CARBS', 'GREEN_VEGGIES', 'NEUTRAL') NOT NULL DEFAULT 'NEUTRAL',
    `orderIndex` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Intake` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `plannedMealId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT') NOT NULL,
    `status` ENUM('PLANNED', 'COMPLETED', 'MODIFIED', 'SKIPPED') NOT NULL DEFAULT 'PLANNED',
    `planDescription` TEXT NULL,
    `actualDescription` TEXT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `digestiveFeedback` ENUM('GOOD', 'NEUTRAL', 'BAD') NULL,
    `hasGas` BOOLEAN NULL,
    `processedFoodType` ENUM('GOOD_PROCESSED', 'ULTRA_PROCESSED', 'NEUTRAL') NULL,
    `extraFat10g` INTEGER NOT NULL DEFAULT 0,
    `extraProtein10g` INTEGER NOT NULL DEFAULT 0,
    `extraFruit` INTEGER NOT NULL DEFAULT 0,
    `extremeHunger` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `group` ENUM('PROTEIN', 'FAT', 'CARBOHYDRATE', 'VEGETABLE', 'FRUIT', 'DAIRY', 'LEGUME', 'OTHER') NOT NULL,
    `subgroup` VARCHAR(191) NULL,
    `processedType` ENUM('GOOD_PROCESSED', 'ULTRA_PROCESSED', 'NEUTRAL') NOT NULL DEFAULT 'NEUTRAL',
    `caloriesPer100g` DOUBLE NULL,
    `proteinPer100g` DOUBLE NULL,
    `fatPer100g` DOUBLE NULL,
    `carbsPer100g` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntakeFoodItem` (
    `id` VARCHAR(191) NOT NULL,
    `intakeId` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `grams` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitLog` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `sleepHours` DOUBLE NULL,
    `bedtime` DATETIME(3) NULL,
    `wakeTime` DATETIME(3) NULL,
    `lastMealTime` DATETIME(3) NULL,
    `breakfastTime` DATETIME(3) NULL,
    `fastingDurationHours` DOUBLE NULL,
    `waterGlasses` INTEGER NULL,
    `waterObjective` INTEGER NOT NULL DEFAULT 8,
    `strengthSessions` INTEGER NULL,
    `cardioMinutes` DOUBLE NULL,
    `cardioAvgBpm` INTEGER NULL,
    `naturalLightMinutes` INTEGER NULL,
    `naturalLightMorning` BOOLEAN NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HabitLog_patientId_date_key`(`patientId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplement` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `defaultDose` DOUBLE NULL,
    `defaultDoseUnit` VARCHAR(191) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatientSupplement` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `supplementId` VARCHAR(191) NOT NULL,
    `doseMg` DOUBLE NULL,
    `doseUnit` VARCHAR(191) NULL,
    `scheduledTime` VARCHAR(191) NULL,
    `frequency` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplementLog` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `patientSupplementId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `taken` BOOLEAN NOT NULL DEFAULT false,
    `actualTime` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `type` ENUM('WEIGHT_LOSS', 'WEIGHT_GAIN', 'BODY_COMPOSITION', 'PERFORMANCE', 'HEALTH_GENERAL') NOT NULL,
    `targetValue` DOUBLE NULL,
    `targetDate` DATETIME(3) NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgressLog` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `weight` DOUBLE NULL,
    `bodyFatPercent` DOUBLE NULL,
    `muscleMassKg` DOUBLE NULL,
    `waistCm` DOUBLE NULL,
    `hipCm` DOUBLE NULL,
    `energyLevel` INTEGER NULL,
    `hungerLevel` INTEGER NULL,
    `moodLevel` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProgressLog_patientId_date_key`(`patientId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviationAlert` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NULL,
    `nutritionistId` VARCHAR(191) NULL,
    `type` ENUM('CARBS_AT_DINNER', 'LOW_ADHERENCE', 'BAD_DIGESTION', 'MISSING_LOGS', 'EXTREME_HUNGER', 'GAS_LEGUMES', 'SUPPLEMENT_MISSED', 'CUSTOM') NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_nutritionistId_fkey` FOREIGN KEY (`nutritionistId`) REFERENCES `Nutritionist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nutritionist` ADD CONSTRAINT `Nutritionist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealPlan` ADD CONSTRAINT `MealPlan_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealPlan` ADD CONSTRAINT `MealPlan_nutritionistId_fkey` FOREIGN KEY (`nutritionistId`) REFERENCES `Nutritionist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlannedMeal` ADD CONSTRAINT `PlannedMeal_mealPlanId_fkey` FOREIGN KEY (`mealPlanId`) REFERENCES `MealPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Intake` ADD CONSTRAINT `Intake_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Intake` ADD CONSTRAINT `Intake_plannedMealId_fkey` FOREIGN KEY (`plannedMealId`) REFERENCES `PlannedMeal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntakeFoodItem` ADD CONSTRAINT `IntakeFoodItem_intakeId_fkey` FOREIGN KEY (`intakeId`) REFERENCES `Intake`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntakeFoodItem` ADD CONSTRAINT `IntakeFoodItem_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitLog` ADD CONSTRAINT `HabitLog_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientSupplement` ADD CONSTRAINT `PatientSupplement_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientSupplement` ADD CONSTRAINT `PatientSupplement_supplementId_fkey` FOREIGN KEY (`supplementId`) REFERENCES `Supplement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplementLog` ADD CONSTRAINT `SupplementLog_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplementLog` ADD CONSTRAINT `SupplementLog_patientSupplementId_fkey` FOREIGN KEY (`patientSupplementId`) REFERENCES `PatientSupplement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgressLog` ADD CONSTRAINT `ProgressLog_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviationAlert` ADD CONSTRAINT `DeviationAlert_nutritionistId_fkey` FOREIGN KEY (`nutritionistId`) REFERENCES `Nutritionist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
