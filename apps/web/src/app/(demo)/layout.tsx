import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SDK Demo | Boost',
  description: 'Interactive demo of the Boost SDK functionality',
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="aurora" />
      {children}
    </div>
  );
}
