import { Html, Head, Body, Container, Text, Link, Hr } from '@react-email/components';
import { scanReportStrings, type EmailLocale } from './messages';

export interface ReportFinding {
  /** Already localized by the server from the site's own catalogue. */
  title: string;
  explanation: string;
  status: 'pass' | 'warn' | 'fail' | 'unknown';
}

export interface ScanReportProps {
  locale: EmailLocale;
  name: string;
  domain: string;
  grade: string;
  points: number;
  headline: ReportFinding[];
  findings: ReportFinding[];
  bookingUrl: string;
}

// Status is a word and a mark, never a colour on its own: half of these are
// read in a client that strips styling, and colour alone says nothing to a
// reader who cannot see it.
const MARK = { pass: '✓', warn: '!', fail: '✕', unknown: '–' } as const;
const TONE = { pass: '#15803d', warn: '#b45309', fail: '#b91c1c', unknown: '#6f6a8a' } as const;

function Row({ finding, label, withExplanation = true }: { finding: ReportFinding; label: string; withExplanation?: boolean }) {
  return (
    <Text style={{ margin: '0 0 12px' }}>
      <span style={{ color: TONE[finding.status], fontWeight: 'bold' }}>{MARK[finding.status]} </span>
      <strong>{finding.title}</strong>
      <span style={{ color: TONE[finding.status] }}> · {label}</span>
      {withExplanation && finding.explanation ? (
        <>
          <br />
          <span style={{ color: '#4a4763' }}>{finding.explanation}</span>
        </>
      ) : null}
    </Text>
  );
}

export function ScanReport({ locale, name, domain, grade, points, headline, findings, bookingUrl }: ScanReportProps) {
  const t = scanReportStrings[locale];
  const label = (status: ReportFinding['status']) =>
    ({ pass: t.statusPass, warn: t.statusWarn, fail: t.statusFail, unknown: t.statusUnknown })[status];
  const headlineIds = new Set(headline.map((f) => f.title));

  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#faf9ff' }}>
        <Container style={{ padding: '24px', background: '#ffffff', maxWidth: '640px' }}>
          <Text style={{ fontWeight: 'bold' }}>bis&gt;</Text>
          <Text>{t.greeting(name)}</Text>
          <Text>{t.intro(domain)}</Text>
          <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.scoreLine(grade, points)}</Text>

          {headline.length > 0 && (
            <>
              <Hr />
              <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>{t.fixFirst}</Text>
              {headline.map((f) => <Row key={`h-${f.title}`} finding={f} label={label(f.status)} />)}
            </>
          )}

          <Hr />
          <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>{t.everything}</Text>
          {findings.map((f) => (
            // A finding already explained above keeps its place in the full
            // list without repeating the paragraph, the same way the page does.
            <Row key={f.title} finding={f} label={label(f.status)} withExplanation={!headlineIds.has(f.title)} />
          ))}

          <Hr />
          <Text>{t.outro}</Text>
          <Text>
            <Link href={bookingUrl} style={{ color: '#7c3aed', fontWeight: 'bold' }}>{t.cta}</Link>
          </Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ScanReport;
