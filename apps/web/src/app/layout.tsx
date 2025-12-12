import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Boost - Loyalty Engine for Modern Apps',
  description: 'Build engaging customer experiences with real-time event tracking, powerful promotions, and intelligent loyalty programs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
