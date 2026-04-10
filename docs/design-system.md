# VoiceOps Design System

Initial design tokens and guidelines for the VoiceOps FSM application.

## Color Palette

### Primary Colors
- **Primary**: `#2563EB` (Blue) — main actions, active states, links
- **Primary Dark**: `#1D4ED8` — hover states
- **Primary Light**: `#DBEAFE` — backgrounds, highlights

### Neutral Colors
- **Gray 900**: `#111827` — headings, primary text
- **Gray 700**: `#374151` — body text
- **Gray 500**: `#6B7280` — secondary text, labels
- **Gray 300**: `#D1D5DB` — borders, dividers
- **Gray 100**: `#F3F4F6` — page backgrounds
- **White**: `#FFFFFF` — card backgrounds

### Status Colors
- **Assigned**: `#F59E0B` (Amber)
- **En Route**: `#3B82F6` (Blue)
- **In Progress**: `#8B5CF6` (Purple)
- **Completed**: `#10B981` (Green)
- **Cancelled**: `#EF4444` (Red)
- **Draft**: `#9CA3AF` (Gray)

## Typography

### Font Choices (Planned)
- **Headings**: Inter or system sans-serif
- **Body**: Inter or system sans-serif
- **Monospace**: For reference numbers and codes — system monospace

### Scale
- Page title: 20px / 1.5rem, bold
- Section heading: 16px / 1rem, semibold
- Body: 14px / 0.875rem, regular
- Small / labels: 12px / 0.75rem, regular
- Badge text: 11px / 0.6875rem

## Spacing Scale

Using a 4px base unit:
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `2xl`: 32px
- `3xl`: 48px

## Border Radius
- Cards: 6px
- Buttons: 4px
- Badges: 10px (pill shape)
- Inputs: 4px

## Component Patterns

### Cards
- White background, 1px border (`Gray 300`), 6px radius
- 16px padding inside
- Used for grouping related content (job details, customer info, etc.)

### Status Badges
- Pill shape (10px radius)
- 1px border matching status color
- Light background tint of status color
- 11px font size

### Buttons
- Primary: solid fill with primary color, white text
- Secondary: white background, gray border, gray text
- Consistent 8px vertical, 18px horizontal padding

### Layout
- Max content width: 900px (centered)
- Page padding: 16px horizontal
- Section gap: 14-16px vertical

## Notes
- These are initial tokens and will be refined as we build out components
- Mobile-first approach — wireframes are designed for phone-sized screens first
- Accessibility: ensure minimum 4.5:1 contrast ratio for text
- Wireframes are intentionally low-fidelity and grayscale. The color palette and typography defined above will be applied during the implementation phase.
