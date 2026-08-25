import { Router } from "express";
import { createSpace,updateSpace } from "../modules/spaces/spaces.controller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);
spacesRouter.patch("/:spaceId", updateSpace);

export { spacesRouter };
