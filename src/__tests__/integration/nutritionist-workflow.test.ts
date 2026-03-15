/**
 * Integration tests: Nutritionist patient-management workflow.
 * Tests the flow of a nutritionist listing patients, creating deviation alerts,
 * and reviewing unread alerts.
 */
import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET as getPatients } from "@/app/api/patients/route";
import { GET as getAlerts, POST as postAlert } from "@/app/api/alerts/route";
import { buildRequest } from "../helpers";

const NUTRITIONIST_ID = "nutri-integration-1";

describe("Integration: Nutritionist patient management workflow", () => {
  it("allows a nutritionist to list patients and create a deviation alert", async () => {
    // Step 1: Nutritionist lists their patients
    const patients = [
      {
        id: "patient-1",
        nutritionistId: NUTRITIONIST_ID,
        user: { id: "u-1", name: "Carlos López", email: "carlos@example.com", image: null },
        mealPlans: [],
      },
      {
        id: "patient-2",
        nutritionistId: NUTRITIONIST_ID,
        user: { id: "u-2", name: "Ana Martínez", email: "ana@example.com", image: null },
        mealPlans: [],
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patient.findMany as any).mockResolvedValueOnce(patients);

    const patientsReq = buildRequest("/api/patients", {
      searchParams: { nutritionistId: NUTRITIONIST_ID },
    });
    const patientsRes = await getPatients(patientsReq);
    expect(patientsRes.status).toBe(200);
    const patientsBody = await patientsRes.json();
    expect(patientsBody).toHaveLength(2);

    // Step 2: Nutritionist creates a deviation alert for patient-1 (carbs in dinner)
    const createdAlert = {
      id: "alert-1",
      patientId: "patient-1",
      alertType: "CARBS_EXCESS",
      message: "Carbohidratos en la cena 2 días consecutivos",
      isRead: false,
      createdAt: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.create as any).mockResolvedValueOnce(createdAlert);

    const alertReq = buildRequest("/api/alerts", {
      method: "POST",
      body: {
        patientId: "patient-1",
        alertType: "CARBS_EXCESS",
        message: "Carbohidratos en la cena 2 días consecutivos",
      },
    });
    const alertRes = await postAlert(alertReq);
    expect(alertRes.status).toBe(201);
    const alertBody = await alertRes.json();
    expect(alertBody.alertType).toBe("CARBS_EXCESS");
    expect(alertBody.isRead).toBe(false);

    // Step 3: Retrieve unread alerts for patient-1
    const unreadAlerts = [
      { id: "alert-1", patientId: "patient-1", alertType: "CARBS_EXCESS", isRead: false },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.findMany as any).mockResolvedValueOnce(unreadAlerts);

    const getAlertsReq = buildRequest("/api/alerts", {
      searchParams: { patientId: "patient-1", isRead: "false" },
    });
    const getAlertsRes = await getAlerts(getAlertsReq);
    expect(getAlertsRes.status).toBe(200);
    const alertsBody = await getAlertsRes.json();
    expect(alertsBody).toHaveLength(1);
    expect(alertsBody[0].isRead).toBe(false);
  });
});
