import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, UserPlus, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type RfiSubmitter = {
  id: number;
  username: string;
  persona?: string;
};

type SimilarRfi = {
  id: number;
  title: string;
  description: string;
  category: string;
  problem: string;
  impact: string;
  submitter: RfiSubmitter;
  createdAt: string;
  status: string;
};

type InvitationType = 'alias' | 'email' | 'text';

type Invitation = {
  type: InvitationType;
  alias?: string;
  email?: string;
  phone?: string;
};

type SimilarRfiModalProps = {
  isOpen: boolean;
  onClose: () => void;
  similarRfis: SimilarRfi[];
  originalTitle: string;
  originalData: any;
  onJoinExisting: (rfiId: number) => void;
  onSubmitAnyway: (newTitle: string, invitations: Invitation[]) => void;
};

export default function SimilarRfiModal({
  isOpen,
  onClose,
  similarRfis,
  originalTitle,
  originalData,
  onJoinExisting,
  onSubmitAnyway
}: SimilarRfiModalProps) {
  const [newTitle, setNewTitle] = useState(originalTitle);
  const [invitationTab, setInvitationTab] = useState<InvitationType>('alias');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvitationTypeChange = (type: InvitationType) => {
    setInvitationTab(type);
  };

  const addInvitation = () => {
    let invitation: Invitation | null = null;
    
    if (invitationTab === 'alias' && alias.trim()) {
      invitation = { type: 'alias', alias: alias.trim() };
    } else if (invitationTab === 'email' && email.trim()) {
      invitation = { type: 'email', email: email.trim() };
    } else if (invitationTab === 'text' && phone.trim()) {
      invitation = { type: 'text', phone: phone.trim() };
    }
    
    if (invitation) {
      setInvitations([...invitations, invitation]);
      // Clear inputs
      if (invitationTab === 'alias') setAlias('');
      if (invitationTab === 'email') setEmail('');
      if (invitationTab === 'text') setPhone('');
    }
  };

  const removeInvitation = (index: number) => {
    const newInvitations = [...invitations];
    newInvitations.splice(index, 1);
    setInvitations(newInvitations);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmitAnyway(newTitle, invitations);
    setIsSubmitting(false);
    // Modal will be closed by parent component
  };

  // Get the first letter of the username for the avatar fallback
  const getInitials = (username: string) => {
    return username.substring(0, 1).toUpperCase();
  };

  // Get color based on persona type
  const getPersonaColor = (persona?: string) => {
    switch (persona) {
      case 'developer':
        return 'bg-blue-100 text-blue-600';
      case 'designer':
        return 'bg-orange-100 text-orange-600';
      case 'influencer':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-warning mr-2" />
            Similar RFIs Found
          </DialogTitle>
          <DialogDescription>
            We found existing RFIs similar to the one you're trying to create. You can join an existing RFI or create a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Similar RFIs:</h3>
          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {similarRfis.map((rfi) => (
              <Card key={rfi.id} className="border border-muted">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{rfi.title}</CardTitle>
                      <CardDescription className="text-xs">
                        Created {format(new Date(rfi.createdAt), 'PPP')} · {rfi.category}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className={getPersonaColor(rfi.submitter.persona)}>
                        {getInitials(rfi.submitter.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{rfi.submitter.username}</span>
                    {rfi.submitter.persona && (
                      <Badge variant="secondary" className="ml-2 text-xs capitalize">
                        {rfi.submitter.persona}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {rfi.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => onJoinExisting(rfi.id)}
                  >
                    <Users className="h-4 w-4 mr-2" /> Join This RFI
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Or create a new RFI with a different title:</h3>
          <div className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="new-title">New RFI Title</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter a unique title for your RFI"
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Invite Collaborators (Optional):</h4>
              <Tabs value={invitationTab} onValueChange={handleInvitationTypeChange as any}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="alias">By Username</TabsTrigger>
                  <TabsTrigger value="email">By Email</TabsTrigger>
                  <TabsTrigger value="text">By Phone</TabsTrigger>
                </TabsList>
                
                <TabsContent value="alias" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="Enter username"
                    />
                    <Button type="button" size="sm" onClick={addInvitation}>
                      <UserPlus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="email" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      type="email"
                    />
                    <Button type="button" size="sm" onClick={addInvitation}>
                      <UserPlus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      type="tel"
                    />
                    <Button type="button" size="sm" onClick={addInvitation}>
                      <UserPlus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* List of added invitations */}
            {invitations.length > 0 && (
              <div className="border rounded-md p-2">
                <h4 className="text-sm font-medium mb-2">Added Collaborators:</h4>
                <ul className="space-y-1">
                  {invitations.map((inv, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm p-1 bg-muted/40 rounded">
                      <span>
                        {inv.type === 'alias' && `@${inv.alias}`}
                        {inv.type === 'email' && inv.email}
                        {inv.type === 'text' && inv.phone}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeInvitation(idx)}>
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !newTitle.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create New RFI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
