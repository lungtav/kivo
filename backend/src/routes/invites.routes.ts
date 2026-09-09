import { Router } from "express";
import { previewInvite } from "../modules/invites/invites.controller.js";

const invitesRouter = Router();

// public: renders invite links for logged-out visitors (join page).
// joining itself stays behind auth on /api/spaces/join/:code.
invitesRouter.get("/:code", previewInvite);

export { invitesRouter };
