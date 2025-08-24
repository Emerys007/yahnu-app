
'use client'

import { ContentPagesEditor } from '@/features/content/ContentPagesEditor'
import { FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ContentManagementPage() {
  const router = useRouter();

  // Redirect to a more specific default page for this role
  useEffect(() => {
    router.replace('/dashboard/content/static-pages');
  }, [router]);
  
  // Render a loading state or null while redirecting
  return null;
}
