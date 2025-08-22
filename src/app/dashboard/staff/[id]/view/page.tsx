
import { getStaffById } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

const AssociationList = ({ title, items, icon }: { title: string, items: { id: string | number, name: string }[], icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            {icon}
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map(item => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No {title.toLowerCase()} assigned.</p>
            )}
        </CardContent>
    </Card>
);

export default async function ViewStaffPage({ params }: { params: { id: string } }) {
    const staffId = Number(params.id);
    if (isNaN(staffId)) {
        notFound();
    }
    const staff = await getStaffById(staffId);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/staff">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Staff Details</h1>
                    <p className="text-muted-foreground">Viewing profile for {staff.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Member Information</CardTitle>
                         {staff.status && <Badge variant={staff.status === 'Active' ? 'default' : 'destructive'} className={staff.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>{staff.status}</Badge>}
                    </div>
                    <CardDescription>Contact and professional details for the staff member.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Full Name" value={staff.name} />
                    <DetailItem label="Email Address" value={staff.email} />
                    <DetailItem label="Contact Number" value={staff.number} />
                    <DetailItem label="Designation" value={staff.designation} />
                    <DetailItem label="Department" value={staff.department} />
                    <DetailItem label="Shift Timing" value={staff.shiftTime} />
                    <DetailItem label="Joining Date" value={formatDate(staff.joiningDate)} />
                    <DetailItem label="End Date" value={formatDate(staff.endDate)} />
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-1 gap-6">
                 <AssociationList 
                    title="Assigned Hospitals" 
                    items={staff.assignedHospitalsDetails || []} 
                    icon={<Building className="h-6 w-6 text-primary" />} 
                />
            </div>

        </div>
    );
}
