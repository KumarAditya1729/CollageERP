import { supabase } from "@/integrations/supabase/client";

export interface MCQQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  marks: number;
}

export interface StudentAnswer {
  question_id: string;
  selected_option_index: number;
}

export class GradingService {
  /**
   * Auto-grade a submission containing multiple-choice questions
   */
  static autoGradeMCQ(
    questions: MCQQuestion[],
    studentAnswers: StudentAnswer[]
  ): { obtained_marks: number; max_marks: number; feedback: any[] } {
    let obtained_marks = 0;
    let max_marks = 0;
    const feedback = [];

    for (const q of questions) {
      max_marks += q.marks;
      const answer = studentAnswers.find((a) => a.question_id === q.id);

      if (answer && answer.selected_option_index === q.correct_option_index) {
        obtained_marks += q.marks;
        feedback.push({ question_id: q.id, status: "correct", awarded: q.marks });
      } else {
        feedback.push({
          question_id: q.id,
          status: "incorrect",
          awarded: 0,
          correct_option_index: q.correct_option_index,
        });
      }
    }

    return { obtained_marks, max_marks, feedback };
  }

  /**
   * Saves the auto-graded result to the database
   */
  static async saveGradingResult(
    submissionId: string,
    assignmentId: string,
    obtainedMarks: number,
    feedback: any[]
  ): Promise<void> {
    // 1. Create the grade record
    const { error: gradeError } = await supabase
      .from("lms_grades")
      .insert({
        submission_id: submissionId,
        assignment_id: assignmentId,
        marks: obtainedMarks,
        rubric_scores: { feedback },
        is_published: true,
      } as any);

    if (gradeError) {
      console.error("Failed to save grade", gradeError);
      throw gradeError;
    }

    // 2. Update submission status
    const { error: subError } = await supabase
      .from("lms_submissions")
      .update({
        status: "graded",
      })
      .eq("id", submissionId);
      
    if (subError) throw subError;
  }
}
