"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { fetchCardsByIds, type CardRow } from "@/app/actions/cards-batch";

type Category = { id: string; label: string };

const SWIPE_THRESHOLD = 100;
const PREFETCH_THRESHOLD = 5; // kaç kart kala sonraki batch çekilsin
const BATCH_SIZE = 20;

// Tek bir sürüklenebilir + çevrilebilir kart
function DraggableCard({
  card,
  levelLabel,
  flipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
}: {
  card: CardRow;
  levelLabel: string;
  flipped: boolean;
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const skipOpacity = useTransform(x, [-80, -30, 0], [1, 0.3, 0]);
  const knowOpacity = useTransform(x, [0, 30, 80], [0, 0.3, 1]);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      onTap={onFlip}
      style={{ x, rotate }}
      className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {/* Sola kaydır göstergesi */}
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute left-5 top-5 z-10 -rotate-12 rounded-xl border-2 border-destructive bg-destructive/10 px-3 py-1.5 text-sm font-bold text-destructive"
      >
        Geç ✕
      </motion.div>

      {/* Sağa kaydır göstergesi */}
      <motion.div
        style={{ opacity: knowOpacity }}
        className="absolute right-5 top-5 z-10 rotate-12 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-600"
      >
        Biliyorum ✓
      </motion.div>

      {/* CSS 3D flip wrapper */}
      <div className="size-full" style={{ perspective: "1200px" }}>
        <div
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.45s ease",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Ön yüz */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 shadow-lg"
          >
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {levelLabel}
            </span>
            <p className="text-center text-4xl font-bold tracking-tight">
              {card.word}
            </p>
            {card.description && (
              <p className="text-center text-sm text-muted-foreground">
                {card.description}
              </p>
            )}
            {card.example_sentence && (
              <p className="mt-2 rounded-lg bg-muted px-4 py-2 text-center text-sm italic text-muted-foreground">
                &ldquo;{card.example_sentence}&rdquo;
              </p>
            )}
            <p className="mt-auto text-xs text-muted-foreground">
              Çeviri için dokun · Geçmek için kaydır
            </p>
          </div>

          {/* Arka yüz */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-primary p-8 shadow-lg"
          >
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-primary-foreground">
              Türkçe
            </span>
            <p className="text-center text-4xl font-bold tracking-tight text-primary-foreground">
              {card.translation ?? "—"}
            </p>
            {card.example_sentence && (
              <p className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-center text-sm italic text-primary-foreground/80">
                &ldquo;{card.example_sentence}&rdquo;
              </p>
            )}
            <p className="mt-auto text-xs text-primary-foreground/60">
              Kaydırarak devam et
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CardsViewer({
  levelId,
  levelLabel,
  initialCards,
  remainingIds,
  categories,
  activeCategoryId,
}: {
  levelId: string;
  levelLabel: string;
  initialCards: CardRow[];
  remainingIds: string[];
  categories: Category[];
  activeCategoryId: string | null;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<CardRow[]>(initialCards);
  const [queuedIds, setQueuedIds] = useState<string[]>(remainingIds);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exitX, setExitX] = useState(0);
  const isFetchingRef = useRef(false);

  const total = cards.length + queuedIds.length;

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Sonraki batch'i arka planda çek
  const prefetchNext = useCallback(async () => {
    if (isFetchingRef.current || queuedIds.length === 0) return;
    isFetchingRef.current = true;

    const nextIds = queuedIds.slice(0, BATCH_SIZE);
    const nextCards = await fetchCardsByIds(nextIds);

    setCards((prev) => [...prev, ...nextCards]);
    setQueuedIds((prev) => prev.slice(BATCH_SIZE));
    isFetchingRef.current = false;
  }, [queuedIds]);

  // Kullanıcı sona yaklaşınca prefetch tetikle
  useEffect(() => {
    const remaining = cards.length - 1 - index;
    if (remaining <= PREFETCH_THRESHOLD && queuedIds.length > 0) {
      prefetchNext();
    }
  }, [index, cards.length, queuedIds.length, prefetchNext]);

  function goNext() {
    if (index >= cards.length - 1 && queuedIds.length === 0) return;
    setExitX(-600);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function goPrev() {
    if (index <= 0) return;
    setExitX(600);
    setFlipped(false);
    setIndex((i) => i - 1);
  }

  function handleCategory(catId: string | null) {
    setIndex(0);
    setFlipped(false);
    const url = catId
      ? `/dashboard/cards/${levelId}?category_id=${catId}`
      : `/dashboard/cards/${levelId}`;
    router.push(url);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  }

  if (total === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/cards" className="hover:underline">
            Kartlar
          </Link>
          <span>/</span>
          <span>{levelLabel}</span>
        </div>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-2xl">📭</p>
          <p className="font-medium">Bu kategoride henüz kart yok.</p>
          <Button variant="outline" onClick={() => handleCategory(null)}>
            Tüm kartları göster
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[index];
  const behindCards = [cards[index + 1], cards[index + 2]].filter(Boolean);
  const isAtEnd = index >= cards.length - 1 && queuedIds.length === 0;
  const isLoadingNext = index >= cards.length - 1 && queuedIds.length > 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 outline-none"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {/* Breadcrumb + sayaç */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/cards" className="hover:underline">
            Kartlar
          </Link>
          <span>/</span>
          <span>{levelLabel}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Kategori filtresi */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategory(null)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              !activeCategoryId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                activeCategoryId === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Kart yığını */}
      <div className="relative mx-auto w-full" style={{ height: 320 }}>
        {isLoadingNext ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border bg-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Arkadaki kartlar (dekoratif) */}
            {behindCards.map((card, i) => (
              <div
                key={card.id}
                className="absolute inset-0 rounded-2xl border bg-card shadow"
                style={{
                  transform: `scale(${0.95 - i * 0.04}) translateY(${(i + 1) * 10}px)`,
                  zIndex: behindCards.length - i,
                }}
              />
            ))}

            {/* Üstteki aktif kart */}
            <AnimatePresence>
              {currentCard && (
                <motion.div
                  key={index}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    x: exitX,
                    rotate: exitX < 0 ? -20 : 20,
                    opacity: 0,
                    transition: { duration: 0.3 },
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="absolute inset-0"
                  style={{ zIndex: 10 }}
                >
                  <DraggableCard
                    card={currentCard}
                    levelLabel={levelLabel}
                    flipped={flipped}
                    onFlip={() => setFlipped((f) => !f)}
                    onSwipeLeft={goNext}
                    onSwipeRight={goNext}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Navigasyon butonları */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={index === 0}
          className="flex-1"
        >
          ← Önceki
        </Button>

        {/* Nokta indikatörü */}
        <div className="flex gap-1.5">
          {Array.from({ length: Math.min(total, 7) }, (_, i) => {
            const pos =
              total <= 7 ? 0 : Math.min(Math.max(index - 3, 0), total - 7);
            const dotIndex = pos + i;
            const isActive = dotIndex === index;
            return (
              <button
                key={i}
                onClick={() => {
                  if (dotIndex >= cards.length) return; // henüz yüklenmedi
                  setExitX(dotIndex > index ? -600 : 600);
                  setFlipped(false);
                  setIndex(dotIndex);
                }}
                className={`rounded-full transition-all ${
                  isActive ? "size-2 bg-primary" : "size-1.5 bg-muted-foreground/30"
                }`}
              />
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={goNext}
          disabled={isAtEnd || isLoadingNext}
          className="flex-1"
        >
          Sonraki →
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Sola kaydır: geç · Sağa kaydır: biliyorum · Klavye: ← →
      </p>
    </div>
  );
}