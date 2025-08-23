
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Search, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

type Message = {
    id: number
    sender: "me" | "them"
    text: string
    time: string
};

type Conversation = {
    id: string
    name: string
    avatar: string
    lastMessage: string
    time: string
    unread: number
    messages: Message[]
}

const getInitialConversations = (): Conversation[] => [
    {
        id: "amina-diallo",
        name: "Amina Diallo",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Merci !",
        time: "10:42 AM",
        unread: 0,
        messages: [
            { id: 1, sender: "them", text: "Bonjour Amina, nous avons été impressionnés par votre profil et aimerions vous inviter à un entretien.", time: "10:40 AM" },
            { id: 2, sender: "me", text: "Bonjour, merci beaucoup ! Je suis disponible mardi ou jeudi après-midi.", time: "10:41 AM" },
            { id: 3, sender: "them", text: "Parfait. Rendez-vous est pris pour mardi à 15h. Vous recevrez un lien de visioconférence bientôt.", time: "10:41 AM" },
            { id: 4, sender: "me", text: "Merci !", time: "10:42 AM" },
        ]
    },
    {
        id: "tech-solutions",
        name: "Tech Solutions",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Pouvez-vous m'en dire plus sur la culture de l'entreprise ?",
        time: "Hier",
        unread: 2,
        messages: [
            { id: 1, sender: "me", text: "Bonjour, je suis très intéressé par le poste d'ingénieur Frontend.", time: "Hier" },
            { id: 2, sender: "me", text: "Pouvez-vous m'en dire plus sur la culture de l'entreprise ?", time: "Hier" },
        ]
    },
     {
        id: "inp-hb-admin",
        name: "Admin INP-HB",
        avatar: "/images/University.png",
        lastMessage: "Votre diplôme a été vérifié avec succès.",
        time: "Il y a 2 jours",
        unread: 0,
        messages: [
            { id: 1, sender: "me", text: "Bonjour, pourriez-vous s'il vous plaît vérifier mon diplôme ?", time: "Il y a 2 jours" },
            { id: 2, sender: "them", text: "Bonjour, bien sûr. Votre diplôme a été vérifié avec succès.", time: "Il y a 2 jours" },
        ]
    },
];

const getNewConvoName = (id: string, name?: string | null) => {
    if (name) return name;
    if (id === 'inp-hb-admin') return 'Admin INP-HB';
    return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [message, setMessage] = useState("");

    // Initialize conversations with localized content
    useEffect(() => {
        const localizedConversations = getInitialConversations();
        setConversations(localizedConversations);
    }, []);

    useEffect(() => {
        const newConvoId = searchParams.get('new');
        const newConvoName = searchParams.get('name');
        
        if (newConvoId) {
            setConversations(prev => {
                if (prev.some(c => c.id === newConvoId)) {
                    return prev;
                }
                const newConvo: Conversation = {
                    id: newConvoId,
                    name: getNewConvoName(newConvoId, newConvoName),
                    avatar: newConvoId.includes('admin') ? "/images/University.png" : "https://placehold.co/100x100.png",
                    lastMessage: "",
                    time: "Maintenant",
                    unread: 0,
                    messages: [],
                };
                return [newConvo, ...prev];
            });

            const convoToSelect = conversations.find(c => c.id === newConvoId) || {
                id: newConvoId,
                name: getNewConvoName(newConvoId, newConvoName),
                avatar: newConvoId.includes('admin') ? "/images/University.png" : "https://placehold.co/100x100.png",
                lastMessage: "",
                time: "Maintenant",
                unread: 0,
                messages: [],
            };
            
            setSelectedConversation(convoToSelect);
            
            // Clean up URL
            router.replace('/dashboard/messages');
        } else if (conversations.length > 0 && !selectedConversation && !isMobile) {
            setSelectedConversation(conversations[0]);
        }
    }, [searchParams, router, isMobile, conversations]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedConversation) return;

        const newMessage: Message = {
            id: Date.now(),
            sender: "me",
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, newMessage],
            lastMessage: message,
            time: "Maintenant"
        };
        
        setSelectedConversation(updatedConversation);
        setConversations(conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c));
        setMessage("");
    }

    const ConversationList = () => (
        <div className="border-r flex flex-col">
            <div className="p-4 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={"Rechercher des conversations"} className="pl-8" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {conversations.map((convo) => (
                    <button
                        key={convo.id}
                        className={cn(
                            "flex items-center gap-3 p-4 w-full text-left hover:bg-accent",
                            selectedConversation?.id === convo.id && "bg-accent"
                        )}
                        onClick={() => setSelectedConversation(convo)}
                    >
                        <Avatar>
                            <AvatarImage src={convo.avatar} alt={convo.name} />
                            <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                            <p className="font-semibold">{convo.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                            <p>{convo.time}</p>
                            {convo.unread > 0 && (
                                <div className="mt-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center ml-auto">
                                    {convo.unread}
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </ScrollArea>
        </div>
    );
    
    const MessageView = ({ conversation }: { conversation: Conversation }) => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-3 shrink-0">
                 {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                 )}
                 <Avatar>
                    <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{conversation.name}</h3>
            </div>
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                    {conversation.messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === "me" ? "justify-end" : "justify-start")}>
                            {msg.sender === 'them' && <Avatar className="h-8 w-8"><AvatarImage src={conversation.avatar} /></Avatar>}
                            <div className={cn(
                                "max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 text-sm",
                                msg.sender === "me" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                            )}>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
                            </div>
                            {msg.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/100x100.png" /></Avatar>}
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4 border-t shrink-0">
                <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                    <Input 
                        placeholder={"Écrivez un message..."} 
                        className="flex-1"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit"><Send className="h-4 w-4" /></Button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col">
            <div className="flex items-start gap-4 mb-8 shrink-0">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messagerie</h1>
                    <p className="text-muted-foreground mt-1">Communiquez avec les entreprises, les écoles et les candidats.</p>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
                 <div className="grid md:grid-cols-[300px_1fr] flex-1 overflow-hidden">
                    {isMobile ? (
                        selectedConversation ? (
                            <MessageView conversation={selectedConversation} />
                        ) : (
                            <ConversationList />
                        )
                    ) : (
                        <>
                            <ConversationList />
                            <div className="flex flex-col">
                                {selectedConversation ? (
                                    <MessageView conversation={selectedConversation} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                                        <p className="mt-4 text-muted-foreground">Sélectionnez une conversation pour commencer à discuter.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                 </div>
            </Card>
        </div>
    )
}
