import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../../config/env.js";
import { wsAuth } from "./ws-auth.middleware.js";
import { randomUUID } from "crypto";
import * as presenceRepository from "./presence.repository.js";
import * as messagesRepository from "../../modules/messages/messages.repository.js";
import * as messagesService from "../../modules/messages/messages.service.js";

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.APP_URL, credentials: true },
  });

  io.use(wsAuth);

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;
    const connectionId = randomUUID();
    socket.data.connectionId = connectionId;

    await presenceRepository.registerConnection(connectionId, userId);
    const user = await messagesRepository.getUserProfile(userId);
    io.emit("presence:online", { userId });

    const conversationIds =
      await messagesRepository.listConversationIdsForUser(userId);

    for (const id of conversationIds) {
      socket.join(`conversation:${id}`);
    }

    //refresh connection
    socket.on("heartbeat", async () => {
      await presenceRepository.refreshConnection(connectionId);
    });

    socket.on("conversation:join", async (payload, ack) => {
      const conversationId = payload?.conversationId as string | undefined;
      if (!conversationId || !(await messagesRepository.isConversationMember(conversationId, userId))) {
        ack?.({ status: "error", message: "conversation not found" });
        return;
      }
      socket.join(`conversation:${conversationId}`);
      ack?.({ status: "ok" });
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const message = await messagesService.sendMessage(
          payload.conversationId,
          userId,
          { content: payload.content, replyToId: payload.replyToId },
        );
        io.to(`conversation:${payload.conversationId}`).emit(
          "message:new",
          message,
        );
        ack?.({ status: "ok", message });
      } catch (err: any) {
        ack?.({ status: "error", message: err.message ?? "failed to send" });
      }
    });

    socket.on("typing:start", (payload) => {
      if (!payload?.conversationId || !user) return;
      socket
        .to(`conversation:${payload.conversationId}`)
        .emit("typing:update", {
          userId,
          conversationId: payload.conversationId,
          user: { displayName: user.display_name, avatarUrl: user.avatar_url },
          isTyping: true,
        });
    });

    socket.on("typing:stop", (payload) => {
      if (!payload?.conversationId || !user) return;
      socket.to(`conversation:${payload.conversationId}`).emit("typing:update", {
        userId,
        conversationId: payload.conversationId,
        user: { displayName: user.display_name, avatarUrl: user.avatar_url },
        isTyping: false,
      });
    });

    socket.on("disconnect", async () => {
      const wasLastConnection = await presenceRepository.removeConnection(
        connectionId,
        userId,
      );
      if (wasLastConnection) {
        io.emit("presence:offline", { userId });
      }
    });
  });

  return io;
};
