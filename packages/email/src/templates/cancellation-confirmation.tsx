import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Preview,
  Row,
  Column,
} from '@react-email/components';

interface CancellationConfirmationProps {
  hotelName: string;
  hotelSlug: string;
  hotelPhone?: string | null;
  hotelEmail?: string | null;
  primaryColor: string;
  bookingCode: string;
  guestName: string;
  roomTypeName: string;
  checkinDate: string;
  checkoutDate: string;
  refundAmount: number;
  refundPercentage: number;
  currency: string;
}

export function CancellationConfirmationEmail({
  hotelName = 'Hotel Demo',
  hotelSlug = 'demo',
  hotelPhone,
  hotelEmail,
  primaryColor = '#2563eb',
  bookingCode = 'ABC123',
  guestName = 'Huésped',
  roomTypeName = 'Habitación Estándar',
  checkinDate = '2026-01-15',
  checkoutDate = '2026-01-18',
  refundAmount = 348,
  refundPercentage = 100,
  currency = 'MXN',
}: CancellationConfirmationProps) {
  const rebookLink = `https://hotelos-booking.vercel.app/${hotelSlug}`;

  return (
    <Html>
      <Head />
      <Preview>Reserva {bookingCode} cancelada - {hotelName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.mainHeading}>Reserva cancelada</Heading>
            <Text style={styles.headerSub}>{hotelName}</Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.introText}>
              Hola {guestName}, tu reserva ha sido cancelada exitosamente.
            </Text>
          </Section>

          {/* Booking code */}
          <Section style={styles.codeBox}>
            <Text style={styles.codeLabel}>Código de reserva</Text>
            <Text style={styles.codeValue}>{bookingCode}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Refund info */}
          <Section style={styles.refundSection}>
            <Heading as="h3" style={styles.sectionTitle}>Reembolso</Heading>
            <Row style={styles.row}>
              <Column style={styles.label}>Monto reembolsado</Column>
              <Column style={{ ...styles.value, fontWeight: 'bold', color: '#16a34a' }}>
                ${refundAmount.toLocaleString()} {currency}
              </Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Porcentaje</Column>
              <Column style={styles.value}>{refundPercentage}%</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Tiempo estimado</Column>
              <Column style={styles.value}>5-10 días hábiles</Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Original booking */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Reserva original</Heading>
            <Row style={styles.row}>
              <Column style={styles.label}>Habitación</Column>
              <Column style={styles.value}>{roomTypeName}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Check-in</Column>
              <Column style={styles.value}>{checkinDate}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Check-out</Column>
              <Column style={styles.value}>{checkoutDate}</Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Rebook CTA */}
          <Section style={styles.ctaSection}>
            <Text style={styles.ctaText}>
              ¿Fue un error? Puedes hacer una nueva reserva en cualquier momento.
            </Text>
            <Link href={rebookLink} style={{ ...styles.ctaButton, backgroundColor: primaryColor }}>
              Hacer nueva reserva
            </Link>
          </Section>

          {/* Contact */}
          <Section style={styles.contactSection}>
            <Text style={styles.contactText}>
              ¿Preguntas sobre tu reembolso?
              {hotelPhone && <> Llámanos al {hotelPhone}.</>}
              {hotelEmail && <> Escríbenos a {hotelEmail}.</>}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>Powered by HotelOS</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    padding: '24px',
    backgroundColor: '#dc2626',
    textAlign: 'center' as const,
  },
  mainHeading: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },
  headerSub: {
    color: '#fecaca',
    fontSize: '14px',
    margin: '0',
  },
  section: {
    padding: '16px 24px',
  },
  introText: {
    fontSize: '15px',
    color: '#52525b',
    textAlign: 'center' as const,
    margin: '0',
  },
  codeBox: {
    margin: '0 24px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  codeLabel: {
    fontSize: '11px',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0',
  },
  codeValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#dc2626',
    letterSpacing: '2px',
    margin: '4px 0 0 0',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0 24px',
  },
  refundSection: {
    padding: '16px 24px',
    backgroundColor: '#f0fdf4',
    margin: '16px 24px',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 10px 0',
  },
  row: {
    marginBottom: '6px',
  },
  label: {
    fontSize: '14px',
    color: '#71717a',
    width: '50%',
  },
  value: {
    fontSize: '14px',
    color: '#18181b',
    width: '50%',
    textAlign: 'right' as const,
  },
  ctaSection: {
    padding: '20px 24px',
    textAlign: 'center' as const,
  },
  ctaText: {
    fontSize: '14px',
    color: '#52525b',
    margin: '0 0 12px 0',
  },
  ctaButton: {
    display: 'inline-block',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  contactSection: {
    padding: '12px 24px',
    backgroundColor: '#fafafa',
  },
  contactText: {
    fontSize: '13px',
    color: '#71717a',
    textAlign: 'center' as const,
    margin: '0',
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: '#f4f4f5',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#a1a1aa',
    margin: '0',
  },
};

export default CancellationConfirmationEmail;
