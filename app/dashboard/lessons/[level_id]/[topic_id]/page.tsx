import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedLevel } from "@/lib/data/levels";
import { getCachedLessonTopic, getCachedLessonSections } from "@/lib/data/lessons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ level_id: string; topic_id: string }>;
}) {
  const { level_id, topic_id } = await params;

  const [level, topic, sections] = await Promise.all([
    getCachedLevel(level_id),
    getCachedLessonTopic(topic_id),
    getCachedLessonSections(topic_id),
  ]);

  if (!level || !topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + başlık */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard/lessons" className="hover:underline">
            Dersler
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/lessons/${level_id}`}
            className="hover:underline"
          >
            {level.label}
          </Link>
          <span>/</span>
          <span>{topic.title}</span>
        </div>
        <h1 className="text-2xl font-semibold">{topic.title}</h1>
        <p className="text-sm text-muted-foreground">
          {sections.length} bölüm · Okumak istediğin başlığa tıkla.
        </p>
      </div>

      {/* Accordion */}
      {sections.length === 0 ? (
        <div className="rounded-xl border py-12 text-center text-muted-foreground">
          Bu konuya henüz içerik eklenmemiş.
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={[sections[0].id]}
          className="flex flex-col gap-2"
        >
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="rounded-xl border bg-card shadow-sm overflow-hidden"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                <span className="text-left font-semibold">{section.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {section.content}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Alt navigasyon */}
      <div className="flex justify-start pt-2">
        <Link
          href={`/dashboard/lessons/${level_id}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← {level.label} konularına dön
        </Link>
      </div>
    </div>
  );
}