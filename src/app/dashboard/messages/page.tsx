
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
import { useAuth, type Role } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, getDoc, writeBatch, setDoc, getDocs } from "firebase/firestore"
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
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'auto' });
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
    const { user, role } = useAuth();
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

    // Effect for handling opening a conversation from a link/ticket
    useEffect(() => {
        const handleUrlParams = async () => {
            const convoId = searchParams.get('convoId');
            if (!convoId) {
                // If there's no convoId, default to selecting the first conversation on desktop
                if (!isMobile && conversations.length > 0 && !selectedConversation) {
                    setSelectedConversation(conversations[0]);
                }
                return;
            }

            // Clean the URL immediately
            router.replace('/dashboard/messages', { scroll: false });

            // Check if conversation already exists locally
            const existingConvo = conversations.find(c => c.id === convoId);
            if (existingConvo) {
                setSelectedConversation(existingConvo);
                return;
            }

            // If not, check Firestore
            const convoRef = doc(db, "conversations", convoId);
            const convoDoc = await getDoc(convoRef);

            if (convoDoc.exists()) {
                // Conversation exists in DB but not in local state yet (can happen on initial load)
                // The main onSnapshot listener will eventually pick it up and set it.
                // We can optimistically set it here or wait. Let's wait to avoid duplicate state.
            } else {
                // This is a new conversation from a support ticket. We need to create it.
                // The convoId should be `support-${userId}`
                const userId = convoId.replace('support-', '');
                if (!userId) return;

                // Fetch the original ticket to get the first message
                const ticketsQuery = query(collection(db, "tickets"), where("userId", "==", userId));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                
                if (!ticketsSnapshot.empty) {
                    const ticket = ticketsSnapshot.docs[0].data(); // Assuming one open ticket per user
                    const newConversation: Conversation = {
                        id: convoId,
                        name: ticket.userName,
                        avatar: "https://placehold.co/100x100.png",
                        participants: [user!.uid, userId],
                        lastMessage: ticket.message,
                        lastMessageTimestamp: ticket.submittedAt.toDate(),
                        unread: 0,
                        messages: [{
                            id: ticketsSnapshot.docs[0].id,
                            senderId: userId,
                            text: ticket.message,
                            timestamp: ticket.submittedAt.toDate(),
                        }],
                    };
                    // Optimistically add to local state and select it
                    setConversations(prev => [newConversation, ...prev]);
                    setSelectedConversation(newConversation);

                    // Save to Firestore
                    await setDoc(convoRef, {
                        ...newConversation,
                        lastMessageTimestamp: ticket.submittedAt,
                         messages: [{
                            id: ticketsSnapshot.docs[0].id,
                            senderId: userId,
                            text: ticket.message,
                            timestamp: ticket.submittedAt,
                        }],
                    });
                }
            }
        };

        if (user) {
            handleUrlParams();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, conversations, user]);

    // Effect for fetching conversations from Firestore
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);

        const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid), orderBy("lastMessageTimestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    avatar: data.avatar,
                    lastMessage: data.lastMessage,
                    lastMessageTimestamp: data.lastMessageTimestamp?.toDate(),
                    unread: data.unread,
                    participants: data.participants,
                    messages: (data.messages || []).map((m: any) => ({ ...m, timestamp: m.timestamp?.toDate() }))
                } as Conversation;
            });
            
            setConversations(convos);

            // Logic to preserve or set the selected conversation
            if (selectedConversation) {
                // If a conversation is already selected, update it with fresh data
                const updatedSelectedConvo = convos.find(c => c.id === selectedConversation.id);
                if (updatedSelectedConvo) {
                    setSelectedConversation(updatedSelectedConvo);
                } else {
                    // The selected conversation was deleted, so deselect it
                    setSelectedConversation(null);
                }
            } else if (!isMobile && convos.length > 0) {
                 // If no conversation is selected and on desktop, select the first one
                 setSelectedConversation(convos[0]);
            }
            
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isMobile]);


    const handleSendMessage = async (text: string) => {
        if (!selectedConversation || !user) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: user.uid,
            text: text,
            timestamp: new Date()
        };
        
        const updatedMessages = [...selectedConversation.messages, newMessage];
        const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);

        // Optimistic update
        const updatedConversation = { 
            ...selectedConversation, 
            messages: updatedMessages, 
            lastMessage: text, 
            lastMessageTimestamp: newMessage.timestamp,
            participants: otherParticipantId ? [user.uid, otherParticipantId] : [user.uid]
        };
        setSelectedConversation(updatedConversation);
        setConversations(prev => prev.map(c => c.id === updatedConversation.id ? updatedConversation : c).sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()));


        try {
            const convoRef = doc(db, "conversations", selectedConversation.id);
            const convoDoc = await getDoc(convoRef);

            const messagePayload = { ...newMessage, timestamp: serverTimestamp() };

            if (convoDoc.exists()) {
                await updateDoc(convoRef, {
                    messages: [...convoDoc.data().messages, messagePayload],
                    lastMessage: text,
                    lastMessageTimestamp: serverTimestamp()
                });
            } else {
                 await setDoc(convoRef, {
                    ...updatedConversation,
                    messages: [messagePayload],
                    lastMessage: text,
                    lastMessageTimestamp: serverTimestamp()
                });
            }
            
            // Send a notification to the other participant
            if (otherParticipantId) {
                await addDoc(collection(db, "notifications"), {
                    userId: otherParticipantId,
                    text: `Nouveau message de ${user.name}: "${text.substring(0, 30)}..."`,
                    read: false,
                    createdAt: serverTimestamp(),
                    type: 'message'
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            toast({ title: "Erreur", description: "Votre message n'a pas pu être envoyé.", variant: "destructive" });
            // Revert optimistic update on error
            setSelectedConversation(selectedConversation);
            setConversations(prev => prev.map(c => c.id === selectedConversation.id ? selectedConversation : c));
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
                                        {isLoading ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                            <>
                                                <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                                                <p className="mt-4 text-muted-foreground">Sélectionnez une conversation pour commencer.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                           
                        </>
                    )}
                 </div>
            </Card>
        </div>
    )
}
