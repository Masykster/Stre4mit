"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

const DEFAULT_PREFIXES = ['/movie/', '/tv/', '/person/'];

export default function DetailModalShell({ children, allowedPrefixes = DEFAULT_PREFIXES }) {
  const pathname = usePathname();
  const router = useRouter();
  const { closeDetailModal } = useApp();
  const scrollContainerRef = useRef(null);

  const isModalActive =
    !pathname?.startsWith('/watch') &&
    allowedPrefixes.some((prefix) => pathname?.startsWith(prefix));

  const handleClose = useCallback(() => {
    closeDetailModal(router);
  }, [closeDetailModal, router]);

  // Scroll modal container back to top when switching between titles/cast inside the modal
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);

  // Lock background scroll & support Escape key dismissal while modal is active
  useEffect(() => {
    if (!isModalActive) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isModalActive, handleClose]);

  if (!isModalActive) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/75 backdrop-blur-[2px] px-2 sm:px-6 py-6 sm:py-9 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-[920px] rounded-[8px] bg-[#181818] text-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 overflow-hidden animate-netflix-pop"
      >
        {/* Netflix Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup detail"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-[#181818]/90 hover:bg-[#2a2a2a] border border-white/15 text-white transition-colors cursor-pointer shadow-lg"
        >
          <X size={20} />
        </button>

        {children}
      </div>
    </div>
  );
}
