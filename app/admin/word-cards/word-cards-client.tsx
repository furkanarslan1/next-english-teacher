"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  createWordCardAction,
  updateWordCardAction,
  deleteWordCardAction,
} from "@/app/actions/word-cards";

type Level = { id: string; label: string };

type WordCard = {
  id: string;
  word: string;
  translation: string | null;
  example_sentence: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  level_id: string;
  levels: { label: string }[] | { label: string } | null;
};

type FormState = {
  word: string;
  level_id: string;
  translation: string;
  example_sentence: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

function getLevelLabel(levels: WordCard["levels"]): string {
  if (!levels) return "—";
  if (Array.isArray(levels)) return levels[0]?.label ?? "—";
  return levels.label;
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };
  add(1);
  if (current > 3) pages.push("…");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  )
    add(i);
  if (current < total - 2) pages.push("…");
  add(total);
  return pages;
}

const defaultForm: FormState = {
  word: "",
  level_id: "",
  translation: "",
  example_sentence: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export function WordCardsClient({
  cards,
  levels,
  currentLevelId,
  currentPage,
  totalPages,
  totalCount,
}: {
  cards: WordCard[];
  levels: Level[];
  currentLevelId: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<WordCard | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function navigate(levelId: string, page: number) {
    const params = new URLSearchParams();
    params.set("level_id", levelId);
    params.set("page", String(page));
    router.push(`/admin/word-cards?${params.toString()}`);
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ ...defaultForm, level_id: currentLevelId });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(card: WordCard) {
    setEditTarget(card);
    setForm({
      word: card.word,
      level_id: card.level_id,
      translation: card.translation ?? "",
      example_sentence: card.example_sentence ?? "",
      description: card.description ?? "",
      sort_order: card.sort_order,
      is_active: card.is_active,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    setFormError(null);
    startTransition(async () => {
      const result = editTarget
        ? await updateWordCardAction(editTarget.id, form)
        : await createWordCardAction(form);

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
      await deleteWordCardAction(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kelime Kartları</h1>
          <p className="text-sm text-muted-foreground">
            Seviye bazlı kelime kartlarını yönetin.
          </p>
        </div>
        <Button onClick={openCreate}>+ Yeni Kart</Button>
      </div>

      {/* Seviye filtresi */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Seviye:</span>
        <Select
          value={currentLevelId}
          onValueChange={(val) => navigate(val, 1)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {totalCount} kart
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kelime</TableHead>
              <TableHead>Türkçe</TableHead>
              <TableHead>Örnek Cümle</TableHead>
              <TableHead>Seviye</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Bu seviyede henüz kelime kartı eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.word}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {card.translation ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {card.example_sentence ?? "—"}
                  </TableCell>
                  <TableCell>{getLevelLabel(card.levels)}</TableCell>
                  <TableCell>{card.sort_order}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        card.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {card.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(card)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(card.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Önceki"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) navigate(currentLevelId, currentPage - 1);
                }}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {buildPageList(currentPage, totalPages).map((item, idx) =>
              item === "…" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(currentLevelId, item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                text="Sonraki"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages)
                    navigate(currentLevelId, currentPage + 1);
                }}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Kelime Kartı Düzenle" : "Yeni Kelime Kartı"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="word">
                Kelime <span className="text-destructive">*</span>
              </Label>
              <Input
                id="word"
                placeholder="Örn: perseverance"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="level_id">
                Seviye <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.level_id}
                onValueChange={(val) => setForm({ ...form, level_id: val })}
              >
                <SelectTrigger id="level_id">
                  <SelectValue placeholder="Seviye seçin" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="translation">Türkçe Çeviri</Label>
              <Input
                id="translation"
                placeholder="Örn: azim, kararlılık"
                value={form.translation}
                onChange={(e) =>
                  setForm({ ...form, translation: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="example_sentence">Örnek Cümle</Label>
              <Input
                id="example_sentence"
                placeholder="Örn: Her perseverance paid off in the end."
                value={form.example_sentence}
                onChange={(e) =>
                  setForm({ ...form, example_sentence: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Açıklama / Tanım</Label>
              <Input
                id="description"
                placeholder="Örn: Continued effort despite difficulty."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div
              className={`grid gap-4 ${editTarget ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {editTarget && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sort_order">Sıra</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) })
                    }
                  />
                </div>
              )}

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
            <AlertDialogTitle>Kelime kartını sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kart kalıcı olarak silinecek. Bu işlem geri alınamaz.
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
