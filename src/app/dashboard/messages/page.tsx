
"use client"

import { useState, useEffect, useRef } from "react"
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
        avatar: "https://placehold.co/100x100.png?text=AD",
        lastMessage: "Bonjour, mon profil ne semble pas être visible par les entreprises. Pouvez-vous m'aider s'il vous plaît ?",
        time: "Il y a 2 heures",
        unread: 1,
        messages: [
            { id: 1, sender: "them", text: "Bonjour, mon profil ne semble pas être visible par les entreprises. Pouvez-vous m'aider s'il vous plaît ?", time: "Il y a 2 heures" },
        ]
    },
    {
        id: "contact-techsolutions",
        name: "Tech Solutions",
        avatar: "https://placehold.co/100x100.png?text=TS",
        lastMessage: "Nous avons essayé de postuler mais nous recevons une erreur.",
        time: "Il y a 8 heures",
        unread: 1,
        messages: [
             { id: 1, sender: "them", text: "Bonjour, nous ne parvenons pas à postuler à l'offre 'Data Scientist'. Nous avons essayé de postuler mais nous recevons une erreur.", time: "Il y a 8 heures" },
             { id: 2, sender: "me", text: "Bonjour, merci de nous avoir contactés. Pourriez-vous me donner plus de détails sur l'erreur que vous rencontrez ?", time: "Il y a 7 heures" },
        ]
    },
     {
        id: "admin-inphb",
        name: "Admin INP-HB",
        avatar: "/images/University.png",
        lastMessage: "L'un de nos diplômés a des difficultés à faire vérifier son diplôme.",
        time: "Il y a 1 jour",
        unread: 0,
        messages: [
            { id: 1, sender: "them", text: "Bonjour, l'un de nos diplômés, Jean Dupont, a des difficultés à faire vérifier son diplôme sur la plateforme. Pouvez-vous vérifier son statut ?", time: "Il y a 1 jour" },
            { id: 2, sender: "me", text: "Bien sûr, je regarde ça tout de suite. Je vous tiens au courant.", time: "Il y a 23 heures" },
        ]
    },
    {
        id: "alice-williams",
        name: "Alice Williams",
        avatar: "https://placehold.co/100x100.png?text=AW",
        lastMessage: "Merci, ça a fonctionné !",
        time: "Il y a 3 jours",
        unread: 0,
        messages: [
            { id: 1, sender: "them", text: "Je n'arrive pas à réinitialiser mon mot de passe.", time: "Il y a 3 jours" },
            { id: 2, sender: "me", text: "Bonjour Alice, j'ai renvoyé le lien de réinitialisation à votre adresse e-mail. Veuillez vérifier votre dossier de spam également.", time: "Il y a 3 jours" },
            { id: 3, sender: "them", text: "Merci, ça a fonctionné !", time: "Il y a 3 jours" },
        ]
    },
];

const getNewConvoName = (id: string, name?: string | null) => {
    if (name) return name;
    if (id === 'admin-inphb') return 'Admin INP-HB';
    return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const MessageView = ({ 
    conversation, 
    onSendMessage,
    isMobile,
    onBack
}: { 
    conversation: Conversation;
    onSendMessage: (text: string) => void;
    isMobile: boolean;
    onBack: () => void;
}) => {
    const [message, setMessage] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [conversation.messages]);


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSendMessage(message);
        setMessage("");
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-3 shrink-0">
                 {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                 )}
                 <Avatar>
                    <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{conversation.name}</h3>
            </div>
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                 <div className="p-6 space-y-4">
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
            <div className="p-4 border-t shrink-0 bg-background">
                <form className="flex items-center gap-2" onSubmit={handleFormSubmit}>
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
};

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    useEffect(() => {
        const localizedConversations = getInitialConversations();
        setConversations(localizedConversations);
    }, []);

    useEffect(() => {
        const newConvoId = searchParams.get('new');
        const newConvoName = searchParams.get('name');
        
        if (newConvoId) {
            const existingConvo = conversations.find(c => c.id === newConvoId);
            if (existingConvo) {
                setSelectedConversation(existingConvo);
            } else {
                 const newConvo: Conversation = {
                    id: newConvoId,
                    name: getNewConvoName(newConvoId, newConvoName),
                    avatar: newConvoId.includes('admin') ? "/images/University.png" : "https://placehold.co/100x100.png",
                    lastMessage: "",
                    time: "Maintenant",
                    unread: 0,
                    messages: [],
                };
                setConversations(prev => [newConvo, ...prev]);
                setSelectedConversation(newConvo);
            }
            // Use replace to avoid adding a new entry to the history stack
            router.replace('/dashboard/messages', { scroll: false });
        } else if (conversations.length > 0 && !selectedConversation && !isMobile) {
            setSelectedConversation(conversations[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, router, isMobile, conversations]);
    
    const handleSendMessage = (text: string) => {
        if (!selectedConversation) return;

        const newMessage: Message = {
            id: Date.now(),
            sender: "me",
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, newMessage],
            lastMessage: text,
            time: "Maintenant"
        };
        
        setSelectedConversation(updatedConversation);
        setConversations(conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c));
    }

    const ConversationList = () => (
        <div className="border-r flex flex-col h-full">
            <div className="p-4 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={"Rechercher dans la messagerie"} className="pl-8" />
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

            <Card className="flex-1 overflow-hidden">
                 <div className="grid md:grid-cols-[300px_1fr] h-full overflow-hidden">
                    {isMobile ? (
                        selectedConversation ? (
                            <MessageView 
                                conversation={selectedConversation} 
                                onSendMessage={handleSendMessage}
                                isMobile={isMobile}
                                onBack={() => setSelectedConversation(null)} 
                            />
                        ) : (
                            <ConversationList />
                        )
                    ) : (
                        <>
                            <ConversationList />
                            
                                {selectedConversation ? (
                                    <MessageView 
                                        conversation={selectedConversation} 
                                        onSendMessage={handleSendMessage}
                                        isMobile={isMobile}
                                        onBack={() => setSelectedConversation(null)} 
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                        <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                                        <p className="mt-4 text-muted-foreground">Sélectionnez une conversation pour commencer.</p>
                                    </div>
                                )}
                           
                        </>
                    )}
                 </div>
            </Card>
        </div>
    )
}
