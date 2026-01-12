import { User, Calendar, Clock, MapPin, FileText, Award } from 'lucide-react';
import type { CandidateInfo } from '@/lib/mockData';

interface CandidateInfoCardProps {
  candidate: CandidateInfo;
}

export const CandidateInfoCard = ({ candidate }: CandidateInfoCardProps) => {
  const infoItems = [
    { icon: FileText, label: 'Roll Number', value: candidate.rollNumber },
    { icon: User, label: 'Candidate Name', value: candidate.name },
    { icon: Award, label: 'Exam Level', value: candidate.examLevel },
    { icon: Calendar, label: 'Test Date', value: candidate.testDate },
    { icon: Clock, label: 'Shift', value: candidate.shift },
    { icon: MapPin, label: 'Centre', value: candidate.centreName },
  ];

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        Candidate Information
      </h2>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className="text-sm font-medium text-foreground break-words">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
