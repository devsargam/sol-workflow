"use client";

import {
  BanknoteIcon,
  BellIcon,
  CircleDollarSignIcon,
  CircleOffIcon,
  CodeIcon,
  FileTextIcon,
  ImageIcon,
  MailIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  RocketIcon,
  SearchIcon,
  SendIcon,
  ZapIcon,
} from "lucide-react";
import { type ComponentType, type ReactElement } from "react";

export type NotificationType = "discord" | "telegram" | "slack" | "email" | "webhook";
export type ActionType = "send_sol" | "send_spl_token" | "call_program" | "do_nothing";
export type TriggerType =
  | "balance_change"
  | "token_receipt"
  | "nft_receipt"
  | "transaction_status"
  | "program_log";

export const NOTIFICATION_ICONS: Record<NotificationType, ComponentType<{ className?: string }>> = {
  discord: MessageCircleIcon,
  telegram: SendIcon,
  slack: MessageCircleIcon,
  email: MailIcon,
  webhook: BellIcon,
};

export const ACTION_ICONS: Record<ActionType, ComponentType<{ className?: string }>> = {
  send_sol: BanknoteIcon,
  send_spl_token: CircleDollarSignIcon,
  call_program: CodeIcon,
  do_nothing: CircleOffIcon,
};

export const TRIGGER_ICONS: Record<TriggerType, ComponentType<{ className?: string }>> = {
  balance_change: CircleDollarSignIcon,
  token_receipt: BanknoteIcon,
  nft_receipt: ImageIcon,
  transaction_status: FileTextIcon,
  program_log: CodeIcon,
};

export const DEFAULT_ICONS = {
  notify: MegaphoneIcon,
  action: RocketIcon,
  trigger: ZapIcon,
  filter: SearchIcon,
} as const;

export function getNotificationIcon(type: string | undefined, className = "w-6 h-6"): ReactElement {
  const IconComponent =
    (type && NOTIFICATION_ICONS[type as NotificationType]) || DEFAULT_ICONS.notify;
  return <IconComponent className={className} />;
}

export function getActionIcon(type: string | undefined, className = "w-6 h-6"): ReactElement {
  const IconComponent = (type && ACTION_ICONS[type as ActionType]) || DEFAULT_ICONS.action;
  return <IconComponent className={className} />;
}

export function getTriggerIcon(type: string | undefined, className = "w-6 h-6"): ReactElement {
  const IconComponent = (type && TRIGGER_ICONS[type as TriggerType]) || DEFAULT_ICONS.trigger;
  return <IconComponent className={className} />;
}

export function getFilterIcon(className = "w-6 h-6"): ReactElement {
  const IconComponent = DEFAULT_ICONS.filter;
  return <IconComponent className={className} />;
}
