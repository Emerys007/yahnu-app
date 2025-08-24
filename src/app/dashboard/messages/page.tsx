
"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Search, ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, getDocs, DocumentData } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

type Message = {
    id: string
    senderId: string
    text: string
    timestamp: Date
};

type Conversation = {
    id: string
    name: string
    avatar: string
    lastMessage: string
    lastMessageTimestamp: Date
    unread: number
    participants: string[]
    messages: Message[]
}

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
    const { user } = useAuth();
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
    
    const formatTime = (date: Date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                             {msg.senderId !== user?.uid && <Avatar className="h-8 w-8"><AvatarImage src={conversation.avatar} /></Avatar>}
                            <div className={cn(
                                "max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 text-sm",
                                msg.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                            )}>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{formatTime(msg.timestamp)}</p>
                            </div>
                            {msg.senderId === user?.uid && <Avatar className="h-8 w-8"><AvatarFallback>{getNewConvoName("", user?.name)}</AvatarFallback></Avatar>}
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
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (date: Date) => {
        if (!date) return "";
        const now = new Date();
        const diffSeconds = (now.getTime() - date.getTime()) / 1000;
        if (diffSeconds < 60) return "Maintenant";
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
        return date.toLocaleDateString();
    }

    // Effect for fetching conversations
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);

        const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos: Conversation[] = [];
            querySnapshot.forEach(doc => {
                const data = doc.data() as DocumentData;
                convos.push({
                    id: doc.id,
                    name: data.name,
                    avatar: data.avatar,
                    lastMessage: data.lastMessage,
                    lastMessageTimestamp: data.lastMessageTimestamp?.toDate(),
                    unread: data.unread,
                    participants: data.participants,
                    messages: (data.messages || []).map((m: any) => ({ ...m, timestamp: m.timestamp?.toDate() }))
                });
            });
            
            convos.sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
            setConversations(convos);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Effect for handling new conversation from query params
    useEffect(() => {
        const handleNewConversation = async () => {
            if (!user || conversations.length === 0) return; // Wait for user and convos to load

            const newConvoId = searchParams.get('new');
            if (!newConvoId) {
                 if (!selectedConversation && conversations.length > 0 && !isMobile) {
                    setSelectedConversation(conversations[0]);
                }
                return
            };

            const existingConvo = conversations.find(c => c.id === newConvoId);

            if (existingConvo) {
                setSelectedConversation(existingConvo);
            } else {
                const newConvoName = searchParams.get('name');
                const initialMessage = searchParams.get('initialMessage');
                
                const newConvo: Conversation = {
                    id: newConvoId,
                    name: getNewConvoName(newConvoId, newConvoName),
                    avatar: newConvoId.includes('school') ? "/images/University.png" : "https://placehold.co/100x100.png",
                    lastMessage: initialMessage || "Nouvelle conversation",
                    lastMessageTimestamp: new Date(),
                    unread: initialMessage ? 1 : 0,
                    participants: [user.uid, newConvoId],
                    messages: initialMessage ? [{
                        id: Date.now().toString(),
                        senderId: newConvoId, // The "other" person
                        text: initialMessage,
                        timestamp: new Date(),
                    }] : [],
                };
                
                // This state update is temporary, it will be replaced by the snapshot listener
                setConversations(prev => [newConvo, ...prev]);
                setSelectedConversation(newConvo);
            }
            router.replace('/dashboard/messages', { scroll: false });
        }
        
        handleNewConversation();
    // We only want this to run when the query params change, or when initial data loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, user, conversations.length > 0]);

    const handleSendMessage = async (text: string) => {
        if (!selectedConversation || !user) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: user.uid,
            text: text,
            timestamp: new Date()
        };
        
        const updatedMessages = [...selectedConversation.messages, newMessage];

        // Optimistic update
        setSelectedConversation({ ...selectedConversation, messages: updatedMessages, lastMessage: text, lastMessageTimestamp: newMessage.timestamp });

        try {
            const convoRef = doc(db, "conversations", selectedConversation.id);
            const convoDoc = await getDoc(convoRef);

            if (convoDoc.exists()) {
                await updateDoc(convoRef, {
                    messages: [...convoDoc.data().messages, { ...newMessage, timestamp: serverTimestamp() }],
                    lastMessage: text,
                    lastMessageTimestamp: serverTimestamp()
                });
            } else {
                 await setDoc(convoRef, {
                    ...selectedConversation,
                    messages: [{ ...newMessage, timestamp: serverTimestamp() }],
                    lastMessage: text,
                    lastMessageTimestamp: serverTimestamp()
                });
            }
            
            // If support staff sends a message, create a notification for the other participant
             if (user.role === 'support_staff') {
                const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
                if (otherParticipantId) {
                    await addDoc(collection(db, "notifications"), {
                        userId: otherParticipantId,
                        text: `Nouvelle réponse du support : "${text.substring(0, 30)}..."`,
                        read: false,
                        createdAt: serverTimestamp(),
                        type: 'message'
                    });
                }
            }


        } catch (error) {
            console.error("Failed to send message:", error);
            toast({ title: "Erreur", description: "Votre message n'a pas pu être envoyé.", variant: "destructive" });
            // Revert optimistic update on error
            setSelectedConversation({ ...selectedConversation, messages: selectedConversation.messages });
        }
    };
    
    const ConversationList = () => (
        <div className="border-r flex flex-col h-full">
            <div className="p-4 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={"Rechercher dans la messagerie"} className="pl-8" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {isLoading ? (
                     <div className="flex justify-center items-center h-full p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    conversations.map((convo) => (
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
                            <p>{formatTime(convo.lastMessageTimestamp)}</p>
                            {convo.unread > 0 && (
                                <div className="mt-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center ml-auto">
                                    {convo.unread}
                                </div>
                            )}
                        </div>
                    </button>
                    ))
                )}
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
