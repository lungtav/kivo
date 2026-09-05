import { db } from "../../config/database.js";

export const createCallLog = async (
  conversationId: string,
  callerId: string,
  calleeId: string,
) => {
  const result = await db.query(
    `INSERT INTO call_logs (conversation_id, caller_id, callee_id)
     VALUES ($1, $2, $3)
     RETURNING id, conversation_id, caller_id, callee_id, status, created_at`,
    [conversationId, callerId, calleeId],
  );
  return result.rows[0];
};

export const markAnswered = async (conversationId: string) => {
  const result = await db.query(
    `UPDATE call_logs SET status = 'answered', started_at = NOW()
     WHERE id = (
       SELECT id FROM call_logs
       WHERE conversation_id = $1 AND status = 'ringing'
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING id`,
    [conversationId],
  );
  return result.rows[0] ?? null;
};

export const markDeclined = async (conversationId: string) => {
  const result = await db.query(
    `UPDATE call_logs SET status = 'declined', ended_at = NOW()
     WHERE id = (
       SELECT id FROM call_logs
       WHERE conversation_id = $1 AND status = 'ringing'
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING id, conversation_id, caller_id, callee_id, status, ended_at, created_at`,
    [conversationId],
  );
  return result.rows[0] ?? null;
};

// who hung up decides the final status: caller during ring = cancelled,
// callee during ring = no answer, after answer = a call with a duration
export const endActiveCall = async (conversationId: string, endedByUserId: string) => {
  const result = await db.query(
    `UPDATE call_logs SET
       status = CASE
         WHEN status = 'answered' THEN 'answered'
         WHEN caller_id = $2 THEN 'cancelled'
         ELSE 'no_answer'
       END,
       ended_at = NOW()
     WHERE id = (
       SELECT id FROM call_logs
       WHERE conversation_id = $1 AND status IN ('ringing', 'answered')
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING id, conversation_id, caller_id, callee_id, status, started_at, ended_at, created_at`,
    [conversationId, endedByUserId],
  );
  return result.rows[0] ?? null;
};

export const listForConversation = async (conversationId: string, limit = 20) => {
  const result = await db.query(
    `SELECT cl.id, cl.conversation_id, cl.caller_id, cl.callee_id, cl.status, cl.started_at, cl.ended_at, cl.created_at,
            u.display_name AS caller_display_name, u.username AS caller_username
     FROM call_logs cl
     JOIN users u ON u.id = cl.caller_id
     WHERE cl.conversation_id = $1
     ORDER BY cl.created_at DESC
     LIMIT $2`,
    [conversationId, limit],
  );
  return result.rows;
};
