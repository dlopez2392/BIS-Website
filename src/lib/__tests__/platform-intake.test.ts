import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { intakeBody, intakeUrl, submitLeadToPlatform, PlatformIntakeError, INTAKE_SOURCE } from '../platform-intake';
import { FORM_PUBLIC_IDS, PLATFORM_ORIGIN } from '../platform';

const LEAD = {
  locale: 'es' as const, firstName: 'Ana', lastName: 'Garza', businessName: 'Garza HVAC',
  email: 'ana@example.com', phone: '(956) 555-0134', need: 'Llamadas perdidas',
};

describe('platform intake', () => {
  const original = process.env.LEAD_INTAKE_SECRET;
  beforeEach(() => { process.env.LEAD_INTAKE_SECRET = 'shared-secret'; });
  afterEach(() => { process.env.LEAD_INTAKE_SECRET = original; });

  it("posts to the locale's own form, on the platform origin", () => {
    expect(intakeUrl('en')).toBe(`${PLATFORM_ORIGIN}/api/intake/${FORM_PUBLIC_IDS.en}`);
    expect(intakeUrl('es')).toBe(`${PLATFORM_ORIGIN}/api/intake/${FORM_PUBLIC_IDS.es}`);
  });

  it("shapes the body to the contact form's field keys and names the assistant as the source", () => {
    expect(intakeBody(LEAD)).toEqual({
      locale: 'es', source: INTAKE_SOURCE,
      attribution: { utm_source: 'bis-rgv.com', utm_medium: 'ai-assistant' },
      answers: {
        first_name: 'Ana', last_name: 'Garza', company_name: 'Garza HVAC',
        email: 'ana@example.com', phone: '(956) 555-0134', message: '[via AI assistant] Llamadas perdidas',
      },
    });
  });

  it('sends the bearer, and returns what the platform said', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, submissionId: 'sub_1' }), { status: 200 }));
    const result = await submitLeadToPlatform(LEAD, fetchImpl as unknown as typeof fetch);
    expect(result).toEqual({ ok: true, submissionId: 'sub_1' });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(intakeUrl('es'));
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer shared-secret');
    expect(JSON.parse(init.body)).toEqual(intakeBody(LEAD));
  });

  it('throws without the secret, before any request, and on a non-2xx answer', async () => {
    delete process.env.LEAD_INTAKE_SECRET;
    const fetchImpl = vi.fn();
    await expect(submitLeadToPlatform(LEAD, fetchImpl as unknown as typeof fetch)).rejects.toBeInstanceOf(PlatformIntakeError);
    expect(fetchImpl).not.toHaveBeenCalled();

    process.env.LEAD_INTAKE_SECRET = 'shared-secret';
    const refusing = vi.fn().mockResolvedValue(new Response('{"error":"unauthorized"}', { status: 401 }));
    await expect(submitLeadToPlatform(LEAD, refusing as unknown as typeof fetch)).rejects.toMatchObject({ status: 401 });
  });
});
