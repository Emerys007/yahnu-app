
import { Eye } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { ContentModerationClient } from "./content-moderation-client";

export const dynamic = 'force-dynamic';

export type ModerationItem = {
    id: string;
    name: string;
    email: string;
    type: 'company' | 'school';
    submittedAt: string;
    details: DocumentData;
};

async function getPendingItems(): Promise<ModerationItem[]> {
    const q = query(
        collection(db, "users"), 
        where("status", "==", "pending"),
        where("role", "in", ["company", "school"])
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [];
    }

    const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.companyName || data.schoolName || "Nom non disponible",
            email: data.email,
            type: data.role as 'company' | 'school',
            submittedAt: data.createdAt?.toDate().toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR'),
            details: data,
        };
    });

    return items;
}

export default async function ContentModerationPage() {
    const pendingItems = await getPendingItems();

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modération de contenu</h1>
                    <p className="text-muted-foreground mt-1">
                        Examinez et approuvez les nouveaux profils d'entreprises et d'écoles pour maintenir la qualité de la plateforme.
                    </p>
                </div>
            </div>
            <ContentModerationClient initialItems={pendingItems} />
        </div>
    );
}
