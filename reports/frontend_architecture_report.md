# AuthentiHire Phase 7: Premium Frontend Architecture Report

**Phase:** Phase 7 — AuthentiHire Premium Frontend Implementation  
**Status:** Complete & Verified  
**Date:** September 2026  
**Artifacts Generated/Updated:**
- `frontend/` (Vite + React 19 + TypeScript application)
- `frontend/src/styles/tokens.css` & `globals.css` (Design system & typography)
- `frontend/src/types/api.ts` (TypeScript interfaces matching backend schema)
- `frontend/src/api/client.ts` (Centralized fetch API client with error handling)
- `frontend/src/components/` (`Navbar`, `Hero`, `HeroVisual`, `AnalysisForm`, `LoadingState`, `ResultsDashboard`, `InfoModals`, `Footer`)
- `frontend/src/__tests__/` (Vitest & React Testing Library test suite — 13 tests)
- `reports/frontend_architecture_report.md` (This report)
- `README.md` (Updated with frontend installation and execution commands)

---

## 1. Executive Summary

In Phase 7, we engineered a modern, Apple-inspired, premium web application for **AuthentiHire** using **React 19**, **Vite**, **TypeScript**, **Vanilla CSS Design Tokens**, and **Framer Motion**.

The frontend connects directly to the existing **FastAPI** backend (`POST /api/v1/analyze`, `GET /api/v1/health`, `GET /api/v1/model-info`) as the single source of truth for all risk scores, probabilities, heuristic rule evidence, company intelligence, and recommendations.

### Key Visual & UX Highlights:
- **Design Baseline**: Implemented the approved visual reference with crisp typography (Inter), deep navy accents (`#0B1F3A`), restrained primary blue (`#1677FF`), soft neutral background (`#F7F8FA`), and clear semantic risk colors.
- **Hero 3D / Layered Visual**: Built a layered document card with translucent glassmorphic depth, soft blue lighting, floating badges (`Analyze`, `Identify Risks`, `Build Confidence`), restrained cursor tilt response, and strict `prefers-reduced-motion` support.
- **Progressive Disclosure Form**: Minimalist, focused input experience with a prominent job description textarea, live character counter (`0/5000`), expandable optional metadata grid, and a quick "Load sample scam posting" demo button.
- **Authoritative Results Dashboard**: Accurate, unmanipulated rendering of backend metrics (Overall Risk Score `0–100`, horizontal segmented risk bar with exact score marker, Calibrated ML Probability, Company Trust Score `0–100`, flagged evidence rules with quotes, company verification checklist, and actionable safety recommendations).
- **Responsive & Accessible**: Seamless fluid adaptation from mobile (375px) to desktop (1440px), high-contrast focus indicators, semantic HTML5, and accessible ARIA attributes.

---

## 2. Component Architecture & User Flow

```text
  [ App.tsx (Root View Orchestrator) ]
   ├── [ Navbar.tsx ] (Sticky Header, Brand Logo, Navigation Links, Mobile Drawer)
   │
   ├── [ View: 'home' ]
   │    └── [ Hero.tsx ]
   │         ├── Pill Tag: "Safer Jobs. Brighter Futures."
   │         ├── Headline: "Find work with confidence."
   │         ├── CTA Buttons: "Analyze a job →", "How it works"
   │         ├── 3 Capability Badges: "Detect", "Verify", "Understand"
   │         ├── [ HeroVisual.tsx ] (3D Layered Document with Depth & Floating Badges)
   │         └── Right Context Box: "A safer tomorrow starts with smarter choices."
   │
   ├── [ View: 'analyze' ]
   │    └── [ AnalysisForm.tsx ]
   │         ├── Top: "← Back", Title & Subtitle
   │         ├── Quick Demo: "Load sample scam posting"
   │         ├── Primary Input: Textarea (Job description *) + Counter
   │         ├── Collapsible Section: "Add more details (optional)" (Grid of 10 fields)
   │         └── Actions: "Clear form", "Analyze posting →"
   │
   ├── [ View: 'loading' ]
   │    └── [ LoadingState.tsx ] (Animated Pulse + 4-Step Verification Checklist)
   │
   ├── [ View: 'results' ]
   │    └── [ ResultsDashboard.tsx ]
   │         ├── Top Actions: "← New analysis", "Download Report", "Share"
   │         ├── Top Left: Overall Risk Score Card (Score / 100, Badge, Horizontal Scale & Pin)
   │         ├── Top Right: Fraud Probability Card (%) + Company Trust Score Card (/100)
   │         ├── Bottom Left: "Why we flagged this" Evidence List (Rules, Severity, Evidence Quotes)
   │         ├── Bottom Right: "Company verification" Checklist & "Recommendations" Card
   │         └── Bottom Drawer: "View submitted job details" (Safe raw text view)
   │
   ├── [ InfoModals.tsx ] ("How It Works", "About", "Resources")
   └── [ Footer.tsx ] (Brand notes, system transparency, quick links)
```

---

## 3. Design System & Tokens

Implemented in `frontend/src/styles/tokens.css` and `globals.css`:

| Token Group | Values | Description |
| :--- | :--- | :--- |
| **Surfaces** | `#F7F8FA` (App bg), `#FFFFFF` (Card bg), `#F9FAFB` (Subtle card) | Clean, airy background |
| **Typography** | `Inter`, 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold) | Apple-like system font scale |
| **Brand Accents** | `#1677FF` (Primary blue), `#0958D9` (Hover), `#E6F4FF` (Subtle bg), `#0B1F3A` (Navy) | Restrained, non-cyberpunk blue |
| **Risk: LOW** | `#12B76A` (Green), `#027A48` (Text), `#ECFDF3` (Bg) | Score 0–24 |
| **Risk: MODERATE**| `#F79009` (Amber), `#B54708` (Text), `#FFFAEB` (Bg) | Score 25–49 |
| **Risk: HIGH** | `#F04438` (Coral/Red), `#B42318` (Text), `#FEF3F2` (Bg) | Score 50–74 |
| **Risk: CRITICAL**| `#D92D20` (Deep Red), `#912018` (Text), `#FEE4E2` (Bg) | Score 75–100 |

---

## 4. API Integration & Error Security

1. **Client Implementation (`frontend/src/api/client.ts`)**:
   - Centralized `analyzeJobPosting(payload, liveChecks)` calling `POST /api/v1/analyze`.
   - `fetchHealth()` calling `GET /api/v1/health`.
   - `fetchModelInfo()` calling `GET /api/v1/model-info`.
   - Base URL dynamically resolved via `import.meta.env.VITE_API_BASE_URL` (defaulting to `http://127.0.0.1:8000`).
2. **Defensive Error Handling**:
   - `422 Unprocessable Entity`: Parsed into user-friendly validation error without stack traces.
   - `500 Internal Error`: Extracts `error_id` for logging, presents clean retry message.
   - Network Disconnection: Friendly offline notice instructing user to verify backend server status.
3. **No Unsafe HTML**:
   - User inputs and job descriptions are rendered purely as plain text with `white-space: pre-wrap`. `dangerouslySetInnerHTML` is never used.

---

## 5. Automated Verification & Testing Results

### 5.1 Frontend Test Suite (`vitest run`):
- **13/13 Tests Passed** (0 failures, 1.34s run time):
  1. `client.test.ts`: Happy path job submission, 422 error parsing, 500 error parsing with error ID, network offline handling, health endpoint fetch, model info endpoint fetch.
  2. `app.test.tsx`: Homepage hero/headline/capability rendering, navigation to analysis view, optional fields accordion toggle, sample scam loading and full live analysis flow, Overall Risk Score and band rendering, Fraud probability & Company trust score rendering, evidence and company verification rendering, insufficient evidence state handling, API error banner rendering, modal open/close interactions.

### 5.2 Backend Regression Test Suite (`python3 -m unittest discover -s tests -v`):
- **63/63 Tests Passed** (0 failures, 6.61s run time):
  - Phase 2.5 ML Calibration (15 tests)
  - Phase 3 Scam Rules (10 tests)
  - Phase 4 Company Intelligence (17 tests)
  - Phase 5 Unified Risk Assessment (12 tests)
  - Phase 5.1 Risk Validation & Calibration (9 tests)

### 5.3 Browser Subagent Visual QA Results:
- Executed visual QA on `http://127.0.0.1:5173`.
- Verified desktop landing page, 3D document visual, hero badges, analysis input flow, sample scam pre-fill, live submission to backend, results dashboard with risk scale, evidence cards, company verification, and mobile 375px responsive layout.
- Status: **PASSED (100% Visual and Functional Compliance)**.

---

## 6. Deliverables & Files Summary

| File | Purpose |
| :--- | :--- |
| `frontend/src/styles/tokens.css` | Design system variables & color tokens |
| `frontend/src/styles/globals.css` | Global styling, typography, buttons, and utility classes |
| `frontend/src/types/api.ts` | Complete TypeScript interfaces matching backend models |
| `frontend/src/api/client.ts` | Centralized fetch API client with error handling |
| `frontend/src/components/Navbar.tsx` | Responsive header with desktop links & mobile drawer |
| `frontend/src/components/Hero.tsx` | Hero section with headline, CTA buttons, and capability pills |
| `frontend/src/components/HeroVisual.tsx` | 3D layered document visual with floating badges |
| `frontend/src/components/AnalysisForm.tsx` | Progressive disclosure input form with live counter |
| `frontend/src/components/LoadingState.tsx` | Multi-step visual verification progress loader |
| `frontend/src/components/ResultsDashboard.tsx` | Complete risk results dashboard with risk scale and evidence |
| `frontend/src/components/InfoModals.tsx` | "How It Works", "About", and "Resources" dialogs |
| `frontend/src/components/Footer.tsx` | Clean system transparency footer |
| `frontend/src/App.tsx` | Main application state & view orchestrator |
| `frontend/src/__tests__/` | Comprehensive Vitest & React Testing Library test suite |
| `reports/frontend_architecture_report.md` | This technical architectural report |
