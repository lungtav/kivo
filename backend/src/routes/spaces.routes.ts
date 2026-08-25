import { Router } from "express";
import { createSpace } from "../modules/spaces/spaces.contoller.js";

const spacesRouter = Router();

spacesRouter.post("/", createSpace);

export { spacesRouter };
