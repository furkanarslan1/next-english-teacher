"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuizAction,
  updateQuizAction,
  deleteQuizAction,
} from "@/app/actions/quizzes";

type Level = { id: string; label: string };
type Category = { id: string; label: string; level_id: string };

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  time_per_question: number;
  is_active: boolean;
  sort_order: number;
  quiz_levels: { level_id: string; levels: { label: string } | { label: string }[] | null }[];
  quiz_categories: { category_id: string; categories: { label: string } | { label: string }[] | null }[];
};

type FormState = {
  title: string;
  description: string;
  time_per_question: number;
  is_active: boolean;
  level_ids: string[];
  category_ids: string[];
};

const defaultForm: FormState = {
  title: "",
  description: "",
  time_per_question: 30,
  is_active: true,
  level_ids: [],
  category_ids: [],
};

function getCategoryLabel(c: Quiz["quiz_categories"][0]["categories"]): string {
  if (!c) return "";
  if (Array.isArray(c)) return c[0]?.label ?? "";
  return c.label;
}

function getLevelLabel(l: Quiz["quiz_levels"][0]["levels"]): string {
  if (!l) return "";
  if (Array.isArray(l)) return l[0]?.label ?? "";
  return l.label;
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => toggle(opt.id)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            selected.includes(opt.id)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function QuizzesClient({
  quizzes,
  levels,
  categories,
}: {
  quizzes: Quiz[];
  levels: Level[];
  categories: Category[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Quiz | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Formda seçili seviyelere ait kategoriler
  const formCategories = categories.filter((c) =>
    form.level_ids.includes(c.level_id),
  );

  function openCreate() {
    setEditTarget(null);
    setForm(defaultForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(quiz: Quiz) {
    setEditTarget(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description ?? "",
      time_per_question: quiz.time_per_question,
      is_active: quiz.is_active,
      level_ids: quiz.quiz_levels.map((ql) => ql.level_id),
      category_ids: quiz.quiz_categories.map((qc) => qc.category_id),
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleLevelToggle(ids: string[]) {
    // Seçimden çıkan seviyelerin kategorilerini de temizle
    const validCategoryIds = form.category_ids.filter((cid) => {
      const cat = categories.find((c) => c.id === cid);
      return cat && ids.includes(cat.level_id);
    });
    setForm({ ...form, level_ids: ids, category_ids: validCategoryIds });
  }

  function handleSubmit() {
    setFormError(null);
    startTransition(async () => {
      const result = editTarget
        ? await updateQuizAction(editTarget.id, form)
        : await createQuizAction(form);

      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteQuizAction(deleteId);
      setDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Testler</h1>
          <p className="text-sm text-muted-foreground">
            Testleri yönetin ve sorularını düzenleyin.
          </p>
        </div>
        <Button onClick={openCreate}>+ Yeni Test</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Adı</TableHead>
              <TableHead>Seviyeler</TableHead>
              <TableHead>Kategoriler</TableHead>
              <TableHead>Süre / Soru</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Henüz test eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>
                    {quiz.quiz_levels.length === 0
                      ? "—"
                      : quiz.quiz_levels
                          .map((ql) => getLevelLabel(ql.levels))
                          .filter(Boolean)
                          .join(", ")}
                  </TableCell>
                  <TableCell>
                    {quiz.quiz_categories.length === 0
                      ? "—"
                      : quiz.quiz_categories
                          .map((qc) => getCategoryLabel(qc.categories))
                          .filter(Boolean)
                          .join(", ")}
                  </TableCell>
                  <TableCell>{quiz.time_per_question}sn</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        quiz.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {quiz.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/quizzes/${quiz.id}`}>Sorular</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(quiz)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(quiz.id)}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Test Düzenle" : "Yeni Test"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">
                Test Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Örn: A1 Kelime Testi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                placeholder="Opsiyonel"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Seviyeler</Label>
              <CheckboxGroup
                options={levels}
                selected={form.level_ids}
                onChange={handleLevelToggle}
              />
            </div>

            {formCategories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Kategoriler</Label>
                <CheckboxGroup
                  options={formCategories}
                  selected={form.category_ids}
                  onChange={(ids) =>
                    setForm({ ...form, category_ids: ids })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="time_per_question">Süre / Soru (sn)</Label>
                <Input
                  id="time_per_question"
                  type="number"
                  min={5}
                  max={300}
                  value={form.time_per_question}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      time_per_question: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="is_active">Durum</Label>
                <Select
                  value={form.is_active ? "true" : "false"}
                  onValueChange={(val) =>
                    setForm({ ...form, is_active: val === "true" })
                  }
                >
                  <SelectTrigger id="is_active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <AlertDialogTitle>Testi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu test ve tüm soruları kalıcı olarak silinecek. Bu işlem geri
              alınamaz.
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
