# Stre4mit Design System (MASTER.md)

This document serves as the master design system and source of truth for the **Stre4mit** application. It is aligned with the `ui-ux-pro-max` guidelines for Entertainment (Video Streaming) products and the `ponytail` principle of minimal, high-efficiency implementation.

---

## 1. Core Visual Archetype & Style
*   **Product Type:** Entertainment (Video Streaming / Movie Klon)
*   **Aesthetics:** Immersive True Dark Mode, Content-First, High Contrast.
*   **Inspiration:** Netflix, Disney+, Apple TV. Immersive layout where imagery populates the screen and interface chrome fades into the background.

---

## 2. Color System (Tokens)
We use a tokenized system based on Tailwind's Zinc palette.

| Token | Class / Hex | Use Case |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-black` / `#000000` | True dark background to let poster colors "pop". |
| **Surface (Container)**| `bg-zinc-900` / `#18181b` | Cards, modals, selectors, search bars. |
| **Surface Hover** | `bg-zinc-800` / `#27272a` | Active state of cards, navigation items. |
| **Primary Accent** | `bg-red-600` / `#dc2626` | CTA (Play button, active status, badges). |
| **Primary Accent Hover**| `bg-red-700` / `#b91c1c` | Hover state for CTA. |
| **Text Primary** | `text-zinc-50` / `#fafafa` | Titles, headers, navigation text. |
| **Text Secondary** | `text-zinc-400` / `#a1a1aa` | Metadata (year, runtime, rating, director). |
| **Text Muted** | `text-zinc-600` / `#52525b` | Disabled states, empty text placeholders. |
| **Border / Divider** | `border-zinc-800` / `#27272a` | Divider lines, card borders, active tabs. |

---

## 3. Typography & Spacing System
*   **Font Family:** Inter or Geist (System Sans-serif fallback).
*   **Spacing Grid:** 4px/8px Incremental Scale (Tailwind standard spacing).
    *   `gap-2` (8px): Between small controls / metadata items.
    *   `gap-4` (16px): Between cards / adjacent items.
    *   `p-4`/`p-6` (16px/24px): Standard page / container paddings.
    *   `space-y-8` (32px): Vertical sections on homepage.

### Type Scale Hierarchy
*   **Main Hero Title:** `text-4xl md:text-6xl font-extrabold tracking-tight`
*   **Section Heading:** `text-xl md:text-2xl font-bold tracking-tight text-zinc-50`
*   **Card Title:** `text-sm font-semibold truncate`
*   **Body / Synopsis:** `text-sm md:text-base leading-relaxed text-zinc-300`
*   **Metadata Labels:** `text-xs md:text-sm font-medium text-zinc-400`

---

## 4. Components Blueprint

### 4.1 MovieCard (Molecule)
*   **Ratios:** Poster aspect-ratio is vertical `aspect-[2/3]`.
*   **Grid layout:**
    *   Mobile: 2 columns (`grid-cols-2`)
    *   Tablet: 4 columns (`md:grid-cols-4`)
    *   Desktop: 6 columns (`lg:grid-cols-6`)
*   **Interactions ("The Hover Pop-up"):**
    *   Desktop hover transitions: `transition-all duration-300 ease-out`
    *   Transform: `hover:scale-105 hover:shadow-2xl hover:shadow-red-950/20`
    *   Overlay: Shimmer/fade in metadata preview (rating, release year).

### 4.2 Hero Carousel / Banner (Organism)
*   **Height:** Responsive `h-[70vh] md:h-[85vh]` with background backdrop aspect-video.
*   **Vibe:** Linear dark gradient overlay `bg-gradient-to-t from-black via-black/40 to-transparent` to ensure absolute readability of hero text at the bottom.
*   **Trailer Auto-play:** YouTube embed trailer (muted) triggers after 1.5s hover on desktop.

### 4.3 sandboxed Iframe Player (Organism)
*   **Aspect Ratio:** `aspect-video` (16:9).
*   **Security:** `sandbox="allow-scripts allow-same-origin allow-forms"` to block popups.
*   **Theater Mode:** Widens container width from normal `max-w-6xl` to `w-full h-[80vh]` and changes page wrapper to pure black.

---

## 5. UI/UX Rules & Accessibility Checklist
1.  **Touch Targets:** All interactive controls (Play, Close, Next, Page tabs) must be at least `min-h-[44px]` and `min-w-[44px]` (Tailwind `h-11 w-11` or larger).
2.  **No Emoji Icons:** Every icon must use `lucide-react` vectors.
3.  **Skeleton Screens:** Custom shimmer layout matching the target components instead of standard spinners:
    *   Use animate-pulse on zinc-800 blocks.
4.  **No Layout Shifts (CLS):** Reserve fixed heights and aspect ratios (`aspect-[2/3]` for cards, `aspect-video` for players/banners) so elements do not jump on load.
5.  **Interactive Feedback:** Active tabs and buttons must have immediate visual responses:
    *   Button tap: `active:scale-95`
    *   Hover: `hover:bg-zinc-800` or `hover:text-red-500`
