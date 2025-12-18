# La Gazette de la Vie - Branding Guidelines

> Visual identity and design language for the living newspaper application

---

## 1. Brand Identity

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              𝔏𝔞 𝔊𝔞𝔷𝔢𝔱𝔱𝔢 𝔡𝔢 𝔩𝔞 𝔙𝔦𝔢                              ║
║                                                                  ║
║         "Where Memories Come to Life"                            ║
║         « Là où les souvenirs prennent vie »                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 1.1 Brand Name

- **Primary**: La Gazette de la Vie
- **English**: The Life Gazette / The Living Gazette

### 1.2 Tagline

- **French**: « Là où les souvenirs prennent vie »
- **English**: "Where Memories Come to Life"

---

## 2. Visual Design Language

### 2.1 Design Inspiration

- 1920s-1940s vintage newspaper aesthetic
- Harry Potter's Daily Prophet (animated newspaper)
- Old European broadsheets
- Sepia-toned family photographs

### 2.2 Color Palette

| Role       | Color Name      | Hex Code  | RGB           | Usage                           |
| ---------- | --------------- | --------- | ------------- | ------------------------------- |
| Primary    | Aged Parchment  | `#F4E4BC` | 244, 228, 188 | Page background                 |
| Secondary  | Sepia Ink       | `#5C4033` | 92, 64, 51    | Headlines, borders              |
| Accent     | Antique Gold    | `#C9A227` | 201, 162, 39  | Highlights, buttons, CTAs       |
| Text       | Newspaper Black | `#2C2416` | 44, 36, 22    | Body text                       |
| Muted      | Faded Gray      | `#8B7355` | 139, 115, 85  | Captions, dates, secondary text |
| Background | Cream           | `#FDF8E8` | 253, 248, 232 | App background                  |
| Error      | Aged Red        | `#8B4513` | 139, 69, 19   | Error states                    |
| Success    | Forest Green    | `#355E3B` | 53, 94, 59    | Success states                  |

### 2.3 Color Usage Guidelines

```css
/* CSS Custom Properties */
:root {
  --color-parchment: #f4e4bc;
  --color-sepia: #5c4033;
  --color-gold: #c9a227;
  --color-ink: #2c2416;
  --color-muted: #8b7355;
  --color-cream: #fdf8e8;
  --color-error: #8b4513;
  --color-success: #355e3b;
}
```

---

## 3. Typography

### 3.1 Font Stack

| Element       | Primary Font      | Fallback               | Weight        | Size Range |
| ------------- | ----------------- | ---------------------- | ------------- | ---------- |
| Masthead      | Playfair Display  | Georgia, serif         | 700 (Bold)    | 48-72px    |
| Headlines     | Old Standard TT   | Times New Roman, serif | 700 (Bold)    | 24-36px    |
| Subheadings   | Libre Baskerville | Georgia, serif         | 400 Italic    | 18-24px    |
| Body/Captions | EB Garamond       | Garamond, serif        | 400 (Regular) | 12-16px    |
| UI Elements   | Inter             | system-ui, sans-serif  | 400-600       | 14-16px    |

### 3.2 Font Import

```css
/* Google Fonts Import */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Old+Standard+TT:wght@700&family=Libre+Baskerville:ital@1&family=EB+Garamond:wght@400;500&family=Inter:wght@400;500;600&display=swap");
```

### 3.3 Typography Scale

```css
/* Typography System */
.masthead {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: clamp(48px, 8vw, 72px);
  line-height: 1.1;
  letter-spacing: 0.02em;
}

.headline {
  font-family: "Old Standard TT", "Times New Roman", serif;
  font-weight: 700;
  font-size: clamp(24px, 4vw, 36px);
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.subheading {
  font-family: "Libre Baskerville", Georgia, serif;
  font-style: italic;
  font-size: clamp(18px, 3vw, 24px);
  line-height: 1.4;
}

.caption {
  font-family: "EB Garamond", Garamond, serif;
  font-size: clamp(12px, 2vw, 14px);
  line-height: 1.5;
}

.body-text {
  font-family: "EB Garamond", Garamond, serif;
  font-size: 16px;
  line-height: 1.6;
}

.ui-text {
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
```

---

## 4. Visual Effects

### 4.1 Paper Texture

- **Type**: Subtle grain overlay
- **Opacity**: 5-8%
- **Blend Mode**: Multiply
- **File**: `textures/paper-grain.png` (tileable)

### 4.2 Aged Effects

```css
/* Vignette Effect */
.gazette-page {
  background:
    radial-gradient(ellipse at center, transparent 60%, rgba(92, 64, 51, 0.15) 100%),
    var(--color-parchment);
}

/* Fold Lines */
.gazette-page::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(92, 64, 51, 0.1) 20%,
    rgba(92, 64, 51, 0.1) 80%,
    transparent
  );
}

/* Ink Bleeding Effect */
.headline {
  text-shadow: 0 0 0.5px var(--color-ink);
}

/* Aged Border */
.gazette-page {
  border: 1px solid rgba(92, 64, 51, 0.3);
  box-shadow:
    inset 0 0 30px rgba(92, 64, 51, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1);
}
```

### 4.3 Decorative Elements

```
Horizontal Rules:
════════════════════════════════════════

Section Dividers:
─────────────────────────────────────────

Corner Ornaments:
╔═══╗     ╔═══╗
║   ║     ║   ║
╚═══╝     ╚═══╝
```

---

## 5. Tone & Voice

### 5.1 Brand Personality

- **Nostalgic**: Evokes warmth of family memories
- **Whimsical**: Touches of magic without being childish
- **Personal**: Feels handcrafted, not mass-produced
- **Elegant**: Refined vintage aesthetic

### 5.2 Writing Guidelines

- Use formal but warm language
- Reference newspaper terminology (headlines, editions, features)
- Avoid overly modern slang
- Embrace French elegance when appropriate

### 5.3 Example Copy

**Welcome Message:**

> "Bienvenue à La Gazette de la Vie. Here, your cherished photographs transform into living memories, ready to tell their stories once more."

**Empty State:**

> "This page awaits your memories. Click to add a photograph and bring the past to life."

**Generation Complete:**

> "Your gazette is ready. The memories have awakened."

---

## 6. Component Styling (shadcn/ui)

We use **shadcn/ui** for all UI components, customized with our vintage aesthetic. Components are installed via the CLI and themed through CSS variables.

### 6.1 shadcn/ui Theme Configuration

The vintage color palette is mapped to shadcn/ui's CSS variables in `globals.css`:

```css
@layer base {
  :root {
    /* shadcn/ui variable mappings */
    --background: 48 45% 95%; /* cream #FDF8E8 */
    --foreground: 36 33% 16%; /* ink #2C2416 */
    --card: 43 50% 85%; /* parchment #F4E4BC */
    --card-foreground: 36 33% 16%; /* ink */
    --popover: 48 45% 95%; /* cream */
    --popover-foreground: 36 33% 16%;
    --primary: 43 69% 47%; /* gold #C9A227 */
    --primary-foreground: 36 33% 16%;
    --secondary: 24 29% 28%; /* sepia #5C4033 */
    --secondary-foreground: 43 50% 85%;
    --muted: 30 24% 44%; /* faded gray #8B7355 */
    --muted-foreground: 30 24% 44%;
    --accent: 43 69% 47%; /* gold */
    --accent-foreground: 36 33% 16%;
    --destructive: 25 76% 31%; /* aged red #8B4513 */
    --destructive-foreground: 48 45% 95%;
    --border: 24 29% 28% / 0.2; /* sepia with opacity */
    --input: 30 24% 44%; /* muted */
    --ring: 43 69% 47%; /* gold */
    --radius: 0.25rem; /* subtle rounding */
  }
}
```

### 6.2 Button Variants

Use shadcn/ui `<Button>` with custom variant styling:

```tsx
import { Button } from "@/components/ui/button"

// Primary action (gold background)
<Button variant="default">Generate Gazette</Button>

// Secondary action (sepia outlined)
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete Page</Button>

// Ghost button for toolbar icons
<Button variant="ghost" size="icon">
  <Sparkles className="h-4 w-4" />
</Button>
```

Extended button styles in `components/ui/button.tsx`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline:
          "border-2 border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-secondary-foreground",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        // ... other variants
      },
    },
  }
);
```

### 6.3 Input Fields

Use shadcn/ui `<Input>` with vintage theming:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="project-name">Project Name</Label>
  <Input
    id="project-name"
    placeholder="Famille Dupont 1950-2024"
    className="bg-background border-muted focus:border-primary focus:ring-primary/20"
  />
</div>;
```

Custom input styling additions:

```css
/* In globals.css */
.input-vintage {
  @apply bg-[hsl(var(--background))] border-[hsl(var(--muted))]
         focus:border-[hsl(var(--primary))]
         focus:ring-2 focus:ring-[hsl(var(--primary))]/20
         placeholder:text-[hsl(var(--muted))];
}
```

### 6.4 Cards & Panels

Use shadcn/ui `<Card>` components:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Standard panel
<Card className="bg-background border-border shadow-sm">
  <CardHeader>
    <CardTitle className="font-headline">Animation Suggestions</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Gazette-style card with vintage shadow
<Card className="bg-card border-secondary shadow-[2px_2px_0_hsl(var(--secondary)),4px_4px_0_hsl(var(--secondary)/0.3)]">
  {/* gazette page preview */}
</Card>
```

### 6.5 Dialog & Modal

Use shadcn/ui `<Dialog>` for modals:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog>
  <DialogContent className="bg-background border-secondary">
    <DialogHeader>
      <DialogTitle className="font-headline text-xl">Add Photograph</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>;
```

### 6.6 Using the cn() Utility

Combine Tailwind classes with shadcn/ui using the `cn()` helper:

```tsx
import { cn } from "@/lib/utils";

<Button className={cn("font-ui", isGenerating && "animate-pulse")}>
  {isGenerating ? "Generating..." : "Generate"}
</Button>;
```

---

## 7. Iconography (Lucide React)

We use **Lucide React**, which is shadcn/ui's default icon library.

### 7.1 Icon Style Guidelines

- Line icons (Lucide default) match our vintage aesthetic
- Stroke width: 1.5px (Lucide default)
- Color: Inherit from text context via `currentColor`
- Size: Use Tailwind classes (`h-4 w-4`, `h-5 w-5`, etc.)

### 7.2 Installation & Usage

```bash
bun add lucide-react
```

```tsx
import {
  Newspaper,      // Gazette/project icon
  Sparkles,       // Generation/magic
  Camera,         // Photo upload
  Image,          // Image frame
  Type,           // Text element
  Plus,           // Add new
  Trash2,         // Delete
  Share2,         // Share
  Download,       // Export
  Eye,            // Preview/view
  Loader2,        // Loading spinner
  ChevronLeft,    // Navigation
  ChevronRight,
  GripVertical,   // Drag handle
} from "lucide-react"

// Usage
<Sparkles className="h-4 w-4 text-primary" />
<Newspaper className="h-6 w-6 text-secondary" />
```

### 7.3 Icon Button Pattern

```tsx
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

<Button variant="ghost" size="icon" aria-label="Generate animation">
  <Sparkles className="h-4 w-4" />
</Button>;
```

### 7.4 Icons with Text

```tsx
<Button>
  <Sparkles className="h-4 w-4" />
  Generate Gazette
</Button>
```

### 7.5 Custom Icons (if needed)

For unique vintage decorative elements not in Lucide, create SVG components:

```tsx
// components/icons/ornament.tsx
export function Ornament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 20">
      {/* vintage decorative SVG path */}
    </svg>
  );
}
```

---

## 8. Animation Guidelines

### 8.1 Transition Timings

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease-out;
}
```

### 8.2 Motion Principles

- Subtle and elegant, never jarring
- Mimic physical newspaper interactions (page turns, unfolds)
- Video elements should fade in gracefully
- Loading states should feel magical, not mechanical

### 8.3 Page Transitions

```css
/* Page fade-in */
@keyframes page-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 9. Responsive Breakpoints

```css
/* Breakpoint System */
:root {
  --bp-mobile: 480px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
  --bp-wide: 1280px;
}

/* Mobile-first approach */
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop */
}
@media (min-width: 1280px) {
  /* Wide */
}
```

---

## 10. Asset Checklist

### Required Assets

- [ ] Paper texture (tileable PNG)
- [ ] Logo/masthead (SVG)
- [ ] Favicon (multiple sizes)
- [ ] OG image for social sharing
- [ ] Corner ornaments (SVG)
- [ ] Horizontal rule decorations (SVG)

### Font Files

- [ ] Playfair Display (subset: Latin)
- [ ] Old Standard TT (subset: Latin)
- [ ] Libre Baskerville (subset: Latin, Italic only)
- [ ] EB Garamond (subset: Latin)
- [ ] Inter (subset: Latin)

---

_Branding Guidelines v1.0_
_Last Updated: December 18, 2024_
