import { BarChart2 } from 'lucide-react';
import type { SectionData } from '@/lib/mockData';

interface SectionBreakdownProps {
  sections: SectionData[];
}

export const SectionBreakdown = ({ sections }: SectionBreakdownProps) => {
  return (
    <div className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        Section-wise Breakdown
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Part</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-correct uppercase tracking-wider">Correct</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-wrong uppercase tracking-wider">Wrong</th>
              <th className="text-center py-3 px-2 text-xs font-semibold text-unattempted uppercase tracking-wider">Skipped</th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-primary uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, index) => (
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
                  <span className="text-sm font-medium text-foreground">{section.subject}</span>
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
                <td className="py-4 px-2 text-right">
                  <span className="score-display text-lg font-bold text-primary">{section.score}</span>
                  <span className="text-xs text-muted-foreground ml-1">/50</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30">
              <td className="py-4 px-2 font-semibold text-foreground" colSpan={2}>Total</td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-correct">
                  {sections.reduce((sum, s) => sum + s.correct, 0)}
                </span>
              </td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-wrong">
                  {sections.reduce((sum, s) => sum + s.wrong, 0)}
                </span>
              </td>
              <td className="py-4 px-2 text-center">
                <span className="font-bold text-unattempted">
                  {sections.reduce((sum, s) => sum + s.unattempted, 0)}
                </span>
              </td>
              <td className="py-4 px-2 text-right">
                <span className="score-display text-xl font-bold text-primary">
                  {sections.reduce((sum, s) => sum + s.score, 0)}
                </span>
                <span className="text-sm text-muted-foreground ml-1">/200</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
