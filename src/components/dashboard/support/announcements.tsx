
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PlusCircle, Megaphone, Edit, Trash2, Calendar } from 'lucide-react'
import { useLocalization } from '@/context/localization-context'

type Announcement = {
  id: string
  title: string
  content: string
  targetAudience: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  publishDate: string
  expiryDate: string
  status: 'active' | 'expired'
}

// Mock data
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Platform Maintenance Scheduled',
    content: 'We will be performing scheduled maintenance on our platform this weekend.',
    targetAudience: 'all_users',
    priority: 'high',
    publishDate: '2025-01-15',
    expiryDate: '2025-01-20',
    status: 'active'
  },
  {
    id: '2',
    title: 'New Features Available',
    content: 'Check out our latest features including enhanced search and improved messaging.',
    targetAudience: 'graduates',
    priority: 'medium',
    publishDate: '2025-01-10',
    expiryDate: '2025-01-25',
    status: 'active'
  }
]

export default function Announcements() {
  const { t } = useLocalization()
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    targetAudience: 'all_users',
    priority: 'medium' as const,
    publishDate: '',
    expiryDate: ''
  })

  const handleCreateAnnouncement = () => {
    const announcement: Announcement = {
      id: Math.random().toString(36).substr(2, 9),
      ...newAnnouncement,
      status: 'active'
    }
    setAnnouncements([...announcements, announcement])
    setIsCreateDialogOpen(false)
    setNewAnnouncement({
      title: '',
      content: '',
      targetAudience: 'all_users',
      priority: 'medium',
      publishDate: '',
      expiryDate: ''
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all_users': return t('dashboard.support.announcements.all_users')
      case 'graduates': return t('dashboard.support.announcements.graduates')
      case 'companies': return t('dashboard.support.announcements.companies')
      case 'schools': return t('dashboard.support.announcements.schools')
      case 'admins': return t('dashboard.support.announcements.admins')
      default: return audience
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.announcements.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.support.announcements.description')}</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dashboard.support.announcements.create_announcement')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t('dashboard.support.announcements.create_announcement')}</DialogTitle>
              <DialogDescription>
                Create a new announcement for your users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t('dashboard.support.announcements.title_label')}</Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">{t('dashboard.support.announcements.content_label')}</Label>
                <Textarea
                  id="content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('dashboard.support.announcements.target_audience')}</Label>
                  <Select value={newAnnouncement.targetAudience} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, targetAudience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">{t('dashboard.support.announcements.all_users')}</SelectItem>
                      <SelectItem value="graduates">{t('dashboard.support.announcements.graduates')}</SelectItem>
                      <SelectItem value="companies">{t('dashboard.support.announcements.companies')}</SelectItem>
                      <SelectItem value="schools">{t('dashboard.support.announcements.schools')}</SelectItem>
                      <SelectItem value="admins">{t('dashboard.support.announcements.admins')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t('dashboard.support.announcements.priority')}</Label>
                  <Select value={newAnnouncement.priority} onValueChange={(value: any) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('dashboard.support.announcements.low')}</SelectItem>
                      <SelectItem value="medium">{t('dashboard.support.announcements.medium')}</SelectItem>
                      <SelectItem value="high">{t('dashboard.support.announcements.high')}</SelectItem>
                      <SelectItem value="urgent">{t('dashboard.support.announcements.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="publishDate">{t('dashboard.support.announcements.publish_date')}</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={newAnnouncement.publishDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, publishDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">{t('dashboard.support.announcements.expiry_date')}</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newAnnouncement.expiryDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiryDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('dashboard.support.announcements.cancel')}
              </Button>
              <Button onClick={handleCreateAnnouncement}>
                {t('dashboard.support.announcements.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.support.announcements.active_announcements')}</h2>
        {announcements.length > 0 ? (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <CardDescription>
                        {getAudienceLabel(announcement.targetAudience)} • {t('dashboard.support.announcements.expires')} {new Date(announcement.expiryDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(announcement.priority)} text-white`}>
                        {t(`dashboard.support.announcements.${announcement.priority}`)}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{announcement.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Published {new Date(announcement.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('dashboard.support.announcements.no_announcements')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
