import { Html, Head, Body, Container, Text, Link } from '@react-email/components';
import { resourceEmailStrings, type EmailLocale } from './messages';
import { WORDMARK } from '@/lib/brand';
import { palette } from '@/lib/brand-palette';

export function ResourceEmail({ locale, name, url }: { locale: EmailLocale; name: string; url: string }) {
  const t = resourceEmailStrings[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: palette.surface }}>
        <Container style={{ padding: '24px', background: '#ffffff' }}>
          <Text style={{ fontWeight: 'bold' }}>{WORDMARK}</Text>
          <Text>{t.greeting(name)}</Text>
          <Text>{t.body}</Text>
          <Text><Link href={url} style={{ color: palette.accent, fontWeight: 'bold' }}>{t.link}</Link></Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResourceEmail;
