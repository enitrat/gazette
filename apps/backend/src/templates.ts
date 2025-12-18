import { db, schema } from "./db";
import {
  TEMPLATES,
  type TemplateDefinition,
  type TemplateElementDefinition,
  type Template as TemplateId,
} from "@gazette/shared";

const TEMPLATE_CANVAS = {
  width: 1200,
  height: 1600,
} as const;

const FULL_PAGE_ELEMENTS: TemplateElementDefinition[] = [
  {
    type: "headline",
    position: { x: 80, y: 80, width: 1040, height: 100 },
    content: "",
  },
  {
    type: "image",
    position: { x: 80, y: 200, width: 1040, height: 1200 },
  },
  {
    type: "caption",
    position: { x: 80, y: 1420, width: 1040, height: 80 },
    content: "",
  },
];

const TWO_COLUMNS_ELEMENTS: TemplateElementDefinition[] = [
  {
    type: "headline",
    position: { x: 80, y: 80, width: 1040, height: 90 },
    content: "",
  },
  {
    type: "image",
    position: { x: 80, y: 200, width: 500, height: 1000 },
  },
  {
    type: "image",
    position: { x: 620, y: 200, width: 500, height: 1000 },
  },
  {
    type: "caption",
    position: { x: 80, y: 1220, width: 500, height: 60 },
    content: "",
  },
  {
    type: "caption",
    position: { x: 620, y: 1220, width: 500, height: 60 },
    content: "",
  },
];

const THREE_GRID_ELEMENTS: TemplateElementDefinition[] = [
  {
    type: "headline",
    position: { x: 80, y: 80, width: 1040, height: 90 },
    content: "",
  },
  {
    type: "image",
    position: { x: 80, y: 210, width: 320, height: 900 },
  },
  {
    type: "image",
    position: { x: 440, y: 210, width: 320, height: 900 },
  },
  {
    type: "image",
    position: { x: 800, y: 210, width: 320, height: 900 },
  },
  {
    type: "caption",
    position: { x: 80, y: 1125, width: 320, height: 60 },
    content: "",
  },
  {
    type: "caption",
    position: { x: 440, y: 1125, width: 320, height: 60 },
    content: "",
  },
  {
    type: "caption",
    position: { x: 800, y: 1125, width: 320, height: 60 },
    content: "",
  },
];

const MASTHEAD_ELEMENTS: TemplateElementDefinition[] = [
  {
    type: "headline",
    position: { x: 80, y: 80, width: 1040, height: 140 },
    content: "",
  },
  {
    type: "subheading",
    position: { x: 80, y: 230, width: 1040, height: 60 },
    content: "",
  },
  {
    type: "image",
    position: { x: 80, y: 320, width: 1040, height: 1020 },
  },
  {
    type: "caption",
    position: { x: 80, y: 1360, width: 1040, height: 80 },
    content: "",
  },
];

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: TEMPLATES.FULL_PAGE,
    name: "Full Page",
    description: "Single hero image with headline and caption.",
    canvas: TEMPLATE_CANVAS,
    elements: FULL_PAGE_ELEMENTS,
  },
  {
    id: TEMPLATES.TWO_COLUMNS,
    name: "Two Columns",
    description: "Two-column photo spread with captions.",
    canvas: TEMPLATE_CANVAS,
    elements: TWO_COLUMNS_ELEMENTS,
  },
  {
    id: TEMPLATES.THREE_GRID,
    name: "Three Grid",
    description: "Three photo grid with captions.",
    canvas: TEMPLATE_CANVAS,
    elements: THREE_GRID_ELEMENTS,
  },
  {
    id: TEMPLATES.MASTHEAD,
    name: "Masthead",
    description: "Masthead headline with a hero image and subheading.",
    canvas: TEMPLATE_CANVAS,
    elements: MASTHEAD_ELEMENTS,
  },
];

const TEMPLATE_LOOKUP = new Map(TEMPLATE_DEFINITIONS.map((template) => [template.id, template]));

export function getTemplateDefinitions() {
  return TEMPLATE_DEFINITIONS;
}

export function getTemplateDefinition(templateId: TemplateId) {
  return TEMPLATE_LOOKUP.get(templateId);
}

export function resolveTemplateId(input?: string | null): TemplateId {
  if (!input) {
    return TEMPLATES.FULL_PAGE;
  }

  if (TEMPLATE_LOOKUP.has(input as TemplateId)) {
    return input as TemplateId;
  }

  return TEMPLATES.FULL_PAGE;
}

export async function initializeTemplateElements(pageId: string, templateId: TemplateId) {
  const template = getTemplateDefinition(templateId);
  if (!template) {
    throw new Error(`Unknown template_id: ${templateId}`);
  }

  const values = template.elements.map((element) => {
    const base = {
      id: crypto.randomUUID(),
      pageId,
      type: element.type,
      positionX: element.position.x,
      positionY: element.position.y,
      positionWidth: element.position.width,
      positionHeight: element.position.height,
    } as const;

    if (element.type === "image") {
      return base;
    }

    return {
      ...base,
      content: element.content ?? "",
    };
  });

  await db.insert(schema.elements).values(values).run();

  return values;
}
