# Litsense Token Management System — Frontend Implementation Plan

## Executive Summary

Build a premium, healthcare-grade frontend using **Next.js 15 App Router**, **Tailwind CSS v4**, and **shadcn/ui**. The backend (21 API routes + hybrid queuing algorithm) is complete and **read-only** — no backend modifications permitted.

---

## Phase 0: Foundation & Design System

### 0.1 — Dependencies
| Package | Purpose |
|---------|---------|
| `shadcn/ui` | Component library (Button, Card, Badge, Dialog, Table, Tabs, Input, Select) |
| `socket.io-client` | Real-time event listener for display/doctor dashboards |
| `clsx` + `tailwind-merge` | Conditional class utilities (shadcn requirement) |
| `class-variance-authority` | Component variant system (shadcn requirement) |
| `@radix-ui/*` | Headless UI primitives (installed via shadcn) |
| `recharts` | Charts for analytics widgets |
| `qrcode.react` | QR code generation for token receipts |

### 0.2 — Environment
```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/litsense-tokens
```

### 0.3 — Design Tokens ("Surgical Blue" Medical Theme)
```
Primary:        hsl(199, 89%, 48%)   — #0891B2 (Surgical Teal)
Primary Dark:   hsl(199, 89%, 38%)   — #0E7490
Accent:         hsl(160, 84%, 39%)   — #10B981 (Medical Green)
Danger:         hsl(0, 84%, 60%)     — #EF4444
Warning:        hsl(38, 92%, 50%)    — #F59E0B
Background:     hsl(210, 40%, 98%)   — #F8FAFC (Light)
Background Dark:hsl(222, 47%, 11%)   — #0F172A (Dark)
Surface:        hsl(0, 0%, 100%)     — #FFFFFF
Surface Dark:   hsl(217, 33%, 17%)   — #1E293B
Text:           hsl(222, 47%, 11%)   — #0F172A
Text Muted:     hsl(215, 16%, 47%)   — #64748B
Border:         hsl(214, 32%, 91%)   — #E2E8F0
```

### 0.4 — File Structure
```
src/
├── app/
│   ├── layout.tsx              ← Root layout (Inter font, theme provider, nav)
│   ├── page.tsx                ← Landing page (/)
│   ├── globals.css             ← Tailwind + CSS variables + animations
│   ├── reception/
│   │   └── page.tsx            ← Reception Dashboard
│   ├── doctor/
│   │   └── page.tsx            ← Doctor Dashboard
│   ├── display/
│   │   ├── page.tsx            ← Full Public Display
│   │   └── [doctorId]/
│   │       └── page.tsx        ← Single Doctor Display
│   └── track/
│       └── [tokenId]/
│           └── page.tsx        ← Patient Tracker (mobile)
├── components/
│   ├── ui/                     ← shadcn/ui primitives
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── reception/
│   │   ├── AppointmentList.tsx
│   │   ├── IssueTokenDialog.tsx
│   │   ├── QueueOverview.tsx
│   │   └── TokenReceipt.tsx
│   ├── doctor/
│   │   ├── QueuePanel.tsx
│   │   ├── CurrentPatient.tsx
│   │   └── ActionButtons.tsx
│   ├── display/
│   │   ├── NowServing.tsx
│   │   ├── UpcomingQueue.tsx
│   │   └── DoctorCard.tsx
│   └── tracker/
│       ├── PositionIndicator.tsx
│       └── TokenDetails.tsx
├── hooks/
│   ├── useTokenQueue.ts        ← Fetches + polls queue data
│   ├── useDoctors.ts           ← Fetches doctor list
│   └── useAutoRefresh.ts       ← Polling interval hook
└── lib/
    ├── api.ts                  ← Centralized fetch wrapper
    ├── utils.ts                ← cn() helper for tailwind-merge
    └── types.ts                ← Shared TypeScript interfaces
```

---

## Phase 1: Reception Dashboard (`/reception`)

### Task Checklist
- [ ] **1.1** Doctor selector dropdown (fetches from `GET /api/doctors`)
- [ ] **1.2** Date picker for appointment filtering
- [ ] **1.3** Appointment list table with status badges (`GET /api/appointments?doctorId=&date=`)
- [ ] **1.4** "Check-In" button per appointment row (`PUT /api/appointments/[id]/checkin`)
- [ ] **1.5** "Issue Token" dialog with confirmation (`POST /api/tokens/issue`)
- [ ] **1.6** Token receipt card with QR code (using `qrcode.react`)
- [ ] **1.7** Live queue overview panel (`GET /api/tokens/queue?doctorId=`)
- [ ] **1.8** "Book Walk-In" form (`POST /api/appointments`)
- [ ] **1.9** Cancel appointment action (`PUT /api/appointments/[id]/cancel`)
- [ ] **1.10** Auto-refresh queue every 5 seconds

### Wireframe
```
┌──────────────────────────────────────────────────────────┐
│  🏥 Litsense Token System    [Dr. Selector ▾] [📅 Date] │
├───────────────────────────┬──────────────────────────────┤
│  📋 Today's Appointments  │  🔢 Live Queue              │
│  ┌─────────────────────┐  │  ┌──────────────────┐       │
│  │ Patient | Time | ⚡ │  │  │ NOW SERVING      │       │
│  │ Anil    | 09:00| ✅ │  │  │ A-001 → Room A101│       │
│  │ Lakshmi | 09:15| ✅ │  │  ├──────────────────┤       │
│  │ Rajesh  | 09:30| 🔲 │  │  │ NEXT UP          │       │
│  │ Suresh  | 10:00| 🔲 │  │  │ A-002 (15 min)   │       │
│  └─────────────────────┘  │  │ A-003 (30 min)   │       │
│  [+ Walk-In]              │  │ W-001 (45 min)   │       │
│                           │  └──────────────────┘       │
└───────────────────────────┴──────────────────────────────┘
```

---

## Phase 2: Public Display (`/display`)

### Task Checklist
- [ ] **2.1** Full-screen "Now Serving" hero with token number + room
- [ ] **2.2** "Up Next" list (next 3 tokens)
- [ ] **2.3** Multi-doctor grid view (all active doctors)
- [ ] **2.4** Single-doctor view (`/display/[doctorId]`)
- [ ] **2.5** Auto-refresh via polling every 3 seconds (`GET /api/tokens/display?doctorId=`)
- [ ] **2.6** Stats bar (completed today, total active)
- [ ] **2.7** High-contrast, large-font design (readable from 3+ meters)
- [ ] **2.8** Pulsing animation on "Now Serving" token
- [ ] **2.9** Audio chime placeholder on token change
- [ ] **2.10** Dark theme optimized for TV/kiosk

### Wireframe
```
┌──────────────────────────────────────────────────────────┐
│                    🏥 LITSENSE                           │
│              NOW SERVING                                 │
│          ┌─────────────────┐                             │
│          │    A-001        │ ← Pulsing glow              │
│          │  Room: A-101    │                             │
│          │  Dr. Priya      │                             │
│          └─────────────────┘                             │
│                                                          │
│  NEXT UP: A-002 → A-003 → W-001                        │
│                                                          │
│  ──────────────────────────────────────                  │
│  Completed: 12  │  Waiting: 8  │  10:45 AM              │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 3: Doctor Dashboard (`/doctor`)

### Task Checklist
- [ ] **3.1** Doctor selector/login simulation
- [ ] **3.2** Current patient card with timer
- [ ] **3.3** Queue panel sorted by priority (`GET /api/tokens/queue?doctorId=`)
- [ ] **3.4** "Call Next" button (`PUT /api/tokens/[id]/call`)
- [ ] **3.5** "Start Serving" button (`PUT /api/tokens/[id]/serving`)
- [ ] **3.6** "Complete" button (`PUT /api/tokens/[id]/complete`)
- [ ] **3.7** "No-Show" action (`PUT /api/tokens/[id]/no-show`)
- [ ] **3.8** "Skip" action (`PUT /api/tokens/[id]/skip`)
- [ ] **3.9** "Delay" with minutes input (`PUT /api/tokens/[id]/delay`)
- [ ] **3.10** Stats summary (served today, avg wait time)
- [ ] **3.11** Auto-refresh queue every 3 seconds

### Wireframe
```
┌──────────────────────────────────────────────────────────┐
│  👨‍⚕️ Dr. Priya Menon — Anaesthesiology     Room A-101  │
├───────────────────────────┬──────────────────────────────┤
│  🟢 CURRENT PATIENT       │  📊 Today's Stats            │
│  ┌─────────────────────┐  │  Served: 5 | Waiting: 8     │
│  │ A-001 Anil Sharma   │  │  Avg Wait: 22 min           │
│  │ Type: Scheduled      │  │                             │
│  │ Wait: 0 min         │  ├──────────────────────────────┤
│  │                     │  │  📋 Queue                     │
│  │ [✅ Complete]        │  │  A-002 Lakshmi   (waiting)  │
│  │ [⏭ Skip] [❌ No-Show] │  │  A-003 Rajesh    (waiting)  │
│  │ [⏱ Delay]           │  │  W-001 Meera     (waiting)  │
│  └─────────────────────┘  │  A-004 Suresh    (waiting)  │
│                           │                              │
│  [📢 Call Next Patient]   │                              │
└───────────────────────────┴──────────────────────────────┘
```

---

## Phase 4: Patient Tracker (`/track/[tokenId]`)

### Task Checklist
- [ ] **4.1** Mobile-first responsive layout
- [ ] **4.2** Token number hero display
- [ ] **4.3** Queue position indicator (animated ring/progress)
- [ ] **4.4** "People Ahead" counter
- [ ] **4.5** Estimated wait time display
- [ ] **4.6** Doctor info (name, room, specialisation)
- [ ] **4.7** Status badge (Waiting → Called → Serving → Complete)
- [ ] **4.8** Auto-refresh every 5 seconds (`GET /api/tokens/[id]/track`)
- [ ] **4.9** Green "You're Next!" / "Your Turn!" celebration state
- [ ] **4.10** Litsense branding footer

### Wireframe (Mobile)
```
┌─────────────────┐
│  🏥 LITSENSE    │
│                 │
│  Your Token     │
│  ┌───────────┐  │
│  │  A-003    │  │
│  └───────────┘  │
│                 │
│   Position: 3   │
│   ┌─────────┐   │
│   │  ⏳ 2   │   │
│   │ people  │   │
│   │ ahead   │   │
│   └─────────┘   │
│                 │
│  Est. Wait:     │
│  ~30 minutes    │
│                 │
│  Dr. Priya      │
│  Room A-101     │
│  Status: ⏳     │
│                 │
│  ─────────────  │
│  Litsense ©     │
└─────────────────┘
```

---

## Phase 5: Landing Page (`/`)

### Task Checklist
- [ ] **5.1** Hero section with tagline + CTA
- [ ] **5.2** Features grid (Smart Queuing, Real-Time Display, QR Tracking, HMS Integration)
- [ ] **5.3** How It Works steps section
- [ ] **5.4** Stats/social proof section
- [ ] **5.5** Footer with Litsense branding
- [ ] **5.6** Responsive mobile layout
- [ ] **5.7** Smooth scroll animations (Framer Motion)

---

## Phase 6: Polish & Verification

### Task Checklist
- [ ] **6.1** Dark mode toggle (all pages)
- [ ] **6.2** Mobile responsiveness audit (320px → 1920px)
- [ ] **6.3** Browser recording: Reception → Issue Token → Display updates
- [ ] **6.4** Browser recording: Doctor calls next → Display updates
- [ ] **6.5** Loading states and error boundaries
- [ ] **6.6** SEO meta tags on all pages
- [ ] **6.7** Favicon and manifest

---

## API Integration Matrix

| Frontend Action | API Endpoint | Method |
|----------------|-------------|--------|
| List doctors | `/api/doctors` | GET |
| Get doctor details | `/api/doctors/{id}` | GET |
| List appointments | `/api/appointments?doctorId=&date=` | GET |
| Book walk-in | `/api/appointments` | POST |
| Check-in patient | `/api/appointments/{id}/checkin` | PUT |
| Cancel appointment | `/api/appointments/{id}/cancel` | PUT |
| Issue token | `/api/tokens/issue` | POST |
| Get live queue | `/api/tokens/queue?doctorId=` | GET |
| Call patient | `/api/tokens/{id}/call` | PUT |
| Start serving | `/api/tokens/{id}/serving` | PUT |
| Complete consultation | `/api/tokens/{id}/complete` | PUT |
| Mark no-show | `/api/tokens/{id}/no-show` | PUT |
| Skip patient | `/api/tokens/{id}/skip` | PUT |
| Delay slot | `/api/tokens/{id}/delay` | PUT |
| Display data | `/api/tokens/display?doctorId=` | GET |
| Track token | `/api/tokens/{id}/track` | GET |
| Seed data | `/api/seed` | POST |

---

## Technical Notes

1. **No Socket.io on backend** — The existing backend uses REST only (no WebSocket server). Real-time updates will be achieved via **aggressive polling** (3-5 second intervals) using `setInterval` + `useEffect`. A Socket.io layer can be added later when the backend supports it.

2. **Tailwind CSS v4** — Uses the new `@import "tailwindcss"` syntax. No `tailwind.config.js` needed; CSS custom properties define the theme.

3. **shadcn/ui** — Must initialize with `npx shadcn@latest init` which will create `components.json` and the `ui/` directory.

4. **Next.js 15 App Router** — All pages use `"use client"` for interactive dashboards. Server components used only for static pages (landing).
