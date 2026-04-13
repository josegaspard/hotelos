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
  Preview,
} from '@react-email/components';

interface PreArrivalProps {
  hotelName: string;
  hotelLogoUrl?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelEmail?: string | null;
  hotelSlug: string;
  primaryColor: string;
  bookingCode: string;
  roomTypeName: string;
  checkinTime: string;
  checkinDate: string;
  guestName: string;
  canCancel: boolean;
}

export function PreArrivalEmail({
  hotelName = 'Hotel Demo',
  hotelLogoUrl,
  hotelAddress,
  hotelPhone,
  hotelEmail,
  hotelSlug = 'demo',
  primaryColor = '#2563eb',
  bookingCode = 'ABC123',
  roomTypeName = 'Habitación Estándar',
  checkinTime = '15:00',
  checkinDate = '2026-01-15',
  guestName = 'Huésped',
  canCancel = true,
}: PreArrivalProps) {
  const mapsLink = hotelAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelAddress)}`
    : null;
  const cancelLink = `https://hotelos-booking.vercel.app/${hotelSlug}/cancel/${bookingCode}`;

  return (
    <Html>
      <Head />
      <Preview>¡Te esperamos mañana en {hotelName}!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={{ ...styles.header, backgroundColor: primaryColor }}>
            {hotelLogoUrl && (
              <Img src={hotelLogoUrl} alt={hotelName} width="50" height="50" style={styles.logo} />
            )}
            <Heading style={styles.hotelNameHeader}>{hotelName}</Heading>
          </Section>

          {/* Main */}
          <Section style={styles.section}>
            <Heading style={{ ...styles.mainHeading, color: primaryColor }}>
              ¡Te esperamos mañana!
            </Heading>
            <Text style={styles.subtitle}>
              Hola {guestName}, tu estancia comienza mañana. Aquí tienes la información que necesitas.
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Details */}
          <Section style={styles.section}>
            <Text style={styles.detailItem}>
              <strong>Check-in:</strong> {checkinDate} a las {checkinTime}
            </Text>
            <Text style={styles.detailItem}>
              <strong>Habitación:</strong> {roomTypeName}
            </Text>
            <Text style={styles.detailItem}>
              <strong>Código de reserva:</strong> {bookingCode}
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Location */}
          {hotelAddress && (
            <Section style={styles.section}>
              <Heading as="h3" style={styles.sectionTitle}>Cómo llegar</Heading>
              <Text style={styles.addressText}>{hotelAddress}</Text>
              {mapsLink && (
                <Link href={mapsLink} style={{ ...styles.mapsLink, color: primaryColor }}>
                  Ver en Google Maps
                </Link>
              )}
            </Section>
          )}

          {/* Contact */}
          <Section style={styles.contactSection}>
            <Text style={styles.contactHeading}>Si necesitas algo especial, contáctanos</Text>
            {hotelPhone && <Text style={styles.contactItem}>📞 {hotelPhone}</Text>}
            {hotelEmail && <Text style={styles.contactItem}>✉️ {hotelEmail}</Text>}
          </Section>

          {/* Cancel */}
          {canCancel && (
            <Section style={styles.cancelSection}>
              <Text style={styles.cancelText}>
                ¿Necesitas cancelar?{' '}
                <Link href={cancelLink} style={{ color: '#ef4444' }}>
                  Cancelar reserva
                </Link>
              </Text>
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
    maxWidth: '560px',
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
    fontSize: '15px',
    color: '#52525b',
    textAlign: 'center' as const,
    margin: '0',
    lineHeight: '1.5',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0 24px',
  },
  detailItem: {
    fontSize: '15px',
    color: '#18181b',
    margin: '8px 0',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 8px 0',
  },
  addressText: {
    fontSize: '14px',
    color: '#52525b',
    margin: '0 0 8px 0',
  },
  mapsLink: {
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  contactSection: {
    padding: '16px 24px',
    backgroundColor: '#f0fdf4',
    margin: '0 24px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  contactHeading: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#166534',
    margin: '0 0 8px 0',
  },
  contactItem: {
    fontSize: '14px',
    color: '#15803d',
    margin: '4px 0',
  },
  cancelSection: {
    padding: '12px 24px',
    textAlign: 'center' as const,
  },
  cancelText: {
    fontSize: '13px',
    color: '#71717a',
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

export default PreArrivalEmail;
