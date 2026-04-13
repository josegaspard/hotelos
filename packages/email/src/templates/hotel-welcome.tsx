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

interface HotelWelcomeProps {
  hotelName: string;
  hotelSlug: string;
}

export function HotelWelcomeEmail({
  hotelName = 'Hotel Demo',
  hotelSlug = 'demo',
}: HotelWelcomeProps) {
  const dashboardLink = `https://hotelos-dashboard.vercel.app/${hotelSlug}`;

  const checklist = [
    { step: '1', title: 'Configura tus habitaciones', desc: 'Agrega tipos de habitación, fotos y amenidades.' },
    { step: '2', title: 'Establece tus precios', desc: 'Define tarifas base y temporadas especiales.' },
    { step: '3', title: 'Conecta Stripe', desc: 'Activa pagos en línea para recibir reservas.' },
    { step: '4', title: 'Instala el widget', desc: 'Agrega el motor de reservas a tu sitio web.' },
  ];

  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido a HotelOS, {hotelName}!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logoText}>HotelOS</Text>
            <Heading style={styles.mainHeading}>¡Bienvenido a HotelOS!</Heading>
            <Text style={styles.headerSub}>{hotelName} ya está registrado</Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.introText}>
              Tu cuenta ha sido creada exitosamente. Estás a pocos pasos de recibir
              reservas en línea. Sigue esta guía rápida para empezar.
            </Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Checklist */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>Guía de inicio rápido</Heading>

            {checklist.map((item) => (
              <Section key={item.step} style={styles.checklistItem}>
                <Text style={styles.stepNumber}>{item.step}</Text>
                <Section style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </Section>
              </Section>
            ))}
          </Section>

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={dashboardLink} style={styles.ctaButton}>
              Ir al dashboard
            </Link>
          </Section>

          <Hr style={styles.hr} />

          {/* Support */}
          <Section style={styles.supportSection}>
            <Heading as="h3" style={styles.supportTitle}>¿Necesitas ayuda?</Heading>
            <Text style={styles.supportText}>
              Nuestro equipo está listo para ayudarte. Escríbenos a{' '}
              <Link href="mailto:soporte@hotelos.app" style={styles.supportLink}>
                soporte@hotelos.app
              </Link>{' '}
              y te responderemos lo antes posible.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by HotelOS — Software de gestión hotelera
            </Text>
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
    padding: '32px 24px',
    backgroundColor: '#18181b',
    textAlign: 'center' as const,
  },
  logoText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#a78bfa',
    textTransform: 'uppercase' as const,
    letterSpacing: '3px',
    margin: '0 0 12px 0',
  },
  mainHeading: {
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  headerSub: {
    color: '#a1a1aa',
    fontSize: '15px',
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
    fontSize: '18px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 16px 0',
  },
  checklistItem: {
    display: 'flex',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
  },
  stepNumber: {
    display: 'inline-block',
    width: '28px',
    height: '28px',
    lineHeight: '28px',
    textAlign: 'center' as const,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 12px 0 0',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 2px 0',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#71717a',
    margin: '0',
  },
  ctaSection: {
    padding: '8px 24px 24px 24px',
    textAlign: 'center' as const,
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  supportSection: {
    padding: '20px 24px',
  },
  supportTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
    margin: '0 0 8px 0',
  },
  supportText: {
    fontSize: '14px',
    color: '#52525b',
    lineHeight: '1.5',
    margin: '0',
  },
  supportLink: {
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

export default HotelWelcomeEmail;
