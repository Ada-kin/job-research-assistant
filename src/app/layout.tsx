import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Research Assistant',
  description: 'Manage applications, customize CVs and generate letters with AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
