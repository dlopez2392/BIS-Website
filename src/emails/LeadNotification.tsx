import { Html, Head, Body, Container, Text, Hr } from '@react-email/components';
import type { ContactFormValues } from '@/lib/contact-schema';

export function LeadNotification({ lead }: { lead: ContactFormValues }) {
  const rows: Array<[string, string]> = [
    ['Name', lead.fullName],
    ['Business', lead.businessName],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Industry', lead.industry],
    ['Language', lead.language],
    ['Message', lead.message ?? ''],
  ];
  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ padding: '24px' }}>
          <Text style={{ fontWeight: 'bold' }}>New free-assessment request</Text>
          <Hr />
          {rows.map(([label, value]) => (
            <Text key={label}><strong>{label}:</strong> {value}</Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

export default LeadNotification;
