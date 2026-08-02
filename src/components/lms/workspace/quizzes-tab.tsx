import { Clock, ClipboardList, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/hooks/useAuth";
import {
  useMyStudent,
  useMyFaculty,
  useQuizzes,
  useQuizAttempts,
  useStartAttempt,
  useSubmitAttempt,
  QuizRow,
  QuizAttemptRow,
  QuizQuestionRow,
} from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export function QuizzesTab({ workspace }: { workspace: any }) {
  const { user } = useAuth();
  const { can } = useAccess();
  const student = useMyStudent();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const quizzes = useQuizzes();
  const quizAttempts = useQuizAttempts();
  const workspaceQuizzes = quizzes.data?.filter((q) => q.workspace_id === workspace.id) ?? [];

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizInstructions, setQuizInstructions] = useState("");
  const [quizDuration, setQuizDuration] = useState("30");
  const [quizMarks, setQuizMarks] = useState("50");
  const [quizShuffle, setQuizShuffle] = useState(true);
  const [negMarking, setNegMarking] = useState("0");
  const [attemptLimit, setAttemptLimit] = useState("3");
  const quizMutation = useResourceMutations({ table: "lms_quizzes" });

  const [activeQuizId, setActiveQuizId] = useState("");
  const [activeAttemptId, setActiveAttemptId] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(1800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAttempt = useStartAttempt();
  const submitAttempt = useSubmitAttempt();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState<QuizAttemptRow | null>(null);

  useEffect(() => {
    if (activeAttemptId) {
      const autosaveInterval = setInterval(() => {
        localStorage.setItem(`quiz_autosave_${activeAttemptId}`, JSON.stringify(answers));
        toast.info("Answers autosaved locally.", { duration: 1500 });
      }, 5000);
      return () => clearInterval(autosaveInterval);
    }
    return undefined;
  }, [activeAttemptId, answers]);

  useEffect(() => {
    if (activeQuizId && quizTimeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setQuizTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timerRef.current!);
    } else if (activeQuizId && quizTimeLeft === 0) {
      toast.warning("Time limit reached. Autosubmitting quiz...");
      void handleSubmitQuiz();
    }
    return undefined;
  }, [activeQuizId, quizTimeLeft]);

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) return;
    await quizMutation.create.mutateAsync({
      workspace_id: workspace.id,
      course_id: workspace.course_id,
      title: quizTitle.trim(),
      instructions: quizInstructions.trim() || null,
      total_marks: Number(quizMarks) || 50,
      duration_minutes: Number(quizDuration) || 30,
      allow_shuffle: quizShuffle,
      negative_marks: Number(negMarking) || 0,
      max_attempts: Number(attemptLimit) || 3,
      status: "published",
    });
    setQuizOpen(false);
    setQuizTitle("");
    setQuizInstructions("");
    void quizzes.refetch();
  };

  const handleStartQuiz = async (quizId: string) => {
    const quiz = workspaceQuizzes.find((q) => q.id === quizId);
    if (!quiz) return;

    setActiveQuizId(quizId);
    setQuizTimeLeft((quiz.duration_minutes || 30) * 60);

    const { data: qQuestions, error: qError } = await supabase
      .from("lms_quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position");
    if (qError) {
      toast.error(qError.message);
      return;
    }

    let formattedQuestions = (qQuestions || []).map((q) => ({
      ...q,
      options: (q.options || []) as unknown as { value: string; label: string }[],
      answer_key: (q.answer_key || []) as unknown as string[],
    })) as unknown as QuizQuestionRow[];

    if (quiz.allow_shuffle) {
      formattedQuestions = [...formattedQuestions].sort(() => Math.random() - 0.5);
    }

    setActiveQuestions(formattedQuestions);

    const attemptId = await startAttempt.mutateAsync({
      quiz: quiz as QuizRow,
      questions: formattedQuestions,
      studentId: student.data?.id || user?.id || "",
      attemptNo: 1,
    });
    setActiveAttemptId(attemptId);
  };

  const handleSubmitQuiz = async () => {
    const quiz = workspaceQuizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return;

    const quizResponses: Record<string, string[]> = {};
    Object.entries(answers).forEach(([qId, val]) => {
      quizResponses[qId] = [val];
    });

    await submitAttempt.mutateAsync({
      attemptId: activeAttemptId,
      quiz: quiz as QuizRow,
      questions: activeQuestions,
      responses: quizResponses,
      timeSpent: (quiz.duration_minutes || 30) * 60 - quizTimeLeft,
    });
    setActiveQuizId("");
    setActiveAttemptId("");
    setActiveQuestions([]);
    setAnswers({});
    void quizAttempts.refetch();
    toast.success("Quiz submitted successfully!");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Quizzes & Assessments</h3>
        {isFaculty && (
          <Button size="sm" onClick={() => setQuizOpen(true)}>
            <Plus className="size-4" /> Create Quiz
          </Button>
        )}
      </div>

      {activeQuizId ? (
        <Card className="shadow-none border border-primary">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Quiz in Progress</CardTitle>
                <CardDescription className="mt-1">
                  Do not refresh or close this tab. Your answers are auto-saving.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                <Badge
                  variant={quizTimeLeft < 300 ? "destructive" : "default"}
                  className="text-lg py-1 px-3"
                >
                  {Math.floor(quizTimeLeft / 60)}:
                  {(quizTimeLeft % 60).toString().padStart(2, "0")}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">This quiz has no questions.</p>
            ) : (
              activeQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-3 rounded border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Q{idx + 1}. {q.body}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {q.difficulty || "medium"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(q.options) &&
                      q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="size-3.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <DialogFooter className="p-4 bg-muted/10 border-t">
            <Button variant="outline" onClick={() => setActiveQuizId("")}>
              Cancel
            </Button>
            <Button onClick={handleSubmitQuiz}>Submit Quiz</Button>
          </DialogFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaceQuizzes.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                icon={ClipboardList}
                title="No Quizzes scheduled"
                description="Quizzes and midterm tests will appear here."
              />
            </div>
          ) : (
            workspaceQuizzes.map((quiz) => {
              const attempt = quizAttempts.data?.find((a) => a.quiz_id === quiz.id);
              return (
                <Card key={quiz.id} className="shadow-none border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">{quiz.title}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <Clock className="size-3" /> {quiz.duration_minutes} minutes · Max
                          Attempts: {quiz.max_attempts}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{quiz.total_marks} marks</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quiz.instructions && (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                        {quiz.instructions}
                      </p>
                    )}
                    <div className="flex justify-between items-center border-t pt-3 mt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Status:{" "}
                        {attempt ? (
                          <Badge className="ml-1 capitalize">{attempt.status}</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1">
                            Not started
                          </Badge>
                        )}
                      </span>
                      {!isFaculty && !attempt && (
                        <Button size="sm" onClick={() => handleStartQuiz(quiz.id)}>
                          Start Quiz
                        </Button>
                      )}
                      {attempt && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Score: {Number(attempt.score) || "Pending grading"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReviewAttempt(attempt);
                              setReviewOpen(true);
                            }}
                          >
                            Review Attempts
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="q-title">Quiz Title</Label>
            <Input
              id="q-title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
            <Label htmlFor="q-inst">Instructions</Label>
            <Textarea
              id="q-inst"
              value={quizInstructions}
              onChange={(e) => setQuizInstructions(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="q-marks">Total Marks</Label>
                <Input
                  id="q-marks"
                  type="number"
                  value={quizMarks}
                  onChange={(e) => setQuizMarks(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="q-dur">Duration (min)</Label>
                <Input
                  id="q-dur"
                  type="number"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="q-att">Attempt Limit</Label>
                <Input
                  id="q-att"
                  type="number"
                  value={attemptLimit}
                  onChange={(e) => setAttemptLimit(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="q-neg">Negative Marking (e.g. 0.25)</Label>
                <Input
                  id="q-neg"
                  type="number"
                  step="0.1"
                  value={negMarking}
                  onChange={(e) => setNegMarking(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="q-shuf"
                checked={quizShuffle}
                onChange={(e) => setQuizShuffle(e.target.checked)}
              />
              <Label htmlFor="q-shuf">Shuffle questions automatically</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
