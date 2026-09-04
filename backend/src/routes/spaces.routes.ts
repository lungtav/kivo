import { Router } from "express";
import {
  createSpace,
  updateSpace,
  deleteSpace,
  listSpaces,
  listSpaceMembers,
  changeMemberRole,
  kickMember,
  leaveSpace,
  getSpace,
} from "../modules/spaces/spaces.controller.js";
import {
  createInvite,
  joinSpace,
  listInvites,
  revokeInvite,
} from "../modules/invites/invites.controller.js";
import { createCategory, deleteCategory } from "../modules/categories/categories.controller.js";
import { createChannel } from "../modules/channels/channels.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);
spacesRouter.delete("/:spaceId", deleteSpace);
spacesRouter.get("/", listSpaces);
spacesRouter.get("/:spaceId", getSpace);
spacesRouter.get("/:spaceId/members", listSpaceMembers);
spacesRouter.patch("/:spaceId/members/:userId", changeMemberRole);
spacesRouter.delete("/:spaceId/members/:userId", kickMember);
spacesRouter.post("/:spaceId/leave", leaveSpace);

//invites
spacesRouter.post("/:spaceId/invites", createInvite);
spacesRouter.post("/join/:code", joinSpace);
spacesRouter.get("/:spaceId/invites", listInvites);
spacesRouter.delete("/invites/:inviteId", revokeInvite);

//categories
spacesRouter.post("/:spaceId/categories", createCategory);
spacesRouter.delete("/categories/:categoryId", deleteCategory);

//channel
spacesRouter.post("/:spaceId/channels", createChannel);

export { spacesRouter };
