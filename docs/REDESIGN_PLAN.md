# La Gazette de la Vie - Redesign Implementation Plan

> Comprehensive plan for redesigning the editor interface to match UI_MOCKUP.jpeg

---

## 1. Overview

This document outlines the complete redesign of the La Gazette de la Vie editor interface to match the reference design shown in `UI_MOCKUP.jpeg`. The redesign focuses on:

1. Modern three-panel layout with improved information architecture
2. Enhanced component library using shadcn/ui
3. Better visual hierarchy and user experience
4. Consistent design system implementation

---

## 2. New shadcn/ui Components to Add

The following shadcn/ui components are **not yet installed** and need to be added:

### 2.1 Priority 1 - Critical Components

| Component       | Purpose              | Usage in Design                                                     |
| --------------- | -------------------- | ------------------------------------------------------------------- |
| **Slider**      | Numeric range inputs | Font size, line height, letter spacing controls in Properties panel |
| **Avatar**      | User profile picture | Top navbar user menu                                                |
| **Badge**       | Count indicators     | Notification count, page count badges                               |
| **Select**      | Dropdown menus       | Font family selector, editor mode selector                          |
| **Switch**      | Toggle controls      | Dark mode toggle, feature toggles                                   |
| **Toggle**      | Button toggles       | Bold, Italic, Underline, Strikethrough buttons                      |
| **ToggleGroup** | Grouped toggles      | Text alignment buttons (left, center, right, justify)               |
| **Popover**     | Floating panels      | Color picker, additional options                                    |

### 2.2 Priority 2 - Enhancement Components

| Component          | Purpose            | Usage in Design                     |
| ------------------ | ------------------ | ----------------------------------- |
| **Command**        | Search palette     | Enhanced search functionality       |
| **ContextMenu**    | Right-click menus  | Canvas element context actions      |
| **ScrollArea**     | Scrollable regions | Page list, media library            |
| **ResizablePanel** | Adjustable panels  | Left/right sidebar width adjustment |
| **HoverCard**      | Rich tooltips      | Extended information on hover       |

### 2.3 Already Installed - To Be Enhanced

These components are already installed but need styling updates:

- ✓ **Button** - Update variants for new design
- ✓ **Card** - Add page card variant
- ✓ **Dialog** - Style to match new design
- ✓ **Input** - Add search variant
- ✓ **Separator** - Already configured
- ✓ **Accordion** - Already configured
- ✓ **Tabs** - Already configured
- ✓ **DropdownMenu** - Style updates needed

---

## 3. Component Installation Commands

To install the new components, run these commands:

```bash
# Priority 1 - Critical
npx shadcn@latest add slider
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add toggle
npx shadcn@latest add toggle-group
npx shadcn@latest add popover

# Priority 2 - Enhancement
npx shadcn@latest add command
npx shadcn@latest add context-menu
npx shadcn@latest add scroll-area
npx shadcn@latest add resizable
npx shadcn@latest add hover-card
```

---

## 4. Architecture Overview

### 4.1 Page Structure

```
/editor/[projectId]
├── Layout (EditorLayout.tsx)
│   ├── TopNavbar
│   ├── EditorToolbar
│   └── ThreePanelLayout
│       ├── LeftSidebar
│       │   ├── ProjectHeader
│       │   ├── PagesList
│       │   └── ContentLibrary (Elements, Media, Templates)
│       ├── CenterCanvas
│       │   ├── CanvasHeader
│       │   ├── CanvasViewport (with zoom controls)
│       │   └── FloatingToolbar
│       └── RightSidebar (PropertiesPanel)
│           └── Tabs (Style, Layout, Advanced)
```

### 4.2 State Management

- **Project State**: Current project data, pages, elements
- **UI State**: Selected element, active page, sidebar visibility
- **Editor State**: Zoom level, canvas position, undo/redo history
- **Generation State**: Progress tracking, queue status

---

## 5. Implementation Phases

### Phase 1: Foundation & New Components (Days 1-2)

**Objective**: Install and configure all new shadcn/ui components

**Tasks**:

1. Install all Priority 1 components
2. Install all Priority 2 components
3. Update theme configuration for new components
4. Create component variants (e.g., search input, page card)
5. Test all components in isolation (Storybook or test page)

**Deliverables**:

- All new components installed in `src/components/ui/`
- Theme configuration updated
- Component test page created

---

### Phase 2: Top Navigation & Toolbar (Days 3-4)

**Objective**: Implement the top navigation bar and editor toolbar

**Components**:

#### 2.1 TopNavbar (`components/editor/TopNavbar.tsx`)

```tsx
- Logo/Brand
- Search Input (with Command component integration)
- Dark Mode Switch
- Notification Bell with Badge
- User Avatar with DropdownMenu
- Editor Mode Select
```

#### 2.2 EditorToolbar (`components/editor/EditorToolbar.tsx`)

```tsx
- Add Page Button
- Add Image Button
- Add Text Button
- Separator
- Delete Button (destructive variant)
- Separator
- Generate All Button (primary)
- View Progress Button
- Separator
- Share Button
- Export DropdownMenu
- Save Button (primary)
```

**Acceptance Criteria**:

- Top navbar matches design exactly
- All buttons have proper icons and tooltips
- Toolbar buttons are properly grouped with separators
- Responsive behavior on tablet/mobile

---

### Phase 3: Left Sidebar (Days 5-6)

**Objective**: Build the navigation panel with pages list and content library

**Components**:

#### 3.1 LeftSidebar (`components/editor/LeftSidebar.tsx`)

Wrapper component managing sidebar state and layout

#### 3.2 ProjectHeader (`components/editor/ProjectHeader.tsx`)

```tsx
- Project name display
- User badge
- Stats display (Elements count, Photos count)
```

#### 3.3 PagesList (`components/editor/PagesList.tsx`)

```tsx
- "Pages" header with count Badge
- Scrollable page cards (ScrollArea)
- Page thumbnails
- Page actions DropdownMenu (Duplicate, Delete, Rename)
- Selected state highlighting
- New Page Button at bottom
```

#### 3.4 ContentLibrary (`components/editor/ContentLibrary.tsx`)

```tsx
- Accordion with three sections:
  - Elements (draggable items)
  - Media (image library)
  - Templates (page layouts)
- Drag and drop helper text
```

**Acceptance Criteria**:

- Pages list displays correctly with thumbnails
- Selected page is highlighted
- Dropdown menus work on each page card
- Accordion sections expand/collapse independently
- New Page button opens template selector

---

### Phase 4: Right Sidebar - Properties Panel (Days 7-8)

**Objective**: Build the dynamic properties panel with style controls

**Components**:

#### 4.1 PropertiesPanel (`components/editor/PropertiesPanel.tsx`)

Main wrapper with tabs (Style, Layout, Advanced)

#### 4.2 StyleTab (`components/editor/properties/StyleTab.tsx`)

```tsx
Typography Section:
- Font Family Select
- Font Size Slider (with numeric input)
- Line Height Slider (with numeric input)
- Letter Spacing Slider (with numeric input)

Color & Alignment:
- Color Popover with color picker
- Text Alignment ToggleGroup (4 buttons)

Text Styling:
- Bold Toggle
- Italic Toggle
- Underline Toggle
- Strikethrough Toggle

Spacing Section:
- Margin dual inputs (horizontal/vertical)
- Padding dual inputs (horizontal/vertical)

Layering Section:
- Send to back Button
- Send backward Button
- Bring forward Button
- Bring to front Button
```

#### 4.3 LayoutTab (`components/editor/properties/LayoutTab.tsx`)

TBD based on requirements

#### 4.4 AdvancedTab (`components/editor/properties/AdvancedTab.tsx`)

TBD based on requirements

#### 4.5 FloatingToolbar (`components/editor/FloatingToolbar.tsx`)

```tsx
- Text alignment (top)
- Cursor/select tool
- Undo button
- Delete element button
```

**Acceptance Criteria**:

- All sliders work with both slider and numeric input
- Font family dropdown shows available fonts
- Color picker opens in popover
- Text alignment toggles work as radio group
- Bold/Italic/Underline toggles work independently
- Spacing inputs update element styling
- Layering buttons change element z-index

---

### Phase 5: Center Canvas (Days 9-10)

**Objective**: Enhance the main editing canvas

**Components**:

#### 5.1 CanvasHeader (`components/editor/CanvasHeader.tsx`)

```tsx
- "Editor Canvas" heading
- Subtitle: "Track generation progress while you keep editing."
```

#### 5.2 CanvasViewport (`components/editor/CanvasViewport.tsx`)

```tsx
- Paper texture background
- Vignette effect
- Drop shadow
- Gazette page rendering
- Element selection with resize handles
- Drag and drop functionality
```

#### 5.3 ZoomControls (`components/editor/ZoomControls.tsx`)

```tsx
- Zoom in Button
- Zoom percentage display
- Zoom out Button
- Position: floating bottom-right
```

**Acceptance Criteria**:

- Canvas displays gazette page with proper styling
- Elements can be selected and resized
- Zoom controls work and update canvas scale
- Canvas scrolls when zoomed in
- Paper texture and vignette effects are visible

---

### Phase 6: Dialogs & Modals (Days 11-12)

**Objective**: Implement all modal dialogs

**Components**:

#### 6.1 ImageUploadDialog (`components/editor/dialogs/ImageUploadDialog.tsx`)

```tsx
- Drag-and-drop zone
- File input
- Upload Progress bar
- Supported formats notice
- Clipboard paste support
```

#### 6.2 AnimationDialog (`components/editor/dialogs/AnimationDialog.tsx`)

```tsx
- Image preview
- AI analysis description
- RadioGroup with 3 suggestions
- Custom prompt Textarea (200 char limit)
- Cancel + Save & Continue Buttons
```

#### 6.3 TemplateDialog (`components/editor/dialogs/TemplateDialog.tsx`)

```tsx
- Grid of 4 template cards
- RadioGroup for selection
- Template preview images
- Cancel + Use Template Buttons
```

#### 6.4 GenerationProgressDialog (`components/editor/dialogs/GenerationProgressDialog.tsx`)

```tsx
- Overall Progress bar
- List of generation tasks with status
- Individual progress bars
- Time estimate
- Minimize Button
```

#### 6.5 ShareDialog (`components/editor/dialogs/ShareDialog.tsx`)

```tsx
- Share link Input with copy Button
- Password display
- Social share Buttons (4 options)
- QR code section (expandable)
- Done Button
```

**Acceptance Criteria**:

- All dialogs open/close properly
- Image upload supports drag-and-drop and click
- Upload progress displays correctly
- Animation suggestions display with radio selection
- Template selector shows all 4 templates
- Generation progress updates in real-time
- Share link copies to clipboard
- Social share buttons trigger correct actions

---

### Phase 7: Responsive Design (Days 13-14)

**Objective**: Ensure responsive behavior across all breakpoints

**Tasks**:

#### Desktop (1024px+)

- Full three-panel layout
- All features visible
- No changes needed from base design

#### Tablet (768px - 1023px)

- Left sidebar becomes Sheet (drawer)
- Right sidebar becomes Sheet (drawer)
- Toggle buttons in toolbar to open sidebars
- Toolbar remains visible
- Canvas adjusts to available width

#### Mobile (< 768px)

- Switch to viewer-only mode
- Hide editor toolbar
- Single column layout
- Touch-friendly navigation
- Display message: "Editor available on desktop only"

**Acceptance Criteria**:

- Layout adjusts smoothly at breakpoints
- Sidebars collapse to drawers on tablet
- Mobile shows viewer mode only
- No horizontal scrolling on any device
- Touch targets are at least 44x44px

---

### Phase 8: Integration & Polish (Days 15-16)

**Objective**: Connect UI to backend, add animations, polish interactions

**Tasks**:

1. Connect all dialogs to API endpoints
2. Implement real-time save functionality
3. Add loading states and error handling
4. Implement keyboard shortcuts
5. Add smooth transitions and animations
6. Accessibility audit (ARIA labels, focus management)
7. Cross-browser testing
8. Performance optimization

**Acceptance Criteria**:

- All features work end-to-end
- No console errors or warnings
- Loading states display during async operations
- Error messages are user-friendly
- Keyboard navigation works throughout
- Meets WCAG 2.1 AA standards
- Smooth 60fps animations
- Fast initial load time (<3s)

---

## 6. Component-Specific Implementation Details

### 6.1 Slider with Numeric Input Pattern

For font size, line height, and letter spacing controls:

```tsx
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SliderWithInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: SliderWithInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-ui text-sm">{label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-16 text-right"
          min={min}
          max={max}
        />
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
```

### 6.2 Page Card Pattern

For the pages list sidebar:

```tsx
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export function PageCard({ page, isSelected, onSelect }: PageCardProps) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer p-2 transition-colors hover:bg-muted/50",
        isSelected && "ring-2 ring-gold"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail */}
        <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-sepia/30 bg-parchment">
          <PageThumbnail page={page} />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="font-ui text-sm font-medium">Page {page.number}</div>
          <div className="font-ui text-xs text-muted">{page.name}</div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-aged-red">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
```

### 6.3 Text Alignment Toggle Group

For the properties panel:

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

export function TextAlignmentControl({ value, onChange }: TextAlignmentProps) {
  return (
    <div className="space-y-2">
      <Label className="font-ui text-sm">Text Alignment</Label>
      <ToggleGroup type="single" value={value} onValueChange={onChange}>
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
      </ToggleGroup>
    </div>
  );
}
```

### 6.4 Color Picker Popover

For color selection:

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="font-ui text-sm">Color</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 w-full justify-start gap-2">
            <div
              className="h-6 w-6 rounded border border-sepia/30"
              style={{ backgroundColor: value }}
            />
            <span className="font-ui text-sm">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          {/* Color picker implementation (e.g., react-colorful) */}
          <HexColorPicker color={value} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

---

## 7. File Structure After Redesign

```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx              # NEW
│   │   ├── badge.tsx               # NEW
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── command.tsx             # NEW
│   │   ├── context-menu.tsx        # NEW
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hover-card.tsx          # NEW
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx             # NEW
│   │   ├── progress.tsx
│   │   ├── resizable.tsx           # NEW
│   │   ├── scroll-area.tsx         # NEW
│   │   ├── select.tsx              # NEW
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── slider.tsx              # NEW
│   │   ├── switch.tsx              # NEW
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toggle.tsx              # NEW
│   │   ├── toggle-group.tsx        # NEW
│   │   └── tooltip.tsx
│   │
│   ├── editor/                      # Editor-specific components
│   │   ├── TopNavbar.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── ProjectHeader.tsx
│   │   ├── PagesList.tsx
│   │   ├── PageCard.tsx
│   │   ├── ContentLibrary.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── CanvasHeader.tsx
│   │   ├── CanvasViewport.tsx
│   │   ├── ZoomControls.tsx
│   │   ├── FloatingToolbar.tsx
│   │   ├── properties/
│   │   │   ├── StyleTab.tsx
│   │   │   ├── LayoutTab.tsx
│   │   │   ├── AdvancedTab.tsx
│   │   │   ├── SliderWithInput.tsx
│   │   │   ├── TextAlignmentControl.tsx
│   │   │   ├── TextStyleToggles.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── SpacingInputs.tsx
│   │   └── dialogs/
│   │       ├── ImageUploadDialog.tsx
│   │       ├── AnimationDialog.tsx
│   │       ├── TemplateDialog.tsx
│   │       ├── GenerationProgressDialog.tsx
│   │       └── ShareDialog.tsx
│   │
│   └── Canvas.tsx                   # Existing gazette canvas component
│
├── routes/
│   └── editor.tsx                   # Main editor page route
│
└── styles/
    └── globals.css                  # Updated with new component styles
```

---

## 8. Testing Strategy

### 8.1 Component Testing

Each new component should have:

- Unit tests for logic
- Visual regression tests (Storybook + Chromatic)
- Accessibility tests (axe-core)

### 8.2 Integration Testing

- User flows (Playwright/Cypress):
  - Create new page
  - Add image to page
  - Modify element properties
  - Generate animations
  - Share gazette
  - Export gazette

### 8.3 Cross-Browser Testing

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 9. Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Lighthouse Score**: > 90
- **Canvas rendering**: 60fps during interactions
- **Bundle size**: < 300kb (gzipped)

---

## 10. Risks & Mitigation

| Risk                                  | Impact | Mitigation                                        |
| ------------------------------------- | ------ | ------------------------------------------------- |
| Complex state management              | High   | Use Zustand or Jotai for predictable state        |
| Canvas performance with many elements | High   | Implement virtualization, limit elements per page |
| Large bundle size from UI components  | Medium | Tree-shaking, code splitting, lazy loading        |
| Browser compatibility issues          | Medium | Polyfills, progressive enhancement                |
| Accessibility gaps                    | High   | Regular audits, automated testing                 |

---

## 11. Success Criteria

The redesign is considered successful when:

1. ✅ All UI matches the reference design (UI_MOCKUP.jpeg)
2. ✅ All shadcn/ui components are properly integrated
3. ✅ Editor functionality works end-to-end
4. ✅ Responsive design works on all breakpoints
5. ✅ Performance targets are met
6. ✅ Accessibility standards are met (WCAG 2.1 AA)
7. ✅ Zero critical bugs in production
8. ✅ User testing shows improved usability

---

## 12. Next Steps

After completing this plan:

1. Get stakeholder approval on design and timeline
2. Set up project tracking in Vibe Kanban
3. Begin Phase 1 implementation
4. Daily standups to track progress
5. Weekly design reviews
6. Beta testing with select users
7. Production release

---

_Redesign Plan v1.0_
_Created: December 19, 2024_
_Estimated Duration: 16 days_
_Reference: UI_MOCKUP.jpeg_
