import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Game Factory - Mobile',
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        background: '#0a0a0a',
        color: '#e5e5e5',
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      {children}
    </div>
  );
}
