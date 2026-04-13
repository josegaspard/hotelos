import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HotelOS Booking",
  description: "Motor de reservas hoteleras",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
