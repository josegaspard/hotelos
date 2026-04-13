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
} from '@react-email/components';

interface CheckoutReviewProps {
  hotelName: string;
  hotelSlug: string;
  primaryColor: string;
  guestName: string;
  roomTypeName: string;
  checkinDate: string;
  checkoutDate: string;
  total: number;
  currency: string;
  bookingCode: string;
}

export function CheckoutReviewEmail({
  hotelName = 'Hotel Demo',
  hotelSlug = 'demo',
  primaryColor = '#2563eb',
  guestName = 'Huésped',
  roomTypeName = 'Habitación Estándar',
  checkinDate = '2026-01-15',
  checkoutDate = '2026-01-18',
  total = 348,
  currency = 'MXN',
  bookingCode = 'ABC123',
}: CheckoutReviewProps) {
  const rebookLink = `https://hotelos-booking.vercel.app/${hotelSlug}`;
  const reviewLink = `https://hotelos-booking.vercel.app/${hotelSlug}/review/${bookingCode}`;

  return (
    <Html>
      <Head />
      <Preview>¡Gracias por tu estancia en {hotelName}!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={{ ...styles.header, backgroundColor: primaryColor }}>
            <Heading style={styles.mainHeading}>¡Gracias por tu estancia!</Heading>
            <Text style={styles.headerSub}>{hotelName}</Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.introText}>
              Hola {guestName}, esperamos que hayas disfrutado tu estadía con nosotros.
              Fue un placer tenerte como huésped.
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Stay summary */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Resumen de tu estancia</Heading>
            <Text style={styles.detailItem}><strong>Habitación:</strong> {roomTypeName}</Text>
            <Text style={styles.detailItem}><strong>Check-in:</strong> {checkinDate}</Text>
            <Text style={styles.detailItem}><strong>Check-out:</strong> {checkoutDate}</Text>
            <Text style={styles.detailItem}><strong>Total pagado:</strong> ${total.toLocaleString()} {currency}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Review prompt */}
          <Section style={styles.reviewSection}>
            <Heading as="h3" style={{ ...styles.reviewHeading, color: primaryColor }}>
              ¿Cómo fue tu experiencia?
            </Heading>
            <Text style={styles.reviewText}>
              Tu opinión nos ayuda a mejorar. Tómate un momento para compartir tu experiencia.
            </Text>
            <Section style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Link
                  key={star}
                  href={`${reviewLink}?rating=${star}`}
                  style={styles.starLink}
                >
                  ⭐
                </Link>
              ))}
            </Section>
            <Link href={reviewLink} style={{ ...styles.reviewButton, backgroundColor: primaryColor }}>
              Dejar reseña
            </Link>
          </Section>

          <Hr style={styles.hr} />

          {/* Rebook */}
          <Section style={styles.rebookSection}>
            <Text style={styles.rebookText}>
              ¿Planeas volver? Reserva directamente y obtén el mejor precio.
            </Text>
            <Link href={rebookLink} style={styles.rebookLink}>
              Reserva de nuevo
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
    padding: '28px 24px',
    textAlign: 'center' as const,
  },
  mainHeading: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    margin: '0',
  },
  section: {
    padding: '20px 24px',
  },
  introText: {
    fontSize: '15px',
    color: '#52525b',
    lineHeight: '1.6',
    margin: '0',
  },
  hr: {
    borderColor: '#e4e4e7',
    margin: '0 24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 12px 0',
  },
  detailItem: {
    fontSize: '14px',
    color: '#52525b',
    margin: '6px 0',
  },
  reviewSection: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  reviewHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  reviewText: {
    fontSize: '14px',
    color: '#71717a',
    margin: '0 0 16px 0',
  },
  starsRow: {
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  starLink: {
    fontSize: '28px',
    textDecoration: 'none',
    margin: '0 4px',
  },
  reviewButton: {
    display: 'inline-block',
    color: '#ffffff',
    padding: '12px 28px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  rebookSection: {
    padding: '20px 24px',
    textAlign: 'center' as const,
    backgroundColor: '#fafafa',
  },
  rebookText: {
    fontSize: '14px',
    color: '#52525b',
    margin: '0 0 8px 0',
  },
  rebookLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
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

export default CheckoutReviewEmail;
