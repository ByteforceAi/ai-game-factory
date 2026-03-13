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
          color: { dark: '#e6edf3', light: '#0d1117' },
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
      // Fallback for older browsers
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
      // User cancelled or share failed — ignore
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#161b22',
          borderRadius: '20px',
          padding: '28px 24px',
          maxWidth: '360px',
          width: '100%',
          border: '1px solid #30363d',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3 style={{ color: '#e6edf3', fontSize: '17px', fontWeight: 600, margin: 0 }}>
            게임 공유하기
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b949e' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
            </div>
            공유 링크 생성 중...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#f85149' }}>
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
                  borderRadius: '12px',
                  border: '1px solid #30363d',
                }}
              />
            </div>

            {/* URL */}
            <div style={{
              background: '#0d1117',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              border: '1px solid #21262d',
              overflow: 'hidden',
            }}>
              <span style={{
                color: '#58a6ff',
                fontSize: '12px',
                wordBreak: 'break-all',
                fontFamily: "'Fira Code', monospace",
              }}>
                {shareUrl}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  background: copied
                    ? 'rgba(63,185,80,0.15)'
                    : 'rgba(88,166,255,0.15)',
                  border: copied
                    ? '1px solid #3fb950'
                    : '1px solid #58a6ff',
                  color: copied ? '#3fb950' : '#58a6ff',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ 복사됨!' : '📋 링크 복사'}
              </button>

              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  style={{
                    flex: 1,
                    background: 'rgba(136,108,228,0.15)',
                    border: '1px solid #8b6ce4',
                    color: '#8b6ce4',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📤 공유
                </button>
              )}
            </div>
          </>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
