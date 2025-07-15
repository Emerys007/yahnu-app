
"use client"

import { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type Conversation = {
    id: number
    name: string
    avatar: string
    lastMessage: string
    time: string
    unread: number
    messages: {
        id: number
        sender: "me" | "them"
        text: string
        time: string
    }[]
}

const conversationsData: Conversation[] = [
    {
        id: 1,
        name: "Amina Diallo",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Thank you for the opportunity! I'm looking forward to the interview.",
        time: "10:42 AM",
        unread: 0,
        messages: [
            { id: 1, sender: "them", text: "Hi! We were very impressed with your profile and would like to schedule an interview for the Frontend Developer role.", time: "10:40 AM" },
            { id: 2, sender: "me", text: "That's great news! I'm available anytime next week.", time: "10:41 AM" },
            { id: 3, sender: "them", text: "Perfect. Does Wednesday at 2 PM work for you?", time: "10:41 AM" },
            { id: 4, sender: "me", text: "Thank you for the opportunity! I'm looking forward to the interview.", time: "10:42 AM" },
        ]
    },
    {
        id: 2,
        name: "Tech Solutions Abidjan",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Can you tell me more about the team culture?",
        time: "Yesterday",
        unread: 2,
        messages: [
            { id: 1, sender: "me", text: "Hello, I'm interested in the Senior Frontend Developer position.", time: "Yesterday" },
            { id: 2, sender: "me", text: "Can you tell me more about the team culture?", time: "Yesterday" },
        ]
    },
]

export default function MessagesPage() {
    const { t } = useLocalization()
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversationsData[0]);

    return (
        <div className="h-[calc(100vh-10rem)] flex flex-col">
            <div className="flex items-start gap-4 mb-8">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Messages')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Communicate with candidates and companies directly.')}</p>
                </div>
            </div>

            <Card className="grid md:grid-cols-[300px_1fr] flex-1">
                <div className="border-r">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t("Search conversations...")} className="pl-8" />
                        </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-18rem)]">
                        {conversationsData.map((convo) => (
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
                <div className="flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3">
                                 <Avatar>
                                    <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                                    <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold">{selectedConversation.name}</h3>
                            </div>
                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-4">
                                    {selectedConversation.messages.map(message => (
                                        <div key={message.id} className={cn("flex items-end gap-2", message.sender === "me" ? "justify-end" : "justify-start")}>
                                            {message.sender === 'them' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConversation.avatar} /></Avatar>}
                                            <div className={cn(
                                                "max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 text-sm",
                                                message.sender === "me" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                            )}>
                                                <p>{message.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{message.time}</p>
                                            </div>
                                            {message.sender === 'me' && <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/100x100.png" /></Avatar>}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="p-4 border-t">
                                <form className="flex items-center gap-2">
                                    <Input placeholder={t("Type your message...")} className="flex-1" />
                                    <Button type="submit"><Send className="h-4 w-4" /></Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">{t('Select a conversation to start chatting.')}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
