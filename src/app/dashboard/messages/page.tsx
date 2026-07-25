"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, Paperclip, Search, Send } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  MessageRecipient,
} from '@/lib/messages';
import { cn } from '@/lib/utils';

const LIST_POLL_MS = 8_000;
const MESSAGE_POLL_MS = 5_000;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'Y';
}

function relativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1_000));
  if (seconds < 60) return 'Maintenant';
  if (seconds < 3_600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)} h`;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
}

type BroadcastDialogProps = {
  recipients: MessageRecipient[];
  recipientsLoading: boolean;
  onSent: () => Promise<void>;
};

function BroadcastDialog({ recipients, recipientsLoading, onSent }: BroadcastDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const recipientOptions = useMemo<MultiSelectOption[]>(() => [
    { value: 'group-all', label: 'Tous les diplômés' },
    { value: 'group-pending', label: 'Diplômés en attente' },
    { value: 'group-active', label: 'Diplômés actifs' },
    ...recipients.map((recipient) => ({
      value: recipient.id,
      label: `${recipient.name}${recipient.status === 'pending' ? ' (en attente)' : ''}`,
    })),
  ], [recipients]);

  const expandedRecipientIds = useMemo(() => {
    const ids = new Set(selected.filter((value) => !value.startsWith('group-')));
    if (selected.includes('group-all')) {
      recipients.forEach((recipient) => ids.add(recipient.id));
    }
    if (selected.includes('group-pending')) {
      recipients.filter((recipient) => recipient.status === 'pending').forEach((recipient) => ids.add(recipient.id));
    }
    if (selected.includes('group-active')) {
      recipients.filter((recipient) => recipient.status === 'active').forEach((recipient) => ids.add(recipient.id));
    }
    return [...ids];
  }, [recipients, selected]);

  const sendBroadcast = async () => {
    if (expandedRecipientIds.length === 0 || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const response = await apiFetch<{ data: { sent: number } }>('/api/conversations/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          recipientIds: expandedRecipientIds,
          subject,
          body,
        }),
      });
      toast({
        title: 'Diffusion envoyée',
        description: `${response.data.sent} message${response.data.sent > 1 ? 's ont' : ' a'} été envoyé${response.data.sent > 1 ? 's' : ''}.`,
      });
      setOpen(false);
      setSelected([]);
      setSubject('');
      setBody('');
      await onSent();
    } catch (error) {
      toast({
        title: 'Envoi impossible',
        description: error instanceof Error ? error.message : 'La diffusion n’a pas pu être envoyée.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Send className="mr-2 h-4 w-4" />
          Diffuser un message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envoyer un message de diffusion</DialogTitle>
          <DialogDescription>
            Chaque diplômé recevra une conversation individuelle. Les autres destinataires ne seront jamais visibles.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Destinataires</Label>
            <MultiSelect
              options={recipientOptions}
              selected={selected}
              onChange={setSelected}
              placeholder={recipientsLoading ? 'Chargement des diplômés…' : 'Sélectionnez des destinataires…'}
              searchPlaceholder="Rechercher un diplômé ou un groupe…"
              emptyPlaceholder="Aucun diplômé trouvé."
            />
            {expandedRecipientIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {expandedRecipientIds.length} destinataire{expandedRecipientIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">Sujet</Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
              placeholder="Ex. Prochain salon de l’emploi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Message</Label>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={10_000}
              rows={8}
              placeholder="Rédigez votre message…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={sendBroadcast}
            disabled={sending || expandedRecipientIds.length === 0 || subject.trim().length < 3 || !body.trim()}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer la diffusion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DirectMessageDialogProps = {
  recipientId: string | null;
  recipientName: string;
  onClose: () => void;
  onCreated: (conversationId: string) => Promise<void>;
};

function DirectMessageDialog({ recipientId, recipientName, onClose, onCreated }: DirectMessageDialogProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBody('');
    setError('');
  }, [recipientId]);

  const createConversation = async () => {
    if (!recipientId || !body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await apiFetch<{ data: { conversation: { id: string } } }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientIds: [recipientId], initialMessage: body.trim() }),
      });
      await onCreated(response.data.conversation.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Impossible de créer la conversation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={Boolean(recipientId)} onOpenChange={(open) => { if (!open && !sending) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>Démarrez une conversation privée avec {recipientName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="direct-message">Message</Label>
          <Textarea
            id="direct-message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={10_000}
            rows={7}
            placeholder="Écrivez votre message…"
            disabled={sending}
          />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>Annuler</Button>
          <Button type="button" onClick={() => void createConversation()} disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type MessageViewProps = {
  conversation: ConversationDetail;
  currentUserId: string;
  currentUserName: string;
  isMobile: boolean;
  sending: boolean;
  loadingOlder: boolean;
  onBack: () => void;
  onLoadOlder: () => Promise<void>;
  onSend: (body: string) => Promise<boolean>;
};

function MessageView({
  conversation,
  currentUserId,
  currentUserName,
  isMobile,
  sending,
  loadingOlder,
  onBack,
  onLoadOlder,
  onSend,
}: MessageViewProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef<{ conversationId: string; latestMessageId: string | null } | null>(null);

  useEffect(() => {
    const latestMessageId = conversation.messages.at(-1)?.id ?? null;
    const shouldScroll = scrollState.current?.conversationId !== conversation.id
      || scrollState.current?.latestMessageId !== latestMessageId;
    scrollState.current = { conversationId: conversation.id, latestMessageId };
    if (!shouldScroll) return;
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
  }, [conversation.id, conversation.messages]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!body || sending) return;
    if (await onSend(body)) setMessage('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b p-4">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour aux conversations">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar>
          <AvatarImage src={conversation.avatarUrl || undefined} alt={conversation.name} />
          <AvatarFallback>{initials(conversation.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{conversation.name}</h2>
          {conversation.ticketId && <p className="text-xs text-muted-foreground">Conversation de support</p>}
        </div>
      </div>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-4 p-4 md:p-6">
          {conversation.hasMoreMessages && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => void onLoadOlder()} disabled={loadingOlder}>
                {loadingOlder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger les messages précédents
              </Button>
            </div>
          )}
          {conversation.messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun message dans cette conversation.</p>
          )}
          {conversation.messages.map((item) => {
            const mine = item.senderId === currentUserId;
            return (
              <div key={item.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                {!mine && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversation.avatarUrl || undefined} alt="" />
                    <AvatarFallback>{initials(item.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-[82%] whitespace-pre-wrap break-words rounded-xl p-3 text-sm md:max-w-md lg:max-w-lg',
                  mine
                    ? 'rounded-br-none bg-primary text-primary-foreground'
                    : 'rounded-bl-none bg-muted',
                )}>
                  <p>{item.body}</p>
                  {item.attachmentUrl && (
                    <a
                      href={item.attachmentUrl}
                      className="mt-2 inline-flex items-center gap-1 rounded-md border border-current/20 px-2 py-1 text-xs font-medium underline-offset-2 hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {item.attachmentName || 'Télécharger la pièce jointe'}
                    </a>
                  )}
                  <p className="mt-1 text-right text-xs opacity-70">
                    {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}
                  </p>
                </div>
                {mine && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(currentUserName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t bg-background p-4">
        <form className="flex items-center gap-2" onSubmit={submit}>
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={10_000}
            placeholder="Écrivez un message…"
            aria-label="Message"
          />
          <Button type="submit" size="icon" disabled={sending || !message.trim()} aria-label="Envoyer le message">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessagesContent() {
  const { user, role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const handledRoute = useRef<string | null>(null);
  const directRecipientId = searchParams?.get('recipientId')?.slice(0, 200) || null;
  const directRecipientName = searchParams?.get('recipientName')?.slice(0, 160) || 'cet utilisateur';

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const refreshConversations = useCallback(async (showLoader = false) => {
    if (!user) return;
    if (showLoader) setLoading(true);
    try {
      const response = await apiFetch<{ data: { conversations: ConversationSummary[]; hasMore: boolean } }>('/api/conversations?limit=100&offset=0');
      setConversations((current) => {
        if (showLoader) return response.data.conversations;
        const latestIds = new Set(response.data.conversations.map((conversation) => conversation.id));
        return [
          ...response.data.conversations,
          ...current.filter((conversation) => !latestIds.has(conversation.id)),
        ];
      });
      setHasMoreConversations((current) => showLoader ? response.data.hasMore : (current || response.data.hasMore));
      setSelectedId((current) => current || (!isMobile ? response.data.conversations[0]?.id || null : null));
    } catch (error) {
      if (showLoader) {
        toast({
          title: 'Messagerie indisponible',
          description: error instanceof Error ? error.message : 'Impossible de charger les conversations.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [isMobile, toast, user]);

  const loadMoreConversations = async () => {
    if (loadingMoreConversations || !hasMoreConversations) return;
    setLoadingMoreConversations(true);
    try {
      const response = await apiFetch<{ data: { conversations: ConversationSummary[]; hasMore: boolean } }>(
        `/api/conversations?limit=100&offset=${conversations.length}`,
      );
      setConversations((current) => {
        const existingIds = new Set(current.map((conversation) => conversation.id));
        return [...current, ...response.data.conversations.filter((conversation) => !existingIds.has(conversation.id))];
      });
      setHasMoreConversations(response.data.hasMore);
    } catch (error) {
      toast({
        title: 'Historique indisponible',
        description: error instanceof Error ? error.message : 'Impossible de charger les conversations précédentes.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMoreConversations(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refreshConversations(true);
    const timer = window.setInterval(() => void refreshConversations(false), LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshConversations, user]);

  useEffect(() => {
    if (role !== 'school' || !user) {
      setRecipients([]);
      return;
    }
    let cancelled = false;
    setRecipientsLoading(true);
    apiFetch<{ data: { recipients: MessageRecipient[] } }>('/api/conversations/recipients?scope=school-graduates&limit=250')
      .then((response) => {
        if (!cancelled) setRecipients(response.data.recipients);
      })
      .catch((error) => {
        if (!cancelled) console.error('Unable to load broadcast recipients.', error);
      })
      .finally(() => {
        if (!cancelled) setRecipientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, user]);

  useEffect(() => {
    if (!user) return;
    const ticketId = searchParams?.get('ticketId');
    const conversationId = searchParams?.get('convoId');
    const routeKey = `${ticketId || ''}:${conversationId || ''}`;
    if (!ticketId && !conversationId) {
      handledRoute.current = null;
      return;
    }
    if (handledRoute.current === routeKey) return;
    handledRoute.current = routeKey;

    const openRouteConversation = async () => {
      try {
        let id = conversationId;
        if (ticketId) {
          const response = await apiFetch<{ data: { conversation: { id: string } } }>(
            `/api/tickets/${encodeURIComponent(ticketId)}/conversation`,
            { method: 'POST', body: JSON.stringify({}) },
          );
          id = response.data.conversation.id;
        }
        if (id) setSelectedId(id);
        router.replace('/dashboard/messages', { scroll: false });
        await refreshConversations(false);
      } catch (error) {
        toast({
          title: 'Conversation inaccessible',
          description: error instanceof Error ? error.message : 'Cette conversation ne peut pas être ouverte.',
          variant: 'destructive',
        });
        router.replace('/dashboard/messages', { scroll: false });
      }
    };
    void openRouteConversation();
  }, [refreshConversations, router, searchParams, toast, user]);

  const loadSelectedConversation = useCallback(async (markRead = false, showLoader = false) => {
    if (!selectedId || !user) return;
    if (showLoader) setConversationLoading(true);
    try {
      const response = await apiFetch<{ data: { conversation: ConversationDetail } }>(
        `/api/conversations/${encodeURIComponent(selectedId)}?messageLimit=500`,
      );
      setSelectedConversation((current) => {
        const incoming = response.data.conversation;
        if (!current || current.id !== incoming.id) return incoming;
        const messages = new Map(current.messages.map((message) => [message.id, message]));
        incoming.messages.forEach((message) => messages.set(message.id, message));
        return {
          ...incoming,
          messages: [...messages.values()].sort((left, right) => (
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
            || left.id.localeCompare(right.id)
          )),
          hasMoreMessages: current.messages.length > incoming.messages.length
            ? current.hasMoreMessages
            : incoming.hasMoreMessages,
        };
      });
      if (markRead && response.data.conversation.unreadCount > 0) {
        await apiFetch(`/api/conversations/${encodeURIComponent(selectedId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ read: true }),
        });
        setConversations((current) => current.map((conversation) => (
          conversation.id === selectedId ? { ...conversation, unreadCount: 0 } : conversation
        )));
      }
    } catch (error) {
      if (showLoader) {
        toast({
          title: 'Conversation indisponible',
          description: error instanceof Error ? error.message : 'Impossible de charger les messages.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoader) setConversationLoading(false);
    }
  }, [selectedId, toast, user]);

  const loadOlderMessages = async () => {
    if (!selectedId || !selectedConversation?.hasMoreMessages || loadingOlderMessages) return;
    setLoadingOlderMessages(true);
    try {
      const response = await apiFetch<{ data: { conversation: ConversationDetail } }>(
        `/api/conversations/${encodeURIComponent(selectedId)}?messageLimit=500&messageOffset=${selectedConversation.messages.length}`,
      );
      setSelectedConversation((current) => {
        if (!current || current.id !== selectedId) return current;
        const messages = new Map(response.data.conversation.messages.map((message) => [message.id, message]));
        current.messages.forEach((message) => messages.set(message.id, message));
        return {
          ...current,
          messages: [...messages.values()].sort((left, right) => (
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
            || left.id.localeCompare(right.id)
          )),
          hasMoreMessages: response.data.conversation.hasMoreMessages,
        };
      });
    } catch (error) {
      toast({
        title: 'Historique indisponible',
        description: error instanceof Error ? error.message : 'Impossible de charger les messages précédents.',
        variant: 'destructive',
      });
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedId) {
      setSelectedConversation(null);
      return;
    }
    setSelectedConversation((current) => current?.id === selectedId ? current : null);
    void loadSelectedConversation(document.visibilityState === 'visible', true);
    const timer = window.setInterval(() => {
      void loadSelectedConversation(document.visibilityState === 'visible', false);
    }, MESSAGE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadSelectedConversation, selectedId]);

  const sendMessage = async (body: string) => {
    if (!selectedId) return false;
    setSending(true);
    try {
      const response = await apiFetch<{ data: { message: ConversationMessage } }>(
        `/api/conversations/${encodeURIComponent(selectedId)}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      );
      setSelectedConversation((current) => current && current.id === selectedId
        ? { ...current, messages: [...current.messages, response.data.message], lastMessage: body, lastMessageAt: response.data.message.createdAt }
        : current);
      await refreshConversations(false);
      return true;
    } catch (error) {
      toast({
        title: 'Message non envoyé',
        description: error instanceof Error ? error.message : 'Réessayez dans quelques instants.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr-FR');
    if (!needle) return conversations;
    return conversations.filter((conversation) => (
      conversation.name.toLocaleLowerCase('fr-FR').includes(needle)
      || conversation.lastMessage.toLocaleLowerCase('fr-FR').includes(needle)
    ));
  }, [conversations, search]);

  const conversationList = (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="shrink-0 border-b p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher dans la messagerie"
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {search ? 'Aucune conversation ne correspond à votre recherche.' : 'Aucune conversation pour le moment.'}
          </div>
        ) : (
          <>
          {visibleConversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            className={cn(
              'flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent',
              selectedId === conversation.id && 'bg-accent',
            )}
            onClick={() => setSelectedId(conversation.id)}
          >
            <Avatar>
              <AvatarImage src={conversation.avatarUrl || undefined} alt={conversation.name} />
              <AvatarFallback>{initials(conversation.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate', conversation.unreadCount > 0 ? 'font-bold' : 'font-semibold')}>
                {conversation.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">{conversation.lastMessage}</p>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <p>{relativeTime(conversation.lastMessageAt)}</p>
              {conversation.unreadCount > 0 && (
                <span className="mt-1 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                  {Math.min(conversation.unreadCount, 99)}
                </span>
              )}
            </div>
          </button>
          ))}
          {!search && hasMoreConversations && (
            <div className="flex justify-center border-t p-4">
              <Button type="button" variant="outline" size="sm" onClick={() => void loadMoreConversations()} disabled={loadingMoreConversations}>
                {loadingMoreConversations && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger les conversations précédentes
              </Button>
            </div>
          )}
          </>
        )}
      </ScrollArea>
    </div>
  );

  const messagePane = conversationLoading && !selectedConversation ? (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ) : selectedConversation && user ? (
    <MessageView
      conversation={selectedConversation}
      currentUserId={user.uid}
      currentUserName={user.name || 'Yahnu'}
      isMobile={isMobile}
      sending={sending}
      loadingOlder={loadingOlderMessages}
      onBack={() => setSelectedId(null)}
      onLoadOlder={loadOlderMessages}
      onSend={sendMessage}
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="h-16 w-16 text-muted-foreground/40" />
      <p className="mt-4 text-muted-foreground">Sélectionnez une conversation pour commencer.</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[32rem] flex-col">
      <DirectMessageDialog
        recipientId={directRecipientId}
        recipientName={directRecipientName}
        onClose={() => router.replace('/dashboard/messages', { scroll: false })}
        onCreated={async (conversationId) => {
          setSelectedId(conversationId);
          router.replace('/dashboard/messages', { scroll: false });
          await refreshConversations(false);
        }}
      />
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messagerie</h1>
            <p className="mt-1 text-muted-foreground">Échangez avec les entreprises, les écoles et les candidats.</p>
          </div>
        </div>
        {role === 'school' && (
          <BroadcastDialog
            recipients={recipients}
            recipientsLoading={recipientsLoading}
            onSent={() => refreshConversations(false)}
          />
        )}
      </div>

      <Card className="flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 md:grid-cols-[320px_1fr]">
          {isMobile ? (selectedId ? messagePane : conversationList) : (
            <>
              {conversationList}
              {messagePane}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
