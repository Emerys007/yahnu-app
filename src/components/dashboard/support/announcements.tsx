
"use client"

import { useState } from 'react';
import { useLocalization } from '@/context/localization-context';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Users, Building, School, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';

const recipientOptions = [
  { value: 'all', label: 'All Users', icon: Users },
  { value: 'graduates', label: 'All Graduates', icon: UserCheck },
  { value: 'companies', label: 'All Companies', icon: Building },
  { value: 'schools', label: 'All Schools', icon: School },
];

export default function Announcements() {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSendBroadcast = () => {
        if (!recipients.length || !subject || !message) {
            toast({
                title: "Incomplete Form",
                description: "Please select recipients, and fill in the subject and message.",
                variant: "destructive"
            });
            return;
        }

        console.log("Sending broadcast:", { recipients, subject, message });

        toast({
            title: "Broadcast Sent!",
            description: `Your message has been sent to the selected groups: ${recipients.join(', ')}.`,
        });

        // Reset form
        setRecipients([]);
        setSubject('');
        setMessage('');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                 <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                        <p className="text-muted-foreground mt-1">Create and send broadcast messages.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label htmlFor="recipients" className="block text-sm font-medium text-muted-foreground mb-1">Recipients</label>
                        <MultiSelect
                            options={recipientOptions}
                            selected={recipients}
                            onChange={setRecipients}
                            className="w-full"
                            placeholder="Select target groups..."
                         />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1">Subject</label>
                        <Input 
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Upcoming Maintenance"
                        />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">Message</label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Compose your announcement here..."
                            rows={8}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSendBroadcast}>Send Broadcast</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
