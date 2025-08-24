
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
    title: 'Maintenance de la plateforme prévue',
    content: 'Nous effectuerons une maintenance programmée sur notre plateforme ce week-end.',
    targetAudience: 'all_users',
    priority: 'high',
    publishDate: '2025-01-15',
    expiryDate: '2025-01-20',
    status: 'active'
  },
  {
    id: '2',
    title: 'Nouvelles fonctionnalités disponibles',
    content: 'Découvrez nos dernières fonctionnalités, notamment la recherche améliorée et la messagerie améliorée.',
    targetAudience: 'graduates',
    priority: 'medium',
    publishDate: '2025-01-10',
    expiryDate: '2025-01-25',
    status: 'active'
  }
]

export default function Announcements() {
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
      case 'all_users': return 'Tous les utilisateurs'
      case 'graduates': return 'Diplômés'
      case 'companies': return 'Entreprises'
      case 'schools': return 'Écoles'
      case 'admins': return 'Admins'
      default: return audience
    }
  }
  
    const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Basse'
      case 'medium': return 'Moyenne'
      case 'high': return 'Haute'
      case 'urgent': return 'Urgente'
      default: return priority
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
            <h1 className="text-3xl font-bold tracking-tight">Annonces</h1>
            <p className="text-muted-foreground mt-1">Créez et gérez les annonces de la plateforme.</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une annonce
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Créer une annonce</DialogTitle>
              <DialogDescription>
                Créez une nouvelle annonce pour vos utilisateurs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Public cible</Label>
                  <Select value={newAnnouncement.targetAudience} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, targetAudience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">Tous les utilisateurs</SelectItem>
                      <SelectItem value="graduates">Diplômés</SelectItem>
                      <SelectItem value="companies">Entreprises</SelectItem>
                      <SelectItem value="schools">Écoles</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priorité</Label>
                  <Select value={newAnnouncement.priority} onValueChange={(value: any) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="publishDate">Date de publication</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={newAnnouncement.publishDate}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, publishDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Date d'expiration</Label>
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
                Annuler
              </Button>
              <Button onClick={handleCreateAnnouncement}>
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Annonces actives</h2>
        {announcements.length > 0 ? (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <CardDescription>
                        {getAudienceLabel(announcement.targetAudience)} • Expire le {new Date(announcement.expiryDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(announcement.priority)} text-white`}>
                        {getPriorityLabel(announcement.priority)}
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
                      Publié le {new Date(announcement.publishDate).toLocaleDateString()}
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
              <p className="text-lg font-medium text-muted-foreground">Aucune annonce</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
