import { useState, useTransition } from "react";
import { Sparkles, Send, Bot, User, CornerDownLeft, Zap, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const SAMPLE_SUGGESTIONS = [
  "Summarize fee collection deficits for B.Tech CSE Semester 4",
  "Generate attendance warning email draft for attendance below 75%",
  "Identify faculty workload imbalances in Mechanical Engineering",
  "Draft statutory compliance audit summary report for Q3",
];

export function AICopilotButton({ className, variant = "default", showText = true }: { className?: string; variant?: "default" | "outline" | "ghost"; showText?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Hello! I am your CampusOS 3.0 Enterprise AI Copilot. I have real-time contextual awareness of admissions, attendance, fees, timetable, and campus operations. How can I assist your institution today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = (query?: string) => {
    const textToSend = query || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!query) setInput("");

    startTransition(() => {
      setTimeout(() => {
        let replyText = "I have analyzed the campus telemetry tables and cross-referenced current semester records. The requested institutional data has been synthesized and flagged in your administrative report feed.";
        if (textToSend.toLowerCase().includes("fee") || textToSend.toLowerCase().includes("deficit")) {
          replyText = "📊 Fee Analysis: 42 students in B.Tech CSE (Sem 4) currently have pending dues totaling ₹2,45,000. automated late-fee calculation of 2% has been scheduled for next Monday.";
        } else if (textToSend.toLowerCase().includes("attendance") || textToSend.toLowerCase().includes("warning")) {
          replyText = "✉️ Draft Generated: 'Dear Parent, this is an official advisory that your ward's attendance currently stands below the mandatory 75% threshold required for end-semester evaluations. Please arrange an interaction with the HoD.'";
        } else if (textToSend.toLowerCase().includes("faculty") || textToSend.toLowerCase().includes("workload")) {
          replyText = "⚖️ Workload Audit: Mechanical Engineering currently shows 3 faculty members exceeding 20 teaching hours/week, while 2 auxiliary instructors have open schedule blocks on Tuesdays.";
        } else if (textToSend.toLowerCase().includes("compliance") || textToSend.toLowerCase().includes("statutory")) {
          replyText = "🏛️ Compliance Check: AICTE and UGC statutory registers for Q3 are 98% complete. Only fire safety inspection renewal doc is pending attachment in Campus Operations.";
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 700);
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant === "default" ? "outline" : variant}
          size="sm"
          className={cn(
            "relative gap-2 font-semibold rounded-[14px] transition-all duration-180 bg-linear-to-r from-purple-600/15 via-blue-600/10 to-purple-600/10 border border-purple-500/30 text-purple-700 hover:border-purple-500/60 hover:shadow-sm dark:text-purple-300",
            className
          )}
        >
          <Sparkles className="size-4 text-purple-600 dark:text-purple-400 shrink-0 animate-pulse" />
          {showText && <span>Ask AI</span>}
          {showText && (
            <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 font-mono text-[10px] font-medium text-purple-600 dark:text-purple-300">
              <span>⌘</span>K
            </kbd>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden sm:rounded-[24px] border border-border bg-card shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-linear-to-r from-purple-500/5 via-primary/5 to-transparent border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                CampusOS AI Copilot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-semibold border border-purple-500/20">v3.0 Engine</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enterprise Intelligence connected to your live university database & statutory rules.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[420px] bg-background/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs text-xs",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-purple-600/10 text-purple-600 border border-purple-500/20 dark:text-purple-400"
                  )}
                >
                  {msg.sender === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-[18px] px-4 py-3 text-sm shadow-2xs group relative transition-all",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3 opacity-70 text-[10px]">
                    <span>{msg.timestamp}</span>
                    {msg.sender === "ai" && (
                      <button
                        onClick={() => copyToClipboard(msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-purple-500 flex items-center gap-1 font-medium cursor-pointer"
                        title="Copy text"
                      >
                        <Copy className="size-3" /> Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 border border-purple-500/20">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-[18px] bg-card border border-border px-4 py-3 text-xs font-mono flex items-center gap-2 text-muted-foreground">
                  <Zap className="size-3.5 text-amber-500 animate-bounce" />
                  Synthesizing campus data matrix...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-card border-t border-border/80">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SAMPLE_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="text-left text-xs bg-muted/60 hover:bg-muted border border-border/70 rounded-xl px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[280px] cursor-pointer"
                >
                  ✨ {sug}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI anything about admissions, attendance, financial ledgers, or compliance..."
                className="h-11 rounded-[14px] border-border bg-background focus-visible:ring-purple-500 pr-10 shadow-xs"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isPending}
                className="h-11 px-5 rounded-[14px] bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
              >
                <Send className="size-4 mr-1.5" />
                Analyze
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
