# La Gazette de la Vie - User Stories

> Complete user stories organized by epic

---

## Epic 1: Project Management

### US-001: Access Project
```
AS A user
I WANT TO access my gazette project with a project name and password
SO THAT my family memories remain private
```

**Acceptance Criteria:**
- [ ] Landing page displays project name + password form
- [ ] Invalid credentials show clear error message
- [ ] Successful login redirects to project editor
- [ ] Session persists for 24 hours

**Priority:** P0 | **Complexity:** Low

---

### US-002: Create New Project
```
AS A user
I WANT TO create a new gazette project
SO THAT I can start building my family newspaper
```

**Acceptance Criteria:**
- [ ] "Create Project" option on landing page
- [ ] User provides project name and sets password
- [ ] New project initializes with one blank page
- [ ] User is redirected to editor

**Priority:** P0 | **Complexity:** Low

---

## Epic 2: Page Management

### US-003: Add New Page
```
AS A user
I WANT TO add new pages to my gazette
SO THAT I can include more photos and chapters of life
```

**Acceptance Criteria:**
- [ ] "Add Page" button visible in editor
- [ ] Template selection modal appears (4 templates)
- [ ] New page added after current page
- [ ] Page navigation updated immediately

**Priority:** P1 | **Complexity:** Medium

---

### US-004: Choose Page Template
```
AS A user
I WANT TO select from predefined page templates
SO THAT I have a good starting layout
```

**Acceptance Criteria:**
- [ ] 4 distinct templates available
- [ ] Visual preview of each template
- [ ] Template applies immediately upon selection
- [ ] Can change template later (with confirmation if content exists)

**Priority:** P0 | **Complexity:** Medium

**Templates:**
1. Classic Front Page
2. Two Column Feature
3. Grid Gallery
4. Magazine Spread

---

### US-005: Navigate Between Pages
```
AS A user
I WANT TO navigate between pages of my gazette
SO THAT I can edit different sections
```

**Acceptance Criteria:**
- [ ] Page thumbnails visible in sidebar
- [ ] Click thumbnail to switch pages
- [ ] Keyboard shortcuts (← →) for navigation
- [ ] Current page clearly highlighted

**Priority:** P1 | **Complexity:** Low

---

### US-006: Reorder Pages
```
AS A user
I WANT TO reorder pages via drag-and-drop
SO THAT I can organize the chronology of my gazette
```

**Acceptance Criteria:**
- [ ] Drag pages in sidebar to reorder
- [ ] Visual feedback during drag
- [ ] Order persists after save

**Priority:** P1 | **Complexity:** Medium

---

### US-007: Delete Page
```
AS A user
I WANT TO delete a page
SO THAT I can remove unwanted content
```

**Acceptance Criteria:**
- [ ] Delete button on each page (except if only one page)
- [ ] Confirmation dialog before deletion
- [ ] Uploaded images preserved in library (not deleted)

**Priority:** P1 | **Complexity:** Low

---

## Epic 3: Layout Customization

### US-008: Reorganize Layout Elements
```
AS A user
I WANT TO drag and resize layout elements (image frames, text blocks)
SO THAT I can customize the newspaper appearance
```

**Acceptance Criteria:**
- [ ] Elements snap to grid for alignment
- [ ] Resize handles on corners and edges
- [ ] Minimum size constraints prevent unusable elements
- [ ] Layout respects newspaper column structure

**Priority:** P1 | **Complexity:** High

---

### US-009: Add/Remove Layout Elements
```
AS A user
I WANT TO add or remove image frames and text blocks
SO THAT I can fully customize my page
```

**Acceptance Criteria:**
- [ ] "Add Element" menu with options: Image Frame, Headline, Subheading, Caption
- [ ] Maximum 5 image frames per page enforced
- [ ] Delete element via context menu or delete key
- [ ] Undo/redo support

**Priority:** P1 | **Complexity:** Medium

---

## Epic 4: Content Management

### US-010: Upload Photo to Frame
```
AS A user
I WANT TO click an image frame and upload a photo
SO THAT I can add my family photos
```

**Acceptance Criteria:**
- [ ] Click empty frame opens upload dialog
- [ ] Supports JPG, PNG, WebP formats
- [ ] Image preview shown before confirmation
- [ ] Progress indicator during upload
- [ ] Image fits frame with crop/position options

**Priority:** P0 | **Complexity:** Low

---

### US-011: Receive Animation Suggestions
```
AS A user
I WANT TO see AI-generated animation suggestions for my photo
SO THAT I know what movement options are available
```

**Acceptance Criteria:**
- [ ] After upload, modal shows 2-3 animation suggestions
- [ ] Suggestions are contextual (e.g., "Two people dancing", "Person waving")
- [ ] Each suggestion has brief description
- [ ] Loading state while AI analyzes image

**Priority:** P0 | **Complexity:** Medium

**AI Provider:** Gemini 2.0 Flash

---

### US-012: Edit Animation Prompt
```
AS A user
I WANT TO edit the animation prompt or write my own
SO THAT I can control how my photo animates
```

**Acceptance Criteria:**
- [ ] Text field pre-filled with selected/suggested prompt
- [ ] Can fully replace with custom text
- [ ] Character limit indicated (e.g., 200 chars)
- [ ] "Save" and "Cancel" buttons

**Priority:** P0 | **Complexity:** Low

---

### US-013: Edit Text Content
```
AS A user
I WANT TO edit headlines, subheadings, and captions
SO THAT I can tell the story of my photos
```

**Acceptance Criteria:**
- [ ] Click text element to edit inline
- [ ] Placeholder Lorem Ipsum text in templates
- [ ] Text styling preserved (font, size per element type)
- [ ] Auto-save on blur

**Priority:** P0 | **Complexity:** Low

---

### US-014: Adjust Image in Frame
```
AS A user
I WANT TO crop and reposition my photo within its frame
SO THAT the important parts are visible
```

**Acceptance Criteria:**
- [ ] Double-click image to enter crop mode
- [ ] Pan image within frame
- [ ] Zoom in/out
- [ ] "Apply" and "Cancel" buttons

**Priority:** P1 | **Complexity:** Medium

---

## Epic 5: Video Generation

### US-015: Generate All Videos
```
AS A user
I WANT TO click "Generate" to create animations for all photos
SO THAT my gazette comes to life
```

**Acceptance Criteria:**
- [ ] "Generate Gazette" button in toolbar
- [ ] Confirmation showing number of images to animate
- [ ] Estimated time/cost indication
- [ ] Generation starts for all images with prompts

**Priority:** P0 | **Complexity:** High

**Video Provider:** WAN 2.x API (Alibaba)

---

### US-016: Monitor Generation Progress
```
AS A user
I WANT TO see the progress of video generation
SO THAT I know when my gazette will be ready
```

**Acceptance Criteria:**
- [ ] Progress panel shows each image status
- [ ] States: Queued → Processing → Complete/Failed
- [ ] Percentage or progress bar per image
- [ ] Overall progress indicator

**Priority:** P0 | **Complexity:** Medium

---

### US-017: Preview Generated Videos
```
AS A user
I WANT TO preview generated videos in place
SO THAT I can see how my gazette looks
```

**Acceptance Criteria:**
- [ ] Videos auto-play on loop when in view
- [ ] Click to pause/play
- [ ] Smooth transition from placeholder to video

**Priority:** P0 | **Complexity:** Medium

---

### US-018: Regenerate Single Video
```
AS A user
I WANT TO regenerate a specific video with a new prompt
SO THAT I can improve unsatisfactory animations
```

**Acceptance Criteria:**
- [ ] "Regenerate" option on each image frame
- [ ] Opens prompt editor pre-filled with current prompt
- [ ] New generation replaces previous video
- [ ] Previous video kept until new one ready

**Priority:** P1 | **Complexity:** Low

---

## Epic 6: Export & Sharing

### US-019: Share via URL
```
AS A user
I WANT TO share my gazette via a password-protected URL
SO THAT family members can view it
```

**Acceptance Criteria:**
- [ ] "Share" button generates/shows URL
- [ ] URL format: `gazette.example.com/view/{project-slug}`
- [ ] Viewer must enter password to access
- [ ] Read-only view (no editing)

**Priority:** P0 | **Complexity:** Medium

---

### US-020: Download as HTML
```
AS A user
I WANT TO download my gazette as a standalone HTML file
SO THAT I can share it offline or archive it
```

**Acceptance Criteria:**
- [ ] "Download HTML" option in export menu
- [ ] Single HTML file with embedded videos (base64) or linked
- [ ] Works offline in any browser
- [ ] Preserves all animations and layout

**Priority:** P1 | **Complexity:** High

---

### US-021: Download Videos
```
AS A user
I WANT TO download all generated videos as a ZIP
SO THAT I can use them elsewhere
```

**Acceptance Criteria:**
- [ ] "Download Videos" option in export menu
- [ ] ZIP file with all videos named by page/position
- [ ] Includes original images as well

**Priority:** P2 | **Complexity:** Low

---

### US-022: Print as PDF
```
AS A user
I WANT TO print or save my gazette as a PDF
SO THAT I can have a physical copy
```

**Acceptance Criteria:**
- [ ] "Print/PDF" option in export menu
- [ ] Uses browser print functionality
- [ ] Layout optimized for A4/Letter paper
- [ ] QR codes link to video versions (optional)

**Priority:** P2 | **Complexity:** Medium

---

## Summary by Priority

### P0 (Must Have - MVP)
| ID | Story | Complexity |
|----|-------|------------|
| US-001 | Access Project | Low |
| US-002 | Create New Project | Low |
| US-004 | Choose Page Template | Medium |
| US-010 | Upload Photo to Frame | Low |
| US-011 | Receive Animation Suggestions | Medium |
| US-012 | Edit Animation Prompt | Low |
| US-013 | Edit Text Content | Low |
| US-015 | Generate All Videos | High |
| US-016 | Monitor Generation Progress | Medium |
| US-017 | Preview Generated Videos | Medium |
| US-019 | Share via URL | Medium |

### P1 (Should Have)
| ID | Story | Complexity |
|----|-------|------------|
| US-003 | Add New Page | Medium |
| US-005 | Navigate Between Pages | Low |
| US-006 | Reorder Pages | Medium |
| US-007 | Delete Page | Low |
| US-008 | Reorganize Layout Elements | High |
| US-009 | Add/Remove Layout Elements | Medium |
| US-014 | Adjust Image in Frame | Medium |
| US-018 | Regenerate Single Video | Low |
| US-020 | Download as HTML | High |

### P2 (Nice to Have)
| ID | Story | Complexity |
|----|-------|------------|
| US-021 | Download Videos | Low |
| US-022 | Print as PDF | Medium |

---

*User Stories v1.0*
*Last Updated: December 18, 2024*
