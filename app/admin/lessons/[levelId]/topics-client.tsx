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
  createLessonTopicAction,
  updateLessonTopicAction,
  deleteLessonTopicAction,
} from "@/app/actions/lessons";

type Level = { id: string; label: string };
type Topic = { id: string; title: string; is_active: boolean; sort_order: number };

type FormState = {
  title: string;
  is_active: boolean;
  sort_order: number;
};

const defaultForm: FormState = { title: "", is_active: true, sort_order: 0 };

export function TopicsClient({
  level,
  topics,
}: {
  level: Level;
  topics: Topic[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Topic | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(null);
    setForm(defaultForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(topic: Topic) {
    setEditTarget(topic);
    setForm({
      title: topic.title,
      is_active: topic.is_active,
      sort_order: topic.sort_order,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      setFormError("Konu başlığı zorunludur.");
      return;
    }
    setFormError(null);

    startTransition(async () => {
      const payload = { ...form, level_id: level.id };
      const result = editTarget
        ? await updateLessonTopicAction(editTarget.id, payload)
        : await createLessonTopicAction(payload);

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
      await deleteLessonTopicAction(deleteId);
      setDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/lessons" className="hover:underline">
              Dersler
            </Link>
            <span>/</span>
            <span>{level.label}</span>
          </div>
          <h1 className="text-2xl font-semibold">{level.label} — Konular</h1>
          <p className="text-sm text-muted-foreground">
            Konuya girerek accordion bölümlerini yönetin.
          </p>
        </div>
        <Button onClick={openCreate}>+ Yeni Konu</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Konu Başlığı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Henüz konu eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.title}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        topic.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {topic.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/lessons/${level.id}/${topic.id}`}>
                          Bölümler
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(topic)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(topic.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Konuyu Düzenle" : "Yeni Konu"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">
                Konu Başlığı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Örn: Present Simple Tense"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
            <AlertDialogTitle>Konuyu sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu konu ve tüm accordion bölümleri kalıcı olarak silinecek.
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