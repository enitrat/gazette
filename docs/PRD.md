# La Gazette de la Vie - Product Requirement Document

> Transform static family memories into living, animated newspapers inspired by the Daily Prophet

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Specifications](#2-feature-specifications)
3. [Implementation Plan](#3-implementation-plan)
4. [Risks & Mitigations](#4-risks--mitigations)

**Related Documents:**

- [Branding Guidelines](./BRANDING.md)
- [User Stories](./USER_STORIES.md)
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [API Specifications](./API_SPEC.md)
- [Data Models](./DATA_MODELS.md)
- [UI Mockups](./UI_MOCKUPS.md)

---

## 1. Executive Summary

### 1.1 Product Overview

**La Gazette de la Vie** is a web application that transforms static family photographs into animated "living newspapers" reminiscent of the Daily Prophet from Harry Potter. Users upload old photos, receive AI-generated animation suggestions, and compose multi-page vintage-style newspapers where images come to life.

### 1.2 Target Audience

- **Primary**: Family members creating personalized gifts
- **Secondary**: Anyone wanting to animate and present old photographs in a unique format

### 1.3 Key Value Proposition

- **Nostalgia meets magic**: Bring old memories to life with AI animation
- **Effortless creativity**: Pre-built templates with drag-and-drop customization
- **Shareable keepsakes**: Password-protected URLs for family sharing

### 1.4 Success Metrics

- Complete newspaper generation in under 30 minutes (excluding video generation time)
- Successful video generation rate > 95%
- Shareable output accessible on any modern browser

---

## 2. Feature Specifications

### 2.1 Feature Priority Matrix

| Feature                          | Priority | MVP     | Complexity |
| -------------------------------- | -------- | ------- | ---------- |
| Project access (name + password) | P0       | Yes     | Low        |
| Page templates (4 layouts)       | P0       | Yes     | Medium     |
| Image upload                     | P0       | Yes     | Low        |
| Animation suggestion             | P0       | Yes     | Medium     |
| Prompt editing                   | P0       | Yes     | Low        |
| Video generation (WAN API)       | P0       | Yes     | High       |
| Text editing                     | P0       | Yes     | Low        |
| Video preview/playback           | P0       | Yes     | Medium     |
| Share via URL                    | P0       | Yes     | Medium     |
| Layout drag-and-drop             | P1       | Yes     | High       |
| Multi-page support               | P1       | Yes     | Medium     |
| Download HTML                    | P1       | Partial | High       |
| Download videos ZIP              | P2       | No      | Low        |
| Print PDF                        | P2       | No      | Medium     |
| Undo/Redo                        | P2       | No      | Medium     |

### 2.2 Animation Suggestion Engine

The system analyzes uploaded images to suggest contextual animations:

#### Detection Categories

| Detected Scene          | Suggested Animations                                        |
| ----------------------- | ----------------------------------------------------------- |
| Two people face-to-face | "Dancing together", "Having a conversation", "Embracing"    |
| Group photo             | "Waving at camera", "Laughing together", "Subtle movements" |
| Single portrait         | "Gentle smile forming", "Head turning slightly", "Blinking" |
| Child/Baby              | "Giggling", "Looking around curiously", "Reaching out"      |
| Outdoor/Nature          | "Wind in hair/clothes", "Looking at scenery", "Walking"     |
| Formal pose             | "Dignified nod", "Slight smile", "Adjusting posture"        |

#### Implementation

- Use **Gemini 3 Flash Preview** to analyze image content
- Generate 3-5 contextual suggestions
- If analysis fails or Gemini is not configured, return no suggestions

---

## 3. Implementation Plan

### Phase 1: Foundation (Days 1-2)

**Goal**: Basic project structure and core infrastructure

#### Tasks:

1. **Project Setup**
   - Initialize monorepo with bun workspace
   - Configure TypeScript (strict mode)
   - Setup Vite + React
   - Configure Tailwind CSS
   - Configure Shadcn UI for components
   - Setup shared package with Zod schemas
   - Use CLI tools to auto-generate the project structure and code from the right templates (e.g. Vite + TS + React)

2. **Backend Foundation**
   - Setup Hono server
   - Configure SQLite + Drizzle
   - Implement database schema/migrations
   - Basic project CRUD endpoints
   - File upload handling

3. **Authentication**
   - Project name + password login
   - JWT token generation
   - Auth middleware

### Phase 2: Editor Core (Days 2-4)

**Goal**: Functional gazette editor with layout system

#### Tasks:

1. **Page Templates**
   - Implement 4 template layouts
   - Template selection UI
   - Page rendering engine

2. **Layout System**
   - Drag-and-drop positioning (dnd-kit)
   - Element resizing
   - Grid snapping
   - Z-index management

3. **Content Editing**
   - Image upload to frames
   - Inline text editing
   - Image crop/position modal

4. **Multi-page Support**
   - Page sidebar navigation
   - Add/delete pages
   - Page reordering

### Phase 3: AI Integration (Days 4-5)

**Goal**: Animation suggestions and video generation

#### Tasks:

1. **Image Analysis**
   - Gemini 3 Flash Preview API integration
   - Scene description generation
   - Animation prompt suggestions

2. **WAN API Integration**
   - API client implementation
   - Image-to-video generation
   - Job queue with BullMQ

3. **Generation UI**
   - Suggestion modal
   - Custom prompt editing
   - Progress tracking
   - Video preview

### Phase 4: Viewing & Export (Days 5-6)

**Goal**: Shareable output and export options

#### Tasks:

1. **Viewer Mode**
   - Password-protected view route
   - Read-only gazette renderer
   - Video autoplay with looping

2. **Export**
   - HTML export with embedded assets
   - Video download (ZIP)
   - Print-friendly CSS

### Phase 5: Polish (Day 6-7)

**Goal**: Visual refinement and UX improvements

#### Tasks:

1. **Visual Design**
   - Paper texture backgrounds
   - Typography refinement
   - Vintage effects (sepia, grain)
   - Animations/transitions

2. **UX Polish**
   - Loading states
   - Error handling
   - Keyboard shortcuts
   - Responsive design (tablet+)

3. **Testing & Deployment**
   - End-to-end testing
   - VPS deployment setup
   - Domain/SSL configuration

---

## 4. Risks & Mitigations

| Risk                       | Impact | Likelihood | Mitigation                                  |
| -------------------------- | ------ | ---------- | ------------------------------------------- |
| WAN API latency            | High   | Medium     | Queue system, async processing, progress UI |
| Video quality inconsistent | Medium | Medium     | Allow regeneration, prompt editing          |
| Large file uploads         | Low    | Medium     | Client-side compression, chunked upload     |
| Browser compatibility      | Low    | Low        | Target modern browsers only                 |

---

## Appendix: WAN API Integration Notes

**TODO**: Fetch WAN 2.x API documentation together to determine:

- Exact endpoint URLs
- Authentication method
- Request/response format
- Image requirements (size, format)
- Video output specifications
- Rate limits and pricing

---

_Document Version: 1.0_
_Last Updated: December 18, 2024_
