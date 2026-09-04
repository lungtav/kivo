import { Router } from "express";
import { getMe, getUserProfile, searchUsers, updateMe } from "../modules/users/users.controller.js";

const meRouter = Router();

meRouter.get("/", getMe);
meRouter.patch("/", updateMe);

const usersRouter = Router();

// registered before /:userId so "search" isn't captured as an id
usersRouter.get("/search", searchUsers);
usersRouter.get("/:userId", getUserProfile);

export { meRouter, usersRouter };
