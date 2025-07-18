import AdminOverviewPage from "@/app/dashboard/admin/overview/page";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { type UserStatus } from "@/context/auth-context";

type User = {
  id: string
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

async function getPendingRequests(): Promise<User[]> {
    const usersRef = collection(db, "users");
    const q = query(
        usersRef, 
        where('status', '==', 'pending'), 
        where('role', 'in', ['company', 'school'])
    );
    const querySnapshot = await getDocs(q);

    const requests = querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
            id: doc.id,
            name: data.name,
            email: data.email,
            accountType: data.role.charAt(0).toUpperCase() + data.role.slice(1),
            status: data.status,
            date: createdAt.toISOString().split('T')[0],
        } as User;
    });

    return requests;
}


export async function AdminDashboard() {
    const pendingRequests = await getPendingRequests();
    
    return <AdminOverviewPage pendingRequests={pendingRequests} />;
}
