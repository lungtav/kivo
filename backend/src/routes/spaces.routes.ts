import { Router } from "express";
import {
  createSpace,
  updateSpace,
  listSpaces,
  getSpace,
} from "../modules/spaces/spaces.controller.js";
import { createInvite } from "../modules/invites/invites.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);
spacesRouter.get("/", listSpaces);
spacesRouter.get("/:spaceId", getSpace);

spacesRouter.post("/:spaceId/invites", createInvite);

export { spacesRouter };
