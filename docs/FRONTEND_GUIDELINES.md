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

| Component        | File                | Primary Use                    |
| ---------------- | ------------------- | ------------------------------ |
| `Accordion`      | `accordion.tsx`     | Collapsible sections           |
| `AlertDialog`    | `alert-dialog.tsx`  | Confirmations, destructive UX  |
| `Avatar`         | `avatar.tsx`        | User profile pictures          |
| `Badge`          | `badge.tsx`         | Count indicators, labels       |
| `Button`         | `button.tsx`        | All clickable actions          |
| `Card`           | `card.tsx`          | Content containers, panels     |
| `Command`        | `command.tsx`       | Search palettes, command menus |
| `ContextMenu`    | `context-menu.tsx`  | Right-click menus              |
| `Dialog`         | `dialog.tsx`        | Modals, popups                 |
| `DropdownMenu`   | `dropdown-menu.tsx` | Overflow actions, menus        |
| `HoverCard`      | `hover-card.tsx`    | Rich tooltips on hover         |
| `Input`          | `input.tsx`         | Text fields                    |
| `Label`          | `label.tsx`         | Form labels                    |
| `Popover`        | `popover.tsx`       | Floating panels, color pickers |
| `Progress`       | `progress.tsx`      | Loading states, uploads        |
| `RadioGroup`     | `radio-group.tsx`   | Radio selections               |
| `ResizablePanel` | `resizable.tsx`     | Adjustable panel widths        |
| `ScrollArea`     | `scroll-area.tsx`   | Custom scrollable regions      |
| `Select`         | `select.tsx`        | Dropdown selectors             |
| `Separator`      | `separator.tsx`     | Dividers, button groups        |
| `Sheet`          | `sheet.tsx`         | Mobile navigation, side panels |
| `Slider`         | `slider.tsx`        | Range inputs, numeric controls |
| `Switch`         | `switch.tsx`        | Toggle switches                |
| `Tabs`           | `tabs.tsx`          | View switching, navigation     |
| `Textarea`       | `textarea.tsx`      | Multi-line text                |
| `Toast`          | `toast.tsx`         | Notifications                  |
| `Toggle`         | `toggle.tsx`        | Single toggle buttons          |
| `ToggleGroup`    | `toggle-group.tsx`  | Grouped toggle buttons         |
| `Tooltip`        | `tooltip.tsx`       | Icon button labels, hints      |
| `Toaster`        | `toaster.tsx`       | Toast viewport                 |
| `useToast`       | `use-toast.ts`      | Toast hook                     |

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

### 2.5 Tooltip for Icon Buttons

Always pair icon-only buttons with tooltips for accessibility.

```tsx
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Generate">
        <Sparkles className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">Generate</TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

### 2.6 Accordion for Collapsible Sections

Use accordions for grouped settings in side panels.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="layout">
    <AccordionTrigger>Layout</AccordionTrigger>
    <AccordionContent>{/* layout controls */}</AccordionContent>
  </AccordionItem>
  <AccordionItem value="typography">
    <AccordionTrigger>Typography</AccordionTrigger>
    <AccordionContent>{/* typography controls */}</AccordionContent>
  </AccordionItem>
</Accordion>;
```

### 2.7 Tabs for Navigation

Tabs are preferred for switching between editor modes or sub-panels.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="details" className="w-full">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="assets">Assets</TabsTrigger>
  </TabsList>
  <TabsContent value="details">{/* details panel */}</TabsContent>
  <TabsContent value="assets">{/* assets panel */}</TabsContent>
</Tabs>;
```

### 2.8 Progress for Loading States

Use `Progress` for uploads, exports, and generation steps.

```tsx
import { Progress } from "@/components/ui/progress";

<div className="space-y-2">
  <div className="font-ui text-xs text-muted">Uploading...</div>
  <Progress value={62} />
</div>;
```

### 2.9 Separator for Toolbar Grouping

Use separators in toolbars or control clusters.

```tsx
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

<div className="flex items-center gap-2">
  <Button>Undo</Button>
  <Separator orientation="vertical" className="h-6" />
  <Button>Redo</Button>
</div>;
```

### 2.10 Slider with Numeric Input

Use for precise numeric controls like font size, spacing, etc.

```tsx
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="font-ui text-sm">Font Size</Label>
    <Input
      type="number"
      value={fontSize}
      onChange={(e) => setFontSize(Number(e.target.value))}
      className="h-8 w-16 text-right"
      min={8}
      max={72}
    />
  </div>
  <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={8} max={72} step={1} />
</div>;
```

### 2.11 Avatar with Dropdown

Use for user profile in navbar.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Avatar className="h-8 w-8 cursor-pointer">
      <AvatarImage src="/user.jpg" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Sign Out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### 2.12 Badge for Counts

Use for notification counts, page counts, etc.

```tsx
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

// Notification badge
<div className="relative">
  <Bell className="h-5 w-5" />
  <Badge className="absolute -right-1 -top-1 h-4 min-w-4 p-0 text-xs">3</Badge>
</div>;

// Count badge
<div className="flex items-center gap-2">
  <span className="font-ui text-sm">Pages</span>
  <Badge variant="secondary">5</Badge>
</div>;
```

### 2.13 Select Dropdown

Use for font family, editor mode, and other dropdown selections.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={fontFamily} onValueChange={setFontFamily}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select font" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="inter">Inter</SelectItem>
    <SelectItem value="serif">Serif</SelectItem>
    <SelectItem value="playfair">Playfair Display</SelectItem>
  </SelectContent>
</Select>;
```

### 2.14 Switch for Settings

Use for dark mode toggle and other on/off settings.

```tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

<div className="flex items-center gap-2">
  <Sun className="h-4 w-4" />
  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
  <Moon className="h-4 w-4" />
</div>;
```

### 2.15 Toggle Group for Alignment

Use for text alignment, view modes, and mutually exclusive options.

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

<ToggleGroup type="single" value={alignment} onValueChange={setAlignment}>
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="justify" aria-label="Justify">
    <AlignJustify className="h-4 w-4" />
  </ToggleGroupItem>
</ToggleGroup>;
```

### 2.16 Toggle for Text Styling

Use for bold, italic, underline, strikethrough buttons.

```tsx
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";

<div className="flex gap-1">
  <Toggle pressed={bold} onPressedChange={setBold} aria-label="Toggle bold">
    <Bold className="h-4 w-4" />
  </Toggle>
  <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Toggle italic">
    <Italic className="h-4 w-4" />
  </Toggle>
  <Toggle pressed={underline} onPressedChange={setUnderline} aria-label="Toggle underline">
    <Underline className="h-4 w-4" />
  </Toggle>
  <Toggle
    pressed={strikethrough}
    onPressedChange={setStrikethrough}
    aria-label="Toggle strikethrough"
  >
    <Strikethrough className="h-4 w-4" />
  </Toggle>
</div>;
```

### 2.17 Popover for Color Picker

Use for color selection and other floating panels.

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="h-10 w-full justify-start gap-2">
      <div className="h-6 w-6 rounded border border-sepia/30" style={{ backgroundColor: color }} />
      <span className="font-ui text-sm">{color}</span>
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    {/* Color picker component (e.g., react-colorful) */}
  </PopoverContent>
</Popover>;
```

### 2.18 ScrollArea for Lists

Use for page lists, media libraries, and scrollable content.

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[400px] w-full">
  <div className="space-y-2 p-4">
    {pages.map((page) => (
      <PageCard key={page.id} page={page} />
    ))}
  </div>
</ScrollArea>;
```

### 2.19 RadioGroup for Options

Use for animation suggestions, template selection, etc.

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

<RadioGroup value={selectedAnimation} onValueChange={setSelectedAnimation}>
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="waltz" id="waltz" />
    <Label htmlFor="waltz" className="font-body">
      <div className="font-semibold">Dancing a slow waltz together</div>
      <div className="text-sm text-muted">The couple begins to dance...</div>
    </Label>
  </div>
  <div className="flex items-start space-x-2">
    <RadioGroupItem value="conversation" id="conversation" />
    <Label htmlFor="conversation" className="font-body">
      <div className="font-semibold">Having a warm conversation</div>
      <div className="text-sm text-muted">The couple looks into each other's eyes...</div>
    </Label>
  </div>
</RadioGroup>;
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

### 4.6 Button Group Pattern

Use a vertical separator to cluster related toolbar actions.

```tsx
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

<div className="flex items-center gap-2">
  <Button>...</Button>
  <Separator orientation="vertical" className="h-6" />
  <Button>...</Button>
</div>;
```

### 4.7 Radio Card Pattern

Use the custom `RadioCard` component for visual option selection (located in `src/components/RadioCard.tsx`).

```tsx
import { RadioCardGroup, RadioCardItem } from "@/components/RadioCard";

<RadioCardGroup value={layout} onValueChange={setLayout} className="grid gap-3 sm:grid-cols-2">
  <RadioCardItem value="classic" title="Classic" description="Traditional gazette layout." />
  <RadioCardItem value="modern" title="Modern" description="Simplified spacing and typography." />
</RadioCardGroup>;
```

### 4.8 Mobile Patterns

Use responsive shadcn/ui components for mobile-first navigation and overflow actions.

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </SheetTrigger>
  <SheetContent side="left">{/* mobile nav */}</SheetContent>
</Sheet>;
```

```tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">More</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuItem>Archive</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
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
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
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
_Last Updated: December 19, 2025_
