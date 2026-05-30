import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Level One | Voice Intelligence",
  description: "AI Voice Agent CRM Dashboard — Level One",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23f97316'/><text x='8' y='23' font-size='18' font-family='sans-serif' fill='white' font-weight='bold'>L1</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
