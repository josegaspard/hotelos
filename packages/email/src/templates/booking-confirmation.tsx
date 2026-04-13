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
  Img,
  Row,
  Column,
  Preview,
} from '@react-email/components';

interface BookingConfirmationProps {
  hotelName: string;
  hotelLogoUrl?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelSlug: string;
  primaryColor: string;
  bookingCode: string;
  roomTypeName: string;
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  checkoutTime: string;
  adults: number;
  children: number;
  subtotal: number;
  extrasTotal: number;
  taxes: number;
  total: number;
  currency: string;
  specialRequests?: string | null;
  cancellationPolicy?: { type: string; hours_before: number } | null;
  guestName: string;
}

export function BookingConfirmationEmail({
  hotelName = 'Hotel Demo',
  hotelLogoUrl,
  hotelAddress,
  hotelPhone,
  hotelSlug = 'demo',
  primaryColor = '#2563eb',
  bookingCode = 'ABC123',
  roomTypeName = 'Habitación Estándar',
  checkinDate = '2026-01-15',
  checkinTime = '15:00',
  checkoutDate = '2026-01-18',
  checkoutTime = '11:00',
  adults = 2,
  children = 0,
  subtotal = 300,
  extrasTotal = 0,
  taxes = 48,
  total = 348,
  currency = 'MXN',
  specialRequests,
  cancellationPolicy,
  guestName = 'Huésped',
}: BookingConfirmationProps) {
  const cancelLink = `https://hotelos-booking.vercel.app/${hotelSlug}/cancel/${bookingCode}`;

  return (
    <Html>
      <Head />
      <Preview>Reserva confirmada - {bookingCode} en {hotelName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={{ ...styles.header, backgroundColor: primaryColor }}>
            {hotelLogoUrl && (
              <Img src={hotelLogoUrl} alt={hotelName} width="60" height="60" style={styles.logo} />
            )}
            <Heading style={styles.hotelNameHeader}>{hotelName}</Heading>
          </Section>

          {/* Main heading */}
          <Section style={styles.section}>
            <Heading style={{ ...styles.mainHeading, color: primaryColor }}>
              ¡Reserva confirmada!
            </Heading>
            <Text style={styles.subtitle}>
              Hola {guestName}, tu reserva ha sido confirmada exitosamente.
            </Text>
          </Section>

          {/* Booking code */}
          <Section style={{ ...styles.codeBox, borderColor: primaryColor }}>
            <Text style={styles.codeLabel}>Código de reserva</Text>
            <Text style={{ ...styles.codeValue, color: primaryColor }}>{bookingCode}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Booking details */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Detalles de tu reserva</Heading>

            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Hotel</Column>
              <Column style={styles.detailValue}>{hotelName}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Habitación</Column>
              <Column style={styles.detailValue}>{roomTypeName}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Check-in</Column>
              <Column style={styles.detailValue}>{checkinDate} a las {checkinTime}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Check-out</Column>
              <Column style={styles.detailValue}>{checkoutDate} a las {checkoutTime}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Huéspedes</Column>
              <Column style={styles.detailValue}>
                {adults} adulto{adults !== 1 ? 's' : ''}
                {children > 0 ? `, ${children} niño${children !== 1 ? 's' : ''}` : ''}
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Price breakdown */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Resumen de pago</Heading>

            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Subtotal</Column>
              <Column style={styles.detailValue}>${subtotal.toLocaleString()} {currency}</Column>
            </Row>
            {extrasTotal > 0 && (
              <Row style={styles.detailRow}>
                <Column style={styles.detailLabel}>Extras</Column>
                <Column style={styles.detailValue}>${extrasTotal.toLocaleString()} {currency}</Column>
              </Row>
            )}
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>Impuestos</Column>
              <Column style={styles.detailValue}>${taxes.toLocaleString()} {currency}</Column>
            </Row>
            <Hr style={styles.hrThin} />
            <Row style={styles.detailRow}>
              <Column style={{ ...styles.detailLabel, fontWeight: 'bold', fontSize: '18px' }}>Total</Column>
              <Column style={{ ...styles.detailValue, fontWeight: 'bold', fontSize: '18px', color: primaryColor }}>
                ${total.toLocaleString()} {currency}
              </Column>
            </Row>
          </Section>

          {/* Special requests */}
          {specialRequests && (
            <>
              <Hr style={styles.hr} />
              <Section style={styles.section}>
                <Heading as="h3" style={styles.sectionTitle}>Solicitudes especiales</Heading>
                <Text style={styles.specialRequests}>{specialRequests}</Text>
              </Section>
            </>
          )}

          <Hr style={styles.hr} />

          {/* Hotel info */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Información del hotel</Heading>
            {hotelAddress && <Text style={styles.infoText}>📍 {hotelAddress}</Text>}
            {hotelPhone && <Text style={styles.infoText}>📞 {hotelPhone}</Text>}
          </Section>

          {/* Cancellation */}
          {cancellationPolicy && (
            <Section style={styles.cancelSection}>
              <Text style={styles.cancelText}>
                <strong>Política de cancelación:</strong>{' '}
                {cancellationPolicy.type === 'flexible'
                  ? `Cancelación gratuita hasta ${cancellationPolicy.hours_before} horas antes del check-in.`
                  : cancellationPolicy.type === 'moderate'
                    ? `Cancelación gratuita hasta ${cancellationPolicy.hours_before} horas antes del check-in. Después se cobra el 50%.`
                    : `No reembolsable.`}
              </Text>
              <Link href={cancelLink} style={{ ...styles.cancelLink, color: primaryColor }}>
                Cancelar reserva
              </Link>
            </Section>
          )}

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
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  logo: {
    marginBottom: '8px',
    borderRadius: '8px',
  },
  hotelNameHeader: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0',
  },
  section: {
    padding: '20px 24px',
  },
  mainHeading: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '16px',
    color: '#52525b',
    textAlign: 'center' as const,
    margin: '0',
  },
  codeBox: {
    margin: '0 24px',
    padding: '16px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  codeLabel: {
    fontSize: '12px',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0 0 4px 0',
  },
  codeValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    margin: '0',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0 24px',
  },
  hrThin: {
    borderColor: '#e4e4e7',
    margin: '8px 0',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 12px 0',
  },
  detailRow: {
    marginBottom: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#71717a',
    width: '40%',
  },
  detailValue: {
    fontSize: '14px',
    color: '#18181b',
    width: '60%',
    textAlign: 'right' as const,
  },
  specialRequests: {
    fontSize: '14px',
    color: '#52525b',
    backgroundColor: '#fefce8',
    padding: '12px',
    borderRadius: '6px',
    margin: '0',
  },
  infoText: {
    fontSize: '14px',
    color: '#52525b',
    margin: '4px 0',
  },
  cancelSection: {
    padding: '16px 24px',
    backgroundColor: '#fafafa',
  },
  cancelText: {
    fontSize: '13px',
    color: '#52525b',
    margin: '0 0 8px 0',
  },
  cancelLink: {
    fontSize: '13px',
    textDecoration: 'underline',
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

export default BookingConfirmationEmail;
