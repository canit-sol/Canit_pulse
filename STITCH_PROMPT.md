# CANIT Pulse — Stitch UI Redesign Prompt

## Project Context

CANIT Pulse is an internal B2B brand intelligence dashboard used by a digital agency to manage ~30+ client brands. It is NOT a consumer app or a startup landing page. The audience is agency staff (super admins, CSMs, HR) and their clients who log in monthly to view performance reports.

The platform has two core interfaces:
1. **Admin Dashboard** — agency staff manage clients, generate reports, connect social accounts
2. **Client Portal** — clients view their analytics across Instagram, Facebook, YouTube, ad spend campaigns

## Design Goals

The redesigned UI should feel like:
- **A professional agency operations tool** — think Linear, Stripe dashboard, Vercel admin
- **Data-dense but clean** — tables, KPIs, and charts are the hero; decorative elements are minimal
- **Typographically rigorous** — clear hierarchy, consistent sizing, good information density
- **Consistent** — single radius system, single color variable source, no mixing of design languages
- **No "vibe-coded" artifacts** — no random emoji in UI, no unnecessary gradients, no glassmorphism for the sake of it, no decorative blobs/orbs

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#113A87` (navy) | Primary buttons, active states, key accents |
| Primary hover | `#1E56B8` (lighter navy) | Button hover states |
| Accent | `#F5A623` (gold) | Premium badges, highlights, warnings |
| Background | `#FAFCFF` (off-white) | Page background |
| Card surface | `#FFFFFF` | Cards, modals, panels |
| Border | `#E7EDF5` (light blue-gray) | Card borders, dividers |
| Text primary | `#1A1A1A` (near black) | Body text |
| Text muted | `#6B7280` (gray) | Secondary labels |
| Success | Green | Positive metrics |
| Destructive | Red | Negative metrics, delete actions |

## Typography

- Primary font: **Poppins** (all UI — headings, body, labels)
- Logo font: **Linux Libertine** or **Georgia** (serif, for the "CANIT Pulse" wordmark only)
- Size scale should be intentional: 10px (badges/tags), 12px (table cells/meta), 14px (body), 16px (subheadings), 20px+ (page titles)
- Table data should use tabular-nums for alignment

## Pages/Screens to Design

### 1. Login Page
- Centered card layout, minimal
- Large centered logo at top
- Clean email/password form
- No animated background orbs, no frosted glass — just a solid card on clean background
- "CANIT Pulse" brand name and tagline below logo

### 2. Admin Dashboard — Client Grid
- Collapsible sidebar on left (navy/dark background)
- Main area: header with "Active Clients" title + search bar
- Grid of client cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Each client card shows: name, industry, website, social connection status dots (Instagram/Facebook/YouTube — colored when connected, gray when not), SEO upload status, "Generate Report" action
- Floating action button or top-right button to add new client

### 3. Admin Dashboard — Modals (consistent treatment for all)
- **Add/Edit Client modal**: name, industry, website, purpose fields
- **Instagram Page Picker**: search + select from Meta pages list
- **Delete Confirmation**: clean alert with danger button
- All modals should share the same: overlay, header style, button placement, padding, border radius

### 4. Client Portal — Platform Tabs
- Horizontal tab bar with per-platform colors as subtle accents (not overwhelming):
  - Deliverables → Violet accent
  - Ad Spends → Emerald accent
  - Instagram → Pink accent
  - Facebook → Blue accent
  - YouTube → Red accent
  - Blogs & SEO → Teal accent
- Active tab has a slim colored bottom bar or subtle background fill
- Tabs are horizontally scrollable on mobile with hidden scrollbar

### 5. Client Portal — KPI Stat Cards
- Row of 4-6 compact metric cards
- Each shows: large number (animated on mount), label below, small icon or colored dot
- Numbers use tabular-nums, compact notation (1.2K, 3.4M, etc.)
- Consistent card style across all platform tabs

### 6. Client Portal — Ad Spends Table
- Month selector (left/right arrows + month name)
- 4 stat summary cards at top (Allocated Budget, Amount Spent, Clicks, Leads)
- Dense data table with: Campaign Name | Platform icon | KPI name | monthly columns | Total
- Sticky header, horizontally scrollable on mobile
- Import CSV button that opens a clean upload modal with template download

### 7. App Sidebar
- Single sidebar component (no duplicate implementations)
- Desktop: collapsible between icon-only (68px) and full (224px)
- Mobile: overlay drawer triggered by hamburger menu
- Nav items: Dashboard, Clients, Archive, Users, Settings, Terms
- User avatar/initials + role at bottom + sign out

## Design Rules to Follow

1. **Single border radius scale** — pick one: 16px for cards, 12px for buttons/inputs, 8px for badges. Do not mix 6px (shadcn default), 16px, 20px, and 32px in different places
2. **CSS variables for color** — no hardcoded `#113a87` hex values in components. Use `var(--primary)` or Tailwind `bg-primary`/`text-primary` everywhere
3. **No duplicate icon components** — platform icons (Instagram, Facebook, YouTube SVG paths) should be shared from a single source
4. **No emoji in UI** — use Lucide icons or nothing for visual indicators. No `✨`, `🚀`, `💾`, `⚠️`, `❌` in interface text
5. **Decompose large files** — no single file over ~500 lines. Separate concerns: stat cards, tables, modals each get their own component
6. **Unused code removal** — remove any shadcn components that aren't actually used in the app (e.g., accordion, carousel, context-menu, menubar, pagination, resizable, sonner, etc.)
7. **Mobile responsive** — all pages must work on 375px width. Sidebar becomes overlay drawer, tables scroll horizontally, stat cards stack vertically

## What NOT to Do

- Do not add decorative gradient blobs, floating orbs, or animated background particles
- Do not use glassmorphism or frosted glass as a primary card style — subtle is fine for modals/overlays
- Do not use random emoji characters as UI elements
- Do not make it look like a startup landing page or consumer social app
- Do not add illustration or mascot characters
- Do not use border-radius smaller than 6px or larger than 24px for any UI element
