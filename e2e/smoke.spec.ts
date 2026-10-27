import { expect, test } from "@playwright/test";
import { dismissCookieBanner, loginAsAdmin } from "./helpers";

test.beforeEach(async ({ page }) => {
  await dismissCookieBanner(page);
});

test.describe("Smoke public", () => {
  test("page d’accueil charge", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: /FEBiS/i }).first()).toBeVisible();
  });

  test("page BTP publique charge", async ({ page }) => {
    await page.goto("/btp");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("page cookies charge", async ({ page }) => {
    await page.goto("/cookies");
    await expect(page.getByText(/cookies/i).first()).toBeVisible();
  });
});

test.describe("Smoke admin auth", () => {
  test("login admin → dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText(/Admin/i).first()).toBeVisible();
  });

  test("accès refusé sans session", async ({ page }) => {
    await page.goto("/admin/dashboard/facturation");
    await page.waitForURL(/\/admin(\?|$|\/?$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /connexion admin/i })).toBeVisible();
  });

  test("API admin sans cookie → 401", async ({ request }) => {
    const res = await request.get("/api/admin/facturation");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });
});

test.describe("Smoke facturation PDF", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("page facturation accessible", async ({ page }) => {
    await page.goto("/admin/dashboard/facturation");
    await expect(page.getByRole("heading", { name: /facturation/i })).toBeVisible();
  });

  test("téléchargement PDF reçu ou facture", async ({ page, request }) => {
    await page.goto("/admin/dashboard/facturation");
    await expect(page.getByRole("heading", { name: /facturation/i })).toBeVisible();

    // Créer un document reçu via API (session cookies du navigateur)
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const createRes = await request.post("/api/admin/facturation", {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      data: {
        type: "recu",
        title: "Reçu e2e smoke",
        activity: "general",
        clientName: "Client E2E",
        clientEmail: "e2e@febis.ci",
        lines: [
          { label: "Prestation test e2e", quantity: 1, unitPrice: 150000, total: 150000 },
        ],
        taxRate: 0,
        notes: "Document généré par Playwright",
      },
    });

    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as {
      document?: { id?: string; number?: string };
    };
    const id = created.document?.id;
    expect(id).toBeTruthy();

    const pdfRes = await request.get(`/api/admin/facturation/${id}/pdf`, {
      headers: { Cookie: cookieHeader },
    });
    expect(pdfRes.status(), await pdfRes.text()).toBe(200);
    expect(pdfRes.headers()["content-type"]).toContain("application/pdf");
    const buf = await pdfRes.body();
    expect(buf.byteLength).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
});

test.describe("Smoke paiements API", () => {
  test("initiate payment intent (public)", async ({ request }) => {
    const res = await request.post("/api/payments/initiate", {
      data: {
        sourceType: "btp",
        sourceId: "e2e-smoke-btp",
        amount: 1000,
        channel: "wave",
        title: "Paiement e2e",
        clientName: "E2E",
      },
    });

    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as {
      intent?: { id?: string; reference?: string; status?: string };
    };
    expect(body.intent?.id || body.intent?.reference).toBeTruthy();
    expect(body.intent?.status ?? "pending").toBe("pending");
  });
});

test.describe("Smoke BTP admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("liste BTP charge", async ({ page }) => {
    await page.goto("/admin/dashboard/btp");
    await expect(page.getByRole("heading", { name: /btp/i })).toBeVisible();
  });
});
