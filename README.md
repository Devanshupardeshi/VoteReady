<p align="center">
  <img src="public/favicon.svg" alt="VoteReady Logo" width="80" height="80" />
</p>

<h1 align="center">🗳️ VoteReady — Your AI Election Journey Assistant</h1>

<p align="center">
  <strong>An intelligent, personalized civic education platform that empowers Indian citizens to navigate the election process with confidence.</strong>
</p>

<p align="center">
  <a href="https://voteready-358464469744.us-central1.run.app">🌐 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-google-services-integration">Google Services</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Google_Cloud_Run-Deployed-0F9D58?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Cloud Run" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
</p>

---

## 🚀 Live Deployment

> **🔗 [https://voteready-temp-358464469744.us-central1.run.app/](https://voteready-temp-358464469744.us-central1.run.app/)**
>
> Deployed on **Google Cloud Run** with auto-scaling, HTTPS, and global edge caching.

---

**VoteReady** solves this by building a **smart, context-aware AI assistant** that adapts its entire experience — from onboarding to AI responses to checklist items — based on who the voter is, where they're voting, and what they need help with.

---

## ✨ Features

### 🎯 Personalized Onboarding Flow
A 3-step animated onboarding that collects:
- **Voter Type** — First-time voter, Returning voter, NRI/Overseas, or Student
- **State/UT** — All 28 states + 8 Union Territories supported
- **Primary Concern** — Registration, Booth Finding, Process Understanding, or Candidate Research

Every subsequent screen adapts dynamically based on these inputs.

### 🤖 AI-Powered Chat Assistant (Gemini)
- **Multi-model selector** — Switch between Gemini 2.5 Flash, 2.5 Pro, 2.0 Flash, 1.5 Flash, and experimental 3.x models
- **Live model availability detection** — Checks which models are accessible in real-time
- **Context-aware system prompt** — Injects full VoterProfile (type, state, language, concern) into every request
- **Role-based quick prompts** — Different suggested questions for first-timers vs. NRIs vs. students
- **Non-partisan safeguards** — System prompt enforces neutrality, redirects political opinion questions to eci.gov.in
- **Conversation history** — Maintains last 10 messages for contextual follow-ups
- **Response caching** — SessionStorage caching prevents redundant API calls
- **Retry logic** — Automatic 2-retry mechanism with 1s backoff on failures
- **XSS Protection** — All AI responses sanitized via DOMPurify before rendering

### 📅 Election Timeline
- **7-step visual timeline** — From Election Announcement → Government Formation
- **Interactive step cards** — Expand for detailed explanations
- **"Watch Guide" buttons** — Direct YouTube links to official ECI video guides for each step
- **"Add to Calendar" integration** — Generate Google Calendar / ICS events for key election dates
- **Step completion tracking** — Mark steps as done, progress persists in localStorage

### 🔍 Candidate Research (AI-Powered)
- **Auto-detects constituency** from voter profile
- **Gemini-powered candidate lookup** — Uses structured JSON output for rich candidate cards
- **Party-color coded cards** — Visual party identification (BJP=Saffron, INC=Blue, AAP=Teal, etc.)
- **Party symbol emoji mapping** — 🪷 Lotus, ✋ Hand, 🧹 Broom, and more
- **Custom search** — Search specific leaders or constituencies
- **Non-endorsement disclaimer** — Clear "VoteReady does not endorse any candidate" notice

### 📍 Polling Booth Locator (Google Maps)
- **Browser geolocation** — One-click "Use My Location" with permission handling
- **Address search fallback** — Manual address/pincode input
- **Auto-initialize** — Pre-loads map based on user's profile state
- **Google Maps Embed API** — Interactive embedded map with zoom controls
- **ECI verification link** — Always directs users to verify at eci.gov.in

### ✅ Election Readiness Checklist
- **Dynamic per voter type** — Different checklist items for first-timers, returning voters, NRIs, and students
- **Visual progress ring** — SVG-animated circular progress indicator
- **Color-coded scoring** — Red (0-49%), Orange (50-79%), Green (80-100%)
- **Expandable details** — Each item has contextual help text with official sources
- **Persistent progress** — Checklist state saved to localStorage

### 🌐 Multilingual Support
- **10 Indian languages** — English, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada, Gujarati, Punjabi, Malayalam
- **Google Translate API v2** — Real-time translation with batch support
- **Intelligent caching** — SessionStorage cache per language/text pair
- **Debounced switching** — 300ms debounce prevents rapid API calls

### 🎨 Design & UX
- **Mobile-first responsive** design
- **Dark navy theme** with accent colors (#0F3460 primary)
- **Smooth animations** — CSS slide transitions for onboarding, tab switching
- **Lazy-loaded components** — React.lazy + Suspense for optimal loading
- **Loading skeletons** — Skeleton cards while data fetches
- **Custom SVG icons** — No icon library dependency, all inline SVGs

---

## 🔗 Google Services Integration

VoteReady integrates **7 Google services** meaningfully throughout the application:

| # | Google Service | Integration | Component |
|---|---------------|-------------|-----------|
| 1 | **Gemini AI** (2.5 Flash/Pro) | AI chat assistant with multi-model selection, context-aware system prompts, conversation history | `ChatAssistant`, `useGeminiAPI` |
| 2 | **Gemini Structured Output** | AI-powered candidate research with JSON schema output for rich candidate cards | `CandidateSearch` |
| 3 | **Google Maps Embed API** | Interactive polling booth locator with geolocation + address search | `BoothLocator` |
| 4 | **Google Translate API v2** | Real-time multilingual support for 10 Indian languages with batch translation | `LanguageSwitcher` |
| 5 | **YouTube Data API v3** | Election education video guides linked from timeline steps | `VideoCard` |
| 6 | **Google Calendar API** | Add election dates/reminders to Google Calendar | `AddToCalendar` |
| 7 | **Google Cloud Run** | Production deployment with auto-scaling, HTTPS, and managed infrastructure | `Dockerfile`, `server.js` |

---

## 🏗️ Architecture

```
VoteReady
├── Frontend (React 19 + Vite 8)
│   ├── Onboarding Flow ─── builds VoterProfile
│   ├── Tab Navigation (4 tabs)
│   │   ├── Timeline ──── ElectionTimeline + StepCard
│   │   ├── Ask AI ────── ChatAssistant + useGeminiAPI
│   │   ├── Candidates ── CandidateSearch + BoothLocator  
│   │   └── Checklist ─── ReadinessChecklist
│   ├── Context ────────── VoterProfileContext (useReducer + localStorage)
│   └── Services ───────── LanguageSwitcher (Google Translate)
│
├── Backend (Express 5 + Node 20)
│   ├── /api/gemini ────── Gemini API proxy (model whitelist + rate limiting)
│   ├── /api/gemini-models  Model availability check
│   ├── /api/youtube ───── YouTube Data API proxy
│   ├── /api/translate ─── Google Translate API proxy
│   └── Static serving ─── dist/ (SPA fallback)
│
└── Infrastructure (Google Cloud)
    ├── Cloud Run ──────── Serverless container hosting
    ├── Cloud Build ────── CI/CD from source
    └── Artifact Registry ─ Container image storage
```

### Security Architecture

| Layer | Implementation |
|-------|---------------|
| **API Key Protection** | All API keys stored server-side; frontend calls `/api/*` proxy routes only |
| **Rate Limiting** | 100 requests per 15 minutes per IP on all `/api/*` endpoints |
| **Input Sanitization** | DOMPurify on all AI-generated HTML content |
| **Model Whitelisting** | Server validates model names against allowlist to prevent injection |
| **CSP Headers** | Strict Content-Security-Policy via Helmet.js |
| **CORS** | Disabled in production (same-origin); localhost-only in development |
| **XSS Prevention** | Meta CSP + Helmet + DOMPurify triple layer |

---

## 📁 Project Structure

```
promptwars/
├── src/
│   ├── App.jsx                          # Root — Splash → Onboarding → Main (4 tabs)
│   ├── main.jsx                         # React entry point
│   ├── index.css                        # Global design system (CSS custom properties)
│   ├── context/
│   │   └── VoterProfileContext.jsx      # Global state (useReducer + localStorage)
│   └── components/
│       ├── Onboarding/
│       │   ├── OnboardingFlow.jsx       # 3-step animated questionnaire
│       │   └── OnboardingFlow.module.css
│       ├── Layout/
│       │   ├── AppHeader.jsx            # Top bar + language switcher + reset
│       │   └── AppHeader.module.css
│       ├── Timeline/
│       │   ├── ElectionTimeline.jsx     # 7-step election process
│       │   ├── StepCard.jsx             # Individual step with expand/video/calendar
│       │   └── *.module.css
│       ├── Chat/
│       │   ├── ChatAssistant.jsx        # AI Q&A with model selector
│       │   ├── useGeminiAPI.js          # Custom hook — system prompt, retry, cache
│       │   └── ChatAssistant.module.css
│       ├── Search/
│       │   ├── CandidateSearch.jsx      # AI-powered candidate cards
│       │   └── CandidateSearch.module.css
│       ├── Maps/
│       │   ├── BoothLocator.jsx         # Google Maps embed + geolocation
│       │   └── BoothLocator.module.css
│       ├── Checklist/
│       │   ├── ReadinessChecklist.jsx   # Dynamic checklist with progress ring
│       │   └── ReadinessChecklist.module.css
│       ├── Translate/
│       │   └── LanguageSwitcher.jsx     # Google Translate v2 + batch + cache
│       ├── YouTube/
│       │   ├── VideoCard.jsx            # YouTube video guides
│       │   └── VideoCard.module.css
│       └── Calendar/
│           ├── AddToCalendar.jsx        # Google Calendar + ICS export
│           └── AddToCalendar.module.css
├── server.js                            # Express 5 API proxy + static serving
├── Dockerfile                           # Multi-stage build (build → prod)
├── index.html                           # SEO meta tags + CSP + fonts
├── vite.config.js                       # Dev proxy config
├── package.json
└── .env.example                         # Required API keys documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** and **npm 10+**
- Google Cloud API keys (see below)

### 1. Clone & Install
```bash
git clone https://github.com/Devanshupardeshi/VoteReady.git
cd promptwars
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_TRANSLATE_API_KEY=your_translate_api_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key
VITE_GOOGLE_SEARCH_API_KEY=your_search_api_key
VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### 3. Run Locally
```bash
npm run dev
```
This starts both the **Vite dev server** (port 5173) and the **Express API server** (port 8080) concurrently.

### 4. Build for Production
```bash
npm run build
node server.js
```

### 5. Deploy to Cloud Run
```bash
gcloud run deploy voteready --source . --region us-central1 --allow-unauthenticated --port 8080
```

---

## 🧪 Code Quality

| Aspect | Implementation |
|--------|---------------|
| **Modularity** | 10 component directories, each self-contained with `.jsx` + `.module.css` |
| **State Management** | `useReducer` + Context API — no external state library needed |
| **Performance** | `React.lazy` + `Suspense` for code splitting; `useCallback`/`useMemo` for memoization |
| **CSS** | CSS Modules for scoped styling — zero class name collisions |
| **Documentation** | JSDoc headers on every file explaining purpose, inputs, and behavior |
| **Error Handling** | Try/catch with user-friendly error messages; retry logic on API failures |
| **Caching** | SessionStorage for API responses; localStorage for user profile persistence |
| **Accessibility** | ARIA roles, labels, `role="tablist"`, `aria-expanded`, skip links, screen reader text |
| **Security** | API proxy pattern, rate limiting, DOMPurify, CSP headers, model whitelisting |

---

## ♿ Accessibility

- **ARIA landmarks** — `role="tablist"`, `role="tab"`, `role="log"`, `role="alert"`, `role="progressbar"`
- **Screen reader support** — `.sr-only` class for visually hidden labels
- **Keyboard navigation** — All interactive elements are focusable and operable
- **Skip links** — "Skip to content" link on onboarding
- **Color contrast** — High contrast text on dark backgrounds
- **Semantic HTML** — `<main>`, `<nav>`, `<section>`, `<form>`, `<label>` elements
- **Alt text** — All SVG icons have `aria-hidden="true"` with associated text labels

---

## 🔒 Security

- **No client-side API keys** — All Google API keys are kept server-side in `server.js`
- **Express proxy** — Frontend calls `/api/*` which proxies to Google services
- **Rate limiting** — 100 requests / 15 minutes per IP via `express-rate-limit`
- **Helmet.js** — Sets security headers including CSP, HSTS, X-Frame-Options
- **DOMPurify** — Sanitizes all AI-generated content before DOM insertion
- **Model whitelisting** — Server rejects any model name not in the approved list
- **Multi-stage Docker build** — Production image contains no source code or `.env` files

---

## 📊 Evaluation Alignment

| Criteria | How VoteReady Addresses It |
|----------|---------------------------|
| **Smart, Dynamic Assistant** | AI chat adapts to voter type, state, language, and conversation history |
| **Logical Decision Making** | Onboarding builds a VoterProfile that drives the entire UX — checklists, prompts, map queries, and timeline steps all adapt |
| **Effective Use of Google Services** | 7 Google services deeply integrated (Gemini AI, Maps, Translate, YouTube, Calendar, Cloud Run, Structured Output) |
| **Practical Real-World Usability** | Helps real Indian voters register, find booths, understand EVMs, and research candidates |
| **Code Quality** | Modular React components, CSS Modules, JSDoc, useReducer state, proper error handling |
| **Security** | API proxy, rate limiting, DOMPurify, Helmet CSP, model whitelisting, multi-stage Docker |
| **Efficiency** | React.lazy code splitting, sessionStorage caching, batch translation, memoized callbacks |
| **Testing** | Input validation, retry logic, error boundaries, graceful degradation |
| **Accessibility** | Full ARIA support, keyboard nav, screen reader labels, skip links, semantic HTML |
| **Google Services** | Deep, meaningful integration — not just API calls but context-aware usage throughout the app |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, CSS Modules |
| **AI** | Google Gemini 2.5 Flash / Pro (multi-model) |
| **Backend** | Express 5, Node.js 20 |
| **Maps** | Google Maps Embed API |
| **Translation** | Google Translate API v2 |
| **Video** | YouTube Data API v3 |
| **Calendar** | Google Calendar API |
| **Security** | Helmet.js, DOMPurify, express-rate-limit |
| **Deployment** | Google Cloud Run, Cloud Build, Artifact Registry |
| **Container** | Docker (multi-stage alpine build) |

---

## 👨‍💻 Author

**Devanshu Pardeshi**

- GitHub: [@Devanshupardeshi](https://github.com/Devanshupardeshi)
- Email: devanshupardeshi21@gmail.com

---

## 📄 License

This project is built for the **PromptWars Hackathon** — an AI-powered civic education challenge.

---

<p align="center">
  <strong>🇮🇳 Empowering Every Indian Voter — One Question at a Time</strong>
</p>
