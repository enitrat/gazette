# La Gazette de la Vie - API Specification

> REST API endpoints, request/response formats, and examples

---

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://gazette.example.com/api`

## Authentication

Most endpoints require a JWT token obtained via project access.

```http
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### POST /api/projects

Create a new project.

**Request:**

```json
{
  "name": "Famille Dupont 1950-2024",
  "password": "famille2024"
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Famille Dupont 1950-2024",
  "slug": "famille-dupont-1950-2024",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "createdAt": "2024-12-18T10:00:00Z"
}
```

**Errors:**

- `400` - Invalid input (name too short, password too weak)
- `409` - Project name already exists

---

### POST /api/projects/access

Access an existing project.

**Request:**

```json
{
  "name": "Famille Dupont 1950-2024",
  "password": "famille2024"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Famille Dupont 1950-2024",
  "slug": "famille-dupont-1950-2024",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "createdAt": "2024-12-18T10:00:00Z",
  "updatedAt": "2024-12-18T12:30:00Z"
}
```

**Errors:**

- `401` - Invalid credentials
- `404` - Project not found

---

## 2. Project Endpoints

### GET /api/projects/:id

Get project details.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Famille Dupont 1950-2024",
  "slug": "famille-dupont-1950-2024",
  "createdAt": "2024-12-18T10:00:00Z",
  "updatedAt": "2024-12-18T12:30:00Z",
  "pageCount": 3,
  "imageCount": 8
}
```

---

### PUT /api/projects/:id

Update project settings.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "name": "La Famille Dupont - Une Histoire"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "La Famille Dupont - Une Histoire",
  "slug": "la-famille-dupont-une-histoire",
  "updatedAt": "2024-12-18T14:00:00Z"
}
```

---

### DELETE /api/projects/:id

Delete a project and all associated data.

**Headers:** `Authorization: Bearer <token>`

**Response (204 No Content)**

---

## 3. Page Endpoints

### GET /api/projects/:id/pages

List all pages in a project.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "pages": [
    {
      "id": "page-001",
      "order": 0,
      "template": "classic-front",
      "title": "L'Enfance",
      "subtitle": "1952 - 1965",
      "elementCount": 4
    },
    {
      "id": "page-002",
      "order": 1,
      "template": "two-column",
      "title": "Les Années de Jeunesse",
      "subtitle": "1965 - 1980",
      "elementCount": 5
    }
  ]
}
```

---

### POST /api/projects/:id/pages

Create a new page.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "template": "grid-gallery",
  "afterPageId": "page-001" // optional, inserts after this page
}
```

**Response (201 Created):**

```json
{
  "id": "page-003",
  "projectId": "550e8400...",
  "order": 1,
  "template": "grid-gallery",
  "title": "",
  "subtitle": "",
  "createdAt": "2024-12-18T15:00:00Z"
}
```

---

### PUT /api/pages/:id

Update a page.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "title": "La Vie de Famille",
  "subtitle": "1980 - 2000",
  "template": "magazine-spread",
  "order": 2
}
```

**Response (200 OK):**

```json
{
  "id": "page-003",
  "projectId": "550e8400...",
  "order": 2,
  "template": "magazine-spread",
  "title": "La Vie de Famille",
  "subtitle": "1980 - 2000",
  "updatedAt": "2024-12-18T15:30:00Z"
}
```

---

### DELETE /api/pages/:id

Delete a page.

**Headers:** `Authorization: Bearer <token>`

**Response (204 No Content)**

**Errors:**

- `400` - Cannot delete the only page in a project

---

## 4. Element Endpoints

### GET /api/pages/:id/elements

List all elements on a page.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "elements": [
    {
      "id": "elem-001",
      "pageId": "page-001",
      "type": "image",
      "position": {
        "x": 50,
        "y": 100,
        "width": 400,
        "height": 300
      },
      "imageId": "img-001",
      "imageUrl": "/api/images/img-001/file",
      "cropData": {
        "x": 0,
        "y": 10,
        "zoom": 1.2
      },
      "animationPrompt": "The couple dances a gentle waltz",
      "videoUrl": "/api/videos/vid-001.mp4",
      "videoStatus": "complete"
    },
    {
      "id": "elem-002",
      "pageId": "page-001",
      "type": "headline",
      "position": {
        "x": 50,
        "y": 20,
        "width": 700,
        "height": 60
      },
      "content": "Les Premières Années"
    }
  ]
}
```

---

### POST /api/pages/:id/elements

Create a new element.

**Headers:** `Authorization: Bearer <token>`

**Request (Image Element):**

```json
{
  "type": "image",
  "position": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 250
  }
}
```

**Request (Text Element):**

```json
{
  "type": "headline",
  "position": {
    "x": 50,
    "y": 50,
    "width": 600,
    "height": 40
  },
  "content": "Nouveau Titre"
}
```

**Response (201 Created):**

```json
{
  "id": "elem-003",
  "pageId": "page-001",
  "type": "image",
  "position": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 250
  },
  "imageId": null,
  "videoStatus": "none",
  "createdAt": "2024-12-18T16:00:00Z"
}
```

**Errors:**

- `400` - Maximum 5 image elements per page

---

### PUT /api/elements/:id

Update an element.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "position": {
    "x": 120,
    "y": 180,
    "width": 350,
    "height": 280
  },
  "cropData": {
    "x": 10,
    "y": 0,
    "zoom": 1.5
  },
  "animationPrompt": "The couple looks at each other and smiles"
}
```

**Response (200 OK):**

```json
{
  "id": "elem-001",
  "position": { ... },
  "cropData": { ... },
  "animationPrompt": "The couple looks at each other and smiles",
  "updatedAt": "2024-12-18T16:30:00Z"
}
```

---

### DELETE /api/elements/:id

Delete an element.

**Headers:** `Authorization: Bearer <token>`

**Response (204 No Content)**

---

## 5. Image Endpoints

### POST /api/projects/:id/images

Upload an image.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:**

```
file: [binary image data]
```

**Response (201 Created):**

```json
{
  "id": "img-002",
  "originalFilename": "grandparents-wedding.jpg",
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "url": "/api/images/img-002/file",
  "uploadedAt": "2024-12-18T17:00:00Z"
}
```

**Errors:**

- `400` - Invalid file type (not JPG/PNG/WebP)
- `413` - File too large (>10MB)

---

### GET /api/images/:id

Get image metadata.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "id": "img-002",
  "projectId": "550e8400...",
  "originalFilename": "grandparents-wedding.jpg",
  "mimeType": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "url": "/api/images/img-002/file",
  "uploadedAt": "2024-12-18T17:00:00Z"
}
```

---

### GET /api/images/:id/file

Get the actual image file.

**Headers:** `Authorization: Bearer <token>`

**Response:** Binary image data with appropriate `Content-Type` header.

---

### POST /api/images/:id/analyze

Get AI-generated animation suggestions.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "imageId": "img-002",
  "sceneDescription": "Black and white photo of a young couple in formal wedding attire, standing face to face, holding hands",
  "suggestions": [
    {
      "id": "sug-1",
      "description": "Dancing a slow waltz",
      "prompt": "The couple begins to dance a gentle waltz, swaying gracefully while holding hands, with soft smiles on their faces"
    },
    {
      "id": "sug-2",
      "description": "Exchanging loving glances",
      "prompt": "The couple looks into each other's eyes, subtle head movements, gentle smiles appearing, tender moment"
    },
    {
      "id": "sug-3",
      "description": "Walking forward together",
      "prompt": "The couple takes a few steps forward together, hand in hand, as if approaching the camera"
    }
  ]
}
```

---

## 6. Generation Endpoints

### POST /api/projects/:id/generate

Start video generation for multiple images.

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "elements": [
    {
      "elementId": "elem-001",
      "imageId": "img-001",
      "prompt": "The couple begins to dance a gentle waltz, swaying gracefully"
    },
    {
      "elementId": "elem-002",
      "imageId": "img-002",
      "prompt": "A baby smiles and reaches toward the camera"
    }
  ]
}
```

**Response (202 Accepted):**

```json
{
  "projectId": "550e8400...",
  "jobCount": 2,
  "estimatedDuration": 120,
  "jobs": [
    {
      "id": "job-001",
      "elementId": "elem-001",
      "status": "queued"
    },
    {
      "id": "job-002",
      "elementId": "elem-002",
      "status": "queued"
    }
  ]
}
```

---

### GET /api/generation/:id

Get status of a single generation job.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "id": "job-001",
  "elementId": "elem-001",
  "imageId": "img-001",
  "prompt": "The couple begins to dance a gentle waltz",
  "status": "processing",
  "progress": 65,
  "videoUrl": null,
  "error": null,
  "createdAt": "2024-12-18T18:00:00Z",
  "updatedAt": "2024-12-18T18:01:30Z"
}
```

**Status Values:**

- `queued` - Waiting in queue
- `processing` - Currently generating
- `complete` - Video ready
- `failed` - Generation failed

---

### GET /api/projects/:id/generation/status

Get status of all generation jobs for a project.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "projectId": "550e8400...",
  "totalJobs": 5,
  "completed": 3,
  "processing": 1,
  "queued": 1,
  "failed": 0,
  "jobs": [
    {
      "id": "job-001",
      "elementId": "elem-001",
      "status": "complete",
      "progress": 100,
      "videoUrl": "/api/videos/vid-001.mp4"
    },
    {
      "id": "job-002",
      "elementId": "elem-002",
      "status": "processing",
      "progress": 45,
      "videoUrl": null
    }
    // ...
  ]
}
```

---

### DELETE /api/generation/:id

Cancel a pending generation job.

**Headers:** `Authorization: Bearer <token>`

**Response (204 No Content)**

**Errors:**

- `400` - Job already completed or processing

---

## 7. Viewer Endpoints (Public)

### POST /api/view/:slug/access

Verify password for viewing a shared gazette.

**Request:**

```json
{
  "password": "famille2024"
}
```

**Response (200 OK):**

```json
{
  "viewToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

**Errors:**

- `401` - Invalid password
- `404` - Project not found

---

### GET /api/view/:slug

Get gazette data for viewing (read-only).

**Headers:** `Authorization: Bearer <viewToken>`

**Response (200 OK):**

```json
{
  "project": {
    "name": "Famille Dupont 1950-2024",
    "createdAt": "2024-12-18T10:00:00Z"
  },
  "pages": [
    {
      "id": "page-001",
      "order": 0,
      "template": "classic-front",
      "title": "L'Enfance",
      "subtitle": "1952 - 1965",
      "elements": [
        {
          "id": "elem-001",
          "type": "image",
          "position": { ... },
          "imageUrl": "/api/view/famille-dupont.../images/img-001",
          "videoUrl": "/api/view/famille-dupont.../videos/vid-001",
          "videoStatus": "complete"
        },
        {
          "id": "elem-002",
          "type": "headline",
          "position": { ... },
          "content": "Les Premières Années"
        }
      ]
    }
  ]
}
```

---

## 8. Export Endpoints

### GET /api/projects/:id/export/html

Download gazette as standalone HTML.

**Headers:** `Authorization: Bearer <token>`

**Response:** HTML file download with `Content-Disposition: attachment`.

---

### GET /api/projects/:id/export/videos

Download all videos as ZIP.

**Headers:** `Authorization: Bearer <token>`

**Response:** ZIP file download with `Content-Disposition: attachment`.

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 4 characters"
      }
    ]
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | No access to resource |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `PAYLOAD_TOO_LARGE` | 413 | File too large |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

_API Specification v1.0_
_Last Updated: December 18, 2024_
