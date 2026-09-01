import { Router } from "express";
import {
  createSpace,
  updateSpace,
  deleteSpace,
  listSpaces,
  getSpace,
} from "../modules/spaces/spaces.controller.js";
import {
  createInvite,
  joinSpace,
} from "../modules/invites/invites.controller.js";
import { createCategory, deleteCategory } from "../modules/categories/categories.controller.js";
import { createChannel } from "../modules/channels/channels.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);
spacesRouter.delete("/:spaceId", deleteSpace);
spacesRouter.get("/", listSpaces);
spacesRouter.get("/:spaceId", getSpace);

//invites
spacesRouter.post("/:spaceId/invites", createInvite);
spacesRouter.post("/join/:code", joinSpace);

//categories
spacesRouter.post("/:spaceId/categories", createCategory);
spacesRouter.delete("/categories/:categoryId", deleteCategory);

//channel
spacesRouter.post("/:spaceId/channels", createChannel);

export { spacesRouter };
