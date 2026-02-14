import type { ScorecardData } from '@/lib/parseSSCHtml';
import { BarChart3, User, MapPin, Calendar, Clock, BookOpen } from 'lucide-react';

interface ScorecardProps {
  data: ScorecardData;
}

const Scorecard = ({ data }: ScorecardProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Candidate Info */}
      {data.candidateInfo && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Candidate Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.candidateInfo.candidateName && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.candidateName}</p>
                </div>
              </div>
            )}
            {data.candidateInfo.rollNumber && (
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.rollNumber}</p>
                </div>
              </div>
            )}
            {data.candidateInfo.venueName && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.venueName}</p>
                </div>
              </div>
            )}
            {data.candidateInfo.examDate && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Exam Date</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.examDate}</p>
                </div>
              </div>
            )}
            {data.candidateInfo.examTime && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Exam Time</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.examTime}</p>
                </div>
              </div>
            )}
            {data.candidateInfo.subject && (
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="font-semibold text-foreground">{data.candidateInfo.subject}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Section-wise Breakdown</h2>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-2 px-6 py-4 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Part</div>
          <div className="col-span-2">Subject</div>
          <div className="text-center">Correct</div>
          <div className="text-center">Wrong</div>
          <div className="text-center">Skipped</div>
          <div className="text-right">Score</div>
        </div>

        {/* Section Rows */}
        {data.sections.map((section) => (
          <div
            key={section.part}
            className="grid grid-cols-7 gap-2 px-6 py-5 border-t border-border items-center hover:bg-muted/30 transition-colors"
          >
            <div>
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {section.part}
              </span>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-foreground">{section.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                +{section.marksPerCorrect} / -{section.negativePerWrong}
              </p>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-lg dark:bg-emerald-950/30 dark:text-emerald-400">
                {section.correct}
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 text-red-500 font-bold text-lg dark:bg-red-950/30 dark:text-red-400">
                {section.wrong}
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground font-bold text-lg">
                {section.skipped}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-foreground">{section.score.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground"> /{section.maxMarks}</span>
            </div>
          </div>
        ))}

        {/* Total Row */}
        <div className="grid grid-cols-7 gap-2 px-6 py-5 border-t-2 border-primary/20 bg-primary/5 items-center">
          <div className="col-span-3">
            <p className="text-xl font-bold text-foreground">Total</p>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-lg dark:bg-emerald-950/50 dark:text-emerald-400">
              {data.totalCorrect}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 text-red-600 font-bold text-lg dark:bg-red-950/50 dark:text-red-400">
              {data.totalWrong}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground font-bold text-lg">
              {data.totalSkipped}
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{data.totalScore.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground"> /{data.totalMaxMarks}</span>
          </div>
        </div>

        {/* Qualifying Section */}
        {data.qualifyingSection && (
          <div className="grid grid-cols-7 gap-2 px-6 py-5 border-t border-border items-center bg-muted/20">
            <div>
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {data.qualifyingSection.part}
              </span>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-foreground">
                {data.qualifyingSection.subject}
                <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Qualifying
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                +{data.qualifyingSection.marksPerCorrect} / -{data.qualifyingSection.negativePerWrong}
              </p>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-lg dark:bg-emerald-950/30 dark:text-emerald-400">
                {data.qualifyingSection.correct}
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 text-red-500 font-bold text-lg dark:bg-red-950/30 dark:text-red-400">
                {data.qualifyingSection.wrong}
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground font-bold text-lg">
                {data.qualifyingSection.skipped}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-foreground">{data.qualifyingSection.score.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground"> /{data.qualifyingSection.maxMarks}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scorecard;
