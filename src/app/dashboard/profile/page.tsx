
"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value || "N/A"}</p>
    </div>
);

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    let photoUrl: string | undefined = undefined;
    if (user.photo) {
        try {
            const photoData = JSON.parse(user.photo);
            photoUrl = photoData.url;
        } catch {
            if (typeof user.photo === 'string' && user.photo.startsWith('http')) {
                photoUrl = user.photo;
            }
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={photoUrl} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center gap-2">
                        <CardTitle className="text-3xl">{user.name}</CardTitle>
                        {user.role && <Badge variant="default" className="bg-accent text-accent-foreground">{user.role}</Badge>}
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <DetailItem label="Designation" value={user.designation} />
                    <DetailItem label="Department" value={user.department} />
                    <DetailItem label="Contact Number" value={user.number} />
                    <DetailItem label="Shift Timing" value={user.shiftTime} />
                    <DetailItem label="Status" value={user.status} />
                    <DetailItem label="Joining Date" value={user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'} />
                </CardContent>
            </Card>
        </div>
    );
}
