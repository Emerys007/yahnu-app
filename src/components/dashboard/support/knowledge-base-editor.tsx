
"use client"

import { useState } from 'react';
import { useLocalization } from '@/context/localization-context';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type FaqCategory = 'graduate' | 'company' | 'school' | 'general';

type FaqArticle = {
    id: string;
    title: string;
    slug: string;
    category: FaqCategory;
    content: string;
};

const initialArticles: FaqArticle[] = [
    { id: 'faq-1', title: "Why is my account pending activation?", slug: "why-is-my-account-pending-activation", category: 'graduate', content: "Graduate accounts require verification and activation by an administrator from your registered school. This ensures the integrity of our talent pool. If activation is taking longer than expected, please use the 'Contact Your School' button on the support page to message them." },
    { id: 'faq-2', title: "How do I post a job?", slug: "how-do-i-post-a-job", category: 'company', content: "You can post and manage jobs from your Company Profile page. Click on 'Add New Job', fill in the details, and it will become visible to qualified graduates in our talent pool." },
    { id: 'faq-3', title: "How do I approve my graduates' accounts?", slug: "how-do-i-approve-my-graduates-accounts", category: 'school', content: "Navigate to the Graduate Management page. Under the 'Pending Activation' tab, you will see a list of students from your institution awaiting approval. You can review their details and activate their accounts there." },
];

export default function KnowledgeBaseEditor() {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [articles, setArticles] = useState<FaqArticle[]>(initialArticles);
    const [selectedArticle, setSelectedArticle] = useState<FaqArticle | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<FaqCategory>('general');
    const [content, setContent] = useState('');

    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const handleSelectArticle = (article: FaqArticle) => {
        setSelectedArticle(article);
        setTitle(article.title);
        setCategory(article.category);
        setContent(article.content);
    };
    
    const clearForm = () => {
        setSelectedArticle(null);
        setTitle('');
        setCategory('general');
        setContent('');
    };

    const handleDelete = (id: string) => {
        setArticles(articles.filter(a => a.id !== id));
        toast({ title: "Article Deleted", description: "The FAQ article has been removed." });
        clearForm();
    };

    const handleSave = () => {
        if (!title || !content) {
            toast({ title: "Incomplete Form", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }

        if (selectedArticle) {
            // Update existing article
            setArticles(articles.map(a => a.id === selectedArticle.id ? { ...a, title, slug: slugify(title), category, content } : a));
            toast({ title: "Article Updated", description: "Your changes have been saved." });
        } else {
            // Create new article
            const newArticle: FaqArticle = {
                id: `faq-${Date.now()}`,
                title,
                slug: slugify(title),
                category,
                content,
            };
            setArticles([...articles, newArticle]);
            toast({ title: "Article Created", description: "The new FAQ article has been added." });
        }
        clearForm();
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base Editor</h1>
                        <p className="text-muted-foreground mt-1">Create and manage FAQ articles.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>All Articles</CardTitle>
                            <Button variant="outline" size="sm" onClick={clearForm}><PlusCircle className="h-4 w-4 mr-2" /> Create New</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {articles.map((article) => (
                                        <TableRow key={article.id}>
                                            <TableCell className="font-medium">{article.title}</TableCell>
                                            <TableCell className="capitalize">{article.category}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleSelectArticle(article)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedArticle ? 'Edit Article' : 'Create Article'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                             <div>
                                <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                                <Select value={category} onValueChange={(v: FaqCategory) => setCategory(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="graduate">Graduate</SelectItem>
                                        <SelectItem value="company">Company</SelectItem>
                                        <SelectItem value="school">School</SelectItem>
                                        <SelectItem value="general">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-muted-foreground mb-1">Content</label>
                                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSave}>Save Article</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
