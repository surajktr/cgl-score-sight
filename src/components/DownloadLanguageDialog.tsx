import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Languages, FileText, Gamepad2 } from 'lucide-react';

export type DownloadLanguage = 'hindi' | 'english' | 'bilingual';

interface DownloadLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (language: DownloadLanguage) => void;
  mode: 'normal' | 'quiz';
}

export const DownloadLanguageDialog = ({
  open,
  onOpenChange,
  onConfirm,
  mode,
}: DownloadLanguageDialogProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<DownloadLanguage>('hindi');

  const handleConfirm = () => {
    onConfirm(selectedLanguage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Select Download Language
          </DialogTitle>
          <DialogDescription>
            Choose the language for your {mode === 'quiz' ? 'quiz' : 'answer key'} download.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup
            value={selectedLanguage}
            onValueChange={(value) => setSelectedLanguage(value as DownloadLanguage)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="hindi" id="hindi" />
              <Label htmlFor="hindi" className="flex-1 cursor-pointer">
                <div className="font-medium">हिंदी (Hindi)</div>
                <div className="text-sm text-muted-foreground">Download questions in Hindi only</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="english" id="english" />
              <Label htmlFor="english" className="flex-1 cursor-pointer">
                <div className="font-medium">English</div>
                <div className="text-sm text-muted-foreground">Download questions in English only</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
              <RadioGroupItem value="bilingual" id="bilingual" />
              <Label htmlFor="bilingual" className="flex-1 cursor-pointer">
                <div className="font-medium">Bilingual (Hindi + English)</div>
                <div className="text-sm text-muted-foreground">Download questions in both languages</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            {mode === 'quiz' ? (
              <Gamepad2 className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download {mode === 'quiz' ? 'Quiz' : 'Answer Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
