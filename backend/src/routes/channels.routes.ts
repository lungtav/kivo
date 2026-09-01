import { Router } from "express";
import { deleteChannel, joinChannel } from "../modules/channels/channels.controller.js";

const channelsRouter = Router();

channelsRouter.post("/:channelId/join", joinChannel);
channelsRouter.delete("/:channelId", deleteChannel);

export { channelsRouter };
