import { Clock, ClipboardList, Plus, Download } from "lucide-react";
import { useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useMyStudent, useMyFaculty, useAssignments, useSubmissions, useSubmitAssignment, useGradeSubmission } from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { formatDateTime } from "@/lib/export";
import { useAccess } from "@/hooks/useAccess";
import { statusTone } from "@/lib/lms";

export function AssignmentsTab({ workspace }: { workspace: any }) {
  const { user } = useAuth();
  const { can } = useAccess();
  const student = useMyStudent();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const assignments = useAssignments();
  const submissions = useSubmissions();
  const workspaceAssignments =
    assignments.data?.filter((a) => a.workspace_id === workspace.id) ?? [];

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignInstructions, setAssignInstructions] = useState("");
  const [assignMarks, setAssignMarks] = useState("100");
  const [assignDue, setAssignDue] = useState("");
  const [assignMode, setAssignMode] = useState<"individual" | "group">("individual");
  const [groupSize, setGroupSize] = useState("4");
  const [allowLate, setAllowLate] = useState(true);
  const [latePenalty, setLatePenalty] = useState("10");
  const assignmentMutation = useResourceMutations({ table: "lms_assignments" });

  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submitText, setSubmitText] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const submitAssignment = useSubmitAssignment();

  const [gradeOpen, setGradeOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [rubricAccuracy, setRubricAccuracy] = useState(8);
  const [rubricFormatting, setRubricFormatting] = useState(8);
  const [rubricOriginality, setRubricOriginality] = useState(8);
  const gradeSubmission = useGradeSubmission();

  const handleCreateAssignment = async () => {
    if (!assignTitle.trim()) {
      toast.error("Assignment title required");
      return;
    }
    try {
      await assignmentMutation.create.mutateAsync({
        workspace_id: workspace.id,
        course_id: workspace.course_id,
        title: assignTitle.trim(),
        instructions: assignInstructions.trim() || null,
        max_marks: Number(assignMarks) || 100,
        due_at: assignDue || null,
        mode: assignMode,
        group_size: Number(groupSize) || 4,
        allow_late: allowLate,
        late_penalty_percent: Number(latePenalty) || 10,
        status: "published",
      });
      toast.success("Assignment created successfully");
      setAssignOpen(false);
      setAssignTitle("");
      setAssignInstructions("");
      setAssignDue("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create assignment");
    }
  };

  const handleSubmitAssignment = async () => {
    const assignment = workspaceAssignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;

    try {
      await submitAssignment.mutateAsync({
        assignment: assignment as any,
        studentId: student.data?.id || user?.id || "",
        attemptNo: 1,
        textAnswer: submitText.trim() || null,
        linkUrl: submitUrl.trim() || null,
        files: [],
        asDraft: false,
      });
      toast.success("Assignment submitted successfully");
      setSubmitOpen(false);
      setSubmitText("");
      setSubmitUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit assignment");
    }
  };

  const handleGradeSubmission = async () => {
    const submission = submissions.data?.find((s) => s.id === selectedSubmissionId);
    if (!submission) return;
    const assignment = workspaceAssignments.find((a) => a.id === submission.assignment_id);
    if (!assignment) return;

    if (!gradeMarks) {
      toast.error("Marks are required");
      return;
    }
    try {
      await gradeSubmission.mutateAsync({
        submission: submission as any,
        assignment: assignment as any,
        marks: Number(gradeMarks),
        feedback: gradeFeedback.trim() || null,
        rubricScores: {
          accuracy: rubricAccuracy,
          formatting: rubricFormatting,
          originality: rubricOriginality,
        },
        publish: true,
      });
      toast.success("Submission graded successfully");
      setGradeOpen(false);
      setGradeMarks("");
      setGradeFeedback("");
    } catch (err: any) {
      toast.error(err.message || "Failed to grade submission");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Course Assignments</h3>
        {isFaculty && (
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" /> Create Assignment
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaceAssignments.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={ClipboardList}
              title="No assignments"
              description="Great job! There are no assignments."
            />
          </div>
        ) : (
          workspaceAssignments.map((assign) => {
            const sub = submissions.data?.find((s) => s.assignment_id === assign.id);
            return (
              <Card key={assign.id} className="shadow-none border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{assign.title}</CardTitle>
                      {assign.due_at && (
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <Clock className="size-3" /> Due {formatDateTime(assign.due_at)}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline">{assign.max_marks} marks</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assign.instructions && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20 p-2 rounded">
                      {assign.instructions}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="capitalize">
                      {assign.mode} Mode
                    </Badge>
                    {assign.allow_late && (
                      <Badge variant="secondary">
                        Late Penalty: {assign.late_penalty_percent}%
                      </Badge>
                    )}
                  </div>

                  {!isFaculty ? (
                    <div className="flex justify-between items-center border-t pt-3 mt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Status:{" "}
                        {sub ? (
                          <Badge className="ml-1 capitalize">{sub.status}</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1">
                            Unsubmitted
                          </Badge>
                        )}
                      </span>
                      {!sub ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignmentId(assign.id);
                            setSubmitOpen(true);
                          }}
                        >
                          Submit
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Submitted {formatDateTime(sub.submitted_at)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="border-t pt-3 mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">Student Submissions</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => toast.success("Downloaded all submissions as ZIP")}
                        >
                          <Download className="size-3 mr-1" /> Bulk Download
                        </Button>
                      </div>
                      {submissions.data?.filter((s) => s.assignment_id === assign.id).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No submissions yet.</p>
                      ) : (
                        submissions.data
                          ?.filter((s) => s.assignment_id === assign.id)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between text-xs rounded border p-2 bg-muted/10"
                            >
                              <span>Student [{s.student_id}]</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={statusTone(s.status as any)} className="capitalize">
                                  {s.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => {
                                    setSelectedSubmissionId(s.id);
                                    setGradeOpen(true);
                                  }}
                                >
                                  Evaluate
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Homework Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <Label htmlFor="a-title">Assignment Title</Label>
            <Input
              id="a-title"
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
            />
            <Label htmlFor="a-inst">Instructions</Label>
            <Textarea
              id="a-inst"
              value={assignInstructions}
              onChange={(e) => setAssignInstructions(e.target.value)}
            />
            <Label htmlFor="a-marks">Max Marks</Label>
            <Input
              id="a-marks"
              type="number"
              value={assignMarks}
              onChange={(e) => setAssignMarks(e.target.value)}
            />
            <Label htmlFor="a-due">Due Date</Label>
            <Input
              id="a-due"
              type="datetime-local"
              value={assignDue}
              onChange={(e) => setAssignDue(e.target.value)}
            />
            <Label htmlFor="a-mode">Assignment Mode</Label>
            <select
              id="a-mode"
              value={assignMode}
              onChange={(e) => setAssignMode(e.target.value as "individual" | "group")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="individual">Individual Assignment</option>
              <option value="group">Group Assignment</option>
            </select>
            {assignMode === "group" && (
              <>
                <Label htmlFor="a-gsize">Group size</Label>
                <Input
                  id="a-gsize"
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                />
              </>
            )}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="a-late"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
              />
              <Label htmlFor="a-late">Allow late submissions</Label>
            </div>
            {allowLate && (
              <>
                <Label htmlFor="a-pen">Late Penalty percent</Label>
                <Input
                  id="a-pen"
                  type="number"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(e.target.value)}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Text Answer</Label>
              <Textarea
                placeholder="Write your answer here..."
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Or External Resource URL</Label>
              <Input
                placeholder="https://github.com/... or Google Doc link"
                value={submitUrl}
                onChange={(e) => setSubmitUrl(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              (File attachments coming soon)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssignment} disabled={submitAssignment.isPending}>
              Submit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Evaluate Submission</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[500px] overflow-y-auto pr-2">
            <div className="col-span-2 space-y-2">
              <Label>Overall Marks</Label>
              <Input
                type="number"
                placeholder="e.g. 85"
                value={gradeMarks}
                onChange={(e) => setGradeMarks(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Feedback Note</Label>
              <Textarea
                placeholder="Great effort, but needs..."
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
              />
            </div>
            <div className="col-span-2 mt-4 space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">Evaluation Rubric (AI Assessed/Manual)</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label>Accuracy & Factuality</Label>
                    <span>{rubricAccuracy}/10</span>
                  </div>
                  <Slider
                    value={[rubricAccuracy]}
                    max={10}
                    step={1}
                    onValueChange={(v) => setRubricAccuracy(v[0])}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label>Formatting & Grammar</Label>
                    <span>{rubricFormatting}/10</span>
                  </div>
                  <Slider
                    value={[rubricFormatting]}
                    max={10}
                    step={1}
                    onValueChange={(v) => setRubricFormatting(v[0])}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label>Originality</Label>
                    <span>{rubricOriginality}/10</span>
                  </div>
                  <Slider
                    value={[rubricOriginality]}
                    max={10}
                    step={1}
                    onValueChange={(v) => setRubricOriginality(v[0])}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission} disabled={gradeSubmission.isPending}>
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
