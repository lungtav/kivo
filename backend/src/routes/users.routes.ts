import { Router } from "express";
import { getMe, updateMe } from "../modules/users/users.controller.js";

const meRouter = Router();

meRouter.get("/", getMe);
meRouter.patch("/", updateMe);

export { meRouter };
