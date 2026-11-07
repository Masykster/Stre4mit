"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOTER_LINKS = [
  { label: 'Beranda', href: '/' },
  { label: 'Baru & Populer', href: '/latest' },
  { label: 'Acara TV', href: '/discover?type=tv' },
  { label: 'Film', href: '/discover?type=movie' },
  { label: 'Anime', href: '/discover?anime=true' },
  { label: 'Drama', href: '/discover?drama=true' },
  { label: 'Daftar Saya', href: '/watchlist' },
  { label: 'Telusuri menurut Bahasa', href: '/languages' },
];

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on fullscreen cinema player pages
  if (pathname?.startsWith('/watch')) {
    return null;
  }

  return (
    <footer className="bg-[#141414] border-t border-white/5 pt-14 pb-10 text-xs text-zinc-500">
      <div className="max-w-6xl mx-auto px-4 md:px-12 space-y-6">
        <div className="text-[#E50914] font-black text-lg tracking-wider select-none">
          STRE<span className="text-white">4</span>MIT
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-500 hover:text-zinc-300 hover:underline transition-colors w-fit"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="pt-2 space-y-1.5 text-[11px] text-zinc-600">
          <p>Metadata & gambar disediakan oleh TMDb API. Stre4mit tidak menyimpan berkas media secara langsung.</p>
          <p>&copy; {new Date().getFullYear()} Stre4mit By Masykster</p>
        </div>
      </div>
    </footer>
  );
}
