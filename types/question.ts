export interface Question {
  year: number | null;
  paper_code: string;
  question_no: string;
  question_text: string;
  subject: string;
  chapter: string;
  subtopic: string;
  theoretical_practical: string;
  marks: number | null;
  provenance: string;
  confidence: number;
}

export interface SubjectData {
  name: string;
  fileName: string;
  icon: string;
  description: string;
}

