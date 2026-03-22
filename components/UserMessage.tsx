'use client';

import { escapeHtml } from '@/lib/scenarios';

interface UserMessageProps {
  text: string;
}

export default function UserMessage({ text }: UserMessageProps) {
  return (
    <div className="flex justify-end animate-msg-in">
      <div
        className="px-4 py-2.5 text-[15px] leading-relaxed max-w-[75%]"
        style={{
          background: 'var(--bg-bubble-user)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-primary)',
        }}
        dangerouslySetInnerHTML={{ __html: escapeHtml(text) }}
      />
    </div>
  );
}
