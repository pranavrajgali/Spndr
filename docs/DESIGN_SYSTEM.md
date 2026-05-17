# Spndr Design System

The visual identity of Spndr. Use this as a reference when building new components or modifying existing ones.

---

## Brand Identity

**Name:** Spndr (pronounced "Spender")
**Tagline:** Track money without linking your bank.
**Personality:** Savage, honest, student-friendly, premium.

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Teal 600 | `#0D9488` | Primary buttons, active states, accents, chart lines |
| Teal 900 | `#134E4A` | Headings, bold text, dark UI elements |
| Teal 50 | `#F0FDFA` | Page background |
| Teal 300 | `#2DD4BF` | Highlights, success accents |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Emerald 500 | `#10B981` | Income, positive trends, success states |
| Emerald 600 | `#059669` | Income text, positive amounts |
| Rose 500 | `#F43F5E` | Expense, negative trends, danger states |
| Rose 600 | `#E11D48` | Expense text, negative amounts |
| Gray 500 | `#6B7280` | Secondary text, labels, timestamps |
| Gray 200 | `#E5E7EB` | Borders, dividers, chart grid lines |

### Gradients

```css
/* Chart fill gradient (teal) */
linear-gradient(to bottom, rgba(13, 148, 136, 0.3), rgba(13, 148, 136, 0))

/* Balance chart gradient (dark teal) */
linear-gradient(to bottom, rgba(19, 78, 74, 0.2), rgba(19, 78, 74, 0))
```

---

## Typography

**Font Family:** Plus Jakarta Sans (Google Fonts)
**Weights:** 400 (Regular), 600 (Semibold), 700 (Bold)

### Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page heading | `text-2xl` | Bold (700) | Teal 900 |
| Card title | `text-sm` | Bold (700) | Teal 900 |
| Card subtitle | `text-xs` | Regular (400) | Gray 500 |
| Label (uppercase) | `text-[10px]` | Bold (700) | Gray 500 |
| Body text | `text-sm` | Regular (400) | Gray 700 `#374151` |
| Large number | `text-lg` or `text-2xl` | Black (900) | Teal 900 |
| Tracking label | `tracking-widest` | Bold | Gray 500 |

### Rules

1. Labels are always `uppercase`, `text-[10px]`, `font-bold`, `tracking-wider`.
2. Numbers use `tabular-nums` for alignment.
3. Currency always uses the `formatCurrency()` helper (displays as Rs. X,XXX).

---

## Components

### Cards

All cards use the "Glassmorphic" style:

```css
border-radius: 24px;          /* rounded-[24px] */
border: 1px solid rgba(13, 148, 136, 0.2);  /* border-[#0D9488]/20 */
background: rgba(255, 255, 255, 0.4);       /* bg-white/40 */
padding: 24px;                /* p-6 */
backdrop-filter: blur(24px);  /* backdrop-blur-xl */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);  /* shadow-sm */
```

### Buttons

**Primary (filled):**
```
bg-[#0D9488] text-white text-xs font-bold rounded-full px-6 py-2
shadow-md hover:bg-[#0D9488]/90
```

**Secondary (outline):**
```
border border-[#0D9488]/30 text-sm font-medium rounded-full px-8 py-2
hover:bg-white/80
```

**Danger:**
```
text-rose-600 hover:bg-rose-50 rounded-lg
```

### Inputs

Use the default Shadcn/Base UI input styles. No custom styling beyond the card container.

### Loading States

Every async component shows a skeleton placeholder:
```
h-[Xpx] w-[Y%] bg-black/5 rounded-full animate-pulse
```

Use 3 skeleton lines with widths: 75%, 100%, 50%.

### Icons

Library: Lucide React
Size: 16-24px depending on context
Color: Inherits from text color

---

## Chart Guidelines

### Recharts Configuration

All charts use `ResponsiveContainer` with:
```jsx
<ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
```

### Color Assignments

| Chart | Stroke | Fill |
|-------|--------|------|
| Spending Line (daily) | `#0D9488` (teal) | Gradient to transparent |
| Balance Line (savings) | `#134E4A` (dark teal) | Gradient to transparent |
| Income Bar | `#059669` (emerald) | Solid |
| Expense Bar | `#E11D48` (rose) | Solid |
| Donut segments | Array of 8 preset colors | Solid |

### Donut Color Array

```javascript
["#0D9488", "#F43F5E", "#8B5CF6", "#F59E0B", "#3B82F6", "#EC4899", "#10B981", "#6366F1"]
```

---

## Spacing and Layout

### Page Structure

```
max-w-6xl mx-auto px-4      /* Desktop container */
max-w-lg mx-auto             /* Mobile-first pages (transactions, chat) */
```

### Grid

Dashboard uses a responsive grid:
```
grid grid-cols-1 md:grid-cols-2 gap-6
```

### Section Spacing

Between major sections: `space-y-8`
Within a card: `space-y-4`
Between label and value: `mb-1` or `gap-1`

---

## Animation

### Transitions

All interactive elements use:
```css
transition-all duration-200
```

### Entrance Animations

New content appearing uses:
```
animate-in fade-in slide-in-from-bottom-2 duration-500
```

### Loading Spinner

```jsx
<Loader2 className="animate-spin text-[#0D9488]" size={32} />
```

### Pulse

Used for attention-grabbing icons:
```
animate-pulse
```

---

## Dark Mode

Not implemented in V1. The current design uses a light teal background (`#F0FDFA`) with white glassmorphic cards. Dark mode would swap:

| Light | Dark |
|-------|------|
| `#F0FDFA` background | `#0F172A` (slate 900) |
| `white/40` cards | `white/5` cards |
| `#134E4A` text | `#F0FDFA` text |
| `#6B7280` secondary | `#9CA3AF` secondary |
