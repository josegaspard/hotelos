import { render } from '@react-email/components';
import { resend } from './client';
import { BookingConfirmationEmail } from './templates/booking-confirmation';
import { NewBookingHotelEmail } from './templates/new-booking-hotel';
import { PreArrivalEmail } from './templates/pre-arrival';
import { CancellationConfirmationEmail } from './templates/cancellation-confirmation';
import { CheckoutReviewEmail } from './templates/checkout-review';
import { HotelWelcomeEmail } from './templates/hotel-welcome';
import React from 'react';

const FROM_ADDRESS = 'HotelOS <onboarding@resend.dev>';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  primary_color: string;
  checkin_time: string;
  checkout_time: string;
  cancellation_policy: { type: string; hours_before: number };
  tax_percentage: number;
  currency: string;
}

interface Guest {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
}

interface RoomType {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  booking_code: string;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  adults: number;
  children: number;
  subtotal: number;
  extras_total: number;
  taxes: number;
  total: number;
  currency: string;
  commission_amount: number;
  net_hotel: number;
  special_requests: string | null;
  source: string;
  status: string;
}

export async function sendBookingConfirmation(data: {
  booking: Booking;
  guest: Guest;
  roomType: RoomType;
  organization: Organization;
}) {
  const { booking, guest, roomType, organization } = data;

  const fullAddress = [organization.address, organization.city, organization.country]
    .filter(Boolean)
    .join(', ');

  try {
    const html = await render(
      React.createElement(BookingConfirmationEmail, {
        hotelName: organization.name,
        hotelLogoUrl: organization.logo_url,
        hotelAddress: fullAddress || null,
        hotelPhone: organization.phone,
        hotelSlug: organization.slug,
        primaryColor: organization.primary_color,
        bookingCode: booking.booking_code,
        roomTypeName: roomType.name,
        checkinDate: booking.checkin_date,
        checkinTime: organization.checkin_time,
        checkoutDate: booking.checkout_date,
        checkoutTime: organization.checkout_time,
        adults: booking.adults,
        children: booking.children,
        subtotal: booking.subtotal,
        extrasTotal: booking.extras_total,
        taxes: booking.taxes,
        total: booking.total,
        currency: booking.currency,
        specialRequests: booking.special_requests,
        cancellationPolicy: organization.cancellation_policy,
        guestName: guest.full_name,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: guest.email,
      subject: `Reserva confirmada - ${booking.booking_code} | ${organization.name}`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending booking confirmation:', error);
    throw error;
  }
}

export async function sendNewBookingToHotel(data: {
  booking: Booking;
  guest: Guest;
  roomType: RoomType;
  organization: Organization;
}) {
  const { booking, guest, roomType, organization } = data;

  try {
    const html = await render(
      React.createElement(NewBookingHotelEmail, {
        hotelName: organization.name,
        hotelSlug: organization.slug,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        guestName: guest.full_name,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        roomTypeName: roomType.name,
        checkinDate: booking.checkin_date,
        checkoutDate: booking.checkout_date,
        nights: booking.nights,
        adults: booking.adults,
        children: booking.children,
        total: booking.total,
        commissionAmount: booking.commission_amount,
        netHotel: booking.net_hotel,
        currency: booking.currency,
        specialRequests: booking.special_requests,
        source: booking.source,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: organization.email,
      subject: `Nueva reserva ${booking.booking_code} - ${guest.full_name}`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending new booking to hotel:', error);
    throw error;
  }
}

export async function sendPreArrivalReminder(data: {
  booking: Booking;
  guest: Guest;
  roomType: RoomType;
  organization: Organization;
}) {
  const { booking, guest, roomType, organization } = data;

  const fullAddress = [organization.address, organization.city, organization.country]
    .filter(Boolean)
    .join(', ');

  // Determine if the guest can still cancel based on policy
  const checkinDateTime = new Date(`${booking.checkin_date}T${organization.checkin_time}`);
  const hoursUntilCheckin = (checkinDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const canCancel =
    organization.cancellation_policy.type !== 'strict' &&
    hoursUntilCheckin > organization.cancellation_policy.hours_before;

  try {
    const html = await render(
      React.createElement(PreArrivalEmail, {
        hotelName: organization.name,
        hotelLogoUrl: organization.logo_url,
        hotelAddress: fullAddress || null,
        hotelPhone: organization.phone,
        hotelEmail: organization.email,
        hotelSlug: organization.slug,
        primaryColor: organization.primary_color,
        bookingCode: booking.booking_code,
        roomTypeName: roomType.name,
        checkinTime: organization.checkin_time,
        checkinDate: booking.checkin_date,
        guestName: guest.full_name,
        canCancel,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: guest.email,
      subject: `¡Te esperamos mañana! - ${organization.name}`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending pre-arrival reminder:', error);
    throw error;
  }
}

export async function sendCancellationConfirmation(data: {
  booking: Booking;
  guest: Guest;
  roomType: RoomType;
  organization: Organization;
  refundAmount: number;
  refundPercentage: number;
}) {
  const { booking, guest, roomType, organization, refundAmount, refundPercentage } = data;

  try {
    const html = await render(
      React.createElement(CancellationConfirmationEmail, {
        hotelName: organization.name,
        hotelSlug: organization.slug,
        hotelPhone: organization.phone,
        hotelEmail: organization.email,
        primaryColor: organization.primary_color,
        bookingCode: booking.booking_code,
        guestName: guest.full_name,
        roomTypeName: roomType.name,
        checkinDate: booking.checkin_date,
        checkoutDate: booking.checkout_date,
        refundAmount,
        refundPercentage,
        currency: booking.currency,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: guest.email,
      subject: `Reserva cancelada - ${booking.booking_code} | ${organization.name}`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending cancellation confirmation:', error);
    throw error;
  }
}

export async function sendCheckoutReview(data: {
  booking: Booking;
  guest: Guest;
  roomType: RoomType;
  organization: Organization;
}) {
  const { booking, guest, roomType, organization } = data;

  try {
    const html = await render(
      React.createElement(CheckoutReviewEmail, {
        hotelName: organization.name,
        hotelSlug: organization.slug,
        primaryColor: organization.primary_color,
        guestName: guest.full_name,
        roomTypeName: roomType.name,
        checkinDate: booking.checkin_date,
        checkoutDate: booking.checkout_date,
        total: booking.total,
        currency: booking.currency,
        bookingCode: booking.booking_code,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: guest.email,
      subject: `¡Gracias por tu estancia! - ${organization.name}`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending checkout review:', error);
    throw error;
  }
}

export async function sendHotelWelcome(data: {
  organization: Organization;
}) {
  const { organization } = data;

  try {
    const html = await render(
      React.createElement(HotelWelcomeEmail, {
        hotelName: organization.name,
        hotelSlug: organization.slug,
      })
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: organization.email,
      subject: `¡Bienvenido a HotelOS, ${organization.name}!`,
      html,
    });

    return result;
  } catch (error) {
    console.error('[Email] Error sending hotel welcome:', error);
    throw error;
  }
}
