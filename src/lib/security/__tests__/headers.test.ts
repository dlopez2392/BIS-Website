import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { securityHeaders, contentSecurityPolicy } from '../headers';
import { PLATFORM_ORIGIN } from '@/lib/platform';

function directive(csp: string, name: string): string[] {
  const found = csp.split('; ').find((part) => part === name || part.startsWith(`${name} `));
  if (!found) throw new Error(`CSP has no ${name} directive: ${csp}`);
  return found.split(' ').slice(1);
}

const ORIGINAL = process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN;
  else process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN = ORIGINAL;
});

describe('contentSecurityPolicy', () => {
  it('frames the platform that hosts the contact form and scheduler, and nothing else', () => {
    expect(directive(contentSecurityPolicy(), 'frame-src')).toEqual([PLATFORM_ORIGIN]);
  });

  it('follows the platform origin when a preview points at a test account', () => {
    process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN = 'https://staging.example.com/';
    expect(directive(contentSecurityPolicy(), 'frame-src')).toEqual(['https://staging.example.com']);
  });

  it('shuts the doors that do not need to be open', () => {
    const csp = contentSecurityPolicy();
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('admits no third-party script origin beyond the analytics the site loads', () => {
    const sources = directive(contentSecurityPolicy(), 'script-src').filter((s) => s.startsWith('http'));
    expect(sources).toEqual(['https://va.vercel-scripts.com']);
  });

  it('serves the hero video and the fonts from this origin only', () => {
    const csp = contentSecurityPolicy();
    expect(directive(csp, 'media-src')).toEqual(["'self'"]);
    expect(directive(csp, 'font-src')).toEqual(["'self'", 'data:']);
  });

  it('allows the dev bundler to eval and websocket, and never ships that allowance', () => {
    expect(directive(contentSecurityPolicy({ dev: true }), 'script-src')).toContain("'unsafe-eval'");
    expect(directive(contentSecurityPolicy({ dev: true }), 'connect-src')).toContain('ws:');
    expect(contentSecurityPolicy({ dev: true })).not.toContain('upgrade-insecure-requests');
    expect(directive(contentSecurityPolicy(), 'script-src')).not.toContain("'unsafe-eval'");
  });
});

describe('securityHeaders', () => {
  it('sends the headers a scanner looks for', () => {
    const keys = securityHeaders().map((h) => h.key);
    expect(keys).toEqual([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'X-DNS-Prefetch-Control',
    ]);
  });

  it('grants the microphone to this site only, never to an embedded third party', () => {
    const policy = securityHeaders().find((h) => h.key === 'Permissions-Policy')!.value;
    expect(policy).toContain('microphone=(self)');
    // The two ways this gets loosened by accident, both refused.
    expect(policy).not.toContain('microphone=*');
    expect(policy).not.toMatch(/microphone=\("?https/);
  });

  it('still denies the camera outright — the voice demo needs a voice, not a face', () => {
    const policy = securityHeaders().find((h) => h.key === 'Permissions-Policy')!.value;
    expect(policy).toContain('camera=()');
    expect(policy).toContain('browsing-topics=()');
  });

  it('asks for HSTS long enough to be preload-eligible', () => {
    const hsts = securityHeaders().find((h) => h.key === 'Strict-Transport-Security')!.value;
    const maxAge = Number(/max-age=(\d+)/.exec(hsts)![1]);
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });
});

describe('the copy of PLATFORM_ORIGIN this module keeps', () => {
  // next.config.ts loads outside the app's path aliases, so headers.ts cannot
  // import platform.ts. This guards the duplicated env var name and default.
  it('reads the same env var and default as src/lib/platform.ts', () => {
    const read = (rel: string) => readFileSync(join(process.cwd(), 'src/lib', rel), 'utf8');
    const platform = read('platform.ts');
    const headers = read('security/headers.ts');
    const shape = /process\.env\.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN \?\? 'https:\/\/app\.bis-rgv\.com'/;
    expect(platform).toMatch(shape);
    expect(headers).toMatch(shape);
  });
});

describe('connect-src and the voice session', () => {
  const csp = () => contentSecurityPolicy({ dev: false });

  it('lets the browser reach OpenAI to exchange the WebRTC offer', () => {
    expect(csp()).toContain('https://api.openai.com');
  });

  it('lets the browser reach the platform, which mints the session key', () => {
    expect(csp()).toMatch(/connect-src[^;]*https:\/\/app\.bis-rgv\.com/);
  });

  it('adds both to connect-src only, never to script-src', () => {
    const scriptSrc = /script-src ([^;]*)/.exec(csp())![1];
    expect(scriptSrc).not.toContain('api.openai.com');
    expect(scriptSrc).not.toContain('app.bis-rgv.com');
  });

  it('keeps default-src closed to self, so a new host must be named deliberately', () => {
    expect(csp()).toMatch(/default-src 'self'/);
  });
});
