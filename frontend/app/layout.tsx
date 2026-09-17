import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VITAL-X — Clinical Case-Taking System',
  description: 'Evidence-First Multilingual Intake for SIH26047',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
