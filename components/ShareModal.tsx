'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface ShareModalProps {
  gameHtml: string;
  gameTitle: string;
  onClose: () => void;
}

export default function ShareModal({ gameHtml, gameTitle, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const share = async () => {
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: gameHtml, title: gameTitle }),
        });
        if (!res.ok) throw new Error('공유 실패');
        const { url } = await res.json();
        setShareUrl(url);

        const qr = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: { dark: '#e2e8f0', light: '#0a0a20' },
        });
        setQrDataUrl(qr);
      } catch {
        setError('공유 링크 생성에 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    share();
  }, [gameHtml, gameTitle]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: `${gameTitle} — AI Game Factory`,
        text: '내가 만든 게임을 플레이해보세요!',
        url: shareUrl,
      });
    } catch {
      // User cancelled — ignore
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5,5,16,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-cinematic"
        style={{
          padding: '28px 24px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 16px 64px rgba(99,102,241,0.15), 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3 style={{ color: 'var(--text-bright)', fontSize: '17px', fontWeight: 600, margin: 0 }}>
            게임 공유하기
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            CLOSE
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            <div style={{
              width: '24px', height: '24px', margin: '0 auto 12px',
              border: '2px solid var(--border-dim)',
              borderTopColor: 'var(--ai-indigo)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span className="mono-xs">GENERATING SHARE LINK...</span>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {shareUrl && qrDataUrl && (
          <>
            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-dim)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* URL */}
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              border: '1px solid rgba(99,102,241,0.15)',
              overflow: 'hidden',
            }}>
              <span style={{
                color: 'var(--ai-indigo)',
                fontSize: '12px',
                wordBreak: 'break-all',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {shareUrl}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCopy}
                className="btn-glow"
                style={{
                  flex: 1,
                  background: copied
                    ? 'linear-gradient(135deg, var(--ai-emerald), #4ade80)'
                    : undefined,
                  fontSize: '13px',
                  padding: '12px',
                  borderRadius: '12px',
                }}
              >
                {copied ? 'COPIED' : 'COPY LINK'}
              </button>

              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-glow)',
                    color: 'var(--ai-indigo)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  SHARE
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
