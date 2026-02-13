import {
    type ExamConfig,
    type SubjectConfig,
    type ExamType,
    type Language,
    calculateScore
} from './examConfig';
import {
    type QuestionData,
    type CandidateInfo,
    type SectionData,
    type AnalysisResult
} from './mockData';

// Helper: strip HTML tags and decode entities, preserve special chars
function stripHtml(html: string): string {
    // First handle superscript/subscript by converting to unicode-like representation
    let text = html
        .replace(/<sup[^>]*>\s*2\s*<\/sup>/gi, '²')
        .replace(/<sup[^>]*>\s*3\s*<\/sup>/gi, '³')
        .replace(/<sup[^>]*>\s*(\d+)\s*<\/sup>/gi, '^$1')
        .replace(/<sub[^>]*>\s*(\d+)\s*<\/sub>/gi, '₍$1₎')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n');

    // Strip remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Decode HTML entities - comprehensive list
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lsquo;/g, '\u2018')
        .replace(/&rsquo;/g, '\u2019')
        .replace(/&ldquo;/g, '\u201C')
        .replace(/&rdquo;/g, '\u201D')
        .replace(/&minus;/g, '\u2212')
        .replace(/&ndash;/g, '\u2013')
        .replace(/&mdash;/g, '\u2014')
        .replace(/&times;/g, '\u00D7')
        .replace(/&divide;/g, '\u00F7')
        .replace(/&plusmn;/g, '\u00B1')
        .replace(/&le;/g, '\u2264')
        .replace(/&ge;/g, '\u2265')
        .replace(/&ne;/g, '\u2260')
        .replace(/&sup2;/g, '\u00B2')
        .replace(/&sup3;/g, '\u00B3')
        .replace(/&frac12;/g, '\u00BD')
        .replace(/&frac14;/g, '\u00BC')
        .replace(/&frac34;/g, '\u00BE')
        .replace(/&deg;/g, '\u00B0')
        .replace(/&pi;/g, '\u03C0')
        .replace(/&alpha;/g, '\u03B1')
        .replace(/&beta;/g, '\u03B2')
        .replace(/&gamma;/g, '\u03B3')
        .replace(/&delta;/g, '\u03B4')
        .replace(/&theta;/g, '\u03B8')
        .replace(/&sigma;/g, '\u03C3')
        .replace(/&radic;/g, '\u221A')
        .replace(/&infin;/g, '\u221E')
        .replace(/&rarr;/g, '\u2192')
        .replace(/&larr;/g, '\u2190')
        .replace(/&darr;/g, '\u2193')
        .replace(/&uarr;/g, '\u2191')
        .replace(/&bull;/g, '\u2022')
        .replace(/&hellip;/g, '\u2026')
        .replace(/&trade;/g, '\u2122')
        .replace(/&copy;/g, '\u00A9')
        .replace(/&reg;/g, '\u00AE')
        .replace(/&rupee;/g, '\u20B9')
        // Numeric entities
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

    // Collapse multiple spaces but preserve newlines
    return text
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
}

// Helper to get Hindi/English URLs from an image URL
function getLanguageUrlsFromImage(imageUrl: string): { hindi?: string; english?: string } {
    if (!imageUrl) return {};

    // Check for _en or _hi suffix in filename
    const isEnglish = /_en\.(jpg|jpeg|png|gif)/i.test(imageUrl);
    const isHindi = /_hi\.(jpg|jpeg|png|gif)/i.test(imageUrl);

    if (isEnglish) {
        return {
            english: imageUrl,
            hindi: imageUrl.replace(/_en\.(jpg|jpeg|png|gif)/i, '_hi.$1'),
        };
    } else if (isHindi) {
        return {
            hindi: imageUrl,
            english: imageUrl.replace(/_hi\.(jpg|jpeg|png|gif)/i, '_en.$1'),
        };
    }

    // Default: return the URL as both
    return { hindi: imageUrl, english: imageUrl };
}

// Generate URLs for all parts based on exam config
function generatePartUrls(inputUrl: string, examConfig: ExamConfig): { part: string; url: string; subject: SubjectConfig }[] {
    const parts: { part: string; url: string; subject: SubjectConfig }[] = [];

    const urlParts = inputUrl.split('?');
    const queryString = urlParts[1] || '';
    const basePath = urlParts[0];
    const lastSlashIndex = basePath.lastIndexOf('/');
    const baseDir = basePath.substring(0, lastSlashIndex + 1);

    // Map parts to file names
    const partFileMap: Record<string, string> = {
        'A': 'ViewCandResponse.aspx',
        'B': 'ViewCandResponse2.aspx',
        'C': 'ViewCandResponse3.aspx',
        'D': 'ViewCandResponse4.aspx',
        'E': 'ViewCandResponse5.aspx',
    };

    for (const subject of examConfig.subjects) {
        const file = partFileMap[subject.part];
        if (file) {
            const url = `${baseDir}${file}${queryString ? '?' + queryString : ''}`;
            parts.push({ part: subject.part, url, subject });
        }
    }

    return parts;
}

// Parse candidate info from the HTML
function parseCandidateInfo(html: string): CandidateInfo {
    const getTableValue = (label: string): string => {
        const regex = new RegExp(
            `<td[^>]*>[^<]*${label}[^<]*<\\/td>\\s*<td[^>]*>:?(?:&nbsp;)*\\s*([^<]+)`,
            'i'
        );
        const match = html.match(regex);
        if (match) {
            return match[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return '';
    };

    return {
        rollNumber: getTableValue('Roll No') || getTableValue('Roll Number') || '',
        name: getTableValue('Candidate Name') || getTableValue('Participant Name') || getTableValue('Name') || '',
        examLevel: getTableValue('Exam Level') || getTableValue('Post Name') || getTableValue('Subject') || '',
        testDate: getTableValue('Test Date') || getTableValue('Exam Date') || '',
        shift: getTableValue('Test Time') || getTableValue('Shift') || getTableValue('Exam Time') || '',
        centreName: getTableValue('Test Center Name') || getTableValue('Test Centre Name') || getTableValue('Centre Name') || getTableValue('Center Name') || getTableValue('Exam Centre') || getTableValue('Venue') || getTableValue('Venue Name') || '',
    };
}

// Parse questions from HTML for a specific part (SSC Multi-page format)
function parseQuestionsForPart(
    html: string,
    part: string,
    baseUrl: string,
    subject: SubjectConfig,
    questionOffset: number
): QuestionData[] {
    console.log('=== LOCAL PARSER: parseQuestionsForPart ===');
    const questions: QuestionData[] = [];

    const urlParts = baseUrl.split('?')[0];
    const lastSlashIndex = urlParts.lastIndexOf('/');
    const baseDir = urlParts.substring(0, lastSlashIndex + 1);

    const questionTablePattern = /<table[^>]*>[\s\S]*?Q\.No:\s*&nbsp;(\d+)[\s\S]*?<\/table>/gi;
    let tableMatch;

    while ((tableMatch = questionTablePattern.exec(html)) !== null) {
        const qNum = parseInt(tableMatch[1]);
        const tableContent = tableMatch[0];

        // Helper to resolve URLs
        const resolveUrl = (src: string) => {
            if (!src) return '';
            if (src.startsWith('http')) return src;
            return baseDir + src;
        };

        const qImgPattern = /Q\.No:\s*&nbsp;\d+<\/font><\/td><td[^>]*>[\s\S]*?<img[^>]+src\s*=\s*["']([^"']+)["']/i;
        const qImgMatch = tableContent.match(qImgPattern);
        let questionImageUrl = qImgMatch ? resolveUrl(qImgMatch[1]) : '';

        // Get Hindi and English URLs for question image
        const questionLangUrls = getLanguageUrlsFromImage(questionImageUrl);

        // Ensure we always have valid URLs
        const finalQuestionHindiUrl = questionLangUrls.hindi || questionImageUrl;
        const finalQuestionEnglishUrl = questionLangUrls.english || questionImageUrl;

        const options: QuestionData['options'] = [];
        const optionIds = ['A', 'B', 'C', 'D'];

        const optionRowPattern = /<tr[^>]*(?:bgcolor\s*=\s*["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/tr>/gi;
        let optionMatch;
        let optIdx = 0;
        let foundQuestionRow = false;

        while ((optionMatch = optionRowPattern.exec(tableContent)) !== null && optIdx < 4) {
            const rowBgcolor = (optionMatch[1] || '').toLowerCase();
            const rowContent = optionMatch[2];

            if (rowContent.includes('Q.No:')) {
                foundQuestionRow = true;
                continue;
            }

            if (!foundQuestionRow) continue;

            // Extract ALL images from this option row using exec loop for better compatibility
            const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["']/gi;
            const imageUrls: string[] = [];
            let match;

            while ((match = imgRegex.exec(rowContent)) !== null) {
                let imgUrl = resolveUrl(match[1]);
                imageUrls.push(imgUrl);
            }

            // If no images found, skip this row
            if (imageUrls.length === 0) continue;

            // Determine which image is Hindi and which is English
            let hindiUrl = '';
            let englishUrl = '';
            let defaultUrl = imageUrls[0]; // Fallback to first image

            for (const url of imageUrls) {
                if (/_HI\.(jpg|jpeg|png|gif)/i.test(url)) {
                    hindiUrl = url;
                } else if (/_EN\.(jpg|jpeg|png|gif)/i.test(url)) {
                    englishUrl = url;
                }
            }

            // If we didn't find language-specific URLs, use the default and try getLanguageUrls
            if (!hindiUrl && !englishUrl) {
                const langUrls = getLanguageUrlsFromImage(defaultUrl);
                hindiUrl = langUrls.hindi || defaultUrl;
                englishUrl = langUrls.english || defaultUrl;
            } else {
                // If we found one but not the other, set the missing one to the default
                if (!hindiUrl) hindiUrl = englishUrl || defaultUrl;
                if (!englishUrl) englishUrl = hindiUrl || defaultUrl;
            }

            let bgcolor = rowBgcolor;
            if (!bgcolor) {
                const tdBgMatch = rowContent.match(/bgcolor\s*=\s*["']([^"']+)["']/i);
                if (tdBgMatch) {
                    bgcolor = tdBgMatch[1].toLowerCase();
                }
            }

            const isGreen = bgcolor.includes('green');
            const isRed = bgcolor.includes('red');
            const isYellow = bgcolor.includes('yellow');

            const isCorrect = isGreen || isYellow;
            const isSelected = isGreen || isRed;

            options.push({
                id: optionIds[optIdx],
                imageUrl: defaultUrl,
                imageUrlHindi: hindiUrl,
                imageUrlEnglish: englishUrl,
                isSelected,
                isCorrect,
            });

            optIdx++;
        }

        if (options.length >= 2) {
            while (options.length < 4) {
                options.push({
                    id: optionIds[options.length],
                    imageUrl: '',
                    imageUrlHindi: '',
                    imageUrlEnglish: '',
                    isSelected: false,
                    isCorrect: false,
                });
            }

            // Detect bonus question
            const hasCorrectOption = options.some(o => o.isCorrect);
            const isBonus = !hasCorrectOption;

            let status: 'correct' | 'wrong' | 'unattempted' | 'bonus' = 'unattempted';
            const hasSelected = options.some(o => o.isSelected);
            const selectedIsCorrect = options.some(o => o.isSelected && o.isCorrect);

            if (isBonus) {
                status = 'bonus';
            } else if (!hasSelected) {
                status = 'unattempted';
            } else if (selectedIsCorrect) {
                status = 'correct';
            } else {
                status = 'wrong';
            }

            const marksAwarded = status === 'bonus'
                ? subject.correctMarks
                : status === 'correct'
                    ? subject.correctMarks
                    : status === 'wrong'
                        ? -subject.negativeMarks
                        : 0;

            questions.push({
                questionNumber: questionOffset + qNum,
                part,
                subject: subject.name,
                questionImageUrl: questionImageUrl,
                questionImageUrlHindi: finalQuestionHindiUrl,
                questionImageUrlEnglish: finalQuestionEnglishUrl,
                options,
                status,
                marksAwarded,
                isBonus,
            });
        }
    }

    return questions;
}

// Parse the AssessmentQPHTMLMode1 answer key format (NTPC, etc.)
function parseAnswerKeyFormat(
    html: string,
    baseUrl: string,
    examConfig: ExamConfig
): { questions: QuestionData[]; candidate: CandidateInfo } {
    console.log('=== LOCAL PARSER: parseAnswerKeyFormat (with Q8 Fix) ===');

    const questions: QuestionData[] = [];

    // Helper to resolve relative URLs
    const resolveUrl = (src: string): string => {
        if (!src) return '';
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        if (src.startsWith('data:')) return src; // FIX: Handle data URIs
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) {
            try {
                const origin = new URL(baseUrl).origin;
                return origin + src;
            } catch {
                return baseUrl + src;
            }
        }
        return baseUrl + src;
    };

    // Find all section labels
    const sectionLabels: { index: number; name: string }[] = [];
    const sectionLblRegex = /<div[^>]*class\s*=\s*["'][^"']*section-lbl[^"']*["'][^>]*>[\s\S]*?<span[^>]*class\s*=\s*["']bold["'][^>]*>([^<]+)<\/span>/gi;
    let sectionMatch;
    while ((sectionMatch = sectionLblRegex.exec(html)) !== null) {
        sectionLabels.push({
            index: sectionMatch.index,
            name: sectionMatch[1].trim()
        });
    }

    const sectionToSubjectIndex: Record<number, number> = {};
    sectionLabels.forEach((section, idx) => {
        const moduleMatch = section.name.match(/Module\s+([IV]+)/i);
        if (moduleMatch) {
            const romanToNum: Record<string, number> = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4 };
            const moduleIdx = romanToNum[moduleMatch[1].toUpperCase()];
            if (moduleIdx !== undefined && moduleIdx < examConfig.subjects.length) {
                sectionToSubjectIndex[idx] = moduleIdx;
                return;
            }
        }
        if (idx < examConfig.subjects.length) {
            sectionToSubjectIndex[idx] = idx;
        }
    });

    const questionPanelPositions: number[] = [];
    const qpnlRegex = /class\s*=\s*["']question-pnl["']/gi;
    let qpnlMatch;
    while ((qpnlMatch = qpnlRegex.exec(html)) !== null) {
        questionPanelPositions.push(qpnlMatch.index);
    }

    const getSubjectForPosition = (pos: number): { subject: SubjectConfig; part: string } => {
        let sectionIdx = 0;
        for (let s = sectionLabels.length - 1; s >= 0; s--) {
            if (pos > sectionLabels[s].index) {
                sectionIdx = s;
                break;
            }
        }
        const subjectIdx = sectionToSubjectIndex[sectionIdx] ?? Math.min(sectionIdx, examConfig.subjects.length - 1);
        const subject = examConfig.subjects[subjectIdx];
        return { subject, part: subject.part };
    };

    const questionPanels = html.split(/class\s*=\s*["']question-pnl["']/i);
    let globalQuestionNumber = 0;

    for (let i = 1; i < questionPanels.length; i++) {
        const panelContent = questionPanels[i];
        globalQuestionNumber++;

        const qPos = questionPanelPositions[i - 1] || 0;
        const { subject: currentSubject, part: currentPart } = getSubjectForPosition(qPos);

        const qNumMatch = panelContent.match(/Q\.(\d+)/i);
        // const displayQNum = qNumMatch ? parseInt(qNumMatch[1]) : globalQuestionNumber;

        let questionText = '';
        let questionImageUrl = '';

        const questionTextMatch = panelContent.match(
            /Q\.\d+<\/td>\s*<td[^>]*class\s*=\s*["']bold["'][^>]*(?:style\s*=\s*["'][^"']*["'])?[^>]*>([\s\S]*?)(?=<\/td>)/i
        );
        if (questionTextMatch) {
            const rawContent = questionTextMatch[1];
            const textContent = stripHtml(rawContent);

            const qImgMatches = [...rawContent.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
            for (const match of qImgMatches) {
                const src = match[1];
                if (!src.includes('tick') && !src.includes('cross')) {
                    questionImageUrl = resolveUrl(src);
                    break;
                }
            }

            // FIX: Extract alt text from Wirisformula images as question text
            if (!textContent || textContent.length <= 3) {
                const altMatch = rawContent.match(/<img[^>]+alt\s*=\s*["']([^"']+)["'][^>]*>/i);
                if (altMatch) {
                    questionText = altMatch[1]
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/begin mathsize \d+px style\s*/i, '')
                        .replace(/\s*end style$/i, '')
                        .replace(/ space /g, ' ')
                        .replace(/ comma /g, ', ')
                        .replace(/ squared /g, '² ')
                        .trim();
                }
            }

            if (textContent.length > 3) {
                questionText = textContent;
            }
        }

        // Fallback: If no question text found yet, try extracting from general panel content
        if (!questionText && !questionImageUrl) {
            const allImgMatches = [...panelContent.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
            for (const match of allImgMatches) {
                const src = match[1];
                if (!src.includes('tick') && !src.includes('cross')) {
                    questionImageUrl = resolveUrl(src);
                    break;
                }
            }
        }

        const questionLangUrls = getLanguageUrlsFromImage(questionImageUrl);

        const options: QuestionData['options'] = [];
        const optionIds = ['A', 'B', 'C', 'D'];

        const answerRowRegex = /<td[^>]*class\s*=\s*["'](rightAns|wrngAns)["'][^>]*>([\s\S]*?)(?=<\/td>)/gi;
        let answerMatch;
        let optIdx = 0;

        while ((answerMatch = answerRowRegex.exec(panelContent)) !== null && optIdx < 4) {
            const rowClass = answerMatch[1];
            const rowContent = answerMatch[2];

            const isCorrectAnswer = rowClass === 'rightAns';
            const hasTickMark = rowContent.includes('tick.png');

            let optionImageUrl = '';
            let optionText = '';

            const optImgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
            let optImgMatch;
            while ((optImgMatch = optImgRegex.exec(rowContent)) !== null) {
                const src = optImgMatch[1];
                if (!src.includes('tick') && !src.includes('cross')) {
                    optionImageUrl = resolveUrl(src);
                    break;
                }
            }

            const textOnly = stripHtml(rowContent);
            const cleanedText = textOnly.replace(/^\d+\.\s*/, '').trim();
            if (cleanedText.length > 0) {
                optionText = cleanedText;
            }

            const optionLangUrls = getLanguageUrlsFromImage(optionImageUrl);

            options.push({
                id: optionIds[optIdx],
                imageUrl: optionImageUrl,
                imageUrlHindi: optionLangUrls.hindi || optionImageUrl,
                imageUrlEnglish: optionLangUrls.english || optionImageUrl,
                text: optionText || undefined,
                isSelected: hasTickMark,
                isCorrect: isCorrectAnswer,
            });

            optIdx++;
        }

        const chosenMatch = panelContent.match(/Chosen\s+Option\s*:[\s\S]*?<td[^>]*class\s*=\s*["']bold["'][^>]*>\s*([^<\s]+)/i);
        const chosenOption = chosenMatch ? chosenMatch[1].trim() : '';

        const hasCorrectOption = options.some(o => o.isCorrect);
        const isBonus = !hasCorrectOption;

        let status: 'correct' | 'wrong' | 'unattempted' | 'bonus' = 'unattempted';
        let hasSelected = options.some(o => o.isSelected);

        if (isBonus) {
            status = 'bonus';
        } else if (chosenOption === '--' || chosenOption === '' || chosenOption.includes('--')) {
            status = 'unattempted';
        } else {
            const chosenNum = parseInt(chosenOption);
            if (!isNaN(chosenNum) && chosenNum >= 1 && chosenNum <= 4) {
                const chosenIdx = chosenNum - 1;
                if (options[chosenIdx]) {
                    options[chosenIdx].isSelected = true;
                    hasSelected = true;
                    status = options[chosenIdx].isCorrect ? 'correct' : 'wrong';
                }
            } else if (hasSelected) {
                const selectedIsCorrect = options.some(o => o.isSelected && o.isCorrect);
                status = selectedIsCorrect ? 'correct' : 'wrong';
            }
        }

        const marksAwarded = status === 'bonus'
            ? currentSubject.correctMarks
            : status === 'correct'
                ? currentSubject.correctMarks
                : status === 'wrong'
                    ? -currentSubject.negativeMarks
                    : 0;

        while (options.length < 4) {
            options.push({
                id: optionIds[options.length],
                imageUrl: '',
                imageUrlHindi: '',
                imageUrlEnglish: '',
                text: undefined,
                isSelected: false,
                isCorrect: false,
            });
        }

        questions.push({
            questionNumber: globalQuestionNumber,
            part: currentPart,
            subject: currentSubject.name,
            questionImageUrl,
            questionImageUrlHindi: questionLangUrls.hindi || questionImageUrl,
            questionImageUrlEnglish: questionLangUrls.english || questionImageUrl,
            questionText: questionText || undefined,
            options,
            status,
            marksAwarded,
            isBonus,
        });
    }

    const candidateCandidate = parseCandidateInfo(html);

    return {
        questions,
        candidate: candidateCandidate
    };
}

export function analyzeResponseSheetLocal(
    html: string,
    url: string,
    examConfig: ExamConfig,
    language: Language
): AnalysisResult {
    console.log('Starting local analysis...');

    const baseUrl = url.split('?')[0].substring(0, url.lastIndexOf('/') + 1);

    let result: { questions: QuestionData[]; candidate: CandidateInfo };
    let candidate: CandidateInfo;
    let questions: QuestionData[];

    // Determine format
    const isSSCFormat = html.includes('ViewCandResponse.aspx');

    if (isSSCFormat) {
        // For SSC, we can't fully parse multipart locally properly without all parts, 
        // but if we are given just one page HTML, we parse what we can.
        // However, SSC usually requires fetching multiple pages. 
        // This local function presumes we have the HTML of the provided URL.
        // If the URL is just one part, we only get that one part's questions.

        // IMPORTANT: The edge function fetches all parts for SSC. 
        // Locally we can only parse the HTML we are given.

        // NOTE: This local parser is primarily to support the RAILWAY/NTPC case 
        // which is a single page (AssessmentQPHTMLMode1).

        // But let's implementing mostly for the single-page logic (NTPC).

        // Fallback for NTPC/Single page:
        result = parseAnswerKeyFormat(html, baseUrl, examConfig);
    } else {
        // Default to single page format (includes NTPC)
        result = parseAnswerKeyFormat(html, baseUrl, examConfig);
    }

    candidate = result.candidate;
    questions = result.questions;

    // Calculate section scores
    const sections: SectionData[] = examConfig.subjects.map(subject => {
        const subjectQuestions = questions.filter(q => q.subject === subject.name);

        const correct = subjectQuestions.filter(q => q.status === 'correct').length;
        const wrong = subjectQuestions.filter(q => q.status === 'wrong').length;
        const unattempted = subjectQuestions.filter(q => q.status === 'unattempted').length;
        const bonus = subjectQuestions.filter(q => q.status === 'bonus').length;

        // Calculate raw score logic
        const score = (correct * subject.correctMarks) - (wrong * subject.negativeMarks) + (bonus * subject.correctMarks);

        return {
            part: subject.part,
            subject: subject.name,
            correct,
            wrong,
            unattempted,
            bonus,
            score,
            maxMarks: subject.maxMarks,
            correctMarks: subject.correctMarks,
            negativeMarks: subject.negativeMarks,
            isQualifying: subject.isQualifying
        };
    });

    // Exclude qualifying subjects from total score
    const totalScore = sections.reduce((sum, s) => s.isQualifying ? sum : sum + s.score, 0);
    const correctCount = sections.reduce((sum, s) => sum + s.correct, 0);
    const wrongCount = sections.reduce((sum, s) => sum + s.wrong, 0);
    const unattemptedCount = sections.reduce((sum, s) => sum + s.unattempted, 0);
    const bonusCount = sections.reduce((sum, s) => sum + s.bonus, 0);

    return {
        candidate,
        examType: examConfig.id,
        examConfig,
        language,
        totalScore,
        maxScore: examConfig.maxMarks,
        totalQuestions: examConfig.totalQuestions,
        correctCount,
        wrongCount,
        unattemptedCount,
        bonusCount,
        sections,
        questions,
    };
}
