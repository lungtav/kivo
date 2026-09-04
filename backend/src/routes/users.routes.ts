import { Router } from "express";
import { getMe, getUserProfile, updateMe } from "../modules/users/users.controller.js";

const meRouter = Router();

meRouter.get("/", getMe);
meRouter.patch("/", updateMe);

const usersRouter = Router();

usersRouter.get("/:userId", getUserProfile);

export { meRouter, usersRouter };
