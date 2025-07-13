"use client"

import { useState, useRef, useEffect } from "react"
import { chatbotAssistance } from "@/ai/flows/chatbot"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, MessageSquare, Send, X, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  text: string
  sender: "user" | "bot"
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "bot" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSend = async () => {
    if (input.trim() === "") return
    const userMessage: Message = { id: Date.now(), text: input, sender: "user" }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const response = await chatbotAssistance({ query: input })
      const botMessage: Message = { id: Date.now() + 1, text: response.response, sender: "bot" }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting. Please try again later.", sender: "bot" }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to get the viewport. There should be a better way.
        const viewport = scrollAreaRef.current.querySelector("div")
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight
        }
    }
  }, [messages])

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-4 md:right-8 w-[calc(100%-2rem)] max-w-sm z-50"
          >
            <Card className="shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot />
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>Yahnu Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 pr-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 text-sm",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "bot" && (
                           <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/20 text-primary">
                                <Bot className="h-4 w-4"/>
                            </AvatarFallback>
                           </Avatar>
                        )}
                        <p className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2",
                            message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {message.text}
                        </p>
                         {message.sender === "user" && (
                           <Avatar className="h-6 w-6">
                             <AvatarImage src="https://placehold.co/100x100.png" />
                             <AvatarFallback>U</AvatarFallback>
                           </Avatar>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                         <div className="flex gap-2 text-sm justify-start">
                             <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                    <Bot className="h-4 w-4"/>
                                </AvatarFallback>
                           </Avatar>
                           <p className="max-w-[80%] rounded-lg px-3 py-2 bg-muted flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                           </p>
                         </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend() }}
                    className="flex w-full items-center space-x-2"
                >
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit" size="icon" disabled={isTyping}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className="fixed bottom-4 right-4 md:right-8 rounded-full h-16 w-16 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Chatbot"
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1}} exit={{ rotate: 90, scale: 0}}><X className="h-8 w-8" /></motion.div>
          ) : (
             <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1}} exit={{ rotate: -90, scale: 0}}><MessageSquare className="h-8 w-8" /></motion.div>
          )}
        </AnimatePresence>
      </Button>
    </>
  )
}
