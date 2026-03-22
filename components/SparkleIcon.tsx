'use client';

interface SparkleIconProps {
  size?: number;
  className?: string;
}

export default function SparkleIcon({ size = 48, className = '' }: SparkleIconProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path d="M24 4 C24 4 26 18 24 24 C22 18 24 4 24 4Z" fill="#e07a5f" />
        <path d="M24 44 C24 44 22 30 24 24 C26 30 24 44 24 44Z" fill="#e07a5f" />
        <path d="M4 24 C4 24 18 22 24 24 C18 26 4 24 4 24Z" fill="#e07a5f" />
        <path d="M44 24 C44 24 30 26 24 24 C30 22 44 24 44 24Z" fill="#e07a5f" />
        <path d="M9 9 C9 9 20 18 24 24 C18 20 9 9 9 9Z" fill="#e07a5f" opacity="0.7" />
        <path d="M39 39 C39 39 28 30 24 24 C30 28 39 39 39 39Z" fill="#e07a5f" opacity="0.7" />
        <path d="M39 9 C39 9 28 18 24 24 C30 20 39 9 39 9Z" fill="#e07a5f" opacity="0.7" />
        <path d="M9 39 C9 39 20 30 24 24 C18 28 9 39 9 39Z" fill="#e07a5f" opacity="0.7" />
      </svg>
    </div>
  );
}
