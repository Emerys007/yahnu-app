import type { Role, UserStatus } from '@/lib/auth-types';

export type MessageParticipant = {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
};

export type ConversationSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  ticketId: string | null;
  participants: MessageParticipant[];
};

export type ConversationDetail = ConversationSummary & {
  messages: ConversationMessage[];
  hasMoreMessages: boolean;
};

export type MessageRecipient = {
  id: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
};
