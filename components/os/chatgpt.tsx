"use client";

import {
  useEffect,
  useEffectEvent,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useReducedMotion } from "motion/react";
import { classifyPrompt, type ChatIntent } from "./chatgpt-intent";
import MatrixRain from "./matrix-rain";

type Phase =
  | "idle"
  | "thinking"
  | "answering"
  | "replied"
  | "erasing"
  | "rethinking"
  | "matrix"
  | "rain";

type ScriptLine = {
  text: string;
  reveal: "type" | "instant";
  holdMs: number;
};

const ANSWER = `Here's a simple framework that works for almost anything:

1. Define the outcome. Write down, in one sentence, what "done" looks like.
2. Break it down. Split the work into steps you can finish in under an hour.
3. Start with the smallest step. Momentum beats motivation.
4. Review and adjust. After each step, ask what you learned and what to change.

If you share a bit more context, I can tailor this to your situation.`;

// The answer is cut off mid-sentence before it gets erased.
const ANSWER_CUTOFF = ANSWER.indexOf("Momentum");
if (ANSWER_CUTOFF < 0) {
  throw new Error('The ChatGPT answer must include the word "Momentum".');
}

// The film types the first three lines and drops the knock in all at once.
const MATRIX_SCRIPT: readonly ScriptLine[] = [
  { text: "Wake up, Neo...", reveal: "type", holdMs: 2600 },
  { text: "The Matrix has you...", reveal: "type", holdMs: 2600 },
  { text: "Follow the white rabbit.", reveal: "type", holdMs: 2400 },
  { text: "Knock, knock, Neo.", reveal: "instant", holdMs: 3200 },
];

const GREETING_REPLY = "Hi.";
const AGENT_REPLY = "Yes, I am.";

// Sit on "Thinking" before a short reply or the matrix sequence.
const THINKING_MS = 4000;
const REPLY_TICK_MS = 70;
const STREAM_TICK_MS = 28;
const ANSWER_HOLD_MS = 700;
const ERASE_TICK_MS = 10;
const ERASE_CHUNK = 3;
const RETHINKING_MS = 2600;
const THEME_SHIFT_MS = 1600;
const MATRIX_LINE_GAP_MS = 500;

const BUSY_PHASES: readonly Phase[] = [
  "thinking",
  "answering",
  "erasing",
  "rethinking",
  "matrix",
];
const MATRIX_PHASES: readonly Phase[] = ["matrix", "rain"];

const directReplyFor = (intent: ChatIntent) => {
  if (intent === "greeting") {
    return GREETING_REPLY;
  }
  if (intent === "agent") {
    return AGENT_REPLY;
  }
  return "";
};

const keystrokeDelay = (character: string) => {
  const jitter = 60 + Math.random() * 120;
  if (character === "," || character === ".") {
    return jitter + 220;
  }
  return jitter;
};

const streamChunkSize = () => 2 + Math.floor(Math.random() * 4);

const NewChatIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-none stroke-current">
    <path
      d="M10 3.5H5.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V10"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M14.6 2.9a1.6 1.6 0 0 1 2.3 2.3L10.5 11.6l-3 .7.7-3 6.4-6.4Z"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current opacity-50">
    <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-none stroke-current">
    <path d="M10 15.5v-11M5 9l5-5 5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StopIcon = () => (
  <span aria-hidden="true" className="block size-3 rounded-[3px] bg-current" />
);

const ThinkingLabel = () => (
  <p
    role="status"
    className="w-fit animate-[chatgpt-shimmer_1.8s_linear_infinite] bg-[linear-gradient(90deg,#9b9b9b_0%,#9b9b9b_40%,#0d0d0d_50%,#9b9b9b_60%,#9b9b9b_100%)] bg-size-[200%_100%] bg-clip-text text-transparent"
  >
    Thinking
  </p>
);

const ChatGPTApp = () => {
  const reduceMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState<ChatIntent>("matrix");
  const [answer, setAnswer] = useState("");
  const [matrixLine, setMatrixLine] = useState("");
  const [runId, setRunId] = useState(0);
  const readReduceMotion = useEffectEvent(() => reduceMotion);

  useEffect(() => {
    if (runId === 0) {
      return;
    }
    // Clearing the timers leaves the script parked on its pending await.
    const timers = new Set<number>();
    const wait = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, milliseconds);
        timers.add(timer);
      });
    const isInstant = readReduceMotion();

    const streamAnswer = async () => {
      if (isInstant) {
        setAnswer(ANSWER.slice(0, ANSWER_CUTOFF));
        return;
      }
      for (let length = 0; length < ANSWER_CUTOFF; ) {
        length = Math.min(ANSWER_CUTOFF, length + streamChunkSize());
        setAnswer(ANSWER.slice(0, length));
        await wait(STREAM_TICK_MS);
      }
    };

    const eraseAnswer = async () => {
      if (isInstant) {
        setAnswer("");
        return;
      }
      for (let length = ANSWER_CUTOFF; length > 0; ) {
        length = Math.max(0, length - ERASE_CHUNK);
        setAnswer(ANSWER.slice(0, length));
        await wait(ERASE_TICK_MS);
      }
    };

    const typeMatrixLine = async (line: ScriptLine) => {
      if (isInstant || line.reveal === "instant") {
        setMatrixLine(line.text);
        return;
      }
      for (let length = 1; length <= line.text.length; length += 1) {
        await wait(keystrokeDelay(line.text[length - 1]));
        setMatrixLine(line.text.slice(0, length));
      }
    };

    const typeReply = async (reply: string) => {
      setPhase("answering");
      if (isInstant) {
        setAnswer(reply);
        setPhase("replied");
        return;
      }
      for (let length = 1; length <= reply.length; length += 1) {
        setAnswer(reply.slice(0, length));
        await wait(REPLY_TICK_MS);
      }
      setPhase("replied");
    };

    const playConversation = async () => {
      await wait(THINKING_MS);
      const reply = directReplyFor(intent);
      if (reply !== "") {
        await typeReply(reply);
        return;
      }
      setPhase("answering");
      await streamAnswer();
      await wait(ANSWER_HOLD_MS);
      setPhase("erasing");
      await eraseAnswer();
      setPhase("rethinking");
      await wait(RETHINKING_MS);
      setPhase("matrix");
      await wait(THEME_SHIFT_MS);
      for (const line of MATRIX_SCRIPT) {
        await typeMatrixLine(line);
        await wait(line.holdMs);
        setMatrixLine("");
        await wait(MATRIX_LINE_GAP_MS);
      }
      setPhase("rain");
    };

    playConversation();

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [intent, runId]);

  const isBusy = BUSY_PHASES.includes(phase);
  const isMatrix = MATRIX_PHASES.includes(phase);
  const hasConversation = prompt !== "";
  const isThinking = phase === "thinking" || phase === "rethinking";
  const isStreaming = phase === "answering" || phase === "erasing";
  const showAnswer = isStreaming || phase === "replied";
  const canSend = !isBusy && draft.trim() !== "";

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    const nextPrompt = draft.trim();
    setPrompt(nextPrompt);
    setIntent(classifyPrompt(nextPrompt));
    setDraft("");
    setAnswer("");
    setMatrixLine("");
    setPhase("thinking");
    setRunId((current) => current + 1);
  };

  const handleNewChat = () => {
    setPrompt("");
    setDraft("");
    setIntent("matrix");
    setAnswer("");
    setMatrixLine("");
    setPhase("idle");
    setRunId(0);
  };

  return (
    <div
      data-theme={isMatrix ? "matrix" : "light"}
      data-follows-keyboard
      className="chatgpt-app group relative flex h-full min-h-[320px] w-full flex-col max-[700px]:min-h-0 overflow-hidden bg-white text-[15px] leading-7 text-[#0d0d0d] transition-colors duration-[1400ms] [font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] data-[theme=matrix]:bg-black data-[theme=matrix]:font-mono data-[theme=matrix]:text-[#3dff7a]"
    >
      <header className="flex h-12 shrink-0 items-center justify-between px-3">
        <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-lg font-medium">
          ChatGPT
          <ChevronIcon />
        </span>
        <button
          type="button"
          aria-label="New chat"
          onClick={handleNewChat}
          className="grid size-9 place-items-center rounded-lg text-[#5d5d5d] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#0d0d0d] group-data-[theme=matrix]:text-[#3dff7a] group-data-[theme=matrix]:hover:bg-[#3dff7a]/10"
        >
          <NewChatIcon />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-[var(--keyboard-overlap,0px)]">
        {hasConversation ? (
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-5 py-6">
            <p className="ml-auto max-w-[80%] rounded-3xl bg-[#f4f4f4] px-4 py-2 break-words whitespace-pre-wrap transition-colors duration-[1400ms] group-data-[theme=matrix]:border group-data-[theme=matrix]:border-[#3dff7a]/30 group-data-[theme=matrix]:bg-[#03140a]">
              {prompt}
            </p>
            <div aria-live="polite" className="min-h-7">
              {isThinking && <ThinkingLabel />}
              {showAnswer && (
                <p className="whitespace-pre-wrap">
                  {answer}
                  {isStreaming && (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block size-3 rounded-full bg-current align-middle"
                    />
                  )}
                </p>
              )}
              {phase === "matrix" && (
                <p className="[text-shadow:0_0_6px_rgba(61,255,122,0.55)]">
                  <span>{matrixLine}</span>
                  <span
                    aria-hidden="true"
                    className="ml-px inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] animate-[matrix-cursor-blink_1.05s_steps(1)_infinite] bg-[#3dff7a] shadow-[0_0_8px_rgba(61,255,122,0.7)]"
                  />
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center px-5">
            <h2 className="text-center text-[28px] leading-tight font-normal">
              What can I help with?
            </h2>
          </div>
        )}
      </main>

      <form autoComplete="off" onSubmit={handleSubmit} className="relative z-[1] mx-auto w-full max-w-[720px] shrink-0 translate-y-[calc(var(--keyboard-overlap,0px)*-1)] bg-white px-4 pb-2 transition-colors duration-[1400ms] group-data-[theme=matrix]:bg-black">
        <div className="flex items-center gap-2 rounded-[28px] border border-black/10 bg-white py-2 pr-2 pl-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-colors duration-[1400ms] group-data-[theme=matrix]:border-[#3dff7a]/30 group-data-[theme=matrix]:bg-black group-data-[theme=matrix]:shadow-none">
          <input
            type="text"
            value={draft}
            onChange={handleDraftChange}
            disabled={isBusy}
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="send"
            spellCheck
            aria-label="Message ChatGPT"
            placeholder="Ask anything"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-[#8f8f8f] disabled:cursor-not-allowed group-data-[theme=matrix]:placeholder:text-[#3dff7a]/40"
          />
          <button
            type="submit"
            disabled={!canSend}
            data-busy={isBusy || undefined}
            aria-label={isBusy ? "Responding" : "Send prompt"}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0d0d0d] text-white transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d0d0d] disabled:opacity-30 data-busy:opacity-100 group-data-[theme=matrix]:bg-[#3dff7a] group-data-[theme=matrix]:text-black"
          >
            {isBusy ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
        <p className="py-2 text-center text-xs text-[#5d5d5d] group-data-[theme=matrix]:text-[#3dff7a]/50">
          ChatGPT can make mistakes. Check important info.
        </p>
      </form>

      {phase === "rain" && (
        <button
          type="button"
          autoFocus
          aria-label="Wake up again: start a new chat"
          onClick={handleNewChat}
          className="absolute inset-0 z-10 cursor-pointer bg-black focus:outline-none"
        >
          <MatrixRain isAnimated={!reduceMotion} />
          <span className="absolute right-4 bottom-3 left-4 text-right font-mono text-xs text-[#3dff7a]/50">
            <span className="pointer-coarse:hidden">press enter to wake up again</span>
            <span className="hidden pointer-coarse:inline">tap to wake up again</span>
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatGPTApp;
