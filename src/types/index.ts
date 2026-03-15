import { DigestiveMood, IntakeStatus, MealType, ProcessedType } from "@prisma/client";

export interface IntakeCreateInput {
  patientId: string;
  plannedMealId?: string;
  date: Date;
  mealType: MealType;
  status?: IntakeStatus;
  planDescription?: string;
  actualDescription?: string;
  photoUrl?: string;
  digestiveFeedback?: DigestiveMood;
  hasGas?: boolean;
  processedFoodType?: ProcessedType;
  extraFat10g?: number;
  extraProtein10g?: number;
  extraFruit?: number;
  extremeHunger?: boolean;
  notes?: string;
}

export interface HabitLogCreateInput {
  patientId: string;
  date: Date;
  sleepHours?: number;
  bedtime?: Date;
  wakeTime?: Date;
  lastMealTime?: Date;
  breakfastTime?: Date;
  waterGlasses?: number;
  strengthSessions?: number;
  cardioMinutes?: number;
  cardioAvgBpm?: number;
  naturalLightMinutes?: number;
  naturalLightMorning?: boolean;
  notes?: string;
}

export interface ProgressLogCreateInput {
  patientId: string;
  date: Date;
  weight?: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  waistCm?: number;
  hipCm?: number;
  energyLevel?: number;
  hungerLevel?: number;
  moodLevel?: number;
  notes?: string;
}

export interface AIAnalysisInput {
  patientId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface AIFeedback {
  summary: string;
  recommendations: string[];
  alerts: string[];
}
