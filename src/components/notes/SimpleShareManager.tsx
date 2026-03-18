import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmailSharing } from '@/hooks/useEmailSharing';
import { ShareStatus, SharePermissionIcon, ShareStatusText } from './ShareStatus';
import { Loader2, UserPlus, Mail, Users, UserX, AlertCircle } from 'lucide-react';
import type { NoteWithSharing } from '@/types/sharing';

interface SimpleShareManagerProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteWithSharing;
}

export function SimpleShareManager({ isOpen, onClose, note }: SimpleShareManagerProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [isAdding, setIsAdding] = useState(false);
  
  const { shares, loading, addShare, updatePermission, removeShare } = useEmailSharing(note?.id);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPermission('read');
      setIsAdding(false);
    }
  }, [isOpen]);

  const handleAddShare = async () => {
    if (!email.trim()) return;

    setIsAdding(true);
    try {
      const result = await addShare(email.trim(), permission);
      if (result.success) {
        setEmail('');
        setPermission('read');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding && email.trim()) {
      handleAddShare();
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-xl">
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            {note.isOwnedByUser ? 'Manage Sharing' : 'Sharing Info'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* Note status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium truncate text-sm">{note.title || 'Untitled Note'}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {note.isOwnedByUser ? 'You own this note' : 'Shared with you'}
              </p>
            </div>
            <ShareStatus note={note} showText={false} />
          </div>

          {/* Content based on ownership */}
          {!note.isOwnedByUser ? (
            <div className="text-center py-6">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-3 text-sm">
                This note has been shared with you
              </p>
              <div className="flex items-center justify-center gap-2">
                <SharePermissionIcon permission={note.userPermission || 'read'} />
                <span className="text-sm font-medium">
                  <ShareStatusText permission={note.userPermission || 'read'} />
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Add new share section */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-medium">Share with someone new</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isAdding}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter an email address to share this note
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permission Level</Label>
                    <RadioGroup 
                      value={permission} 
                      onValueChange={(value: 'read' | 'write') => setPermission(value)}
                      className="flex flex-col gap-3 mt-2"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="read" id="read" />
                        <Label htmlFor="read" className="cursor-pointer flex items-center gap-2 text-sm">
                          <SharePermissionIcon permission="read" />
                          View Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="write" id="write" />
                        <Label htmlFor="write" className="cursor-pointer flex items-center gap-2 text-sm">
                          <SharePermissionIcon permission="write" />
                          Can Edit
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    onClick={handleAddShare} 
                    disabled={!email.trim() || isAdding}
                    className="w-full h-10 mt-4"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Share Note
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Current shares list */}
              <div className="space-y-3 min-h-0">
                <h3 className="font-medium">Shared with ({shares.length})</h3>

                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Not shared with anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {shares.map((share) => (
                      <div 
                        key={share.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate text-sm">
                              {share.shared_with_email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {share.is_registered_user ? 'Active user' : 'Pending invitation'}
                            </div>
                          </div>
                        </div>
                       
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={share.permission}
                            onValueChange={(value: 'read' | 'write') => 
                              updatePermission(share.id, value)
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">
                                <div className="flex items-center gap-2">
                                  <SharePermissionIcon permission="read" className="h-3 w-3" />
                                  <span className="text-xs">View Only</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="write">
                                <div className="flex items-center gap-2">
                                  <SharePermissionIcon permission="write" className="h-3 w-3" />
                                  <span className="text-xs">Can Edit</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeShare(share.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Dialog actions */}
        <div className="flex justify-end pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="h-9">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}