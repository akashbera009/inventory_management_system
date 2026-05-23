import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountService, UpdateProfilePayload } from '@/features/accounts/services/accountService';
import { Edit2, Save, X } from 'lucide-react';

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  STAFF: 'bg-gray-100 text-gray-800',
};

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<UpdateProfilePayload>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: accountService.getProfile,
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: accountService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      setEditValues({});
    },
  });

  const handleStartEdit = () => {
    if (!profile) return;
    setEditValues({
      name: profile.name,
      date_of_birth: profile.date_of_birth ?? '',
      address: profile.address,
      state: profile.state,
      city: profile.city,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const payload: UpdateProfilePayload = { ...editValues };
    if (payload.date_of_birth === '') payload.date_of_birth = null;
    updateMutation.mutate(payload);
  };

  const avatarLetter = profile?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading profile…</div>
        ) : profile ? (
          <div className="space-y-5 py-2">
            {/* Avatar + name + role */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold border-2 border-border">
                {avatarLetter}
              </div>
              <div>
                <p className="text-lg font-semibold">{profile.name || profile.username}</p>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                <span
                  className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    ROLE_STYLES[profile.role] ?? 'bg-muted text-muted-foreground'
                  }`}
                >
                  {profile.role}
                </span>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Editable fields */}
            {isEditing ? (
              <div className="space-y-3 border border-border rounded-lg p-4">
                <div className="space-y-1">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={editValues.name ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={editValues.date_of_birth ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={editValues.address ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input
                      value={editValues.city ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input
                      value={editValues.state ?? ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, state: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{profile.date_of_birth ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[profile.city, profile.state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                {profile.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{profile.address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                  >
                    <X size={14} className="mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="gap-1"
                  >
                    <Save size={14} />
                    {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={handleStartEdit} className="gap-1">
                  <Edit2 size={14} />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
