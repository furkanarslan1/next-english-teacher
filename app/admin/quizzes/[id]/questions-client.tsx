"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
} from "@/app/actions/questions";

type Level = { id: string; label: string };
type WordCard = { id: string; word: string; translation: string | null };

type Question = {
  id: string;
  type: "true_false" | "multiple_choice";
  question_text: string;
  options: { label: string; is_correct: boolean }[];
  word_card_id: string | null;
  question_direction: "en_to_tr" | "tr_to_en" | null;
  points: number;
  sort_order: number;
};

type Quiz = { id: string; title: string; time_per_question: number };

type FormState = {
  type: "true_false" | "multiple_choice";
  mode: "word" | "manual";
  question_text: string;
  options: { label: string; is_correct: boolean }[];
  word_card_id: string;
  question_direction: "en_to_tr" | "tr_to_en";
  points: number;
  sort_order: number;
  // word search
  selectedLevelId: string;
};

const defaultForm: FormState = {
  type: "multiple_choice",
  mode: "word",
  question_text: "",
  options: [
    { label: "", is_correct: false },
    { label: "", is_correct: false },
    { label: "", is_correct: false },
    { label: "", is_correct: false },
  ],
  word_card_id: "",
  question_direction: "en_to_tr",
  points: 10,
  sort_order: 0,
  selectedLevelId: "",
};

function buildPayload(
  form: FormState,
  quizId: string,
  nextSortOrder: number,
  existingSortOrder?: number,
) {
  const sortOrder = existingSortOrder ?? nextSortOrder;

  if (form.type === "true_false") {
    return {
      quiz_id: quizId,
      type: "true_false" as const,
      question_text: form.question_text,
      options: [
        { label: "Doğru", is_correct: true },
        { label: "Yanlış", is_correct: false },
      ],
      word_card_id: null,
      question_direction: null,
      points: form.points,
      sort_order: sortOrder,
    };
  }

  if (form.mode === "word") {
    return {
      quiz_id: quizId,
      type: "multiple_choice" as const,
      question_text: "",           // sunucu tarafı veya öğrenci UI'ı üretecek
      options: [],                 // öğrenci UI'ı word_cards'dan üretecek
      word_card_id: form.word_card_id,
      question_direction: form.question_direction,
      points: form.points,
      sort_order: sortOrder,
    };
  }

  // manual
  return {
    quiz_id: quizId,
    type: "multiple_choice" as const,
    question_text: form.question_text,
    options: form.options,
    word_card_id: null,
    question_direction: null,
    points: form.points,
    sort_order: sortOrder,
  };
}

export function QuestionsClient({
  quiz,
  questions,
  levels,
}: {
  quiz: Quiz;
  questions: Question[];
  levels: Level[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Seçili seviyenin kelime kartları
  const [wordCards, setWordCards] = useState<WordCard[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);

  useEffect(() => {
    if (!form.selectedLevelId) {
      setWordCards([]);
      return;
    }
    setLoadingWords(true);
    fetch(
      `/api/word-cards?level_id=${form.selectedLevelId}`,
    )
      .then((r) => r.json())
      .then((data) => setWordCards(data ?? []))
      .finally(() => setLoadingWords(false));
  }, [form.selectedLevelId]);

  const nextSortOrder =
    questions.length === 0
      ? 10
      : Math.max(...questions.map((q) => q.sort_order)) + 10;

  function openCreate() {
    setEditTarget(null);
    setForm({ ...defaultForm, sort_order: nextSortOrder });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(q: Question) {
    setEditTarget(q);
    const isWord = !!q.word_card_id;
    setForm({
      type: q.type,
      mode: isWord ? "word" : "manual",
      question_text: q.question_text,
      options:
        q.options.length > 0
          ? q.options
          : [
              { label: "", is_correct: false },
              { label: "", is_correct: false },
              { label: "", is_correct: false },
              { label: "", is_correct: false },
            ],
      word_card_id: q.word_card_id ?? "",
      question_direction: q.question_direction ?? "en_to_tr",
      points: q.points,
      sort_order: q.sort_order,
      selectedLevelId: "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    setFormError(null);

    // Basit validasyon
    if (form.type === "true_false" && !form.question_text.trim()) {
      setFormError("Soru metni zorunludur.");
      return;
    }
    if (form.type === "multiple_choice" && form.mode === "word" && !form.word_card_id) {
      setFormError("Lütfen bir kelime seçin.");
      return;
    }
    if (form.type === "multiple_choice" && form.mode === "manual") {
      if (!form.question_text.trim()) {
        setFormError("Soru metni zorunludur.");
        return;
      }
      if (!form.options.some((o) => o.is_correct)) {
        setFormError("En az bir doğru şık işaretleyin.");
        return;
      }
      if (form.options.some((o) => !o.label.trim())) {
        setFormError("Tüm şıkları doldurun veya boş satırları kaldırın.");
        return;
      }
    }

    startTransition(async () => {
      const payload = buildPayload(
        form,
        quiz.id,
        nextSortOrder,
        editTarget?.sort_order,
      );

      const result = editTarget
        ? await updateQuestionAction(editTarget.id, quiz.id, payload)
        : await createQuestionAction(payload);

      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteQuestionAction(deleteId, quiz.id);
      setDeleteId(null);
      router.refresh();
    });
  }

  function updateOption(
    idx: number,
    field: "label" | "is_correct",
    value: string | boolean,
  ) {
    const opts = form.options.map((o, i) => {
      if (i !== idx) return field === "is_correct" ? { ...o, is_correct: false } : o;
      return { ...o, [field]: value };
    });
    setForm({ ...form, options: opts });
  }

  function addOption() {
    if (form.options.length >= 6) return;
    setForm({
      ...form,
      options: [...form.options, { label: "", is_correct: false }],
    });
  }

  function removeOption(idx: number) {
    if (form.options.length <= 2) return;
    setForm({
      ...form,
      options: form.options.filter((_, i) => i !== idx),
    });
  }

  const questionLabel = (q: Question) => {
    if (q.word_card_id) {
      return q.question_direction === "en_to_tr"
        ? "Çoktan Seçmeli (EN→TR)"
        : "Çoktan Seçmeli (TR→EN)";
    }
    return q.type === "true_false" ? "Doğru / Yanlış" : "Çoktan Seçmeli (Manuel)";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/quizzes" className="hover:underline">
              Testler
            </Link>
            <span>/</span>
            <span>{quiz.title}</span>
          </div>
          <h1 className="text-2xl font-semibold">Sorular</h1>
          <p className="text-sm text-muted-foreground">
            {questions.length} soru · Soru başına {quiz.time_per_question}sn
          </p>
        </div>
        <Button onClick={openCreate}>+ Yeni Soru</Button>
      </div>

      {/* Soru listesi */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">No</TableHead>
              <TableHead>Soru / Kelime</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Puan</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Henüz soru eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="max-w-sm truncate font-medium">
                    {q.question_text || (q.word_card_id ? `Kelime ID: ${q.word_card_id.slice(0, 8)}…` : "—")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {questionLabel(q)}
                  </TableCell>
                  <TableCell>{q.points}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(q)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(q.id)}
                      >
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Soru Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Soruyu Düzenle" : "Yeni Soru"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Soru tipi */}
            <div className="flex flex-col gap-1.5">
              <Label>Soru Tipi</Label>
              <Select
                value={form.type}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    type: val as FormState["type"],
                    question_text: "",
                    word_card_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Çoktan Seçmeli</SelectItem>
                  <SelectItem value="true_false">Doğru / Yanlış</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Çoktan seçmeli: mod seçimi */}
            {form.type === "multiple_choice" && (
              <div className="flex flex-col gap-1.5">
                <Label>Mod</Label>
                <div className="flex gap-2">
                  {(["word", "manual"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, mode: m, word_card_id: "", question_text: "" })
                      }
                      className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                        form.mode === m
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {m === "word" ? "Kelime Bazlı" : "Manuel"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Doğru/Yanlış: soru metni */}
            {form.type === "true_false" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="question_text">
                  Soru Metni <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="question_text"
                  placeholder="Örn: 'Run' kelimesi Türkçe'de koşmak anlamına gelir."
                  value={form.question_text}
                  onChange={(e) =>
                    setForm({ ...form, question_text: e.target.value })
                  }
                />
              </div>
            )}

            {/* Kelime bazlı: seviye → kelime seç */}
            {form.type === "multiple_choice" && form.mode === "word" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Seviye</Label>
                  <Select
                    value={form.selectedLevelId || "none"}
                    onValueChange={(val) =>
                      setForm({
                        ...form,
                        selectedLevelId: val === "none" ? "" : val,
                        word_card_id: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seviye seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Seçin</SelectItem>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>
                    Kelime <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.word_card_id || "none"}
                    onValueChange={(val) =>
                      setForm({
                        ...form,
                        word_card_id: val === "none" ? "" : val,
                      })
                    }
                    disabled={!form.selectedLevelId || loadingWords}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingWords
                            ? "Yükleniyor…"
                            : "Kelime seçin"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Seçin</SelectItem>
                      {wordCards.map((wc) => (
                        <SelectItem key={wc.id} value={wc.id}>
                          {wc.word}
                          {wc.translation ? ` — ${wc.translation}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Soru Yönü</Label>
                  <Select
                    value={form.question_direction}
                    onValueChange={(val) =>
                      setForm({
                        ...form,
                        question_direction: val as FormState["question_direction"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_to_tr">
                        İngilizce → Türkçe (kelime gösterilir, anlamı sorulur)
                      </SelectItem>
                      <SelectItem value="tr_to_en">
                        Türkçe → İngilizce (anlam gösterilir, kelime sorulur)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Manuel: soru metni + şıklar */}
            {form.type === "multiple_choice" && form.mode === "manual" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="manual_text">
                    Soru Metni <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual_text"
                    placeholder="Soru metnini girin"
                    value={form.question_text}
                    onChange={(e) =>
                      setForm({ ...form, question_text: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Şıklar (doğru olanı seçin)</Label>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateOption(idx, "is_correct", true)}
                        className={`size-5 shrink-0 rounded-full border-2 transition-colors ${
                          opt.is_correct
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      />
                      <Input
                        placeholder={`Şık ${idx + 1}`}
                        value={opt.label}
                        onChange={(e) =>
                          updateOption(idx, "label", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        disabled={form.options.length <= 2}
                        className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      + Şık Ekle
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Puan */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="points">Puan</Label>
              <Input
                id="points"
                type="number"
                min={1}
                value={form.points}
                onChange={(e) =>
                  setForm({ ...form, points: Number(e.target.value) })
                }
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soruyu sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu soru kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Siliniyor…" : "Evet, sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
