/**
 * Manageo SSE (Server-Sent Events) Service
 * 
 * Manages active SSE connections for real-time notification push to clients.
 * Replaces high-frequency client polling with event-driven updates.
 */

// Global registry of SSE clients keyed by userId (string)
// Using globalThis ensures persistence across HMR during Next.js development
const globalSSE = globalThis as unknown as {
  sseClients?: Map<string, Set<ReadableStreamDefaultController>>;
};

if (!globalSSE.sseClients) {
  globalSSE.sseClients = new Map<string, Set<ReadableStreamDefaultController>>();
}

const clients = globalSSE.sseClients;

/**
 * Register an active SSE stream controller for a user.
 * Returns an unregister cleanup function.
 */
export function registerSSEClient(
  userId: string,
  controller: ReadableStreamDefaultController
): () => void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  const userControllers = clients.get(userId)!;
  userControllers.add(controller);

  console.log(`[SSE] User ${userId} connected. Total active tabs for user: ${userControllers.size}`);

  // Send initial connection event
  try {
    const encoder = new TextEncoder();
    controller.enqueue(
      encoder.encode(`event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: Date.now() })}\n\n`)
    );
  } catch (err) {
    console.error(`[SSE] Error sending welcome to user ${userId}:`, err);
  }

  return () => {
    userControllers.delete(controller);
    if (userControllers.size === 0) {
      clients.delete(userId);
    }
    console.log(`[SSE] User ${userId} disconnected. Remaining active tabs: ${userControllers.size}`);
  };
}

export interface SSEEventPayload {
  type: string;
  notificationId?: string;
  all?: boolean;
  id?: string;
  read?: boolean;
  entityType?: string;
  entityId?: string;
  data?: any;
  [key: string]: any;
}

/**
 * Send a real-time SSE notification event to all active connections of a specific user.
 */
export function notifyUserViaSSE(userId: string, event: SSEEventPayload) {
  const userControllers = clients.get(userId.toString());
  if (!userControllers || userControllers.size === 0) {
    return;
  }

  const payload = `event: notification\ndata: ${JSON.stringify({
    ...event,
    timestamp: Date.now(),
  })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(payload);

  const staleControllers: ReadableStreamDefaultController[] = [];

  for (const controller of userControllers) {
    try {
      controller.enqueue(bytes);
    } catch (err) {
      console.warn(`[SSE] Stale connection for user ${userId}, marking for removal:`, err);
      staleControllers.push(controller);
    }
  }

  for (const stale of staleControllers) {
    userControllers.delete(stale);
  }
  if (userControllers.size === 0) {
    clients.delete(userId.toString());
  }
}

/**
 * Send heartbeat ping to keep connections alive through proxies and browsers.
 */
export function pingSSEUser(userId: string) {
  const userControllers = clients.get(userId.toString());
  if (!userControllers) return;

  const ping = `event: ping\ndata: {}\n\n`;
  const bytes = new TextEncoder().encode(ping);

  for (const controller of userControllers) {
    try {
      controller.enqueue(bytes);
    } catch {
      // Ignored, handled on next notification or abort
    }
  }
}
