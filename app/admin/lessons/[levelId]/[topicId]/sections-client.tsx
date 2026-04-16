"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLessonSectionAction,
  updateLessonSectionAction,
  deleteLessonSectionAction,
} from "@/app/actions/lessons";

type Level = { id: string; label: string };
type Topic = { id: string; title: string };
type Section = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
};

type FormState = {
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
};

const defaultForm: FormState = {
  title: "",
  content: "",
  is_active: true,
  sort_order: 0,
};

export function SectionsClient({
  level,
  topic,
  sections,
}: {
  level: Level;
  topic: Topic;
  sections: Section[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditTarget(null);
    setForm(defaultForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(section: Section) {
    setEditTarget(section);
    setForm({
      title: section.title,
      content: section.content,
      is_active: section.is_active,
      sort_order: section.sort_order,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      setFormError("Başlık zorunludur.");
      return;
    }
    if (!form.content.trim()) {
      setFormError("İçerik zorunludur.");
      return;
    }
    setFormError(null);

    startTransition(async () => {
      const result = editTarget
        ? await updateLessonSectionAction(editTarget.id, topic.id, form)
        : await createLessonSectionAction(topic.id, form);

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
      await deleteLessonSectionAction(deleteId, topic.id);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/lessons" className="hover:underline">
              Dersler
            </Link>
            <span>/</span>
            <Link
              href={`/admin/lessons/${level.id}`}
              className="hover:underline"
            >
              {level.label}
            </Link>
            <span>/</span>
            <span>{topic.title}</span>
          </div>
          <h1 className="text-2xl font-semibold">{topic.title}</h1>
          <p className="text-sm text-muted-foreground">
            {sections.length} bölüm · Öğrencilere accordion olarak gösterilir.
          </p>
        </div>
        <Button onClick={openCreate}>+ Yeni Bölüm</Button>
      </div>

      {/* Accordion önizleme */}
      {sections.length > 0 ? (
        <Accordion type="multiple" className="rounded-lg border divide-y">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-0"
            >
              <div className="flex items-center gap-2 px-4">
                <AccordionTrigger className="flex-1 hover:no-underline py-4 text-left">
                  <span className="font-medium">{section.title}</span>
                  {!section.is_active && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Pasif
                    </span>
                  )}
                </AccordionTrigger>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(section)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteId(section.id)}
                  >
                    Sil
                  </Button>
                </div>
              </div>
              <AccordionContent className="px-4 pb-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {section.content}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="rounded-lg border py-12 text-center text-muted-foreground">
          Henüz bölüm eklenmemiş. &quot;+ Yeni Bölüm&quot; ile başlayın.
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Bölümü Düzenle" : "Yeni Bölüm"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sec-title">
                Başlık <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sec-title"
                placeholder="Örn: Olumsuz Cümle Yapısı"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sec-content">
                İçerik <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sec-content"
                placeholder="Konu anlatımı, örnek cümleler, notlar..."
                rows={8}
                value={form.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, content: e.target.value })}
                className="resize-y"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sec-active">Durum</Label>
              <Select
                value={form.is_active ? "true" : "false"}
                onValueChange={(val) =>
                  setForm({ ...form, is_active: val === "true" })
                }
              >
                <SelectTrigger id="sec-active">
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
            <AlertDialogTitle>Bölümü sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bölüm kalıcı olarak silinecek. Bu işlem geri alınamaz.
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