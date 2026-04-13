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

interface NewBookingHotelProps {
  hotelName: string;
  hotelSlug: string;
  bookingId: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomTypeName: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  adults: number;
  children: number;
  total: number;
  commissionAmount: number;
  netHotel: number;
  currency: string;
  specialRequests?: string | null;
  source: string;
}

export function NewBookingHotelEmail({
  hotelName = 'Hotel Demo',
  hotelSlug = 'demo',
  bookingId = 'uuid',
  bookingCode = 'ABC123',
  guestName = 'Juan Pérez',
  guestEmail = 'juan@example.com',
  guestPhone,
  roomTypeName = 'Habitación Estándar',
  checkinDate = '2026-01-15',
  checkoutDate = '2026-01-18',
  nights = 3,
  adults = 2,
  children = 0,
  total = 348,
  commissionAmount = 34.8,
  netHotel = 313.2,
  currency = 'MXN',
  specialRequests,
  source = 'widget',
}: NewBookingHotelProps) {
  const dashboardLink = `https://hotelos-dashboard.vercel.app/${hotelSlug}/bookings/${bookingId}`;

  return (
    <Html>
      <Head />
      <Preview>Nueva reserva {bookingCode} - {guestName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.mainHeading}>Nueva reserva</Heading>
            <Text style={styles.headerSub}>{hotelName}</Text>
          </Section>

          {/* Booking code */}
          <Section style={styles.codeSection}>
            <Text style={styles.codeLabel}>Código</Text>
            <Text style={styles.codeValue}>{bookingCode}</Text>
            <Text style={styles.sourceTag}>Origen: {source}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Guest info */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Huésped</Heading>
            <Row style={styles.row}>
              <Column style={styles.label}>Nombre</Column>
              <Column style={styles.value}>{guestName}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Email</Column>
              <Column style={styles.value}>{guestEmail}</Column>
            </Row>
            {guestPhone && (
              <Row style={styles.row}>
                <Column style={styles.label}>Teléfono</Column>
                <Column style={styles.value}>{guestPhone}</Column>
              </Row>
            )}
          </Section>

          <Hr style={styles.hr} />

          {/* Stay details */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Estancia</Heading>
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
            <Row style={styles.row}>
              <Column style={styles.label}>Noches</Column>
              <Column style={styles.value}>{nights}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Huéspedes</Column>
              <Column style={styles.value}>
                {adults} adulto{adults !== 1 ? 's' : ''}
                {children > 0 ? `, ${children} niño${children !== 1 ? 's' : ''}` : ''}
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Financial */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Financiero</Heading>
            <Row style={styles.row}>
              <Column style={styles.label}>Total cobrado</Column>
              <Column style={{ ...styles.value, fontWeight: 'bold' }}>${total.toLocaleString()} {currency}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={styles.label}>Comisión HotelOS</Column>
              <Column style={{ ...styles.value, color: '#ef4444' }}>-${commissionAmount.toLocaleString()} {currency}</Column>
            </Row>
            <Row style={styles.row}>
              <Column style={{ ...styles.label, fontWeight: 'bold' }}>Neto hotel</Column>
              <Column style={{ ...styles.value, fontWeight: 'bold', color: '#16a34a' }}>${netHotel.toLocaleString()} {currency}</Column>
            </Row>
          </Section>

          {/* Special requests */}
          {specialRequests && (
            <>
              <Hr style={styles.hr} />
              <Section style={styles.section}>
                <Heading as="h3" style={styles.sectionTitle}>Solicitudes especiales</Heading>
                <Text style={styles.requestsBox}>{specialRequests}</Text>
              </Section>
            </>
          )}

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={dashboardLink} style={styles.ctaButton}>
              Ver reserva en dashboard
            </Link>
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
    backgroundColor: '#18181b',
    textAlign: 'center' as const,
  },
  mainHeading: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },
  headerSub: {
    color: '#a1a1aa',
    fontSize: '14px',
    margin: '0',
  },
  codeSection: {
    padding: '16px 24px',
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
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2563eb',
    letterSpacing: '2px',
    margin: '4px 0',
  },
  sourceTag: {
    fontSize: '12px',
    color: '#a1a1aa',
    margin: '0',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0 24px',
  },
  section: {
    padding: '16px 24px',
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
    width: '45%',
  },
  value: {
    fontSize: '14px',
    color: '#18181b',
    width: '55%',
    textAlign: 'right' as const,
  },
  requestsBox: {
    fontSize: '14px',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '3px solid #f59e0b',
    margin: '0',
  },
  ctaSection: {
    padding: '20px 24px',
    textAlign: 'center' as const,
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
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

export default NewBookingHotelEmail;
