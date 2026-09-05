import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../../config/env.js";
import { wsAuth } from "./ws-auth.middleware.js";
import { randomUUID } from "crypto";
import * as presenceRepository from "./presence.repository.js";
import * as messagesRepository from "../../modules/messages/messages.repository.js";
import * as conversationsRepository from "../../modules/conversations/conversations.repository.js";
import * as callLogsRepository from "../../modules/calls/call-logs.repository.js";
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

    // personal room so call signaling can reach every device of a user
    socket.join(`user:${userId}`);

    const conversationIds =
      await messagesRepository.listConversationIdsForUser(userId);
    socket.data.conversationIds = conversationIds;

    for (const id of conversationIds) {
      socket.join(`conversation:${id}`);
      // presence scoped to conversations the user shares, not a global broadcast
      socket.to(`conversation:${id}`).emit("presence:online", { userId });
    }

    // ── call signaling: relay WebRTC offers/answers/ICE between two DM partners ──
    const relayTo = (targetUserId: string, event: string, payload: Record<string, unknown>) => {
      io.to(`user:${targetUserId}`).emit(event, payload);
    };
    const canCall = async (targetUserId: string) =>
      targetUserId !== userId &&
      !!(await conversationsRepository.findDirectConversation(userId, targetUserId));

    socket.on("call:ring", async (payload: { toUserId?: string; video?: boolean }) => {
      const to = payload?.toUserId;
      if (!to || !(await canCall(to))) return;
      const dm = await conversationsRepository.findDirectConversation(userId, to);
      if (!dm) return;
      await callLogsRepository.createCallLog(dm.id, userId, to);
      const caller = await messagesRepository.getUserProfile(userId);
      relayTo(to, "call:incoming", { fromUserId: userId, from: caller, video: !!payload.video });
    });
    socket.on("call:accept", async (payload: { toUserId?: string }) => {
      const to = payload?.toUserId;
      if (!to) return;
      const dm = await conversationsRepository.findDirectConversation(userId, to);
      if (dm) await callLogsRepository.markAnswered(dm.id);
      relayTo(to, "call:accepted", {});
    });
    socket.on("call:decline", async (payload: { toUserId?: string }) => {
      const to = payload?.toUserId;
      if (!to) return;
      const dm = await conversationsRepository.findDirectConversation(userId, to);
      if (dm) {
        const log = await callLogsRepository.markDeclined(dm.id);
        if (log) io.to(`conversation:${dm.id}`).emit("call:log", { log });
      }
      relayTo(to, "call:declined", {});
    });
    socket.on("call:offer", (payload: { toUserId?: string; sdp?: unknown }) => {
      if (payload?.toUserId && payload.sdp) relayTo(payload.toUserId, "call:offer", { sdp: payload.sdp });
    });
    socket.on("call:answer", (payload: { toUserId?: string; sdp?: unknown }) => {
      if (payload?.toUserId && payload.sdp) relayTo(payload.toUserId, "call:answer", { sdp: payload.sdp });
    });
    socket.on("call:ice", (payload: { toUserId?: string; candidate?: unknown }) => {
      if (payload?.toUserId && payload.candidate) relayTo(payload.toUserId, "call:ice", { candidate: payload.candidate });
    });
    socket.on("call:end", async (payload: { toUserId?: string }) => {
      const to = payload?.toUserId;
      if (!to) return;
      const dm = await conversationsRepository.findDirectConversation(userId, to);
      if (!dm) return;
      const log = await callLogsRepository.endActiveCall(dm.id, userId);
      if (log) io.to(`conversation:${dm.id}`).emit("call:log", { log });
      relayTo(to, "call:ended", {});
    });

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

    socket.on("conversation:leave", (payload) => {
      const conversationId = payload?.conversationId as string | undefined;
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const message = await messagesService.sendMessage(
          payload.conversationId,
          userId,
          { content: payload.content, replyToId: payload.replyToId },
        );
        ack?.({ status: "ok", message });
      } catch (err: any) {
        ack?.({ status: "error", message: err.message ?? "failed to send" });
      }
    });

    const emitTyping = async (
      payload: { conversationId?: string },
      isTyping: boolean,
    ) => {
      if (!payload?.conversationId || !user) return;
      if (
        !(await messagesRepository.isConversationMember(
          payload.conversationId,
          userId,
        ))
      ) {
        return;
      }
      socket
        .to(`conversation:${payload.conversationId}`)
        .emit("typing:update", {
          userId,
          conversationId: payload.conversationId,
          user: { displayName: user.display_name, avatarUrl: user.avatar_url },
          isTyping,
        });
    };

    socket.on("typing:start", (payload) => void emitTyping(payload, true));

    socket.on("typing:stop", (payload) => void emitTyping(payload, false));

    socket.on("disconnect", async () => {
      const wasLastConnection = await presenceRepository.removeConnection(
        connectionId,
        userId,
      );
      if (wasLastConnection) {
        for (const id of (socket.data.conversationIds as string[]) ?? []) {
          socket.to(`conversation:${id}`).emit("presence:offline", { userId });
        }
      }
    });
  });

  return io;
};
