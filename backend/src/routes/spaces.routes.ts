import { Router } from "express";
import {
  createSpace,
  updateSpace,
  listSpaces,
} from "../modules/spaces/spaces.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);
spacesRouter.get("/", listSpaces);

export { spacesRouter };
