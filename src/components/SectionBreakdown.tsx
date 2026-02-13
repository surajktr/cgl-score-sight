import { BarChart2, Gift } from 'lucide-react';
import type { SectionData } from '@/lib/mockData';

interface SectionBreakdownProps {
  sections: SectionData[];
  maxScore: number;
}

export const SectionBreakdown = ({ sections, maxScore }: SectionBreakdownProps) => {
  const hasBonus = sections.some(s => (s.bonus || 0) > 0);
  const nonQualifyingSections = sections.filter(s => !s.isQualifying);
  const qualifyingSections = sections.filter(s => s.isQualifying);
  const totalCorrect = nonQualifyingSections.reduce((sum, s) => sum + s.correct, 0);
  const totalWrong = nonQualifyingSections.reduce((sum, s) => sum + s.wrong, 0);
  const totalUnattempted = nonQualifyingSections.reduce((sum, s) => sum + s.unattempted, 0);
  const totalBonus = nonQualifyingSections.reduce((sum, s) => sum + (s.bonus || 0), 0);
  const totalScore = nonQualifyingSections.reduce((sum, s) => sum + s.score, 0);
  
  return (
    <div className="card-elevated p-4 sm:p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        Section-wise Breakdown
      </h2>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {nonQualifyingSections.map((section) => (
          <div 
            key={section.part}
            className="p-4 rounded-lg border border-border/50 bg-muted/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {section.part}
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {section.subject}
                </span>
              </div>
              {section.isQualifying && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Qualifying
                </span>
              )}
            </div>
            <div className={`grid gap-2 text-center ${hasBonus ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <div className="p-2 rounded-md bg-correct-bg">
                <div className="text-sm font-bold text-correct">{section.correct}</div>
                <div className="text-xs text-correct/70">Correct</div>
              </div>
              <div className="p-2 rounded-md bg-wrong-bg">
                <div className="text-sm font-bold text-wrong">{section.wrong}</div>
                <div className="text-xs text-wrong/70">Wrong</div>
              </div>
              <div className="p-2 rounded-md bg-unattempted-bg">
                <div className="text-sm font-bold text-unattempted">{section.unattempted}</div>
                <div className="text-xs text-unattempted/70">Skip</div>
              </div>
              {hasBonus && (
                <div className="p-2 rounded-md bg-purple-100">
                  <div className="text-sm font-bold text-purple-700">{section.bonus || 0}</div>
                  <div className="text-xs text-purple-600">Bonus</div>
                </div>
              )}
              <div className="p-2 rounded-md bg-primary/10">
                <div className="text-sm font-bold text-primary">{section.score.toFixed(1)}</div>
                <div className="text-xs text-primary/70">/{section.maxMarks}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              +{section.correctMarks} / -{section.negativeMarks}
            </div>
          </div>
        ))}

        <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Total</span>
            </div>
          </div>
          <div className={`grid gap-2 text-center ${hasBonus ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <div className="p-2 rounded-md bg-correct-bg">
              <div className="text-sm font-bold text-correct">{totalCorrect}</div>
              <div className="text-xs text-correct/70">Correct</div>
            </div>
            <div className="p-2 rounded-md bg-wrong-bg">
              <div className="text-sm font-bold text-wrong">{totalWrong}</div>
              <div className="text-xs text-wrong/70">Wrong</div>
            </div>
            <div className="p-2 rounded-md bg-unattempted-bg">
              <div className="text-sm font-bold text-unattempted">{totalUnattempted}</div>
              <div className="text-xs text-unattempted/70">Skip</div>
            </div>
            {hasBonus && (
              <div className="p-2 rounded-md bg-purple-100">
                <div className="text-sm font-bold text-purple-700">{totalBonus}</div>
                <div className="text-xs text-purple-600">Bonus</div>
              </div>
            )}
            <div className="p-2 rounded-md bg-primary/10">
              <div className="text-sm font-bold text-primary">{totalScore.toFixed(1)}</div>
              <div className="text-xs text-primary/70">/{maxScore}</div>
            </div>
          </div>
        </div>

        {qualifyingSections.map((section) => (
          <div 
            key={section.part}
            className="p-4 rounded-lg border border-border/50 bg-muted/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {section.part}
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {section.subject}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Qualifying</span>
            </div>
            <div className={`grid gap-2 text-center ${hasBonus ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <div className="p-2 rounded-md bg-correct-bg">
                <div className="text-sm font-bold text-correct">{section.correct}</div>
                <div className="text-xs text-correct/70">Correct</div>
              </div>
              <div className="p-2 rounded-md bg-wrong-bg">
                <div className="text-sm font-bold text-wrong">{section.wrong}</div>
                <div className="text-xs text-wrong/70">Wrong</div>
              </div>
              <div className="p-2 rounded-md bg-unattempted-bg">
                <div className="text-sm font-bold text-unattempted">{section.unattempted}</div>
                <div className="text-xs text-unattempted/70">Skip</div>
              </div>
              {hasBonus && (
                <div className="p-2 rounded-md bg-purple-100">
                  <div className="text-sm font-bold text-purple-700">{section.bonus || 0}</div>
                  <div className="text-xs text-purple-600">Bonus</div>
                </div>
              )}
              <div className="p-2 rounded-md bg-primary/10">
                <div className="text-sm font-bold text-primary">{section.score.toFixed(1)}</div>
                <div className="text-xs text-primary/70">/{section.maxMarks}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              +{section.correctMarks} / -{section.negativeMarks}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Part</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marks</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-correct uppercase tracking-wider">Correct</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-wrong uppercase tracking-wider">Wrong</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-unattempted uppercase tracking-wider">Skipped</th>
              {hasBonus && (
                <th className="text-center py-3 px-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1">
                    <Gift className="h-3 w-3" />
                    Bonus
                  </span>
                </th>
              )}
              <th className="text-right py-3 px-2 text-xs font-semibold text-primary uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {nonQualifyingSections.map((section) => (
              <tr 
                key={section.part} 
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-4 px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    {section.part}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{section.subject}</span>
                    {section.isQualifying && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Qualifying
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    +{section.correctMarks} / -{section.negativeMarks}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-correct-bg text-correct font-semibold text-sm">
                    {section.correct}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-wrong-bg text-wrong font-semibold text-sm">
                    {section.wrong}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-unattempted-bg text-unattempted font-semibold text-sm">
                    {section.unattempted}
                  </span>
                </td>
                {hasBonus && (
                  <td className="py-4 px-2 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-purple-100 text-purple-700 font-semibold text-sm">
                      {section.bonus || 0}
                    </span>
                  </td>
                )}
                <td className="py-4 px-2 text-right">
                  <span className="score-display text-lg font-bold text-primary">{section.score.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground ml-1">/{section.maxMarks}</span>
                </td>
              </tr>
            ))}
            <tr className="bg-muted/30">
              <td className="py-4 px-2 font-semibold text-foreground" colSpan={3}>Total</td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-correct">{totalCorrect}</span>
              </td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-wrong">{totalWrong}</span>
              </td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-unattempted">{totalUnattempted}</span>
              </td>
              {hasBonus && (
                <td className="py-4 px-2 text-center">
                  <span className="font-bold text-purple-700">{totalBonus}</span>
                </td>
              )}
              <td className="py-4 px-2 text-right">
                <span className="score-display text-xl font-bold text-primary">{totalScore.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground ml-1">/{maxScore}</span>
              </td>
            </tr>
            {qualifyingSections.map((section) => (
              <tr 
                key={section.part}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-4 px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    {section.part}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{section.subject}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Qualifying</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-xs text-muted-foreground">+{section.correctMarks} / -{section.negativeMarks}</span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-correct-bg text-correct font-semibold text-sm">
                    {section.correct}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-wrong-bg text-wrong font-semibold text-sm">
                    {section.wrong}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-unattempted-bg text-unattempted font-semibold text-sm">
                    {section.unattempted}
                  </span>
                </td>
                {hasBonus && (
                  <td className="py-4 px-2 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-purple-100 text-purple-700 font-semibold text-sm">
                      {section.bonus || 0}
                    </span>
                  </td>
                )}
                <td className="py-4 px-2 text-right">
                  <span className="score-display text-lg font-bold text-primary">{section.score.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground ml-1">/{section.maxMarks}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
