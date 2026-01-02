import { z } from "zod";

// Notification types
export const NotificationTypeEnum = z.enum(["discord", "telegram"]);

export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const TelegramNotificationConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
  template: z.string().default("default"),
  customMessage: z.string().optional(),
  parseMode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
  disableWebPreview: z.boolean().default(true),
});

export type TelegramNotificationConfig = z.infer<typeof TelegramNotificationConfigSchema>;

// Discord Notification Config
export const DiscordNotificationConfigSchema = z.object({
  webhookUrl: z.string().url(),
  template: z.string().default("default"),
  customMessage: z.string().optional(),
  embedColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#5865F2"), // Hex color
  includeTransactionLink: z.boolean().default(true),
  includeTriggerData: z.boolean().default(true),
});

export type DiscordNotificationConfig = z.infer<typeof DiscordNotificationConfigSchema>;

// Notification schema
export const NotificationSchema = z.object({
  type: NotificationTypeEnum,
  webhookUrl: z.string().url(),
  template: z.string(),
  customMessage: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Discord template types
export const DiscordTemplateEnum = z.enum(["default", "success", "error", "minimal", "detailed"]);

export type DiscordTemplate = z.infer<typeof DiscordTemplateEnum>;

// Discord webhook payload
export const DiscordWebhookPayloadSchema = z.object({
  content: z.string().optional(),
  embeds: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        color: z.number().optional(),
        fields: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
              inline: z.boolean().optional(),
            })
          )
          .optional(),
        footer: z
          .object({
            text: z.string(),
          })
          .optional(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

export type DiscordWebhookPayload = z.infer<typeof DiscordWebhookPayloadSchema>;
