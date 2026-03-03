# Brutalist Amber Theme Standardization Plan

> **For Claude:** Use `superpowers:executing-plans` skill to implement this plan task-by-task.

**Goal:** Standardize the brutalist amber terminal theme across all 19 pages and 40+ components in the poofMQ application.

**Architecture:** Update CSS theme variables, Tailwind config, and all UI/app components to apply the dark background with amber (#FFBF00) accent colors, monospace typography, and 4px solid borders.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, Tailwind CSS v4

---

## Design Tokens

### Colors
```css
--color-primary: #FFBF00;        /* Amber - primary accent */
--color-background: #000000;       /* Pure black */
--color-secondary-bg: #000033;   /* Deep blue for sections */
--color-terminal-gray: #0a0a0a;   /* Dark gray for cards */
--color-border: #FFFFFF;         /* White for brutalist borders */
--color-border-primary: #FFBF00; /* Amber for primary borders */
--color-text: #FFFFFF;          /* White text */
--color-text-muted: rgba(255,255,255,0.6); /* Muted white */
--color-error: #FF0000;          /* Red for errors */
--color-success: #00FF00;        /* Green for success */
```

### Typography
```css
--font-mono: 'JetBrains Mono', monospace;
--font-heading-weight: 800;    /* font-extrabold */
--font-body-weight: 400;      /* font-normal */
--letter-spacing-tight: -0.05em;
--letter-spacing-normal: normal;
```

### Spacing Scale
```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
```

### Border System
```css
/* Brutalist borders - 4px solid, no rounded corners */
--border-brutal: 4px solid white;
--border-brutal-primary: 4px solid #FFBF00;
--border-brutal-error: 4px solid #FF0000;
--border-brutal-success: 4px solid #00FF00;

/* Hybrid softer borders for forms - 2px solid, slightly rounded */
--border-soft: 2px solid white;
--border-soft-primary: 2px solid #FFBF00;
--border-soft-error: 2px solid #FF0000;
```

### Interaction States
```css
/* Hover - color inversion */
--hover-invert: background-color: var(--color-primary); color: black;

/* Active - shift effect */
--active-shift: transform: translate(2px, -2px);

/* Focus - amber outline */
--focus-ring: outline: 2px solid var(--color-primary);
```

---

## Component Specifications

### Button Component
**File:** `resources/js/components/ui/button.tsx`

```tsx
// Variants: primary, secondary, destructive, ghost, link

// Primary (filled)
<button className="border-4 border-[#FFBF00] bg-[#FFBF00] text-black font-bold uppercase px-6 py-2 hover:bg-transparent hover:text-[#FFBF00]">

// Secondary (outline)
<button className="border-4 border-white bg-transparent text-white font-bold uppercase px-6 py-2 hover:bg-white hover:text-black">

// Destructive
<button className="border-4 border-white bg-red-600 text-white font-bold uppercase px-6 py-2 hover:bg-red-500">

// Ghost
<button className="border-4 border-white/20 text-white/50 font-bold uppercase px-6 py-2">

// Sizes: sm, md, lg, icon
```

### Input Component
**File:** `resources/js/components/ui/input.tsx`

```tsx
// Hybrid: softer appearance for forms (2px border, minimal rounding)
<input className="border-2 border-white bg-black text-white font-mono px-4 py-2 focus:border-[#FFBF00] focus:outline-2 focus:outline-[#FFBF00]">

// States: default, error, disabled
// Error: border-red-500
// Disabled: opacity-50, cursor-not-allowed

// Label: uppercase, font-bold, text-sm
// Helper text: text-xs, text-white/50, normal-case
```

### Card Component
**File:** `resources/js/components/ui/card.tsx`

```tsx
// Standard card
<div className="border-4 border-white bg-[#0a0a0a] p-6">
  {/* Content */}
</div>

// Primary card (amber border)
<div className="border-4 border-[#FFBF00] bg-[#0a0a0a] p-6">
  {/* Content */}
</div>

// Interactive card (hover effects)
<div className="border-4 border-white bg-[#0a0a0a] p-6 hover:bg-[#FFBF00] hover:text-black transition-colors">
  {/* Content */}
</div>
```

### Badge Component
**File:** `resources/js/components/ui/badge.tsx`

```tsx
// Default badge
<span className="border-2 border-[#FFBF00] bg-[#FFBF00]/20 px-2 py-1 text-xs font-bold uppercase text-black">
  STATUS
</span>

// Solid badge
<span className="border-2 border-[#FFBF00] bg-[#FFBF00] px-2 py-1 text-xs font-bold uppercase text-black">
  ACTIVE
</span>
```

### Alert Component
**File:** `resources/js/components/ui/alert.tsx`

```tsx
// Info (amber)
<div className="border-4 border-[#FFBF00] bg-[#FFBF00]/10 p-4">
  <p className="font-bold uppercase">INFO_MESSAGE</p>
</div>

// Error (red)
<div className="border-4 border-red-500 bg-red-500/10 p-4">
  <p className="font-bold uppercase text-white">ERROR_MESSAGE</p>
</div>

// Success (green)
<div className="border-4 border-green-500 bg-green-500/10 p-4">
  <p className="font-bold uppercase text-white">SUCCESS_MESSAGE</p>
</div>
```

### Dialog/Modal Component
**File:** `resources/js/components/ui/dialog.tsx`

```tsx
// Overlay
<div className="fixed inset-0 bg-black/80 z-50">

// Dialog container
<div className="border-4 border-white bg-black p-6 max-w-md mx-auto">
  {/* Header */}
  <div className="border-b-4 border-white pb-4 mb-4">
    <h2 className="text-xl font-bold uppercase">DIALOG_TITLE</h2>
  </div>

  {/* Content */}
  {/* Footer */}
  <div className="border-t-4 border-white pt-4 mt-4 flex gap-4 justify-end">
    <button className="border-2 border-white px-4 py-2 hover:bg-white hover:text-black">CONFIRM</button>
    <button className="border-2 border-white px-4 py-2 hover:bg-white hover:text-black">CANCEL</button>
  </div>
</div>
```

### Avatar Component
**File:** `resources/js/components/ui/avatar.tsx`

```tsx
// Default avatar
<div className="border-4 border-white bg-[#000033]/20 w-10 h-10 flex items-center justify-center font-bold uppercase text-white">
  JD
</div>
```

### Select Component
**File:** `resources/js/components/ui/select.tsx`

```tsx
// Trigger
<button className="border-2 border-white bg-black px-4 py-2 font-mono uppercase text-white flex items-center justify-between">
  <span>SELECTED_OPTION</span>
  <span className="material-symbols-outlined">expand_more</span>
</button>

// Dropdown
<div className="border-4 border-white bg-black mt-1">
  {/* Options */}
  <button className="px-4 py-2 hover:bg-[#FFBF00] hover:text-black w-full text-left font-mono uppercase">
    OPTION_1
  </button>
</div>
```

### Checkbox Component
**File:** `resources/js/components/ui/checkbox.tsx`

```tsx
// Checkbox with brutalist styling
<div className="flex items-center gap-3">
  <div className="border-4 border-white w-6 h-6 flex items-center justify-center bg-black">
    {/* Check icon when checked */}
  </div>
  <label className="font-bold uppercase">LABEL_TEXT</label>
</div>
```

### Toggle Component
**File:** `resources/js/components/ui/toggle.tsx`

```tsx
// Toggle switch
<button className="border-4 border-white w-12 h-6 bg-black relative">
  <div className="absolute inset-1 bg-[#FFBF00] transition-transform" />
</button>
```

---

## App Component Specifications

### App Logo Component
**File:** `resources/js/components/app-logo.tsx`

```tsx
// Logo with amber cyclone icon
<div className="flex items-center gap-4">
  <span className="material-symbols-outlined text-5xl text-[#FFBF00]">cyclone</span>
  <span className="text-2xl font-black italic">POOF_MQ</span>
</div>
```

### App Header Component
**File:** `resources/js/components/app-header.tsx`

```tsx
// Header with black background, amber accents
<header className="border-b-4 border-white bg-[#000033]/20 px-6 py-4">
  <div className="flex items-center justify-between">
    {/* Logo */}
    {/* Navigation - uppercase links */}
    {/* User menu */}
  </div>
</header>
```

### App Sidebar Component
**File:** `resources/js/components/app-sidebar.tsx`

```tsx
// Sidebar with dark background
<aside className="border-r-4 border-white bg-[#000033] w-64">
  {/* Navigation items - uppercase labels */}
  <nav className="p-4">
    <a className="block px-4 py-2 hover:bg-[#FFBF00] hover:text-black font-bold uppercase">
      DASHBOARD
    </a>
  </nav>
</aside>
```

### Navigation Components
**Files:**
- `resources/js/components/nav-main.tsx`
- `resources/js/components/nav-footer.tsx`
- `resources/js/components/nav-user.tsx`

```tsx
// Nav item styling
<a className="px-2 transition-colors hover:bg-[#FFBF00] hover:text-black font-bold uppercase">
  LINK_TEXT
</a>
```

### Breadcrumbs Component
**File:** `resources/js/components/breadcrumbs.tsx`

```tsx
// Breadcrumbs with monospace and amber separator
<nav className="flex items-center gap-2 font-mono text-sm">
  <span className="text-white/50">PARENT</span>
  <span className="text-[#FFBF00]">/</span>
  <span className="text-white">CURRENT</span>
</nav>
```

### User Menu Component
**Files:**
- `resources/js/components/user-menu-content.tsx`
- `resources/js/components/user-info.tsx`

```tsx
// User menu dropdown
<div className="border-4 border-white bg-black">
  <div className="p-4 border-b-4 border-white">
    <span className="font-bold uppercase">USER_NAME</span>
  </div>
  <button className="px-4 py-2 hover:bg-[#FFBF00] hover:text-black w-full text-left font-bold uppercase">
    PROFILE
  </button>
  <button className="px-4 py-2 hover:bg-red-500 w-full text-left font-bold uppercase text-white">
    LOG_OUT
  </button>
</div>
```

---

## Page Specifications

### Auth Pages
**Files:**
- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/auth/confirm-password.tsx`
- `resources/js/pages/auth/verify-email.tsx`
- `resources/js/pages/auth/two-factor-challenge.tsx`

**Layout:**
- Centered card layout
- Black background (#000000)
- Border-4 border-white
- Form with hybrid softer inputs (border-2)
- Amber CTA button
- Uppercase labels and headings

### Settings Pages
**Files:**
- `resources/js/pages/settings/profile.tsx`
- `resources/js/pages/settings/password.tsx`
- `resources/js/pages/settings/two-factor.tsx`
- `resources/js/pages/settings/api-keys.tsx`

**Layout:**
- Sidebar layout with main content area
- Brutalist cards with border-4
- Forms with hybrid inputs
- Amber accent buttons

### Dashboard Page
**File:** `resources/js/pages/dashboard.tsx`

**Layout:**
- Stats cards with amber accents
- Data tables with border-4
- Quick action buttons with hover effects
- Uppercase headings and labels

### Sandbox Page
**File:** `resources/js/pages/sandbox/index.tsx`

**Layout:**
- Terminal-style interface
- Code blocks with amber syntax highlighting
- Results display with monospace font
- Border-4 throughout

### Developers Page
**File:** `resources/js/pages/developers.tsx`

**Layout:**
- API documentation style
- Code examples in monospace blocks
- SDK cards with border-4
- Amber accent for endpoints

### Projects Page
**File:** `resources/js/pages/projects/index.tsx`

**Layout:**
- Project cards with border-4
- API key management with monospace display
- Usage stats with amber highlights
- Uppercase labels throughout

---

## Implementation Tasks

### Phase 1: Theme Foundation (Priority: Critical)
1. Update `resources/css/app.css`
   - Add brutalist color variables
   - Add border utility classes
   - Add scrollbar styles
   - Add selection styles

2. Verify theme loads correctly

### Phase 2: Core UI Components (Priority: Critical)
1. `button.tsx` - Button variants with brutalist styling
2. `input.tsx` - Input with hybrid softer border
3. `card.tsx` - Card with border-4 variants
4. `badge.tsx` - Badge with amber accent
5. `alert.tsx` - Alert with border-4 variants
6. `dialog.tsx` - Dialog with brutalist borders
7. `avatar.tsx` - Avatar with border-4
8. `select.tsx` - Select with monospace font
9. `checkbox.tsx` - Checkbox with border-4
10. `toggle.tsx` - Toggle with border-4

### Phase 3: App Components (Priority: High)
1. `app-logo.tsx` - Logo with amber cyclone
2. `app-logo-icon.tsx` - Icon component
3. `app-header.tsx` - Header with brutalist styling
4. `app-sidebar.tsx` - Sidebar with dark theme
5. `nav-main.tsx` - Main nav with uppercase links
6. `nav-footer.tsx` - Footer nav with uppercase links
7. `nav-user.tsx` - User nav with hover states
8. `breadcrumbs.tsx` - Breadcrumbs with amber separator
9. `user-menu-content.tsx` - User menu dropdown
10. `user-info.tsx` - User info display
11. `heading.tsx` - Heading with uppercase styling

### Phase 4: Auth Pages (Priority: High)
1. `login.tsx` - Login page with centered card
2. `register.tsx` - Register page with centered card
3. `forgot-password.tsx` - Forgot password page
4. `reset-password.tsx` - Reset password page
5. `confirm-password.tsx` - Confirm password page
6. `verify-email.tsx` - Verify email page
7. `two-factor-challenge.tsx` - 2FA challenge page

### Phase 5: Settings Pages (Priority: Medium)
1. `profile.tsx` - Profile settings
2. `password.tsx` - Password settings
3. `two-factor.tsx` - 2FA settings
4. `api-keys.tsx` - API keys management

### Phase 6: Main App Pages (Priority: Medium)
1. `dashboard.tsx` - Dashboard with stats cards
2. `sandbox/index.tsx` - Sandbox terminal interface
3. `developers.tsx` - API documentation
4. `projects/index.tsx` - Projects list

### Phase 7: Additional Components (Priority: Low)
1. `tooltip.tsx` - Tooltip with brutalist styling
2. `skeleton.tsx` - Skeleton with amber shimmer
3. `spinner.tsx` - Spinner with amber color
4. `separator.tsx` - Separator with border-white
5. `dropdown-menu.tsx` - Dropdown with border-4
6. `sheet.tsx` - Sheet with brutalist borders
7. `collapsible.tsx` - Collapsible with border-4
8. `navigation-menu.tsx` - Navigation menu styling

---

## Testing Strategy

### Visual Testing
1. Manual review of each page in browser
2. Check responsive breakpoints
3. Verify hover states work correctly
4. Test focus states for accessibility
5. Verify color contrast ratios

### Component Testing
1. Verify button variants render correctly
2. Test form inputs with validation states
3. Check dialog open/close animations
4. Verify navigation hover states

---

## Files to Modify

### CSS Files
- `resources/css/app.css` - Main theme file

### UI Components (10 files)
- `resources/js/components/ui/button.tsx`
- `resources/js/components/ui/input.tsx`
- `resources/js/components/ui/card.tsx`
- `resources/js/components/ui/badge.tsx`
- `resources/js/components/ui/alert.tsx`
- `resources/js/components/ui/dialog.tsx`
- `resources/js/components/ui/avatar.tsx`
- `resources/js/components/ui/select.tsx`
- `resources/js/components/ui/checkbox.tsx`
- `resources/js/components/ui/toggle.tsx`

### App Components (11 files)
- `resources/js/components/app-logo.tsx`
- `resources/js/components/app-logo-icon.tsx`
- `resources/js/components/app-header.tsx`
- `resources/js/components/app-sidebar.tsx`
- `resources/js/components/nav-main.tsx`
- `resources/js/components/nav-footer.tsx`
- `resources/js/components/nav-user.tsx`
- `resources/js/components/breadcrumbs.tsx`
- `resources/js/components/user-menu-content.tsx`
- `resources/js/components/user-info.tsx`
- `resources/js/components/heading.tsx`

### Auth Pages (7 files)
- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/auth/confirm-password.tsx`
- `resources/js/pages/auth/verify-email.tsx`
- `resources/js/pages/auth/two-factor-challenge.tsx`

### Settings Pages (4 files)
- `resources/js/pages/settings/profile.tsx`
- `resources/js/pages/settings/password.tsx`
- `resources/js/pages/settings/two-factor.tsx`
- `resources/js/pages/settings/api-keys.tsx`

### Main App Pages (4 files)
- `resources/js/pages/dashboard.tsx`
- `resources/js/pages/sandbox/index.tsx`
- `resources/js/pages/developers.tsx`
- `resources/js/pages/projects/index.tsx`

---

## Estimated Effort
- **Phase 1**: ~30 minutes (theme foundation)
- **Phase 2**: ~2 hours (10 UI components)
- **Phase 3**: ~1.5 hours (11 app components)
- **Phase 4**: ~1 hour (7 auth pages)
- **Phase 5**: ~1 hour (4 settings pages)
- **Phase 6**: ~1.5 hours (4 main pages)
- **Phase 7**: ~30 minutes (additional components)

**Total**: ~8 hours of focused work

---

## Success Criteria
1. All pages use black background with amber accents
2. All borders are 4px solid (no rounded corners on cards/buttons)
3. Form inputs use 2px borders for usability
4. All labels and headings are uppercase
5. Hover states use color inversion (amber background, black text)
6. Consistent monospace font (JetBrains Mono) throughout
7. Material Symbols icons for iconography
8. All 19 pages render correctly with new theme
9. All 40+ components updated with new styling
10. Build succeeds with no errors
