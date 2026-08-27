import { Router } from "express";
import { joinChannel } from "../modules/channels/channels.controller.js";

const channelsRouter = Router();

channelsRouter.post("/:channelId/join", joinChannel);

export { channelsRouter };
