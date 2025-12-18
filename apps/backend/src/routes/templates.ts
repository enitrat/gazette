import { Hono } from "hono";
import { getTemplateDefinitions } from "../templates";

export const templatesRouter = new Hono();

templatesRouter.get("/templates", (c) => {
  return c.json({
    templates: getTemplateDefinitions(),
  });
});
