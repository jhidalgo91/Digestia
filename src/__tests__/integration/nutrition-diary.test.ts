/**
 * Integration tests: Patient nutrition diary workflow.
 * Tests the complete flow of a patient recording their meals,
 * habits, and receiving AI analysis — all with mocked dependencies.
 */
import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET as getIntakes, POST as postIntake } from "@/app/api/intakes/route";
import { POST as postHabit } from "@/app/api/habits/route";
import { POST as postProgress } from "@/app/api/progress/route";
import { POST as postAnalyze } from "@/app/api/ai/analyze/route";
import { buildRequest } from "../helpers";

const PATIENT_ID = "integration-patient-1";
const TODAY = "2024-03-15";

describe("Integration: Patient nutrition diary workflow", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows a patient to record breakfast intake, sleep habit, weight, and receive AI analysis", async () => {
    // Step 1: Record breakfast intake
    const createdIntake = {
      id: "intake-breakfast",
      patientId: PATIENT_ID,
      date: new Date(TODAY),
      mealType: "BREAKFAST",
      status: "COMPLETED",
      digestiveFeedback: "GOOD",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.create as any).mockResolvedValueOnce(createdIntake);

    const intakeReq = buildRequest("/api/intakes", {
      method: "POST",
      body: {
        patientId: PATIENT_ID,
        date: `${TODAY}T08:30:00Z`,
        mealType: "BREAKFAST",
        status: "COMPLETED",
        digestiveFeedback: "GOOD",
      },
    });
    const intakeRes = await postIntake(intakeReq);
    expect(intakeRes.status).toBe(201);
    const intakeBody = await intakeRes.json();
    expect(intakeBody.mealType).toBe("BREAKFAST");

    // Step 2: Record habit log for the day
    const createdHabit = {
      id: "habit-1",
      patientId: PATIENT_ID,
      date: new Date(TODAY),
      sleepHours: 7.5,
      waterGlasses: 8,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.upsert as any).mockResolvedValueOnce(createdHabit);

    const habitReq = buildRequest("/api/habits", {
      method: "POST",
      body: {
        patientId: PATIENT_ID,
        date: TODAY,
        sleepHours: 7.5,
        waterGlasses: 8,
      },
    });
    const habitRes = await postHabit(habitReq);
    expect(habitRes.status).toBe(201);
    const habitBody = await habitRes.json();
    expect(habitBody.sleepHours).toBe(7.5);

    // Step 3: Record weight progress
    const createdProgress = {
      id: "progress-1",
      patientId: PATIENT_ID,
      date: new Date(TODAY),
      weight: 73.2,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.upsert as any).mockResolvedValueOnce(createdProgress);

    const progressReq = buildRequest("/api/progress", {
      method: "POST",
      body: {
        patientId: PATIENT_ID,
        date: TODAY,
        weight: 73.2,
      },
    });
    const progressRes = await postProgress(progressReq);
    expect(progressRes.status).toBe(201);
    const progressBody = await progressRes.json();
    expect(progressBody.weight).toBe(73.2);

    // Step 4: Request AI weekly analysis
    const weeklyIntakes = [
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
      { status: "MODIFIED", digestiveFeedback: "NEUTRAL", extremeHunger: true },
    ];
    const weeklyHabits = [{ sleepHours: 7.5 }, { sleepHours: 8 }];
    const weeklyProgress = [{ weight: 73.2 }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValueOnce(weeklyIntakes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValueOnce(weeklyHabits);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValueOnce(weeklyProgress);

    const aiResponse = "Buena semana. Mantén la hidratación y duerme al menos 8 horas.";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: aiResponse } }] }),
    });

    const analyzeReq = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: {
        patientId: PATIENT_ID,
        dateFrom: "2024-03-09",
        dateTo: "2024-03-15",
      },
    });
    const analyzeRes = await postAnalyze(analyzeReq);
    expect(analyzeRes.status).toBe(200);
    const analyzeBody = await analyzeRes.json();
    expect(analyzeBody.feedback).toBe(aiResponse);
  });

  it("retrieves all intakes after recording multiple meals", async () => {
    const storedIntakes = [
      { id: "i-1", patientId: PATIENT_ID, mealType: "BREAKFAST", status: "COMPLETED" },
      { id: "i-2", patientId: PATIENT_ID, mealType: "LUNCH", status: "COMPLETED" },
      { id: "i-3", patientId: PATIENT_ID, mealType: "DINNER", status: "MODIFIED" },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValueOnce(storedIntakes);

    const getReq = buildRequest("/api/intakes", {
      searchParams: { patientId: PATIENT_ID, date: TODAY },
    });
    const getRes = await getIntakes(getReq);
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body).toHaveLength(3);
    const mealTypes = body.map((i: { mealType: string }) => i.mealType);
    expect(mealTypes).toContain("BREAKFAST");
    expect(mealTypes).toContain("LUNCH");
    expect(mealTypes).toContain("DINNER");
  });
});
