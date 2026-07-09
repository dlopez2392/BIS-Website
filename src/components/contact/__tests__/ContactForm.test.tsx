import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { track } from '@vercel/analytics';

const submitContact = vi.fn();
vi.mock('@/app/[locale]/contact/actions', () => ({ submitContact: (...a: unknown[]) => submitContact(...a) }));
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
vi.mock('next-intl', async (orig) => ({ ...(await orig<typeof import('next-intl')>()), useLocale: () => 'en' }));

import { ContactForm } from '../ContactForm';

const messages = { contact: {
  fullName: 'Full Name', businessName: 'Business Name', email: 'Email Address', phone: 'Phone Number',
  industry: 'Industry', industryLegal: 'Legal', industryHealth: 'Healthcare', industryMfg: 'Manufacturing',
  industryLogistics: 'Logistics', industryOther: 'Other', language: 'Preferred Language',
  message: 'Message', submit: 'Book my free assessment', success: 'Thanks — we received your request.',
  errRequired: 'This field is required', errEmail: 'Enter a valid email',
  errorGeneric: 'Something went wrong sending your request.',
} };

function fill() {
  return render(<NextIntlClientProvider locale="en" messages={messages}><ContactForm /></NextIntlClientProvider>);
}
async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full Name'), 'Ana Reyes');
  await user.type(screen.getByLabelText('Business Name'), 'Reyes Law');
  await user.type(screen.getByLabelText('Email Address'), 'ana@reyeslaw.com');
  await user.type(screen.getByLabelText('Phone Number'), '956-555-0100');
}

describe('ContactForm', () => {
  it('shows the success state when the action returns ok', async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValueOnce({ ok: true });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    expect(await screen.findByText(/we received your request/i)).toBeTruthy();
    expect(submitContact).toHaveBeenCalledOnce();
  });

  it('shows the generic error when the action fails', async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValueOnce({ ok: false, error: 'failed' });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    expect(await screen.findByText(/Something went wrong/i)).toBeTruthy();
  });

  it('fires a lead_submitted analytics event only on a successful submit', async () => {
    const user = userEvent.setup();
    submitContact.mockResolvedValueOnce({ ok: true });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    await screen.findByText(/we received your request/i);
    expect(track).toHaveBeenCalledWith('lead_submitted', { locale: 'en', industry: 'legal' });
  });

  it('does NOT fire lead_submitted when the submit fails', async () => {
    const user = userEvent.setup();
    (track as unknown as ReturnType<typeof vi.fn>).mockClear();
    submitContact.mockResolvedValueOnce({ ok: false, error: 'failed' });
    fill();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Book my free assessment/i }));
    await screen.findByText(/Something went wrong/i);
    expect(track).not.toHaveBeenCalled();
  });
});
