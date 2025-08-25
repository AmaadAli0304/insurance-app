
import { getStaffById } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";


const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

export default async function ViewStaffPage({ params }: { params: { id: string } }) {
    const staff = await getStaffById(params.id);

    if (!staff) {
        notFound();
    }
    
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch {
            return "Invalid Date";
        }
    };

    const getInitials = (name: string) => {
      if (!name) return 'U';
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                           <AvatarImage src={staff.photo ?? undefined} alt={staff.name} />
                           <AvatarFallback className="text-3xl">{getInitials(staff.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-3xl">{staff.name}</CardTitle>
                                {staff.status && <Badge variant={staff.status === 'Active' ? 'default' : 'destructive'} className={staff.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>{staff.status}</Badge>}
                            </div>
                            <CardDescription>Contact and professional details for {staff.name}.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                    <DetailItem label="Email Address" value={staff.email} />
                    <DetailItem label="Contact Number" value={staff.number} />
                    <DetailItem label="Designation" value={staff.designation} />
                    <DetailItem label="Department" value={staff.department} />
                    <DetailItem label="Shift Timing" value={staff.shiftTime} />
                    <DetailItem label="Joining Date" value={formatDate(staff.joiningDate)} />
                    <DetailItem label="End Date" value={formatDate(staff.endDate)} />
                </CardContent>
            </Card>
        </div>
    );
}
