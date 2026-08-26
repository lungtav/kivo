import { Router } from "express";
import {
  createSpace,
  updateSpace,
  listSpaces,
  getSpace,
} from "../modules/spaces/spaces.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);
spacesRouter.get("/", listSpaces);
spacesRouter.get("/:spaceId", getSpace);

export { spacesRouter };
