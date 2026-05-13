import { prisma } from "../db";
import { decode } from "./json";

export async function missingMandatoryTranslations(packId: string) {
  const strings = await prisma.localizationString.findMany({ where: { packId } });
  const contentKeys = [...new Set(strings.map((string) => string.contentKey))];
  const approvedSet = new Set(
    strings
      .filter((s) => s.status === "approved")
      .map((s) => `${s.contentKey}::${s.locale}`)
  );
  const missing: Array<{ contentKey: string; locale: string }> = [];

  for (const contentKey of contentKeys) {
    for (const locale of ["en-GB", "pt-PT"]) {
      if (!approvedSet.has(`${contentKey}::${locale}`)) {
        missing.push({ contentKey, locale });
      }
    }
  }

  return missing;
}

export async function lintDocumentGlossary(packId: string, locale: string, content: string) {
  const terms = await prisma.legalGlossaryTerm.findMany({ where: { packId, locale, status: "approved" } });
  const contentLower = content.toLowerCase();
  const violations = terms.flatMap((term) => {
    const prohibitedTerms = decode<string[]>(term.prohibitedTerms, []);
    return prohibitedTerms
      .filter((prohibited) => contentLower.includes(prohibited.toLowerCase()))
      .map((prohibited) => ({ termKey: term.termKey, prohibited }));
  });

  return {
    passed: violations.length === 0,
    violations
  };
}
