"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { saveProgressAction } from "@/app/actions/quiz-progress";

type Option = { label: string; is_correct: boolean };
type Question = {
  word_card_id: string;
  question: string;
  options: Option[];
};

type Phase = "quiz" | "result";

const PASS_SCORE = 0.7;

export function QuizSession({
  levelId,
  levelLabel,
  batch,
  questions,
  timePerQuestion,
}: {
  levelId: string;
  levelLabel: string;
  batch: number;
  questions: Question[];
  timePerQuestion: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [saving, setSaving] = useState(false);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const advance = useCallback(
    (answeredCorrect: boolean) => {
      const newAnswers = [...answers, answeredCorrect];

      if (isLast) {
        setAnswers(newAnswers);
        setPhase("result");
        const score = newAnswers.filter(Boolean).length;
        setSaving(true);
        saveProgressAction(levelId, batch, score, newAnswers.length).finally(
          () => setSaving(false),
        );
      } else {
        setAnswers(newAnswers);
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setRevealed(false);
        setTimeLeft(timePerQuestion);
      }
    },
    [answers, isLast, levelId, batch, timePerQuestion],
  );

  // Süre sayacı
  useEffect(() => {
    if (phase !== "quiz" || revealed) return;
    if (timeLeft <= 0) {
      setRevealed(true);
      setTimeout(() => advance(false), 1200);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, revealed, advance]);

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = current.options[idx].is_correct;
    setTimeout(() => advance(correct), 1000);
  }

  // Sonuç ekranı
  if (phase === "result") {
    const score = answers.filter(Boolean).length;
    const total = answers.length;
    const pct = Math.round((score / total) * 100);
    const passed = score / total >= PASS_SCORE;

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
        <div
          className={`flex size-24 items-center justify-center rounded-full text-4xl ${
            passed
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          }`}
        >
          {passed ? "🎉" : "😅"}
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            {passed ? "Tebrikler!" : "Neredeyse!"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {levelLabel} · Test {batch}
          </p>
        </div>

        <div className="w-full rounded-xl border bg-card p-6">
          <p className="text-5xl font-bold">{pct}%</p>
          <p className="mt-1 text-muted-foreground">
            {score} / {total} doğru
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                passed ? "bg-green-500" : "bg-amber-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {passed && (
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ Sonraki test açıldı!
          </p>
        )}
        {!passed && (
          <p className="text-sm text-muted-foreground">
            Geçmek için %{Math.round(PASS_SCORE * 100)} gerekiyor. Tekrar dene!
          </p>
        )}

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/quizzes/${levelId}`)}
            disabled={saving}
          >
            Testlere Dön
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setPhase("quiz");
              setCurrentIdx(0);
              setSelected(null);
              setRevealed(false);
              setAnswers([]);
              setTimeLeft(timePerQuestion);
            }}
          >
            Tekrar Çöz
          </Button>
        </div>
      </div>
    );
  }

  // Quiz ekranı
  const timerPct = (timeLeft / timePerQuestion) * 100;
  const timerColor =
    timerPct > 50
      ? "bg-primary"
      : timerPct > 25
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {/* Üst bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/quizzes/${levelId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {levelLabel} · Test {batch}
        </Link>
        <span className="text-sm text-muted-foreground">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${((currentIdx + (revealed ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Soru kartı */}
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Bu kelimenin Türkçesi nedir?
        </p>
        <p className="text-4xl font-bold">{current.question}</p>
      </div>

      {/* Süre sayacı */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <span
          className={`w-6 text-right text-sm font-medium tabular-nums ${
            timeLeft <= 5 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {timeLeft}
        </span>
      </div>

      {/* Şıklar */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, idx) => {
          let variant: string =
            "border bg-card hover:bg-muted cursor-pointer";

          if (revealed) {
            if (opt.is_correct) {
              variant =
                "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            } else if (selected === idx) {
              variant =
                "border-destructive bg-destructive/10 text-destructive";
            } else {
              variant = "border bg-muted/40 text-muted-foreground opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={`rounded-xl border p-4 text-sm font-medium transition-colors ${variant}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}