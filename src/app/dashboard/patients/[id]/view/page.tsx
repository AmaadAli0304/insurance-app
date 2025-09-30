
"use client";

import { useState, useEffect } from "react";
import { getPatientById, getClaimsForPatientTimeline } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    FileText, User, Mail, Phone, Calendar, Hash, Users, MapPin, Building, Briefcase, Stethoscope, 
    HeartPulse, Pill, File as FileIcon, Eye, AlertTriangle, Baby, CircleDollarSign, Info, Activity, 
    History, Scissors, Syringe, MessageSquare, HandCoins, Loader2 
} from "lucide-react";
import { format } from 'date-fns';
import type { Patient, Claim, PreAuthStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClaimTimeline } from "@/components/claim-timeline";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";


const DetailItem = ({ label, value, icon: Icon, className, isBoolean = false }: { label: string, value?: string | number | null | boolean, icon?: React.ElementType, className?: string, isBoolean?: boolean }) => {
    let displayValue: React.ReactNode = "N/A";
    if (isBoolean) {
        displayValue = value ? 'Yes' : 'No';
    } else if (value !== null && value !== undefined && value !== '') {
        displayValue = String(value);
    }
    
    return (
        <div className={cn("flex items-start gap-3", className)}>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />}
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{displayValue}</p>
            </div>
        </div>
    );
};

const DocumentLink = ({ doc, label }: { doc: { url: string; name: string; } | string | null | undefined, label: string }) => {
    if (!doc) return <DetailItem label={label} value="Not provided" icon={FileIcon} />;
    
    const docData = typeof doc === 'string' ? { url: doc, name: 'View Document' } : doc;
    
    return (
        <div className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
                <a href={docData.url} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> View
                </a>
            </Button>
        </div>
    );
};


const getStatusVariant = (status?: PreAuthStatus) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'Approval':
      case 'Amount Sanctioned':
      case 'Initial Approval':
      case 'Settlement Done':
      case 'Approved':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Query Raised':
      case 'Initial Approval Amount':
        return 'secondary';
      default: // Pending, Query Answered, Draft
        return 'secondary';
    }
}


export default function ViewPatientPage() {
    const params = useParams();
    const id = params.id as string;
    const [patient, setPatient] = useState<Patient | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const [patientData, claimsData] = await Promise.all([
                    getPatientById(id),
                    getClaimsForPatientTimeline(id)
                ]);

                if (!patientData) {
                    notFound();
                    return;
                }
                setPatient(patientData);
                setClaims(claimsData);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const formatDate = (dateString?: string | null, includeTime: boolean = false) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            const formatString = includeTime ? 'MMMM dd, yyyy p' : 'MMMM dd, yyyy';
            // Check for invalid date strings that result in a valid but incorrect date object
            if (isNaN(date.getTime())) return "Invalid Date";
            const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
            return format(adjustedDate, formatString);
        } catch {
            return "Invalid Date";
        }
    };


    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-destructive">Error: {error}</div>;
    }

    if (!patient) {
        return notFound();
    }

    const photoUrl = patient.photo && typeof patient.photo === 'object' ? patient.photo.url : null;
    const latestClaimStatus = claims.length > 0 ? claims[claims.length - 1].status as PreAuthStatus : undefined;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={photoUrl ?? undefined} alt={patient.fullName} />
                        <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                        <CardTitle className="text-3xl">{patient.fullName}</CardTitle>
                        <CardDescription>Patient Details</CardDescription>
                    </div>
                     {latestClaimStatus ? (
                         <div className="flex flex-col items-center gap-2">
                             <span className="text-sm text-muted-foreground">Pre-Auth Status</span>
                             <Badge variant={getStatusVariant(latestClaimStatus)} className="text-base px-4 py-1">{latestClaimStatus}</Badge>
                         </div>
                     ) : (
                         <Button asChild>
                            <Link href={`/dashboard/pre-auths/new?patientId=${patient.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Fill Pre-Auth Request
                            </Link>
                        </Button>
                     )}
                </CardHeader>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>A. Patient Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="First Name" value={patient.firstName} icon={User} />
                        <DetailItem label="Last Name" value={patient.lastName} icon={User} />
                        <DetailItem label="Email Address" value={patient.email_address} icon={Mail} />
                        <DetailItem label="Contact Number" value={patient.phoneNumber} icon={Phone} />
                        <DetailItem label="Alternate Number" value={patient.alternative_number} icon={Phone} />
                        <DetailItem label="Date of Birth" value={formatDate(patient.dateOfBirth)} icon={Calendar} />
                        <DetailItem label="Gender" value={patient.gender} icon={Users} />
                        <DetailItem label="Occupation" value={patient.occupation} icon={Briefcase} />
                        <DetailItem label="Employee ID" value={patient.employee_id} icon={Hash} />
                        <DetailItem label="ABHA ID" value={patient.abha_id} icon={Hash} />
                        <DetailItem label="Health ID / UHID" value={patient.health_id} icon={Hash} />
                        <DetailItem label="Address" value={patient.address} className="md:col-span-2 lg:col-span-3" icon={MapPin} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>B. KYC &amp; Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                       <DocumentLink doc={patient.adhaar_path} label="Aadhaar Card" />
                       <DocumentLink doc={patient.pan_path} label="PAN Card" />
                       <DocumentLink doc={patient.passport_path} label="Passport" />
                       <DocumentLink doc={patient.voter_id_path} label="Voter ID" />
                       <DocumentLink doc={patient.driving_licence_path} label="Driving License" />
                       <DocumentLink doc={patient.policy_path} label="Policy File" />
                       <DocumentLink doc={patient.other_path} label="Other Document" />
                       <DocumentLink doc={patient.discharge_summary_path} label="Discharge Summary" />
                       <DocumentLink doc={patient.final_bill_path} label="Final Bill" />
                       <DocumentLink doc={patient.pharmacy_bill_path} label="Pharmacy Bill" />
                       <DocumentLink doc={patient.implant_bill_stickers_path} label="Implant Bill/Stickers" />
                       <DocumentLink doc={patient.lab_bill_path} label="Lab Bill" />
                       <DocumentLink doc={patient.ot_anesthesia_notes_path} label="OT/Anesthesia Notes" />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>C. Insurance &amp; Admission Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Insurance Company" value={patient.companyName} icon={Building} />
                        <DetailItem label="TPA" value={patient.tpaName} icon={Briefcase} />
                        <DetailItem label="Policy Number" value={patient.policyNumber} icon={FileText} />
                        <DetailItem label="Member ID" value={patient.memberId} icon={Hash} />
                        <DetailItem label="Relationship to Policyholder" value={patient.relationship_policyholder} icon={Users} />
                        <DetailItem label="Policy Start Date" value={formatDate(patient.policyStartDate)} icon={Calendar} />
                        <DetailItem label="Policy End Date" value={formatDate(patient.policyEndDate)} icon={Calendar} />
                        <DetailItem label="Sum Insured" value={patient.sumInsured ? patient.sumInsured.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Sum Utilized" value={patient.sumUtilized ? patient.sumUtilized.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Total Available Sum" value={patient.totalSum ? patient.totalSum.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Corporate Policy" value={patient.corporate_policy_number} icon={FileText} />
                        <DetailItem label="Other Insurance" value={patient.other_policy_name} icon={FileText} />
                        <DetailItem label="Family Physician" value={patient.family_doctor_name} icon={Stethoscope} />
                        <DetailItem label="Family Physician Contact" value={patient.family_doctor_phone} icon={Phone} />
                        <DetailItem label="Payer Email" value={patient.payer_email} icon={Mail} />
                        <DetailItem label="Payer Phone" value={patient.payer_phone} icon={Phone} />
                        <DetailItem label="Admission ID" value={patient.admission_id} icon={Hash} />
                        <DetailItem label="Treating Doctor" value={patient.treat_doc_name} icon={Stethoscope} />
                        <DetailItem label="Doctor Contact" value={patient.treat_doc_number} icon={Phone} />
                        <DetailItem label="Doctor Qualification" value={patient.treat_doc_qualification} icon={FileText} />
                        <DetailItem label="Doctor Registration No." value={patient.treat_doc_reg_no} icon={Hash} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>D. Clinical Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Nature of Illness" value={patient.natureOfIllness} icon={Activity} />
                        <DetailItem label="Duration of Ailment" value={patient.ailmentDuration ? `${patient.ailmentDuration} days` : null} icon={Calendar} />
                        <DetailItem label="First Consultation Date" value={formatDate(patient.firstConsultationDate)} icon={Calendar} />
                        <DetailItem label="Past History" value={patient.pastHistory} className="md:col-span-2 lg:col-span-3" icon={History} />
                        <DetailItem label="Provisional Diagnosis" value={patient.provisionalDiagnosis} icon={HeartPulse} />
                        <DetailItem label="ICD-10 Codes" value={patient.icd10Codes} icon={Hash} />
                        <DetailItem label="Medical Treatment" value={patient.treatmentMedical} icon={Pill} />
                        <DetailItem label="Surgical Treatment" value={patient.treatmentSurgical} icon={Scissors} />
                        <DetailItem label="Intensive Care" value={patient.treatmentIntensiveCare} icon={HeartPulse} />
                        <DetailItem label="Investigation" value={patient.treatmentInvestigation} icon={Syringe} />
                        <DetailItem label="Non-Allopathic" value={patient.treatmentNonAllopathic} icon={Syringe} />
                        <DetailItem label="Route of Drug" value={patient.drugRoute} icon={Syringe} />
                        <DetailItem label="Procedure Name" value={patient.procedureName} icon={Scissors} />
                        <DetailItem label="ICD-10 PCS Codes" value={patient.icd10PcsCodes} icon={Hash} />
                        <DetailItem label="Investigation Details" value={patient.investigationDetails} className="md:col-span-2 lg:col-span-3" icon={Info} />
                        <DetailItem label="Other Treatments" value={patient.otherTreatments} className="md:col-span-2 lg:col-span-3" icon={Info} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>E. Additional Information (Accident / Maternity)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <h4 className="font-semibold text-lg">Accident / Medico-Legal</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <DetailItem label="Is Injury Case?" value={patient.isInjury} isBoolean icon={AlertTriangle} />
                            <DetailItem label="Cause of Injury" value={patient.injuryCause} icon={Info} />
                            <DetailItem label="Is RTA?" value={patient.isRta} isBoolean icon={AlertTriangle} />
                            <DetailItem label="Date of Injury" value={formatDate(patient.injuryDate)} icon={Calendar} />
                            <DetailItem label="Reported to Police?" value={patient.isReportedToPolice} isBoolean icon={Info} />
                            <DetailItem label="FIR Number" value={patient.firNumber} icon={Hash} />
                            <DetailItem label="Alcohol Suspected?" value={patient.isAlcoholSuspected} isBoolean icon={AlertTriangle} />
                            <DetailItem label="Toxicology Conducted?" value={patient.isToxicologyConducted} isBoolean icon={Info} />
                        </div>
                        <h4 className="font-semibold text-lg border-t pt-6">Maternity</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <DetailItem label="Is Maternity Case?" value={patient.isMaternity} isBoolean icon={Baby} />
                            <DetailItem label="G | P | L | A" value={`${patient.g ?? 'N/A'} | ${patient.p ?? 'N/A'} | ${patient.l ?? 'N/A'} | ${patient.a ?? 'N/A'}`} icon={Hash} />
                            <DetailItem label="Expected Delivery Date" value={formatDate(patient.expectedDeliveryDate)} icon={Calendar} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>F. Admission &amp; Cost Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Admission Date" value={formatDate(patient.admissionDate)} icon={Calendar} />
                        <DetailItem label="Admission Time" value={patient.admissionTime} icon={Info} />
                        <DetailItem label="Admission Type" value={patient.admissionType} icon={Info} />
                        <DetailItem label="Expected Stay" value={patient.expectedStay ? `${patient.expectedStay} days` : 'N/A'} icon={Calendar} />
                        <DetailItem label="Expected ICU Stay" value={patient.expectedIcuStay ? `${patient.expectedIcuStay} days` : 'N/A'} icon={Calendar} />
                        <DetailItem label="Room Category" value={patient.roomCategory} icon={Building} />
                        <DetailItem label="Room/Nursing Cost" value={patient.roomNursingDietCost ? patient.roomNursingDietCost.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Investigation Cost" value={patient.investigationCost ? patient.investigationCost.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="ICU Cost" value={patient.icuCost ? patient.icuCost.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="OT Cost" value={patient.otCost ? patient.otCost.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Professional Fees" value={patient.professionalFees ? patient.professionalFees.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Medicine Cost" value={patient.medicineCost ? patient.medicineCost.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Other Expenses" value={patient.otherHospitalExpenses ? patient.otherHospitalExpenses.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Package Charges" value={patient.packageCharges ? patient.packageCharges.toLocaleString() : null} icon={CircleDollarSign} />
                        <DetailItem label="Total Estimated Cost" value={patient.totalExpectedCost ? patient.totalExpectedCost.toLocaleString() : null} className="font-bold text-lg" icon={CircleDollarSign} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>G. Medical History (Chief Complaints)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {patient.complaints && patient.complaints.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Complaint</TableHead>
                                        <TableHead>Duration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patient.complaints.map(complaint => (
                                        <TableRow key={complaint.id}>
                                            <TableCell>{complaint.name}</TableCell>
                                            <TableCell>{complaint.durationValue} {complaint.durationUnit}(s)</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground">No medical history recorded.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Communication Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ClaimTimeline claims={claims} patientName={patient.fullName} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
