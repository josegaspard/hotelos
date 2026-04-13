export { resend } from './client';
export {
  sendBookingConfirmation,
  sendNewBookingToHotel,
  sendPreArrivalReminder,
  sendCancellationConfirmation,
  sendCheckoutReview,
  sendHotelWelcome,
} from './send';
export { BookingConfirmationEmail } from './templates/booking-confirmation';
export { NewBookingHotelEmail } from './templates/new-booking-hotel';
export { PreArrivalEmail } from './templates/pre-arrival';
export { CancellationConfirmationEmail } from './templates/cancellation-confirmation';
export { CheckoutReviewEmail } from './templates/checkout-review';
export { HotelWelcomeEmail } from './templates/hotel-welcome';
