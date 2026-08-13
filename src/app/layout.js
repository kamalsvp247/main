import "./globals.css";

export const metadata = {
  title: "T2Hub — Exam Center Console",
  description: "Search, schedule, reschedule and manage exam bookings for Bangladesh.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
