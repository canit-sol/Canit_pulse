# CANIT Pulse — Design System & Context

## Project Overview

CANIT Pulse is an internal brand intelligence suite for agencies managing multiple client brands. It allows agencies to:

- Generate automated monthly social media reports (Instagram, Facebook, YouTube)
- Track ad spend campaigns across Meta and Google
- Monitor brand health and intelligence metrics
- Deliver content calendars and deliverables tracking
- Provide clients a branded portal to view their performance

The platform has two main interfaces:
1. **Admin Dashboard** `/admin/dashboard` — agency staff manages clients, generates reports, connects social accounts
2. **Client Portal** `/client/:id` — clients view their platform analytics, ad spends, deliverables, brand intelligence

## Current Design System

### Brand Identity

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | Navy blue `#113a87` (HSL: 219 78% 30%) | Buttons, headings, key accents |
| **Accent** | Gold `#F5A623` (HSL: 45 93% 58%) | Highlights, warnings, premium badges |
| **Body font** | Poppins (sans-serif) | All UI text |
| **Brand font** | Linux Libertine / Georgia (serif) | Logo wordmark "CANIT Pulse" |

### Surface Colors

| Token | Value |
|-------|-------|
| Background | `#FAFCFF` |
| Raised surface (cards) | `#ffffff` |
| Sunken surface | `#f7f5f2` |
| Border | `#E7EDF5` (HSL: 214 50% 93%) |

### Design Tokens

#### Shadows
- `soft` — `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)` (default card)
- `glass` — `0 4px 30px rgba(0,0,0,0.05)` (hover state)
- `bento` — `0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)`
- `float` — `0 8px 40px rgba(17,58,135,0.10), 0 2px 8px rgba(0,0,0,0.04)`
- `glow` — `0 0 24px rgba(17,58,135,0.08)`

#### Border Radius
- Default radius: `1.25rem` (20px)
- Large: `1.5rem` (24px)
- Components use a mix of `rounded-md` (6px shadcn default), `rounded-2xl` (16px), and `rounded-[32px]`

#### Typography
- All UI: Poppins (sans-serif) via `font-sans`, `font-heading`, `font-body`
- Logo/wordmark: Linux Libertine or Georgia via `font-brand`
- Size scale: 9px (badges/labels), 10px (captions/tracking), 12px (meta), 14px (body), 16px+ (headings)

### Common UI Patterns

#### Glass Card
```css
.bento-card {
  bg-white rounded-2xl border border-[#E7EDF5] shadow-soft
  transition-all duration-200 ease-out
}
.bento-card:hover {
  shadow-glass border-slate-300
}
```

#### Modals
```css
fixed inset-0 z-50 bg-black/40 backdrop-blur-md
  content: rounded-[32px] bg-white border border-[#E7EDF5] shadow-soft
```

#### Sidebar
- Collapsible sidebar (minimizes to icon-only)
- Custom overlay drawer for mobile (not shadcn Sheet)
- Collapsed: `w-[68px]`, Expanded: `w-56`

#### Stat Cards (Client Portal)
- Compact `bento-metric` with large monospaced numbers, icon in colored box, label underneath
- Animated counter on mount (ease-out cubic, ~800ms)

#### Platform Tabs
- Horizontally scrollable on mobile (`.hide-scrollbar`)
- Each platform has a dedicated color theme (Instagram pink, Facebook blue, YouTube red, Ad Spends emerald)

### Page Layouts

#### Admin Dashboard
- Sidebar (left) + main content area
- 3-column grid of ClientCards (responsive)
- Each card: client name, industry, website, social connection docks, SEO status, generate button
- Multiple modals: Add/Edit Brand, Instagram Page Picker, Competitor Management, Content Calendar, Delete Confirmation, SEO upload

#### Client Portal
- Platform tabs bar at top (Deliverables, Ad Spends, Instagram, Facebook, YouTube, Blogs & SEO)
- Content area switches per tab
- Floating AI chat widget (bottom-right)
- Report navigation arrows (left/right)

#### Login Page
- Centered card on subtle gradient with animated blur orbs
- Large centered logo
- "Linear/Stripe style" clean card with frosted glass

### Platform-Specific Themes (Client Portal tabs)

| Platform | Primary Color | Tab Active BG | KPI Color |
|----------|--------------|---------------|-----------|
| Deliverables | Violet `#7C3AED` | `bg-[#7C3AED]` | Violet |
| Ad Spends | Emerald `#059669` | `bg-[#059669]` | Emerald |
| Instagram | Pink `#E1306C` | Gradient pink→purple | Pink |
| Facebook | Blue `#1877F2` | `bg-[#1877F2]` | Blue |
| YouTube | Red `#FF0000` | `bg-[#FF0000]` | Red |
| Blogs & SEO | Emerald `#10B981` | `bg-[#10B981]` | Emerald |

## Known Design Issues (Vibe-Coded Artifacts to Fix)

1. **Hardcoded brand color** — `#113a87` appears in 100+ places instead of using `bg-primary` / `text-primary` CSS variables
2. **Two sidebar implementations** — Custom AppSidebar + unused shadcn sidebar boilerplate (30+ unused component files)
3. **Mixed border radii** — Some inputs use `rounded-md` (6px shadcn default), others `rounded-2xl` (16px), modals use `rounded-[32px]`. No consistent scale.
4. **Monolith component files** — `ClientPortal.tsx` is 3656 lines, `AdminDashboard.tsx` is 1772 lines. No decomposition.
5. **Duplicate SVG icons** — Instagram/Facebook/YouTube SVGs duplicated across `ClientCard.tsx` and `ClientPortal.tsx`
6. **Random emoji in code** — Comments and alert messages use emojis (`✨`, `⚠️`, `❌`, `🚀`, `💾`) rather than proper icon components
7. **Inconsistent input styling** — Admin uses `rounded-2xl bg-white/40` inputs, other pages use shadcn `input.tsx` with `rounded-md`
8. **Unused shadcn components** — 30+ shadcn components installed but never used (accordion, carousel, context-menu, menubar, pagination, resizable, etc.)
9. **Lovable generator artifact** — `Index.tsx` still contains a Lovable AI placeholder comment

## Design Direction for Redesign

The platform should feel like:
- **Professional agency tool** — not a consumer app, not a startup landing page
- **Data-dense but clean** — tables, stat cards, charts should be the hero, not decorative elements
- **Consistent radii** — pick one radius system (16px cards, 12px buttons/inputs, 8px badges) and stick to it
- **Single source of truth for brand color** — use CSS variables everywhere, no hardcoded hex values
- **Proper component decomposition** — no 3000+ line files
- **No "vibe code" artifacts** — no emoji in UI copy (unless user-generated), no unnecessary gradients on everything, no frosted glass for the sake of it
- **Mobile-first** — sidebar drawer, scrollable tabs, responsive tables

### Refs for Inspiration
- Linear (clean data dashboards)
- Stripe (dense tables with clear typographic hierarchy)
- Vercel (minimal admin panels)
- Notion (sidebar patterns)

## Pages to Redesign

1. **Login Page** — cleaned up, no extra blur orbs
2. **Admin Dashboard** — proper card grid, consistent modals, no monolith
3. **Client Portal** — decomposed tabs, consistent stat cards throughout, proper table components for ad spends
4. **App Sidebar** — single implementation, no duplicate
5. **Global** — consistent button/input/card radii, no hardcoded colors, no unused components
