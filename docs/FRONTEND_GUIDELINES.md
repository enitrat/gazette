# Frontend Development Guidelines

> Practical guide for building UI components in La Gazette de la Vie

---

## Quick Reference

| Context                                         | Use                                                      | Don't Use                         |
| ----------------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| **App Shell** (navbar, sidebar, dialogs, forms) | shadcn/ui components with vintage theme                  | Custom HTML without design system |
| **Gazette Canvas** (newspaper content)          | Brand design classes (`.gazette-page`, `.font-masthead`) | shadcn/ui components              |
| **Primary Actions**                             | `<Button>` (default variant = gold)                      | `<Button variant="outline">`      |
| **Secondary Actions**                           | `<Button variant="outline">`                             | `<Button variant="ghost">`        |
| **Cards/Panels**                                | `<Card>` + `gazette-page paper-texture` classes          | Plain divs                        |

---

## 1. Two Design Contexts

This application has **two distinct design contexts**:

### 1.1 External UI (App Shell)

The application wrapper: navigation, toolbars, sidebars, dialogs, forms.

**Technology**: shadcn/ui components themed with vintage colors

**Examples**:

- Header navigation
- Editor toolbar buttons
- Authentication forms
- Modal dialogs
- Properties panel

```tsx
// CORRECT: shadcn/ui Button for toolbar action
import { Button } from "@/components/ui/button";

<Button onClick={handleGenerate}>
  <Sparkles className="h-4 w-4" />
  Generate
</Button>;
```

### 1.2 Internal Journal (Gazette Canvas)

The newspaper itself: the content users are creating.

**Technology**: Custom CSS classes from brand design system

**Examples**:

- Gazette page canvas
- Masthead title
- Headlines, subheadings
- Image frames with sepia effect
- Decorative dividers

```tsx
// CORRECT: Brand classes for gazette content
<div className="gazette-page paper-texture">
  <h1 className="font-masthead text-ink-effect">La Gazette de la Vie</h1>
  <hr className="divider-vintage" />
  <p className="font-body text-ink">Article content...</p>
</div>
```

---

## 2. shadcn/ui Component Usage

### 2.1 Available Components

Located in `src/components/ui/`:

| Component  | File           | Primary Use                |
| ---------- | -------------- | -------------------------- |
| `Button`   | `button.tsx`   | All clickable actions      |
| `Card`     | `card.tsx`     | Content containers, panels |
| `Input`    | `input.tsx`    | Text fields                |
| `Label`    | `label.tsx`    | Form labels                |
| `Dialog`   | `dialog.tsx`   | Modals, popups             |
| `Textarea` | `textarea.tsx` | Multi-line text            |

### 2.2 Button Variants

```tsx
import { Button } from "@/components/ui/button";

// PRIMARY ACTION (Gold background #C9A227)
// Use for: Generate, Create, Save, Submit
<Button>Generate Gazette</Button>
<Button>Create Project</Button>

// SECONDARY ACTION (Sepia outline)
// Use for: Cancel, Export, alternative actions
<Button variant="outline">Cancel</Button>
<Button variant="outline">Export</Button>

// DESTRUCTIVE ACTION (Aged red)
// Use for: Delete, Remove
<Button variant="destructive">Delete Page</Button>

// GHOST ACTION (Minimal, for toolbars)
// Use for: Icon buttons, subtle actions
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### 2.3 Card with Vintage Styling

Always combine `<Card>` with brand classes for vintage look:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// CORRECT: Card with vintage styling
<Card className="gazette-page paper-texture border-sepia/30">
  <CardHeader>
    <CardTitle className="font-headline">Properties</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// INCORRECT: Plain card without vintage classes
<Card>
  <CardHeader>
    <CardTitle>Properties</CardTitle>
  </CardHeader>
</Card>
```

### 2.4 Input Fields

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// CORRECT: Input with vintage styling
<div className="space-y-2">
  <Label htmlFor="name" className="font-ui text-sm text-muted">
    Project name
  </Label>
  <Input id="name" placeholder="e.g. Famille Dupont 1950-2024" className="input-vintage" />
</div>;
```

---

## 3. Brand CSS Classes Reference

### 3.1 Typography Classes

| Class             | Font                     | Use For                 |
| ----------------- | ------------------------ | ----------------------- |
| `font-masthead`   | Playfair Display 700     | Main gazette title only |
| `font-headline`   | Old Standard TT 700      | Section headlines       |
| `font-subheading` | Libre Baskerville Italic | Subtitles, taglines     |
| `font-body`       | EB Garamond              | Body text, captions     |
| `font-ui`         | Inter                    | UI labels, buttons      |

```tsx
// Typography examples
<h1 className="font-masthead text-4xl">La Gazette de la Vie</h1>
<h2 className="font-headline text-2xl">Latest News</h2>
<p className="font-subheading text-lg italic">A Family Chronicle</p>
<p className="font-body">Article content goes here...</p>
<span className="font-ui text-sm">UI label</span>
```

### 3.2 Color Classes

| Tailwind Class | Color           | Hex     | Use                      |
| -------------- | --------------- | ------- | ------------------------ |
| `text-ink`     | Newspaper Black | #2C2416 | Primary text             |
| `text-sepia`   | Sepia Ink       | #5C4033 | Headlines, borders       |
| `text-muted`   | Faded Gray      | #8B7355 | Secondary text, captions |
| `text-gold`    | Antique Gold    | #C9A227 | Highlights, CTAs         |
| `bg-parchment` | Aged Parchment  | #F4E4BC | Gazette background       |
| `bg-cream`     | Cream           | #FDF8E8 | App background           |
| `border-sepia` | Sepia Ink       | #5C4033 | Borders                  |

### 3.3 Visual Effect Classes

```tsx
// Gazette page with vignette effect
<div className="gazette-page">
  {/* Has radial gradient vignette + border + shadow */}
</div>

// Paper texture overlay
<div className="paper-texture">
  {/* Adds subtle grain texture via ::after pseudo-element */}
</div>

// Vintage letterpress shadow (for cards)
<div className="vintage-shadow">
  {/* Offset shadow effect */}
</div>

// Sepia filter for images
<img className="sepia-vintage" src="..." />

// Ink bleeding text effect
<h1 className="ink-bleed">Headline</h1>
// Or use:
<h1 className="text-ink-effect">Headline</h1>
```

### 3.4 Decorative Elements

```tsx
// Horizontal rule - simple
<hr className="divider-vintage" />

// Horizontal rule - double line
<hr className="divider-double" />

// Card with ornamental corners
<div className="ornament-corners">
  {/* Adds ❧ decorations */}
</div>
```

---

## 4. Common Patterns

### 4.1 Page Layout

```tsx
// Standard page container
<div className="mx-auto max-w-5xl px-4 py-12">{/* Page content */}</div>
```

### 4.2 Page Header

```tsx
// Page header with title and description
<div className="mx-auto mb-10 max-w-2xl text-center">
  <h2 className="font-headline text-ink-effect">Page Title</h2>
  <p className="mt-3 font-body text-muted">Description text here.</p>
</div>
```

### 4.3 Error Messages

```tsx
// Error message box
{
  error && (
    <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 font-ui text-sm text-aged-red">
      {error}
    </div>
  );
}
```

### 4.4 Empty States

Use poetic, on-brand copy for empty states:

```tsx
// CORRECT: On-brand empty state
<p className="font-body text-muted">
  This page awaits your memories. Click to add a photograph and bring the past to life.
</p>

// INCORRECT: Generic empty state
<p>No items found.</p>
<p>Select a page.</p>
```

**Empty state copy library:**

- Empty gazette: "Your gazette awaits its first memory."
- No pages: "Every story begins with a blank page. Add your first."
- No images: "This frame awaits a photograph. Click to upload."
- Generation complete: "Your gazette is ready. The memories have awakened."

### 4.5 Canvas Component

```tsx
// Editor canvas (without chrome)
<Canvas
  page={activePage}
  showChrome={false}  // No masthead in editor
  emptyState="This page awaits your memories."
  selectedElementId={selectedId}
  onSelectElement={setSelectedId}
/>

// Viewer canvas (with chrome)
<Canvas
  page={activePage}
  showChrome={true}   // Shows masthead
  readOnly={true}
  projectName="Famille Dupont"
/>
```

---

## 5. Icons

Use **Lucide React** (shadcn/ui default):

```tsx
import {
  Newspaper,      // Gazette/project
  Sparkles,       // Generation/magic
  Camera,         // Photo upload
  Image,          // Image frame
  Plus,           // Add new
  Trash2,         // Delete
  Share2,         // Share
  Download,       // Export
  Save,           // Save
  Loader2,        // Loading spinner
} from "lucide-react";

// Size: Use Tailwind classes
<Sparkles className="h-4 w-4" />  // Small (in buttons)
<Sparkles className="h-5 w-5" />  // Medium
<Sparkles className="h-6 w-6" />  // Large
```

---

## 6. Do's and Don'ts

### Do's

- Use `font-ui` for all form labels and UI text
- Add `text-ink-effect` to important headings
- Combine shadcn/ui cards with `gazette-page paper-texture`
- Use semantic button variants (default for primary, outline for secondary)
- Write poetic, on-brand empty state messages
- Apply `input-vintage` class to all form inputs

### Don'ts

- Don't use plain HTML without design system classes
- Don't use `variant="ghost"` for important actions
- Don't write generic empty state text ("No data", "Nothing here")
- Don't forget to add vintage styling to cards
- Don't use shadcn/ui components inside the gazette canvas content
- Don't hardcode colors - use CSS variables or Tailwind classes

---

## 7. File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (DO NOT MODIFY)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   └── textarea.tsx
│   ├── Canvas.tsx       # Gazette canvas (brand design)
│   └── ...              # Feature components
├── styles/
│   └── globals.css      # Brand CSS classes & theme
├── index.css            # Base styles & utilities
└── lib/
    └── utils.ts         # cn() helper for class merging
```

---

## 8. Adding New shadcn/ui Components

If you need a new shadcn/ui component:

1. Check if it exists in shadcn/ui docs
2. Install via CLI or manually create in `src/components/ui/`
3. Ensure it uses the theme variables (already configured)
4. Document usage in this file

---

_Frontend Guidelines v1.0_
_Last Updated: December 19, 2024_
