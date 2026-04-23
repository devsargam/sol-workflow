import { zValidator } from "@hono/zod-validator";
import { createTelegramClient } from "@repo/telegram";
import { Context, Hono } from "hono";
import { z } from "zod";
import { log } from "utils";
import { verifyAuthToken } from "../lib/auth";

const telegram = new Hono();

const sendTelegramSchema = z.object({
  message: z.string().trim().min(1).max(4096),
  chatId: z.union([z.string().trim().min(1), z.number().int()]).optional(),
  parseMode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
  disableWebPagePreview: z.boolean().optional(),
});

async function isAuthorizedRequest(c: Context) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  const payload = await verifyAuthToken(token).catch(() => null);

  return Boolean(payload);
}

telegram.post("/send", zValidator("json", sendTelegramSchema), async (c) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!botToken) {
    return c.json({ error: "Telegram is not configured on the server" }, 500);
  }

  const authorized = await isAuthorizedRequest(c);
  if (!authorized) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { message, chatId, parseMode, disableWebPagePreview } = c.req.valid("json");
  const targetChatId = chatId ?? process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim();

  if (!targetChatId) {
    return c.json({ error: "Telegram chat ID is required" }, 400);
  }

  try {
    const telegramClient = createTelegramClient(botToken);

    await telegramClient.sendMessage({
      chat_id: targetChatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview,
    });

    return c.json({ ok: true });
  } catch (error) {
    log.error("Failed to send Telegram message", error as Error, { service: "api" });
    return c.json({ error: "Failed to send Telegram message" }, 500);
  }
});

export default telegram;
