import { Html, Head, Body, Container, Text, Link } from '@react-email/components';
import { resourceEmailStrings, type EmailLocale } from './messages';
import { WORDMARK } from '@/lib/brand';

export function ResourceEmail({ locale, name, url }: { locale: EmailLocale; name: string; url: string }) {
  const t = resourceEmailStrings[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#faf9ff' }}>
        <Container style={{ padding: '24px', background: '#ffffff' }}>
          <Text style={{ fontWeight: 'bold' }}>{WORDMARK}</Text>
          <Text>{t.greeting(name)}</Text>
          <Text>{t.body}</Text>
          <Text><Link href={url} style={{ color: '#7c3aed', fontWeight: 'bold' }}>{t.link}</Link></Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResourceEmail;
