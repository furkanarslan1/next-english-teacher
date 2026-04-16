"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fetchRandomQuizBatch,
  type QuizQuestion,
} from "@/app/actions/random-quiz";

const BATCH_SIZE = 10;
const DISTRACTOR_POOL = 30;

type Phase = "quiz" | "roundResult" | "done" | "loading";

export function RandomQuizSession({
  levelId,
  levelLabel,
  initialQuestions,
  remainingIds,
}: {
  levelId: string;
  levelLabel: string;
  initialQuestions: QuizQuestion[];
  remainingIds: string[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [queuedIds, setQueuedIds] = useState<string[]>(remainingIds);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [roundNum, setRoundNum] = useState(1);
  const [roundScores, setRoundScores] = useState<
    { score: number; total: number }[]
  >([]);

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const advance = useCallback(
    (correct: boolean) => {
      const newAnswers = [...answers, correct];

      if (isLast) {
        const score = newAnswers.filter(Boolean).length;
        const total = newAnswers.length;
        setRoundScores((prev) => [...prev, { score, total }]);
        setAnswers([]);
        setPhase(queuedIds.length === 0 ? "done" : "roundResult");
      } else {
        setAnswers(newAnswers);
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setRevealed(false);
      }
    },
    [answers, isLast, queuedIds.length],
  );

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = current.options[idx].is_correct;
    setTimeout(() => advance(correct), 1000);
  }

  async function handleNext() {
    setPhase("loading");

    const batchIds = queuedIds.slice(0, BATCH_SIZE);
    const newRemaining = queuedIds.slice(BATCH_SIZE);
    const distractorIds = newRemaining.slice(0, DISTRACTOR_POOL);

    try {
      const nextQuestions = await fetchRandomQuizBatch(batchIds, distractorIds);
      if (nextQuestions.length === 0) throw new Error("Soru üretilemedi");

      setQuestions(nextQuestions);
      setQueuedIds(newRemaining);
      setCurrentIdx(0);
      setSelected(null);
      setRevealed(false);
      setRoundNum((n) => n + 1);
      setPhase("quiz");
    } catch {
      setPhase("roundResult"); // loading'de takılmak yerine geri döner
    }
  }

  // Yükleniyor
  if (phase === "loading") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Sorular hazırlanıyor…</p>
      </div>
    );
  }

  // Round sonucu
  if (phase === "roundResult") {
    const last = roundScores[roundScores.length - 1];
    const pct = Math.round((last.score / last.total) * 100);

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
          {pct >= 70 ? "🎉" : "💪"}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Tur {roundNum}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{pct}%</h2>
          <p className="text-muted-foreground">
            {last.score} / {last.total} doğru
          </p>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 70 ? "bg-green-500" : "bg-amber-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Kalan kelime: {queuedIds.length}
        </p>

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/quizzes/${levelId}`)}
          >
            Çık
          </Button>
          <Button className="flex-1" onClick={handleNext}>
            Devam Et →
          </Button>
        </div>
      </div>
    );
  }

  // Tamamlandı
  if (phase === "done") {
    const totalScore = roundScores.reduce((s, r) => s + r.score, 0);
    const totalTotal = roundScores.reduce((s, r) => s + r.total, 0);
    const overallPct = totalTotal > 0 ? Math.round((totalScore / totalTotal) * 100) : 0;

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-900/30">
          🏆
        </div>

        <div>
          <h2 className="text-2xl font-bold">Tüm kelimeler bitti!</h2>
          <p className="mt-1 text-muted-foreground">
            {levelLabel} · {roundScores.length} tur tamamlandı
          </p>
        </div>

        <div className="w-full rounded-xl border bg-card p-6">
          <p className="text-5xl font-bold">{overallPct}%</p>
          <p className="mt-1 text-muted-foreground">
            {totalScore} / {totalTotal} toplam doğru
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/quizzes/${levelId}`)}
          >
            Testlere Dön
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.refresh()}
          >
            Tekrar Başlat
          </Button>
        </div>
      </div>
    );
  }

  // Quiz ekranı
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {/* Üst bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/quizzes/${levelId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {levelLabel} · Rastgele Test
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

      {/* Tur bilgisi */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Tur {roundNum}</span>
        <span>{queuedIds.length} kelime kaldı</span>
      </div>

      {/* Soru kartı */}
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Bu kelimenin Türkçesi nedir?
        </p>
        <p className="text-4xl font-bold">{current.question}</p>
      </div>

      {/* Şıklar */}
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, idx) => {
          let variant = "border bg-card hover:bg-muted cursor-pointer";

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