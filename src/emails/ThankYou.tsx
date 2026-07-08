import { Html, Head, Body, Container, Text } from '@react-email/components';
import { emailStrings, type EmailLocale } from './messages';

export function ThankYou({ locale, fullName }: { locale: EmailLocale; fullName: string }) {
  const t = emailStrings[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f9f9f9' }}>
        <Container style={{ padding: '24px', background: '#ffffff' }}>
          <Text style={{ fontWeight: 'bold' }}>bis&gt;</Text>
          <Text>{t.greeting(fullName)}</Text>
          <Text>{t.body}</Text>
          <Text>{t.signoff}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ThankYou;
