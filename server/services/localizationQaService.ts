import { prisma } from "../db";
import { audit } from "./auditService";

export async function runLocalizationQa(packId: string) {
  const [strings, terms] = await Promise.all([
    prisma.localizationString.findMany({ where: { packId } }),
    prisma.legalGlossaryTerm.findMany({ where: { packId } })
  ]);

  const requiredLocales = ["en-GB", "pt-PT"];
  const issues: Array<{ type: string; contentKey: string; locale: string; detail: string }> = [];
  const contentKeys = [...new Set(strings.map((s) => s.contentKey))];

  // Check missing translations
  for (const key of contentKeys) {
    for (const locale of requiredLocales) {
      const found = strings.find((s) => s.contentKey === key && s.locale === locale);
      if (!found) {
        issues.push({ type: "missing_translation", contentKey: key, locale, detail: `No ${locale} translation` });
      } else if (!found.translatedText || found.translatedText.trim() === "") {
        issues.push({ type: "empty_value", contentKey: key, locale, detail: "Translation text is empty" });
      }
    }
  }

  // Check prohibited terms in translations
  for (const str of strings) {
    const glossaryTerms = terms.filter((t) => t.locale === str.locale);
    for (const term of glossaryTerms) {
      const prohibited = JSON.parse(term.prohibitedTerms || "[]") as string[];
      for (const p of prohibited) {
        if (str.translatedText.toLowerCase().includes(p.toLowerCase())) {
          issues.push({
            type: "prohibited_term",
            contentKey: str.contentKey,
            locale: str.locale,
            detail: `Contains prohibited term "${p}" (use "${term.preferredTerm}" instead)`
          });
        }
      }
    }
  }

  // Create translation tasks for issues
  const tasksCreated: string[] = [];
  for (const issue of issues) {
    if (issue.type === "missing_translation" || issue.type === "empty_value") {
      const existing = await prisma.translationTask.findFirst({
        where: { packId, contentKey: issue.contentKey, locale: issue.locale, status: { not: "complete" } }
      });
      if (!existing) {
        const task = await prisma.translationTask.create({
          data: {
            packId,
            contentKey: issue.contentKey,
            locale: issue.locale,
            reason: issue.detail,
            status: "pending"
          }
        });
        tasksCreated.push(task.id);
      }
    }
  }

  await audit({
    tenantId: "platform",
    actorRole: "system",
    eventType: "localization.qa_completed",
    entityType: "JurisdictionPack",
    entityId: packId,
    metadata: { issueCount: issues.length, tasksCreated: tasksCreated.length, requirementRefs: ["L10N-010"] }
  });

  return { packId, issues, tasksCreated: tasksCreated.length, requirementRefs: ["L10N-010"] };
}
