"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";

type UserAccount = {
  id: string;
  name: string;
  email: string;
  type: "graduate" | "company" | "school" | "admin";
  status: "active" | "pending" | "suspended" | string;
  slug?: string;
  schoolName?: string;
  industry?: string;
  joinDate: string;
};

type UsersResponse = { data: { users: UserAccount[]; hasMore: boolean } };

const ROLE_LABELS: Record<UserAccount["type"], string> = {
  graduate: "Diplômé·e",
  company: "Entreprise",
  school: "Établissement",
  admin: "Administration",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
};

function formatJoinDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "long",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function AccountTypeIcon({ type, className = "h-4 w-4" }: { type: UserAccount["type"]; className?: string }) {
  const Icon = type === "graduate"
    ? UserCheck
    : type === "company"
      ? Building2
      : type === "school"
        ? GraduationCap
        : type === "admin"
          ? ShieldCheck
          : User;
  return <Icon className={className} />;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "active") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "suspended") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock3 className="h-4 w-4 text-terra" />;
}

function UserProfileDialog({ user }: { user: UserAccount }) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Fiche du compte</DialogTitle>
        <DialogDescription>Informations utiles avant de répondre ou d’ouvrir une conversation.</DialogDescription>
      </DialogHeader>
      <div className="space-y-5 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16 border border-primary/20 bg-primary/10">
            <AvatarFallback className="font-display text-lg text-primary">{user.name?.charAt(0).toUpperCase() || "Y"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-semibold">{user.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Separator />
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Type de compte</dt>
            <dd className="flex items-center gap-2 font-medium"><AccountTypeIcon type={user.type} />{ROLE_LABELS[user.type]}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Statut</dt>
            <dd className="flex items-center gap-2 font-medium"><StatusIcon status={user.status} />{STATUS_LABELS[user.status] ?? "Statut à vérifier"}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Inscription</dt>
            <dd className="font-medium">{formatJoinDate(user.joinDate)}</dd>
          </div>
          {user.type === "graduate" && user.schoolName ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-muted-foreground">Établissement</dt>
              <dd className="font-medium">{user.schoolName}</dd>
            </div>
          ) : null}
          {user.type === "company" && user.industry ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-muted-foreground">Secteur d’activité</dt>
              <dd className="font-medium">{user.industry}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </DialogContent>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === "active") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "suspended") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (status === "pending") return "border-terra/40 bg-terra/10 text-cocoa";
  return "text-muted-foreground";
}

export default function UserLookupPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearchError, setHasSearchError] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<UserAccount | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const query = searchTerm.trim();
    setHasSearchError(false);
    if (query.length < 2) {
      setAllUsers([]);
      setHasMore(false);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch<UsersResponse>(`/api/support/users?q=${encodeURIComponent(query)}&limit=25&offset=0`, {
          signal: controller.signal,
        });
        setAllUsers(response.data.users);
        setHasMore(response.data.hasMore);
      } catch {
        if (!controller.signal.aborted) {
          setAllUsers([]);
          setHasMore(false);
          setHasSearchError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  const loadMoreUsers = async () => {
    const query = searchTerm.trim();
    if (query.length < 2 || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await apiFetch<UsersResponse>(
        `/api/support/users?q=${encodeURIComponent(query)}&limit=25&offset=${allUsers.length}`,
      );
      setAllUsers((current) => {
        const existing = new Set(current.map((user) => user.id));
        return [...current, ...response.data.users.filter((user) => !existing.has(user.id))];
      });
      setHasMore(response.data.hasMore);
    } catch {
      setHasSearchError(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = (user: UserAccount) => {
    setMessageRecipient(user);
    setMessageBody("");
    setMessageError("");
  };

  const createConversation = async () => {
    if (!messageRecipient || !messageBody.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    setMessageError("");
    try {
      const response = await apiFetch<{ data: { conversation: { id: string } } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({
          recipientIds: [messageRecipient.id],
          initialMessage: messageBody.trim(),
        }),
      });
      const conversationId = response.data.conversation.id;
      setMessageRecipient(null);
      router.push(`/dashboard/messages?convoId=${encodeURIComponent(conversationId)}`);
    } catch {
      setMessageError("La conversation n’a pas pu être créée. Réessayez dans un instant.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const queryIsReady = searchTerm.trim().length >= 2;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface ci-pattern overflow-hidden p-5 sm:p-7">
        <p className="section-kicker">Assistance personnalisée</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Retrouver un compte</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Recherchez une personne, une entreprise ou un établissement ivoirien avant de prendre contact.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recherche sécurisée</CardTitle>
          <CardDescription>Utilisez le nom ou l’adresse e-mail associée au compte Yahnu.</CardDescription>
        </CardHeader>
        <CardContent>
          <label htmlFor="support-user-search" className="sr-only">Nom ou adresse e-mail</label>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="support-user-search"
              type="search"
              placeholder="Ex. Aïcha Kouassi ou recrutement@entreprise.ci"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              autoComplete="off"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Saisissez au moins deux caractères. La recherche démarre automatiquement.</p>
        </CardContent>
      </Card>

      {hasSearchError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recherche momentanément indisponible</AlertTitle>
          <AlertDescription>Vérifiez votre connexion puis modifiez ou ressaisissez votre recherche.</AlertDescription>
        </Alert>
      ) : null}

      <Card aria-live="polite">
        <CardHeader>
          <CardTitle>Comptes trouvés</CardTitle>
          <CardDescription>{queryIsReady ? `${allUsers.length} résultat${allUsers.length > 1 ? "s" : ""} chargé${allUsers.length > 1 ? "s" : ""}` : "En attente d’une recherche"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
              <p>Recherche des comptes…</p>
            </div>
          ) : allUsers.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {allUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl border p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{user.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(user.status)}>{STATUS_LABELS[user.status] ?? "À vérifier"}</Badge>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><AccountTypeIcon type={user.type} />{ROLE_LABELS[user.type]}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">Voir la fiche</Button></DialogTrigger>
                        <UserProfileDialog user={user} />
                      </Dialog>
                      <Button size="sm" onClick={() => handleSendMessage(user)} disabled={user.status !== "active"}>
                        <Mail className="mr-2 h-4 w-4" />Écrire
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compte</TableHead>
                      <TableHead>Profil</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell><div className="font-medium">{user.name}</div><div className="text-sm text-muted-foreground">{user.email}</div></TableCell>
                        <TableCell><div className="flex items-center gap-2"><AccountTypeIcon type={user.type} /><span>{ROLE_LABELS[user.type]}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className={getStatusBadgeClass(user.status)}>{STATUS_LABELS[user.status] ?? "À vérifier"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="outline" size="sm">Voir la fiche</Button></DialogTrigger>
                              <UserProfileDialog user={user} />
                            </Dialog>
                            <Button size="sm" onClick={() => handleSendMessage(user)} disabled={user.status !== "active"} title={user.status === "active" ? "Écrire à ce compte" : "Le compte doit être actif pour recevoir un message"}>
                              <Mail className="mr-2 h-4 w-4" />Écrire
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <span className="rounded-full bg-muted p-3">{queryIsReady ? <BriefcaseBusiness className="h-6 w-6 text-muted-foreground" /> : <Search className="h-6 w-6 text-muted-foreground" />}</span>
              <div>
                <p className="font-display text-lg font-semibold">{queryIsReady ? "Aucun compte correspondant" : "Prêt à rechercher"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{queryIsReady ? "Vérifiez l’orthographe du nom ou de l’adresse e-mail." : "Les résultats apparaîtront ici."}</p>
              </div>
            </div>
          )}

          {hasMore && !isLoading ? (
            <div className="mt-5 flex justify-center border-t pt-5">
              <Button type="button" variant="outline" onClick={() => void loadMoreUsers()} disabled={isLoadingMore}>
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                Afficher plus de comptes
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(messageRecipient)}
        onOpenChange={(open) => {
          if (!open && !isSendingMessage) {
            setMessageRecipient(null);
            setMessageBody("");
            setMessageError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
            <DialogDescription>Démarrez une conversation privée avec {messageRecipient?.name ?? "ce compte"}.</DialogDescription>
          </DialogHeader>
          <label htmlFor="support-initial-message" className="text-sm font-medium">Votre réponse</label>
          <Textarea
            id="support-initial-message"
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            maxLength={10_000}
            rows={7}
            placeholder="Bonjour, je vous contacte au nom de l’équipe Yahnu…"
            disabled={isSendingMessage}
          />
          <p className="text-xs text-muted-foreground">{messageBody.length.toLocaleString("fr-CI")} / 10 000 caractères</p>
          {messageError ? <p className="text-sm text-destructive" role="alert">{messageError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMessageRecipient(null)} disabled={isSendingMessage}>Annuler</Button>
            <Button type="button" onClick={() => void createConversation()} disabled={isSendingMessage || !messageBody.trim()}>
              {isSendingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Mail className="mr-2 h-4 w-4" />}
              Envoyer le message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
