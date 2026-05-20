import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { encode } from "../server/services/json";

const prisma = new PrismaClient();

const now = new Date("2026-05-12T00:00:00.000Z");

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function reset() {
  await prisma.faraidCalculation.deleteMany();
  await prisma.clientGoal.deleteMany();
  await prisma.domicileRecord.deleteMany();
  await prisma.willCoordination.deleteMany();
  await prisma.ihtCalculation.deleteMany();
  await prisma.outsideEstateNomination.deleteMany();
  await prisma.estateReliefAssessment.deleteMany();
  await prisma.crossBorderTaxPosition.deleteMany();
  await prisma.incapacityInstrument.deleteMany();
  await prisma.estateTrustStructure.deleteMany();
  await prisma.protectionPolicy.deleteMany();
  await prisma.estateCashFlowItem.deleteMany();
  await prisma.estatePlanningRecord.deleteMany();
  await prisma.lifetimeGift.deleteMany();
  await prisma.reportSnapshot.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.kycAmlRecord.deleteMany();
  await prisma.beneficialOwnership.deleteMany();
  await prisma.featureGate.deleteMany();
  await prisma.regulatoryMonitor.deleteMany();
  await prisma.releaseGate.deleteMany();
  await prisma.translationTask.deleteMany();
  await prisma.legalGlossaryTerm.deleteMany();
  await prisma.localizationString.deleteMany();
  await prisma.integrationProvider.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.retentionPolicy.deleteMany();
  await prisma.dataSubjectRequest.deleteMany();
  await prisma.conflictOfLawsMemo.deleteMany();
  await prisma.packVelocityRecord.deleteMany();
  await prisma.insuranceRecord.deleteMany();
  await prisma.uplOpinion.deleteMany();
  await prisma.aiEvaluationRun.deleteMany();
  await prisma.aiInteraction.deleteMany();
  await prisma.aiPolicy.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.webhookSubscription.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.servicePackage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.message.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.signatureEvent.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.document.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.ruleEvaluation.deleteMany();
  await prisma.disposition.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.liability.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.person.deleteMany();
  await prisma.matter.deleteMany();
  await prisma.workflowNode.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.sourceNote.deleteMany();
  await prisma.packChangeRequest.deleteMany();
  await prisma.packVersion.deleteMany();
  await prisma.jurisdictionPack.deleteMany();
  await prisma.jurisdiction.deleteMany();
  await prisma.tenantUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

async function main() {
  await reset();

  const tenant = await prisma.tenant.create({
    data: {
      id: "tenant-demo",
      name: "Ecobank Africa",
      slug: "ecobank-africa",
      deploymentModel: "b2b-direct",
      dataRegion: "africa",
      defaultLocale: "en",
      enabledCountries: encode(["NG", "GH", "ZA", "KE", "SN", "CM", "MZ", "AO", "EW", "PT"]),
      securityPolicy: encode({ mfaRequired: true, sessionMinutes: 60, dataResidency: ["africa"] })
    }
  });

  const solicitor = await prisma.user.create({
    data: {
      id: "user-solicitor",
      email: "solicitor@example.test",
      displayName: "Adaeze Okonkwo",
      preferredLocale: "en",
      mfaEnabled: true,
      professionalLicense: "NBA-DEMO-001"
    }
  });

  const notary = await prisma.user.create({
    data: {
      id: "user-notary",
      email: "notary@example.test",
      displayName: "Fatou Diallo",
      preferredLocale: "fr",
      mfaEnabled: true,
      professionalLicense: "ORDRE-DEMO-001"
    }
  });

  const paralegal = await prisma.user.create({
    data: {
      id: "user-paralegal",
      email: "paralegal@example.test",
      displayName: "Thabo Mokoena",
      preferredLocale: "en",
      mfaEnabled: true
    }
  });

  await prisma.tenantUser.createMany({
    data: [
      { tenantId: tenant.id, userId: solicitor.id, role: "solicitor", scopes: encode(["matter:write", "document:approve"]) },
      { tenantId: tenant.id, userId: notary.id, role: "notary", scopes: encode(["matter:write", "document:approve"]) },
      { tenantId: tenant.id, userId: paralegal.id, role: "paralegal", scopes: encode(["matter:write"]) }
    ]
  });

  await prisma.jurisdiction.createMany({
    data: [
      { code: "NG", name: "Nigeria", legalSystem: "common_law", defaultLocale: "en", currency: "NGN", timeZone: "Africa/Lagos", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Nigeria Wills Act 1958, Administration of Estates Law." },
      { code: "GH", name: "Ghana", legalSystem: "common_law", defaultLocale: "en", currency: "GHS", timeZone: "Africa/Accra", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Ghana Wills Act 1971, Intestate Succession Law (PNDC Law 111)." },
      { code: "ZA", name: "South Africa", legalSystem: "common_law", defaultLocale: "en", currency: "ZAR", timeZone: "Africa/Johannesburg", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "SA Wills Act 7 of 1953, Estate Duty Act 45 of 1955." },
      { code: "KE", name: "Kenya", legalSystem: "common_law", defaultLocale: "en", currency: "KES", timeZone: "Africa/Nairobi", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Kenya Law of Succession Act Cap 160." },
      { code: "SN", name: "Senegal", legalSystem: "civil_law", defaultLocale: "fr", currency: "XOF", timeZone: "Africa/Dakar", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Senegal Code de la Famille, OHADA Uniform Acts." },
      { code: "CM", name: "Cameroon", legalSystem: "civil_law", defaultLocale: "fr", currency: "XAF", timeZone: "Africa/Douala", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Cameroon Civil Code (francophone regions), Common Law (anglophone regions)." },
      { code: "MZ", name: "Mozambique", legalSystem: "civil_law", defaultLocale: "pt", currency: "MZN", timeZone: "Africa/Maputo", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Mozambique Código Civil, Portuguese-derived succession law." },
      { code: "AO", name: "Angola", legalSystem: "civil_law", defaultLocale: "pt", currency: "AOA", timeZone: "Africa/Luanda", phaseStatus: "phase_1_active", dataRegion: "africa", sourceSummary: "Angola Código Civil, Portuguese-derived succession law." },
      { code: "EW", name: "England & Wales", legalSystem: "common_law", defaultLocale: "en", currency: "GBP", timeZone: "Europe/London", phaseStatus: "phase_1_active", dataRegion: "uk", sourceSummary: "Wills Act 1837, Administration of Estates Act 1925, Inheritance Tax Act 1984, IHTA 1984." },
      { code: "PT", name: "Portugal", legalSystem: "civil_law", defaultLocale: "pt", currency: "EUR", timeZone: "Europe/Lisbon", phaseStatus: "phase_1_active", dataRegion: "eu", sourceSummary: "Código Civil Português, Código do Imposto do Selo, notarial execution formalities." }
    ]
  });

  const JURISDICTION_PACKS = [
    { id: "pack-ng", code: "NG", name: "Nigeria Wills Pack", locales: ["en"] },
    { id: "pack-gh", code: "GH", name: "Ghana Wills Pack", locales: ["en"] },
    { id: "pack-za", code: "ZA", name: "South Africa Wills Pack", locales: ["en"] },
    { id: "pack-ke", code: "KE", name: "Kenya Wills Pack", locales: ["en"] },
    { id: "pack-sn", code: "SN", name: "Senegal Wills Pack", locales: ["fr"] },
    { id: "pack-cm", code: "CM", name: "Cameroon Wills Pack", locales: ["fr", "en"] },
    { id: "pack-mz", code: "MZ", name: "Mozambique Wills Pack", locales: ["pt"] },
    { id: "pack-ao", code: "AO", name: "Angola Wills Pack", locales: ["pt"] },
    { id: "pack-ew", code: "EW", name: "England & Wales Wills Pack", locales: ["en"] },
    { id: "pack-pt", code: "PT", name: "Portugal Wills Pack", locales: ["pt"] },
  ];

  for (const p of JURISDICTION_PACKS) {
    await prisma.jurisdictionPack.create({
      data: {
        id: p.id,
        jurisdictionCode: p.code,
        name: p.name,
        ownerRole: "jurisdiction_counsel",
        status: "active",
        activeVersion: "1.0.0",
        enabledProductModes: encode(["planning"]),
        enabledDocTypes: encode(["will"]),
        languages: encode(p.locales),
        publicationBlockers: encode([])
      }
    });

    await prisma.packVersion.create({
      data: {
        packId: p.id,
        version: "1.0.0",
        status: "active",
        effectiveFrom: now,
        sourceRefs: encode([`${p.code}-S1`]),
        approvalRefs: encode(["legal-content-lead", "jurisdiction-counsel", "ai-safety-lead"]),
        snapshotHash: hash(`${p.id}:1.0.0`),
        rollbackPlan: "Rollback to previous immutable pack snapshot after tenant notification.",
        testEvidence: encode(["unit", "scenario", "golden-document", "localization", "ai-evaluation"])
      }
    });
  }

  await prisma.sourceNote.createMany({
    data: [
      { packId: "pack-ng", sourceCode: "NG-S1", title: "Nigeria Wills Act 1958", url: "https://laws.lawnigeria.com/wills-act", citation: "Nigeria Wills Act 1958, execution formalities and testamentary capacity.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-ng", reviewStatus: "approved" },
      { packId: "pack-gh", sourceCode: "GH-S1", title: "Ghana Wills Act 1971", url: "https://laws.gov.gh/wills-act", citation: "Ghana Wills Act 1971 (Act 360), Intestate Succession Law (PNDC Law 111).", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-gh", reviewStatus: "approved" },
      { packId: "pack-za", sourceCode: "ZA-S1", title: "SA Wills Act 7 of 1953", url: "https://www.gov.za/documents/wills-act", citation: "South Africa Wills Act 7 of 1953, Estate Duty Act 45 of 1955.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-za", reviewStatus: "approved" },
      { packId: "pack-ke", sourceCode: "KE-S1", title: "Kenya Law of Succession Act", url: "http://kenyalaw.org/kl/succession-act", citation: "Kenya Law of Succession Act Cap 160.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-ke", reviewStatus: "approved" },
      { packId: "pack-sn", sourceCode: "SN-S1", title: "Senegal Code de la Famille", url: "https://www.sec.gouv.sn/code-famille", citation: "Senegal Code de la Famille, succession and forced heirship rules.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-sn", reviewStatus: "approved" },
      { packId: "pack-cm", sourceCode: "CM-S1", title: "Cameroon Civil Code", url: "https://www.prc.cm/civil-code", citation: "Cameroon Civil Code (francophone) and Common Law (anglophone) succession.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-cm", reviewStatus: "approved" },
      { packId: "pack-mz", sourceCode: "MZ-S1", title: "Mozambique Código Civil", url: "https://www.portaldogoverno.gov.mz/codigo-civil", citation: "Mozambique Código Civil, Portuguese-derived succession and legítima.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-mz", reviewStatus: "approved" },
      { packId: "pack-ao", sourceCode: "AO-S1", title: "Angola Código Civil", url: "https://www.governo.gov.ao/codigo-civil", citation: "Angola Código Civil, Portuguese-derived succession and legítima.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-ao", reviewStatus: "approved" },
      { packId: "pack-ew", sourceCode: "EW-S1", title: "Inheritance Tax Act 1984", url: "https://www.legislation.gov.uk/ukpga/1984/51", citation: "UK Inheritance Tax Act 1984 (IHTA 1984), IHT thresholds and rates.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-ew", reviewStatus: "approved" },
      { packId: "pack-ew", sourceCode: "EW-S2", title: "Wills Act 1837", url: "https://www.legislation.gov.uk/ukpga/Will4and1Vict/7/26", citation: "Wills Act 1837, execution formalities for England & Wales.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-ew", reviewStatus: "approved" },
      { packId: "pack-pt", sourceCode: "PT-S1", title: "Código Civil Português", url: "https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php", citation: "Código Civil Português, succession, legítima, and notarial formalities.", effectiveFrom: now, reviewedBy: "jurisdiction-counsel-pt", reviewStatus: "approved" },
    ]
  });

  await prisma.rule.createMany({
    data: [
      { packId: "pack-ng", ruleCode: "NG-WILLS-ACT", category: "execution_formality", name: "Nigeria Wills Act compliance", description: "Nigeria Wills Act 1958 requires two witnesses for will execution.", expression: "documentType == 'will' && witnessCount < 2", severity: "blocker", phase: "1", sourceCode: "NG-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-NG-001"]) },
      { packId: "pack-ng", ruleCode: "NG-ISLAMIC-LAW", category: "personal_law", name: "Islamic law conflict check", description: "Northern Nigeria may apply Islamic personal law for succession.", expression: "testatorRegion == 'north' && hasSpouse", severity: "warning", phase: "1", sourceCode: "NG-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-NG-002"]) },
      { packId: "pack-za", ruleCode: "ZA-ESTATE-DUTY", category: "tax_threshold", name: "SA estate duty threshold", description: "Estate duty applies above ZAR 3.5M threshold.", expression: "estateValueZAR > 3500000", severity: "warning", phase: "1", sourceCode: "ZA-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-ZA-001"]) },
      { packId: "pack-za", ruleCode: "ZA-WILLS-ACT", category: "execution_formality", name: "SA Wills Act compliance", description: "SA Wills Act 7 of 1953 requires two competent witnesses.", expression: "documentType == 'will' && witnessCount < 2", severity: "blocker", phase: "1", sourceCode: "ZA-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-ZA-002"]) },
      { packId: "pack-ke", ruleCode: "KE-SUCCESSION-ACT", category: "succession", name: "Kenya Law of Succession", description: "Kenya Law of Succession Act Cap 160 governs testate and intestate succession.", expression: "documentType == 'will'", severity: "info", phase: "1", sourceCode: "KE-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-KE-001"]) },
      { packId: "pack-gh", ruleCode: "GH-INTESTATE-LAW", category: "succession", name: "Ghana Intestate Succession", description: "PNDC Law 111 may override testamentary dispositions for family property.", expression: "hasProtectedHeirs", severity: "info", phase: "1", sourceCode: "GH-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-GH-001"]) },
      { packId: "pack-sn", ruleCode: "SN-FORCED-HEIRSHIP", category: "reserved_share", name: "Senegal réserve héréditaire", description: "Senegal Code de la Famille enforces forced heirship (réserve héréditaire).", expression: "hasProtectedHeirs && nonProtectedPct > freeQuota", severity: "blocker", phase: "1", sourceCode: "SN-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-SN-001"]) },
      { packId: "pack-cm", ruleCode: "CM-FORCED-HEIRSHIP", category: "reserved_share", name: "Cameroon forced heirship", description: "Cameroon civil law regions enforce forced heirship.", expression: "hasProtectedHeirs && nonProtectedPct > freeQuota", severity: "blocker", phase: "1", sourceCode: "CM-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-CM-001"]) },
      { packId: "pack-mz", ruleCode: "MZ-LEGITIMA", category: "reserved_share", name: "Mozambique legítima", description: "Mozambique Código Civil enforces legítima (forced heirship).", expression: "hasProtectedHeirs && nonProtectedPct > freeQuota", severity: "blocker", phase: "1", sourceCode: "MZ-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-MZ-001"]) },
      { packId: "pack-ao", ruleCode: "AO-LEGITIMA", category: "reserved_share", name: "Angola legítima", description: "Angola Código Civil enforces legítima (forced heirship).", expression: "hasProtectedHeirs && nonProtectedPct > freeQuota", severity: "blocker", phase: "1", sourceCode: "AO-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-AO-001"]) },
      { packId: "pack-ng", ruleCode: "COMMON-MINOR-BENEFICIARY", category: "minor_beneficiary", name: "Minor beneficiary review", description: "Minor beneficiaries require professional review.", expression: "beneficiaryAge < minorAge", severity: "warning", phase: "1", sourceCode: "NG-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-COMMON-001"]) },
      { packId: "pack-ew", ruleCode: "EW-IHT-NRB", category: "tax_threshold", name: "UK IHT Nil Rate Band", description: "IHT Nil Rate Band (NRB) threshold — £325,000 as of 2026.", expression: "iht.nrb", severity: "info", phase: "1", sourceCode: "EW-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-EW-IHT-001"]) },
      { packId: "pack-ew", ruleCode: "EW-IHT-RNRB", category: "tax_threshold", name: "UK IHT Residence Nil Rate Band", description: "RNRB — £175,000 as of 2026, tapers for estates above £2M.", expression: "iht.rnrb", severity: "info", phase: "1", sourceCode: "EW-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-EW-IHT-002"]) },
      { packId: "pack-ew", ruleCode: "EW-IHT-RATE", category: "tax_rate", name: "UK IHT Standard Rate", description: "IHT standard rate 40%; reduced rate 36% when ≥10% of baseline estate left to charity.", expression: "iht.rate", severity: "info", phase: "1", sourceCode: "EW-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-EW-IHT-003"]) },
      { packId: "pack-ew", ruleCode: "EW-IHT-TAPER", category: "tax_relief", name: "UK IHT Taper Relief", description: "Taper relief on gifts made 3-7 years before death: 20% at 3-4yr, 40% at 4-5yr, 60% at 5-6yr, 80% at 6-7yr.", expression: "iht.taperRelief", severity: "info", phase: "1", sourceCode: "EW-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-EW-IHT-004"]) },
      { packId: "pack-ew", ruleCode: "EW-WILLS-ACT", category: "execution_formality", name: "E&W Wills Act 1837 compliance", description: "Wills Act 1837 requires two witnesses for will execution in E&W.", expression: "documentType == 'will' && witnessCount < 2", severity: "blocker", phase: "1", sourceCode: "EW-S2", effectiveFrom: now, status: "active", testRefs: encode(["RULE-EW-001"]) },
      { packId: "pack-pt", ruleCode: "PT-LEGITIMA", category: "reserved_share", name: "Portugal legítima", description: "Código Civil Português enforces legítima (forced heirship).", expression: "hasProtectedHeirs && nonProtectedPct > freeQuota", severity: "blocker", phase: "1", sourceCode: "PT-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-PT-001"]) },
      { packId: "pack-pt", ruleCode: "PT-NOTARIAL", category: "execution_formality", name: "Portugal notarial execution", description: "Notarial wills in Portugal require notarial execution.", expression: "documentType == 'will' && executionType == 'notarial'", severity: "blocker", phase: "1", sourceCode: "PT-S1", effectiveFrom: now, status: "active", testRefs: encode(["RULE-PT-002"]) },
    ]
  });

  for (const p of JURISDICTION_PACKS) {
    const workflow = await prisma.workflow.create({
      data: {
        packId: p.id,
        workflowCode: "planning-will",
        name: `${p.code} Planning Will Workflow`,
        productMode: "planning",
        documentType: "will",
        status: "active",
        version: "1.0.0"
      }
    });

    const reviewerRole = ["SN", "CM", "MZ", "AO"].includes(p.code) ? "notary" : "solicitor";
    await prisma.workflowNode.createMany({
      data: [
        { workflowId: workflow.id, nodeCode: "intake", label: "Intake", ownerRole: "paralegal", nodeType: "form" },
        { workflowId: workflow.id, nodeCode: "rule-scan", label: "Rule scan", ownerRole: "solicitor", nodeType: "automation" },
        { workflowId: workflow.id, nodeCode: "professional-review", label: "Professional review", ownerRole: reviewerRole, nodeType: "approval" },
        { workflowId: workflow.id, nodeCode: "execution", label: "Execution", ownerRole: reviewerRole, nodeType: "checklist" }
      ]
    });
  }

  // Document templates — English, French, Portuguese
  const ngTemplate = await prisma.documentTemplate.create({
    data: {
      id: "template-ng-will-en",
      packId: "pack-ng",
      templateCode: "will-standard",
      documentType: "will",
      locale: "en",
      version: "1.0.0",
      status: "approved",
      title: "Nigeria Will",
      body: "Last Will and Testament\n\nTestator: {{testator}}\nJurisdiction: Nigeria\nResidue: {{residue}}\nExecutor: {{executor}}\n\nExecution: Sign in wet ink in the presence of two witnesses.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "wet_ink_two_witnesses", witnessCount: 2 }),
      glossaryLintRules: encode(["executor", "beneficiary", "residue"])
    }
  });

  const snTemplate = await prisma.documentTemplate.create({
    data: {
      id: "template-sn-will-fr",
      packId: "pack-sn",
      templateCode: "will-standard",
      documentType: "will",
      locale: "fr",
      version: "1.0.0",
      status: "approved",
      title: "Testament Sénégal",
      body: "Testament\n\nTestateur: {{testator}}\nJuridiction: Sénégal\nRésiduaire: {{residue}}\nExécuteur: {{executor}}\n\nExécution: Acte notarié ou testament olographe conformément au Code de la Famille.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "notarial_or_holographic", notaryRequired: true }),
      glossaryLintRules: encode(["testateur", "héritier", "réserve héréditaire"])
    }
  });

  const mzTemplate = await prisma.documentTemplate.create({
    data: {
      id: "template-mz-will-pt",
      packId: "pack-mz",
      templateCode: "will-standard",
      documentType: "will",
      locale: "pt",
      version: "1.0.0",
      status: "approved",
      title: "Testamento Moçambique",
      body: "Testamento\n\nTestador: {{testator}}\nJurisdição: Moçambique\nRemanescente: {{residue}}\nExecutor: {{executor}}\n\nExecução: Encaminhar para formalidade notarial conforme o Código Civil.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "notarial_or_holographic", notaryRequired: true }),
      glossaryLintRules: encode(["testador", "herdeiro", "legítima"])
    }
  });

  await prisma.clause.createMany({
    data: [
      { templateId: ngTemplate.id, clauseCode: "residue", title: "Residue", body: "I give the residue of my estate to {{residue}}.", sourceCode: "NG-S1" },
      { templateId: ngTemplate.id, clauseCode: "executor", title: "Executor", body: "I appoint {{executor}} as executor.", sourceCode: "NG-S1" },
      { templateId: snTemplate.id, clauseCode: "residue", title: "Résiduaire", body: "Je lègue le résidu de mes biens à {{residue}}.", sourceCode: "SN-S1" },
      { templateId: snTemplate.id, clauseCode: "forced-heirship-warning", title: "Réserve héréditaire", body: "La disposition est soumise à la réserve héréditaire du Code de la Famille.", condition: "reservedShareRisk", sourceCode: "SN-S1" },
      { templateId: mzTemplate.id, clauseCode: "residue", title: "Remanescente", body: "Deixo o remanescente dos meus bens a {{residue}}.", sourceCode: "MZ-S1" },
      { templateId: mzTemplate.id, clauseCode: "legitima-warning", title: "Legítima", body: "A disposição está sujeita à revisão da legítima.", condition: "reservedShareRisk", sourceCode: "MZ-S1" }
    ]
  });

  await prisma.localizationString.createMany({
    data: [
      { packId: "pack-ng", contentKey: "nav.dashboard", locale: "en", sourceText: "Dashboard", translatedText: "Dashboard", status: "approved" },
      { packId: "pack-sn", contentKey: "nav.dashboard", locale: "fr", sourceText: "Dashboard", translatedText: "Tableau de bord", status: "approved" },
      { packId: "pack-mz", contentKey: "nav.dashboard", locale: "pt", sourceText: "Dashboard", translatedText: "Painel", status: "approved" },
      { packId: "pack-ng", contentKey: "matter.status.review", locale: "en", sourceText: "Review", translatedText: "Review", status: "approved" },
      { packId: "pack-sn", contentKey: "matter.status.review", locale: "fr", sourceText: "Review", translatedText: "Révision", status: "approved" },
      { packId: "pack-mz", contentKey: "matter.status.review", locale: "pt", sourceText: "Review", translatedText: "Revisão", status: "approved" },
    ]
  });

  await prisma.legalGlossaryTerm.createMany({
    data: [
      { packId: "pack-ng", termKey: "executor", locale: "en", preferredTerm: "executor", prohibitedTerms: encode(["administrator"]), definition: "Person appointed to administer a will.", status: "approved" },
      { packId: "pack-za", termKey: "lobola", locale: "en", preferredTerm: "lobola", prohibitedTerms: encode(["bride price"]), definition: "Traditional marriage consideration in South African customary law.", status: "approved" },
      { packId: "pack-sn", termKey: "reserve_hereditaire", locale: "fr", preferredTerm: "réserve héréditaire", prohibitedTerms: encode(["quota réservée"]), definition: "Part légalement protégée de la succession sous le Code de la Famille.", status: "approved" },
      { packId: "pack-mz", termKey: "legitima", locale: "pt", preferredTerm: "legítima", prohibitedTerms: encode(["quota reservada"]), definition: "Parte legalmente protegida da sucessão sob o Código Civil.", status: "approved" },
    ]
  });

  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      label: "Practice-management sandbox",
      keyHash: hash("demo-api-key"),
      scopes: encode(["rules:evaluate", "matters:write", "documents:generate", "exports:read"]),
      status: "active"
    }
  });

  const matter = await prisma.matter.create({
    data: {
      id: "matter-demo-ng-za",
      tenantId: tenant.id,
      matterNumber: "MAT-2026-0001",
      title: "Okonkwo family cross-border will",
      mode: "planning",
      status: "intake",
      primaryJurisdictionCode: "NG",
      additionalJurisdictions: encode(["ZA", "EW"]),
      languageOfRecord: "en",
      engagementStatus: "professional_engaged",
      confidentialityMode: "joint_with_firewall",
      riskLevel: "high",
      createdByUserId: solicitor.id
    }
  });

  const testator = await prisma.person.create({
    data: {
      id: "person-testator",
      tenantId: tenant.id,
      matterId: matter.id,
      legalName: "Chidi Okonkwo",
      preferredName: "Chidi",
      dateOfBirth: new Date("1978-04-12T00:00:00.000Z"),
      email: "chidi@example.test",
      nationality: "NG",
      residenceCountry: "GB",
      domicileCountry: "NG",
      habitualResidence: "NG",
      taxResidency: "NG",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "christian",
      legalSystemPref: "statutory"
    }
  });

  const spouse = await prisma.person.create({
    data: {
      id: "person-spouse",
      tenantId: tenant.id,
      matterId: matter.id,
      legalName: "Naledi Mokoena",
      dateOfBirth: new Date("1979-06-20T00:00:00.000Z"),
      nationality: "ZA",
      residenceCountry: "ZA",
      domicileCountry: "ZA",
      habitualResidence: "ZA",
      taxResidency: "ZA",
      maritalStatus: "married",
      preferredLanguage: "en"
    }
  });

  const child = await prisma.person.create({
    data: {
      id: "person-child",
      tenantId: tenant.id,
      matterId: matter.id,
      legalName: "Amara Okonkwo",
      dateOfBirth: new Date("2014-02-03T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      domicileCountry: "NG",
      habitualResidence: "NG",
      maritalStatus: "single",
      preferredLanguage: "en"
    }
  });

  await prisma.relationship.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, fromPersonId: testator.id, toPersonId: spouse.id, relationshipType: "spouse", legalStatus: "married", startDate: new Date("2008-09-08T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: matter.id, fromPersonId: testator.id, toPersonId: child.id, relationshipType: "child", legalStatus: "recognized", biological: true, dependent: true, minor: true }
    ]
  });

  await prisma.consent.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, personId: testator.id, consentType: "privacy_notice", locale: "en", textVersion: "2026.05", acknowledged: true, acknowledgedAt: now, legalBasis: "contract" },
      { tenantId: tenant.id, matterId: matter.id, personId: testator.id, consentType: "professional_disclaimer", locale: "en", textVersion: "2026.05", acknowledged: true, acknowledgedAt: now, legalBasis: "professional_engagement" }
    ]
  });

  await prisma.asset.createMany({
    data: [
      {
        tenantId: tenant.id,
        matterId: matter.id,
        ownerPersonId: testator.id,
        assetClass: "real_estate",
        description: "Lagos residence",
        jurisdictionCode: "NG",
        situsCountry: "NG",
        currency: "NGN",
        valuation: 120000000,
        valuationDate: now,
        valuationSource: "client_estimate",
        confidenceLevel: "medium",
        ownershipType: "sole",
        ownershipShare: 100,
        evidenceRefs: encode(["title-register-placeholder"])
      },
      {
        tenantId: tenant.id,
        matterId: matter.id,
        ownerPersonId: testator.id,
        assetClass: "real_estate",
        description: "Johannesburg apartment",
        jurisdictionCode: "ZA",
        situsCountry: "ZA",
        currency: "ZAR",
        valuation: 4500000,
        valuationDate: now,
        valuationSource: "client_estimate",
        confidenceLevel: "low",
        ownershipType: "sole",
        evidenceRefs: encode([])
      }
    ]
  });

  // Additional Okonkwo assets (cross-border)
  await prisma.asset.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, ownerPersonId: testator.id, assetClass: "real_estate", description: "London investment property, Kensington", jurisdictionCode: "EW", situsCountry: "GB", currency: "GBP", valuation: 650000, valuationDate: now, valuationSource: "estate_agent_valuation", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: matter.id, ownerPersonId: testator.id, assetClass: "real_estate", description: "Lagos commercial building, Victoria Island", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 200000000, valuationDate: now, valuationSource: "professional_valuation", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: matter.id, ownerPersonId: testator.id, assetClass: "pension", description: "UK workplace pension", jurisdictionCode: "EW", situsCountry: "GB", currency: "GBP", valuation: 180000, valuationDate: now, valuationSource: "pension_statement", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: matter.id, ownerPersonId: testator.id, assetClass: "cryptocurrency", description: "Bitcoin holdings", jurisdictionCode: "EW", situsCountry: "GB", currency: "GBP", valuation: 35000, valuationDate: now, valuationSource: "exchange_balance", confidenceLevel: "low", ownershipType: "sole", volatilityFlag: true, digitalAccessMethod: "hardware wallet" },
      { tenantId: tenant.id, matterId: matter.id, ownerPersonId: testator.id, assetClass: "bank_account", description: "Standard Chartered savings account", jurisdictionCode: "EW", situsCountry: "GB", currency: "GBP", valuation: 50000, valuationDate: now, valuationSource: "bank_statement", confidenceLevel: "high", ownershipType: "sole" },
    ]
  });

  // Okonkwo lifetime gifts
  const twoYearsAgo = new Date("2024-05-12T00:00:00.000Z");
  const oneYearAgo = new Date("2025-05-12T00:00:00.000Z");
  const fourYearsAgoNg = new Date("2022-05-12T00:00:00.000Z");

  await prisma.lifetimeGift.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, donorPersonId: testator.id, giftDate: twoYearsAgo, value: 25000, currency: "GBP", assetType: "cash", relationship: "sibling", exemptionClaimed: "none", petOrClt: "pet", description: "Cash gift to brother" },
      { tenantId: tenant.id, matterId: matter.id, donorPersonId: testator.id, giftDate: oneYearAgo, value: 3000, currency: "GBP", assetType: "cash", relationship: "child", exemptionClaimed: "annual_exemption", petOrClt: "pet", description: "Annual exemption gift to Amara" },
      { tenantId: tenant.id, matterId: matter.id, donorPersonId: testator.id, giftDate: fourYearsAgoNg, value: 100000, currency: "GBP", assetType: "cash", relationship: "trust", exemptionClaimed: "none", petOrClt: "clt", description: "Transfer to family trust" },
    ]
  });

  const scenario = await prisma.scenario.create({
    data: {
      id: "scenario-demo-residue",
      tenantId: tenant.id,
      matterId: matter.id,
      name: "Residue to spouse, then child",
      status: "draft",
      comparisonBase: true
    }
  });

  await prisma.disposition.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, scenarioId: scenario.id, giftType: "residue", beneficiaryPersonId: spouse.id, beneficiaryLabel: "Naledi Mokoena", percentage: 100, perStirpes: false },
      { tenantId: tenant.id, matterId: matter.id, scenarioId: scenario.id, giftType: "percentage", beneficiaryPersonId: child.id, beneficiaryLabel: "Amara Okonkwo contingent", percentage: 100, survivorshipDays: 30, perStirpes: true }
    ]
  });

  // Additional Okonkwo scenarios
  await prisma.scenario.create({
    data: {
      id: "scenario-ng-iht-charity",
      tenantId: tenant.id,
      matterId: matter.id,
      name: "IHT optimization via charitable giving",
      status: "draft",
      comparisonBase: false
    }
  });

  await prisma.scenario.create({
    data: {
      id: "scenario-ng-lifetime",
      tenantId: tenant.id,
      matterId: matter.id,
      name: "Lifetime gift strategy",
      status: "draft",
      comparisonBase: false
    }
  });

  // Okonkwo client goals
  await prisma.clientGoal.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, goalText: "Minimize inheritance tax across UK and Nigerian assets", category: "minimize_iht", priority: "high", status: "partially_addressed", linkedScenarioIds: encode(["scenario-demo-residue", "scenario-ng-iht-charity"]) },
      { tenantId: tenant.id, matterId: matter.id, goalText: "Protect family home in London for Naledi and Amara", category: "protect_family_home", priority: "high", status: "pending", linkedScenarioIds: encode([]) },
      { tenantId: tenant.id, matterId: matter.id, goalText: "Coordinate wills across Nigeria, South Africa, and England", category: "cross_border_coordination", priority: "high", status: "partially_addressed", linkedScenarioIds: encode(["scenario-demo-residue"]) },
      { tenantId: tenant.id, matterId: matter.id, goalText: "Ensure Amara receives education trust", category: "provide_for_dependants", priority: "medium", status: "pending", linkedScenarioIds: encode([]) },
      { tenantId: tenant.id, matterId: matter.id, goalText: "Tax-efficient charitable giving to Lagos community foundation", category: "charitable_giving", priority: "low", status: "pending", linkedScenarioIds: encode(["scenario-ng-iht-charity"]) },
    ]
  });

  // Okonkwo liabilities
  await prisma.liability.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, liabilityType: "mortgage", description: "Mortgage on London investment property", creditor: "HSBC UK", currency: "GBP", amount: 180000, dueDate: new Date("2038-06-01T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: matter.id, liabilityType: "loan", description: "Business expansion loan, Lagos", creditor: "Access Bank Nigeria", currency: "NGN", amount: 25000000, dueDate: new Date("2029-12-31T00:00:00.000Z") },
    ]
  });

  // Okonkwo will coordination
  await prisma.willCoordination.createMany({
    data: [
      { tenantId: tenant.id, matterId: matter.id, jurisdictionCode: "NG", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in Nigeria.", assetIds: encode([]), notes: "Covers Lagos residence and commercial building" },
      { tenantId: tenant.id, matterId: matter.id, jurisdictionCode: "EW", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in England and Wales.", assetIds: encode([]), notes: "Covers London property, pension, crypto, and bank account" },
      { tenantId: tenant.id, matterId: matter.id, jurisdictionCode: "ZA", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in South Africa.", assetIds: encode([]), notes: "Covers Johannesburg apartment" },
    ]
  });

  // --- EW matter for IHT calculation testing ---
  const ewMatter = await prisma.matter.create({
    data: {
      id: "matter-demo-ew",
      tenantId: tenant.id,
      matterNumber: "MAT-2026-0002",
      title: "Morgan family estate plan",
      mode: "planning",
      status: "intake",
      primaryJurisdictionCode: "EW",
      additionalJurisdictions: encode(["PT"]),
      languageOfRecord: "en",
      engagementStatus: "professional_engaged",
      confidentialityMode: "standard",
      riskLevel: "medium",
      createdByUserId: solicitor.id
    }
  });

  const ewTestator = await prisma.person.create({
    data: {
      id: "person-ew-testator",
      tenantId: tenant.id,
      matterId: ewMatter.id,
      legalName: "James Morgan",
      dateOfBirth: new Date("1965-03-15T00:00:00.000Z"),
      nationality: "GB",
      residenceCountry: "GB",
      domicileCountry: "GB",
      domicileOfOrigin: "GB",
      habitualResidence: "GB",
      taxResidency: "GB",
      maritalStatus: "married",
      preferredLanguage: "en"
    }
  });

  const ewSpouse = await prisma.person.create({
    data: {
      id: "person-ew-spouse",
      tenantId: tenant.id,
      matterId: ewMatter.id,
      legalName: "Sarah Morgan",
      dateOfBirth: new Date("1968-07-22T00:00:00.000Z"),
      nationality: "GB",
      residenceCountry: "GB",
      domicileCountry: "GB",
      domicileOfOrigin: "GB",
      habitualResidence: "GB",
      taxResidency: "GB",
      maritalStatus: "married",
      preferredLanguage: "en"
    }
  });

  await prisma.relationship.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      fromPersonId: ewTestator.id,
      toPersonId: ewSpouse.id,
      relationshipType: "spouse",
      legalStatus: "married"
    }
  });

  // EW assets
  await prisma.asset.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewTestator.id, assetClass: "real_estate", description: "Family home, London", situsCountry: "GB", currency: "GBP", valuation: 850000, valuationDate: now, valuationSource: "estate agent valuation", confidenceLevel: "high", ownershipType: "joint_tenancy", ownershipShare: 50 },
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewTestator.id, assetClass: "bank_account", description: "Barclays current account", situsCountry: "GB", currency: "GBP", valuation: 120000, valuationDate: now, valuationSource: "bank statement", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewTestator.id, assetClass: "securities", description: "ISA and investment portfolio", situsCountry: "GB", currency: "GBP", valuation: 350000, valuationDate: now, valuationSource: "investment platform", confidenceLevel: "medium", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewSpouse.id, assetClass: "bank_account", description: "Sarah savings account", situsCountry: "GB", currency: "GBP", valuation: 80000, valuationDate: now, valuationSource: "bank statement", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewTestator.id, assetClass: "real_estate", description: "Holiday apartment, Algarve", situsCountry: "PT", currency: "EUR", valuation: 280000, valuationDate: now, valuationSource: "estate agent valuation", confidenceLevel: "medium", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: ewMatter.id, ownerPersonId: ewTestator.id, assetClass: "cryptocurrency", description: "Bitcoin holdings", situsCountry: "GB", currency: "GBP", valuation: 45000, valuationDate: now, valuationSource: "exchange balance", confidenceLevel: "low", ownershipType: "sole", volatilityFlag: true, digitalAccessMethod: "hardware wallet with executor instruction", evidenceRefs: encode(["wallet-inventory", "executor-access-instruction"]) },
    ]
  });

  // Morgan liabilities
  await prisma.liability.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, liabilityType: "mortgage", description: "Mortgage on family home, London", creditor: "NatWest", currency: "GBP", amount: 220000, dueDate: new Date("2040-03-01T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: ewMatter.id, liabilityType: "mortgage", description: "Mortgage on Algarve apartment", creditor: "Millennium BCP", currency: "EUR", amount: 95000, dueDate: new Date("2035-09-01T00:00:00.000Z") },
    ]
  });

  // Morgan lifetime gifts
  const threeYearsAgo = new Date("2023-05-12T00:00:00.000Z");
  const fourYearsAgo = new Date("2022-05-12T00:00:00.000Z");
  const fiveYearsAgo = new Date("2021-05-12T00:00:00.000Z");
  const sixYearsAgo = new Date("2020-05-12T00:00:00.000Z");
  await prisma.lifetimeGift.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, donorPersonId: ewTestator.id, giftDate: fourYearsAgo, value: 50000, currency: "GBP", assetType: "cash", relationship: "child", exemptionClaimed: "none", petOrClt: "pet", description: "Cash gift to daughter for house deposit" },
      { tenantId: tenant.id, matterId: ewMatter.id, donorPersonId: ewTestator.id, giftDate: sixYearsAgo, value: 150000, currency: "GBP", assetType: "cash", relationship: "child", exemptionClaimed: "none", petOrClt: "pet", description: "Cash gift to son for business start-up" },
      { tenantId: tenant.id, matterId: ewMatter.id, donorPersonId: ewTestator.id, giftDate: threeYearsAgo, value: 3000, currency: "GBP", assetType: "cash", relationship: "child", exemptionClaimed: "annual_exemption", petOrClt: "pet", description: "Annual exemption gift to daughter" },
      { tenantId: tenant.id, matterId: ewMatter.id, donorPersonId: ewTestator.id, giftDate: fiveYearsAgo, value: 75000, currency: "GBP", assetType: "securities", relationship: "trust", exemptionClaimed: "none", petOrClt: "clt", description: "Transfer of shares to family trust" },
    ]
  });

  // Morgan will coordination
  await prisma.willCoordination.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, jurisdictionCode: "EW", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in England and Wales.", assetIds: encode([]), notes: "Covers family home, bank accounts, ISA, and crypto" },
      { tenantId: tenant.id, matterId: ewMatter.id, jurisdictionCode: "PT", documentType: "will", status: "draft", revocationClause: "Revogo todos os testamentos anteriores relativos aos meus bens em Portugal.", assetIds: encode([]), notes: "Covers Algarve holiday apartment" },
    ]
  });

  // Domicile record for diaspora testing
  await prisma.domicileRecord.create({
    data: {
      tenantId: tenant.id,
      personId: testator.id,
      domicileOfOrigin: "NG",
      domicileOfChoice: "GB",
      snapBackRisk: true,
      snapBackReason: "Chidi has lived in the UK for 12 years but maintains strong ties to Nigeria including the Lagos commercial property and family business. Nigerian domicile of origin may 'snap back' if UK domicile of choice is not clearly established."
    }
  });

  // Morgan domicile record
  await prisma.domicileRecord.create({
    data: {
      tenantId: tenant.id,
      personId: ewTestator.id,
      domicileOfOrigin: "GB",
      domicileOfChoice: "GB",
      snapBackRisk: false,
      evidenceSummary: "James Morgan is UK-born and has always been domiciled in England & Wales. Owns a holiday property in Portugal but no intention to acquire Portuguese domicile."
    }
  });

  await prisma.domicileRecord.create({
    data: {
      tenantId: tenant.id,
      personId: ewSpouse.id,
      domicileOfOrigin: "GB",
      domicileOfChoice: "GB",
      snapBackRisk: false,
      evidenceSummary: "Sarah Morgan's UK domicile evidence, residence, tax residency, family home, and intention have been reviewed."
    }
  });

  // EW document templates
  await prisma.documentTemplate.create({
    data: {
      id: "template-ew-will-en",
      packId: "pack-ew",
      templateCode: "will-standard",
      documentType: "will",
      locale: "en",
      version: "1.0.0",
      status: "approved",
      title: "England & Wales Will",
      body: "Last Will and Testament\n\nTestator: {{testator}}\nJurisdiction: England & Wales\nResidue: {{residue}}\nExecutor: {{executor}}\n\nExecution: Sign in wet ink in the presence of two witnesses.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "wet_ink_two_witnesses", witnessCount: 2 }),
      glossaryLintRules: encode(["executor", "beneficiary", "residue", "nil rate band"])
    }
  });

  await prisma.documentTemplate.create({
    data: {
      id: "template-pt-will-pt",
      packId: "pack-pt",
      templateCode: "will-standard",
      documentType: "will",
      locale: "pt",
      version: "1.0.0",
      status: "approved",
      title: "Testamento Portugal",
      body: "Testamento\n\nTestador: {{testator}}\nJurisdição: Portugal\nRemanescente: {{residue}}\nExecutor: {{executor}}\n\nExecução: Encaminhar para formalidade notarial.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "notarial", notaryRequired: true }),
      glossaryLintRules: encode(["testador", "herdeiro", "legítima"])
    }
  });

  // EW scenario for IHT calculation
  await prisma.scenario.create({
    data: {
      id: "scenario-ew-base",
      tenantId: tenant.id,
      matterId: ewMatter.id,
      name: "Base scenario — no IHT planning",
      status: "draft",
      comparisonBase: true
    }
  });

  // Morgan client goals
  await prisma.clientGoal.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, goalText: "Minimize IHT exposure on combined estate", category: "minimize_iht", priority: "high", status: "addressed", linkedScenarioIds: encode(["scenario-ew-base"]), notes: "Focus on spousal exemption and RNRB qualification" },
      { tenantId: tenant.id, matterId: ewMatter.id, goalText: "Protect family home for Sarah", category: "protect_family_home", priority: "high", status: "addressed", linkedScenarioIds: encode(["scenario-ew-base"]), notes: "Ensure RNRB applies to the London property" },
      { tenantId: tenant.id, matterId: ewMatter.id, goalText: "Coordinate Portugal property in estate plan", category: "cross_border_coordination", priority: "medium", status: "addressed", linkedScenarioIds: encode(["scenario-ew-base"]), notes: "Portuguese legítima may restrict free disposition" },
    ]
  });

  await prisma.ihtCalculation.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      personId: ewTestator.id,
      scenarioId: "scenario-ew-base",
      effectiveDate: now,
      netEstate: 980000,
      nrb: 325000,
      nrbUsed: 325000,
      rnrb: 0,
      taxableEstate: 655000,
      ihtDue: 76400,
      exemptionsApplied: encode({ spouse: 0, annual: 3000, smallGifts: 0, normalExpenditure: 0, charity: 0, total: 3000 }),
      sevenYearTransfers: encode([]),
      calculationDetails: encode({ source: "seeded_demo_iht_calculation" })
    }
  });

  await prisma.estatePlanningRecord.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "income_record", title: "James Morgan annual earnings", reviewStatus: "reviewed", payload: encode({ annualAmount: 220000, currency: "GBP", source: "employment_and_dividends" }), evidenceRefs: encode(["income-schedule-2026"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "expense_record", title: "Morgan household annual expenditure", reviewStatus: "reviewed", payload: encode({ annualAmount: 125000, currency: "GBP", category: "household" }), evidenceRefs: encode(["cashflow-review-2026"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "protection_policy", title: "Whole-of-life IHT cover", reviewStatus: "reviewed", payload: encode({ coverAmount: 250000, currency: "GBP", inTrust: true, outsideEstate: true, carrier: "Demo Life" }), evidenceRefs: encode(["policy-trust-deed-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "pension_nomination", title: "Workplace pension nomination", reviewStatus: "reviewed", payload: encode({ beneficiary: "Sarah Morgan", nominationDate: "2026-04-15", provider: "Demo Pension" }), evidenceRefs: encode(["pension-nomination-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "trust_structure", title: "Nil-rate-band discretionary trust review", reviewStatus: "reviewed", payload: encode({ trustType: "discretionary", taxTreatment: "relevant_property_regime", trustees: ["Sarah Morgan", "Professional trustee"], beneficiaries: ["children"] }), evidenceRefs: encode(["trust-review-note-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "incapacity_instrument", title: "Property and financial affairs LPA", reviewStatus: "reviewed", payload: encode({ instrumentType: "property_financial", attorneys: ["Sarah Morgan"], status: "registered" }), evidenceRefs: encode(["lpa-finance-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, recordType: "incapacity_instrument", title: "Health and welfare LPA", reviewStatus: "reviewed", payload: encode({ instrumentType: "health_welfare", attorneys: ["Sarah Morgan"], status: "registered" }), evidenceRefs: encode(["lpa-health-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, recordType: "dta_position", title: "UK Portugal double-tax review", reviewStatus: "reviewed", payload: encode({ countryA: "GB", countryB: "PT", reliefType: "unilateral_credit_review", status: "reviewed" }), evidenceRefs: encode(["dta-pt-demo"]) },
      { tenantId: tenant.id, matterId: ewMatter.id, recordType: "professional_referral", title: "Portuguese notarial and tax advisor", reviewStatus: "accepted", payload: encode({ advisorType: "local_tax_notary", jurisdiction: "PT", status: "engaged" }), evidenceRefs: encode(["referral-pt-demo"]) },
    ]
  });

  await prisma.estateCashFlowItem.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, itemType: "income", category: "employment_and_dividends", description: "James Morgan annual earnings", amount: 220000, currency: "GBP", frequency: "annual", evidenceRefs: encode(["income-schedule-2026"]), reviewStatus: "reviewed" },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, itemType: "expense", category: "household", description: "Morgan household annual expenditure", amount: 125000, currency: "GBP", frequency: "annual", evidenceRefs: encode(["cashflow-review-2026"]), reviewStatus: "reviewed" },
    ]
  });

  await prisma.protectionPolicy.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      personId: ewTestator.id,
      policyType: "whole_of_life",
      carrier: "Demo Life",
      policyRef: "WOL-DEMO-001",
      coverAmount: 250000,
      currency: "GBP",
      ownerPersonId: ewTestator.id,
      lifeAssuredPersonId: ewTestator.id,
      beneficiaryLabel: "Family trust",
      inTrust: true,
      outsideEstate: true,
      premiumAmount: 450,
      premiumFrequency: "monthly",
      evidenceRefs: encode(["policy-trust-deed-demo"]),
      reviewStatus: "reviewed"
    }
  });

  await prisma.estateTrustStructure.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      name: "Nil-rate-band discretionary trust review",
      trustType: "discretionary",
      taxTreatment: "relevant_property_regime",
      jurisdictionCode: "EW",
      settledByPersonId: ewTestator.id,
      trusteePersonIds: encode([ewSpouse.id]),
      beneficiaryPersonIds: encode([]),
      linkedAssetIds: encode([]),
      scenarioId: "scenario-ew-base",
      evidenceRefs: encode(["trust-review-note-demo"]),
      reviewStatus: "reviewed"
    }
  });

  await prisma.incapacityInstrument.createMany({
    data: [
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, instrumentType: "property_financial", jurisdictionCode: "EW", attorneyPersonIds: encode([ewSpouse.id]), executionStatus: "registered", registeredAt: now, evidenceRefs: encode(["lpa-finance-demo"]), reviewStatus: "reviewed" },
      { tenantId: tenant.id, matterId: ewMatter.id, personId: ewTestator.id, instrumentType: "health_welfare", jurisdictionCode: "EW", attorneyPersonIds: encode([ewSpouse.id]), executionStatus: "registered", registeredAt: now, evidenceRefs: encode(["lpa-health-demo"]), reviewStatus: "reviewed" },
    ]
  });

  await prisma.crossBorderTaxPosition.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      countryA: "GB",
      countryB: "PT",
      reliefType: "unilateral_credit_review",
      treatyStatus: "reviewed",
      noDtaWarning: true,
      notes: "Portuguese situs property requires local tax review and unilateral relief analysis.",
      evidenceRefs: encode(["dta-pt-demo"]),
      reviewStatus: "reviewed"
    }
  });

  await prisma.outsideEstateNomination.create({
    data: {
      tenantId: tenant.id,
      matterId: ewMatter.id,
      personId: ewTestator.id,
      nominationType: "pension_nomination",
      provider: "Demo Pension",
      beneficiaryLabel: "Sarah Morgan",
      beneficiaryPersonId: ewSpouse.id,
      nominationDate: now,
      passesOutsideEstate: true,
      evidenceRefs: encode(["pension-nomination-demo"]),
      reviewStatus: "reviewed"
    }
  });

  // --- Abdullahi matter (Islamic estate plan) ---
  const abdullahiMatter = await prisma.matter.create({
    data: {
      id: "matter-demo-ng-ke-islamic",
      tenantId: tenant.id,
      matterNumber: "MAT-2026-0003",
      title: "Abdullahi family Islamic estate plan",
      mode: "planning",
      status: "intake",
      primaryJurisdictionCode: "NG",
      additionalJurisdictions: encode(["KE"]),
      languageOfRecord: "en",
      engagementStatus: "professional_engaged",
      confidentialityMode: "standard",
      riskLevel: "high",
      createdByUserId: solicitor.id
    }
  });

  const ibrahim = await prisma.person.create({
    data: {
      id: "person-ibrahim",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Ibrahim Abdullahi",
      preferredName: "Ibrahim",
      dateOfBirth: new Date("1955-01-20T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      domicileCountry: "NG",
      habitualResidence: "NG",
      taxResidency: "NG",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "muslim",
      legalSystemPref: "islamic"
    }
  });

  const fatima = await prisma.person.create({
    data: {
      id: "person-fatima",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Fatima Abdullahi",
      dateOfBirth: new Date("1960-06-15T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      domicileCountry: "NG",
      habitualResidence: "NG",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const aisha = await prisma.person.create({
    data: {
      id: "person-aisha",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Aisha Abdullahi",
      dateOfBirth: new Date("1968-11-03T00:00:00.000Z"),
      nationality: "KE",
      residenceCountry: "KE",
      domicileCountry: "KE",
      habitualResidence: "KE",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiSon1 = await prisma.person.create({
    data: {
      id: "person-abd-son1",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Yusuf Abdullahi",
      dateOfBirth: new Date("1985-03-10T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiSon2 = await prisma.person.create({
    data: {
      id: "person-abd-son2",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Umar Abdullahi",
      dateOfBirth: new Date("1990-09-22T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "KE",
      maritalStatus: "single",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiSon3 = await prisma.person.create({
    data: {
      id: "person-abd-son3",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Hassan Abdullahi",
      dateOfBirth: new Date("1993-01-05T00:00:00.000Z"),
      nationality: "KE",
      residenceCountry: "KE",
      maritalStatus: "single",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiDaughter1 = await prisma.person.create({
    data: {
      id: "person-abd-daughter1",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Maryam Abdullahi",
      dateOfBirth: new Date("1988-07-18T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      maritalStatus: "married",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiDaughter2 = await prisma.person.create({
    data: {
      id: "person-abd-daughter2",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Zainab Abdullahi",
      dateOfBirth: new Date("1995-04-30T00:00:00.000Z"),
      nationality: "KE",
      residenceCountry: "KE",
      maritalStatus: "single",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  const abdullahiMother = await prisma.person.create({
    data: {
      id: "person-abd-mother",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      legalName: "Halima Abdullahi",
      dateOfBirth: new Date("1935-12-01T00:00:00.000Z"),
      nationality: "NG",
      residenceCountry: "NG",
      maritalStatus: "widowed",
      preferredLanguage: "en",
      religion: "muslim"
    }
  });

  // Abdullahi relationships
  await prisma.relationship.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: fatima.id, relationshipType: "spouse", legalStatus: "married", startDate: new Date("1983-06-01T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: aisha.id, relationshipType: "spouse", legalStatus: "married", startDate: new Date("1992-01-15T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: abdullahiSon1.id, relationshipType: "child", legalStatus: "recognized", biological: true },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: abdullahiSon2.id, relationshipType: "child", legalStatus: "recognized", biological: true },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: abdullahiSon3.id, relationshipType: "child", legalStatus: "recognized", biological: true },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: abdullahiDaughter1.id, relationshipType: "child", legalStatus: "recognized", biological: true },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: ibrahim.id, toPersonId: abdullahiDaughter2.id, relationshipType: "child", legalStatus: "recognized", biological: true },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, fromPersonId: abdullahiMother.id, toPersonId: ibrahim.id, relationshipType: "parent", legalStatus: "recognized", biological: true },
    ]
  });

  // Abdullahi assets
  await prisma.asset.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "real_estate", description: "Abuja family compound", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 250000000, valuationDate: now, valuationSource: "professional_valuation", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "real_estate", description: "Kano commercial plaza", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 180000000, valuationDate: now, valuationSource: "professional_valuation", confidenceLevel: "medium", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "bank_account", description: "GTBank current account", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 85000000, valuationDate: now, valuationSource: "bank_statement", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "bank_account", description: "First National Bank account", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 55000000, valuationDate: now, valuationSource: "bank_statement", confidenceLevel: "high", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "real_estate", description: "Nairobi apartment, Westlands", jurisdictionCode: "KE", situsCountry: "KE", currency: "KES", valuation: 18000000, valuationDate: now, valuationSource: "estate_agent_valuation", confidenceLevel: "medium", ownershipType: "sole" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, ownerPersonId: ibrahim.id, assetClass: "livestock", description: "Cattle ranch, Kaduna", jurisdictionCode: "NG", situsCountry: "NG", currency: "NGN", valuation: 45000000, valuationDate: now, valuationSource: "client_estimate", confidenceLevel: "low", ownershipType: "sole" },
    ]
  });

  // Abdullahi scenario
  await prisma.scenario.create({
    data: {
      id: "scenario-abd-faraid",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      name: "Faraid-compliant distribution",
      status: "draft",
      comparisonBase: true
    }
  });

  // Abdullahi liabilities
  await prisma.liability.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, liabilityType: "loan", description: "Business loan for Kano commercial plaza renovation", creditor: "Zenith Bank Nigeria", currency: "NGN", amount: 35000000, dueDate: new Date("2028-06-30T00:00:00.000Z") },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, liabilityType: "personal_loan", description: "Family loan to cousin (outstanding)", creditor: "Aliyu Abdullahi", currency: "NGN", amount: 8000000, dueDate: new Date("2027-12-31T00:00:00.000Z") },
    ]
  });

  // Abdullahi lifetime gifts
  const abdThreeYearsAgo = new Date("2023-05-12T00:00:00.000Z");
  const abdFiveYearsAgo = new Date("2021-05-12T00:00:00.000Z");
  const abdSixYearsAgo = new Date("2020-05-12T00:00:00.000Z");
  await prisma.lifetimeGift.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, donorPersonId: ibrahim.id, recipientPersonId: abdullahiSon1.id, giftDate: abdThreeYearsAgo, value: 15000000, currency: "NGN", assetType: "cash", relationship: "child", exemptionClaimed: "none", petOrClt: "pet", description: "Cash gift to Yusuf for business" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, donorPersonId: ibrahim.id, recipientPersonId: abdullahiDaughter1.id, giftDate: abdFiveYearsAgo, value: 8000000, currency: "NGN", assetType: "cash", relationship: "child", exemptionClaimed: "none", petOrClt: "pet", description: "Mahr payment for Maryam's marriage" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, donorPersonId: ibrahim.id, recipientPersonId: abdullahiSon2.id, giftDate: abdSixYearsAgo, value: 5000000, currency: "NGN", assetType: "cash", relationship: "child", exemptionClaimed: "none", petOrClt: "pet", description: "Contribution to Umar's education in Nairobi" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, donorPersonId: ibrahim.id, giftDate: abdThreeYearsAgo, value: 2000000, currency: "NGN", assetType: "cash", relationship: "charity", exemptionClaimed: "none", petOrClt: "pet", description: "Zakat and charitable donation to mosque" },
    ]
  });

  // Abdullahi will coordination
  await prisma.willCoordination.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, jurisdictionCode: "NG", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in Nigeria.", assetIds: encode([]), notes: "Covers Abuja compound, Kano plaza, bank accounts, and cattle ranch. Must comply with Islamic law." },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, jurisdictionCode: "KE", documentType: "will", status: "draft", revocationClause: "I revoke all previous wills and codicils made by me insofar as they relate to my property in Kenya.", assetIds: encode([]), notes: "Covers Nairobi apartment. Kenya Law of Succession Act may conflict with Faraid distribution." },
    ]
  });

  // Abdullahi client goals
  await prisma.clientGoal.createMany({
    data: [
      { tenantId: tenant.id, matterId: abdullahiMatter.id, goalText: "Ensure full Islamic law compliance for estate distribution", category: "islamic_compliance", priority: "high", status: "addressed", linkedScenarioIds: encode(["scenario-abd-faraid"]), notes: "Ibrahim insists on strict Faraid compliance across all jurisdictions" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, goalText: "Equitable treatment of both wives per Islamic law", category: "islamic_compliance", priority: "high", status: "addressed", linkedScenarioIds: encode(["scenario-abd-faraid"]), notes: "Both wives to receive equal 1/8 share as per Faraid with children" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, goalText: "Coordinate estate distribution across Nigeria and Kenya", category: "cross_border_coordination", priority: "medium", status: "partially_addressed", linkedScenarioIds: encode([]), notes: "Kenya assets require separate succession process" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, goalText: "Protect mother Halima's 1/6 Faraid share", category: "provide_for_dependants", priority: "high", status: "addressed", linkedScenarioIds: encode(["scenario-abd-faraid"]), notes: "Elderly mother must be provided for per Islamic obligation" },
      { tenantId: tenant.id, matterId: abdullahiMatter.id, goalText: "Minimize succession costs and delays", category: "tax_efficiency", priority: "medium", status: "pending", linkedScenarioIds: encode([]), notes: "Multi-jurisdiction probate can be costly and slow" },
    ]
  });

  // Pre-computed Faraid calculation
  await prisma.faraidCalculation.create({
    data: {
      id: "faraid-abd-main",
      tenantId: tenant.id,
      matterId: abdullahiMatter.id,
      deceasedPersonId: ibrahim.id,
      netEstate: 615000000,
      currency: "NGN",
      method: "standard",
      heirs: encode([
        { heirType: "wife", name: "Fatima Abdullahi", personId: fatima.id, quranicFraction: "1/8 shared", percentage: 6.25, amount: 38437500, blocked: false },
        { heirType: "wife", name: "Aisha Abdullahi", personId: aisha.id, quranicFraction: "1/8 shared", percentage: 6.25, amount: 38437500, blocked: false },
        { heirType: "mother", name: "Halima Abdullahi", personId: abdullahiMother.id, quranicFraction: "1/6", percentage: 16.67, amount: 102500000, blocked: false },
        { heirType: "son", name: "Yusuf Abdullahi", personId: abdullahiSon1.id, quranicFraction: "residuary", percentage: 17.71, amount: 108906250, blocked: false },
        { heirType: "son", name: "Umar Abdullahi", personId: abdullahiSon2.id, quranicFraction: "residuary", percentage: 17.71, amount: 108906250, blocked: false },
        { heirType: "son", name: "Hassan Abdullahi", personId: abdullahiSon3.id, quranicFraction: "residuary", percentage: 17.71, amount: 108906250, blocked: false },
        { heirType: "daughter", name: "Maryam Abdullahi", personId: abdullahiDaughter1.id, quranicFraction: "residuary", percentage: 8.85, amount: 54453125, blocked: false },
        { heirType: "daughter", name: "Zainab Abdullahi", personId: abdullahiDaughter2.id, quranicFraction: "residuary", percentage: 8.85, amount: 54453125, blocked: false },
      ]),
      totalAllocated: 615000000
    }
  });

  // Abdullahi domicile
  await prisma.domicileRecord.create({
    data: {
      tenantId: tenant.id,
      personId: ibrahim.id,
      domicileOfOrigin: "NG",
      domicileOfChoice: "NG",
      snapBackRisk: false
    }
  });

  // =====================================================================
  // Documents & Reviews for all three matters
  // =====================================================================

  // --- Okonkwo matter documents ---
  const okonkwoNgWillContent = `LAST WILL AND TESTAMENT

I, Chidi Okonkwo, of Lagos, Federal Republic of Nigeria, hereby revoke all former wills and codicils made by me insofar as they relate to my property situated in Nigeria, and declare this to be my last will and testament for my Nigerian assets.

ARTICLE I — IDENTIFICATION
I am a citizen of Nigeria, born on 15 March 1978. I am married to Naledi Okonkwo (née Dlamini). I have one child, Amara Okonkwo.

ARTICLE II — NIGERIAN PROPERTY
This will governs the following assets situated in the Federal Republic of Nigeria:
(a) Residential property at 42 Victoria Island Drive, Lagos;
(b) Commercial building at 15 Broad Street, Lagos Island;
(c) All bank accounts held with First Bank of Nigeria and Guaranty Trust Bank.

ARTICLE III — DISPOSITIONS
I devise and bequeath my Nigerian assets as follows:
(a) The Lagos residence to my wife, Naledi Okonkwo, absolutely;
(b) The commercial building to be held in trust for my daughter, Amara Okonkwo, until she attains the age of 25;
(c) All bank balances to be divided equally between my wife and daughter.

ARTICLE IV — EXECUTOR
I appoint Chief Emeka Okafor, Solicitor, of Lagos, Nigeria, as executor of this will.

ARTICLE V — GOVERNING LAW
This will shall be governed by and construed in accordance with the laws of Nigeria.

Signed this ___ day of _______ 2026.`;

  const okonkwoEwWillContent = `LAST WILL AND TESTAMENT (ENGLAND AND WALES)

I, CHIDI OKONKWO, of London, England, hereby revoke all former wills and codicils made by me insofar as they relate to my property situated in England and Wales, and declare this to be my last will and testament for my English assets.

1. INTERPRETATION
In this will "my Trustees" means my executors and trustees for the time being.

2. ENGLISH AND WELSH PROPERTY
This will governs the following property situated in England and Wales:
(a) Investment flat at 18 Canary Wharf, Tower Hamlets, London E14;
(b) Self-invested personal pension (SIPP) with Hargreaves Lansdown;
(c) NatWest current account and savings;
(d) Bitcoin holdings in Coinbase custody.

3. APPOINTMENT OF EXECUTORS
I appoint my wife NALEDI OKONKWO and Messrs Clifford Chance LLP of London as my executors and trustees.

4. DISPOSITIONS
(a) I give the London flat to my wife absolutely, subject to any mortgage thereon.
(b) My SIPP nominations are to be reviewed to ensure my wife is the nominated beneficiary.
(c) My cryptocurrency holdings shall pass to a discretionary trust for my daughter Amara, managed by my trustees until she reaches 25.
(d) The residue of my English estate passes to my wife.

5. INHERITANCE TAX
My trustees shall have power to claim any transferable nil-rate band and residence nil-rate band available.

6. GOVERNING LAW
This will is made under and shall be governed by the law of England and Wales.

IN WITNESS WHEREOF I have hereunto set my hand this ___ day of _______ 2026.`;

  const okonkwoZaWillContent = `LAST WILL AND TESTAMENT (SOUTH AFRICA)

I, the undersigned, CHIDI OKONKWO, identity/passport number NG-XXXXXX, do hereby revoke all previous wills and codicils by me and declare this to be my last will and testament insofar as it relates to my immovable and movable property situated in the Republic of South Africa.

1. I nominate and appoint NALEDI OKONKWO (née DLAMINI), identity number ZA-XXXXXX, as the executrix of this will.

2. SOUTH AFRICAN PROPERTY
This will governs the following asset situated in the Republic of South Africa:
(a) Apartment at 22 Sandton Drive, Johannesburg, Gauteng, valued at ZAR 3,200,000.

3. BEQUEST
I bequeath the above property to my wife, NALEDI OKONKWO, absolutely.

4. Should my wife predecease me, the property shall pass to my daughter, AMARA OKONKWO, to be held in trust by the Standard Bank Trust Company until she attains majority.

5. GOVERNING LAW
This will shall be governed by and construed in accordance with the laws of the Republic of South Africa, including the Wills Act 7 of 1953.

SIGNED at ________________ on this ___ day of _______ 2026.`;

  const okonkwoConflictMemoContent = `CONFLICT OF LAWS MEMORANDUM

MATTER: Okonkwo Family Cross-Border Will (MAT-2026-0001)
PREPARED BY: Adaeze Okonkwo, Solicitor
DATE: May 2026

1. OVERVIEW
Chidi Okonkwo holds assets across three jurisdictions — Nigeria, England & Wales, and South Africa. This memorandum identifies the applicable succession laws and potential conflicts.

2. APPLICABLE LAWS
• Nigeria: Wills Act 1958 (Lagos State); intestacy governed by customary law or Administration of Estates Law depending on domicile.
• England & Wales: Wills Act 1837 (as amended); Inheritance (Provision for Family and Dependants) Act 1975; Inheritance Tax Act 1984.
• South Africa: Wills Act 7 of 1953; Intestate Succession Act 81 of 1987; Estate Duty Act 45 of 1955.

3. KEY CONFLICTS IDENTIFIED
(a) Revocation clauses must be carefully drafted to avoid unintended mutual revocation across jurisdictions.
(b) Nigeria does not levy inheritance tax, but England & Wales imposes IHT on worldwide assets of UK-domiciled individuals and on UK-situs assets of non-domiciled individuals.
(c) South Africa levies estate duty at 20% on estates above ZAR 3.5 million, with a spousal exemption.
(d) Forced heirship provisions do not apply in any of the three jurisdictions under the facts of this case.

4. RECOMMENDATIONS
• Execute three separate jurisdiction-specific wills with clear situs-limiting revocation clauses.
• Obtain professional IHT advice regarding the London investment property and SIPP.
• Consider nominating Naledi as beneficiary under the SIPP to ensure IHT efficiency.`;

  const okonkwoClientLetterContent = `Ecobank Africa
Private & Confidential

Mr Chidi Okonkwo
42 Victoria Island Drive
Lagos, Nigeria

Dear Mr Okonkwo,

RE: Cross-Border Estate Planning Engagement — MAT-2026-0001

Thank you for instructing us in connection with your cross-border estate planning needs. We confirm our engagement to advise on the preparation of jurisdiction-specific wills for your assets in Nigeria, England & Wales, and South Africa.

SCOPE OF WORK
1. Review of your asset portfolio across all three jurisdictions.
2. Preparation of three separate wills, each limited to assets within the respective jurisdiction.
3. Conflict of laws analysis to ensure the wills operate harmoniously.
4. IHT analysis for your English assets, including the investment property, SIPP, and cryptocurrency.
5. Coordination with local counsel in South Africa (Webber Wentzel, Johannesburg).

ESTIMATED TIMELINE
We anticipate completing the first drafts within 4–6 weeks of receiving all supporting documentation. Review and execution should follow within a further 2–4 weeks.

Please do not hesitate to contact us if you have any questions.

Yours sincerely,
Adaeze Okonkwo
Partner, Ecobank Africa`;

  await prisma.document.createMany({
    data: [
      {
        id: "doc-okonkwo-ng-will",
        tenantId: tenant.id,
        matterId: matter.id,
        templateId: "template-ng-will-en",
        documentType: "will",
        jurisdictionCode: "NG",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Last Will and Testament — Nigeria",
        content: okonkwoNgWillContent,
        hash: hash(okonkwoNgWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-okonkwo-ew-will",
        tenantId: tenant.id,
        matterId: matter.id,
        templateId: "template-ew-will-en",
        documentType: "will",
        jurisdictionCode: "EW",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Last Will and Testament — England & Wales",
        content: okonkwoEwWillContent,
        hash: hash(okonkwoEwWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-okonkwo-za-will",
        tenantId: tenant.id,
        matterId: matter.id,
        documentType: "will",
        jurisdictionCode: "ZA",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Last Will and Testament — South Africa",
        content: okonkwoZaWillContent,
        hash: hash(okonkwoZaWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-okonkwo-conflict-memo",
        tenantId: tenant.id,
        matterId: matter.id,
        documentType: "memorandum",
        jurisdictionCode: "NG",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "Conflict of Laws Memorandum",
        content: okonkwoConflictMemoContent,
        hash: hash(okonkwoConflictMemoContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "confidential",
        finalizedAt: now
      },
      {
        id: "doc-okonkwo-client-letter",
        tenantId: tenant.id,
        matterId: matter.id,
        documentType: "correspondence",
        jurisdictionCode: "NG",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "Client Engagement Letter",
        content: okonkwoClientLetterContent,
        hash: hash(okonkwoClientLetterContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "restricted",
        finalizedAt: now
      }
    ]
  });

  // Okonkwo reviews
  await prisma.review.createMany({
    data: [
      {
        id: "review-okonkwo-ng-will",
        tenantId: tenant.id,
        matterId: matter.id,
        documentId: "doc-okonkwo-ng-will",
        reviewType: "legal_review",
        status: "pending",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "Draft will requires senior solicitor review before client presentation"
      },
      {
        id: "review-okonkwo-ew-will",
        tenantId: tenant.id,
        matterId: matter.id,
        documentId: "doc-okonkwo-ew-will",
        reviewType: "legal_review",
        status: "pending",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "English will requires IHT compliance check"
      },
      {
        id: "review-okonkwo-conflict",
        tenantId: tenant.id,
        matterId: matter.id,
        documentId: "doc-okonkwo-conflict-memo",
        reviewType: "compliance_review",
        status: "approved",
        reviewerUserId: solicitor.id,
        mandatory: false,
        triggerReason: "Conflict of laws analysis completed",
        decision: "approved",
        rationale: "Cross-border analysis is thorough and revocation clauses are correctly scoped",
        completedAt: now
      }
    ]
  });

  // --- Morgan (EW) matter documents ---
  const morganEwWillContent = `LAST WILL AND TESTAMENT

I, JAMES MORGAN, of 15 Chelsea Embankment, London SW3, hereby revoke all former wills and testamentary dispositions made by me and declare this to be my last will and testament.

1. APPOINTMENT OF EXECUTORS
I appoint my wife SARAH MORGAN and my solicitors Freshfields Bruckhaus Deringer LLP as my executors and trustees (together "my Trustees").

2. SPECIFIC GIFTS
(a) I give my Rolex Daytona watch (ref. 116500LN) to my son, OLIVER MORGAN.
(b) I give my wine collection stored at Berry Bros & Rudd to my daughter, EMILY MORGAN.

3. THE FAMILY HOME
I give my property at 15 Chelsea Embankment, London SW3, to my wife SARAH MORGAN absolutely, provided she survives me by 28 days. If she does not survive me by that period, the property shall form part of my residuary estate.

4. RESIDUARY ESTATE
I give the residue of my estate (after payment of my debts, funeral expenses, and testamentary expenses):
(a) As to 60% to my wife SARAH MORGAN absolutely;
(b) As to 20% to my son OLIVER MORGAN absolutely;
(c) As to 20% to my daughter EMILY MORGAN absolutely.

5. INHERITANCE TAX
(a) My Trustees shall claim the residence nil-rate band in respect of the family home.
(b) Any IHT attributable to my estate shall be paid from the residuary estate.
(c) My Trustees shall have power to claim any available transferable nil-rate band on the second death.

6. PORTUGAL PROPERTY
This will does NOT govern my property in Portugal. I have made a separate Portuguese will governing my apartment at Rua Augusta 45, Lisbon.

7. POWERS OF TRUSTEES
My Trustees shall have the powers conferred by the Trustee Act 2000 and the following additional powers: [standard administrative provisions].

8. GOVERNING LAW
This will shall be governed by and construed in accordance with the law of England and Wales.

IN WITNESS WHEREOF I have hereunto set my hand this ___ day of _______ 2026.`;

  const morganPtWillContent = `TESTAMENTO

Eu, JAMES MORGAN, cidadão britânico, portador do passaporte n.º UK-XXXXXX, residente em Londres, Inglaterra, declaro que este é o meu testamento relativo exclusivamente aos meus bens situados na República Portuguesa.

ARTIGO 1.º — REVOGAÇÃO
Revogo quaisquer disposições testamentárias anteriores relativas aos meus bens em Portugal.

ARTIGO 2.º — BENS EM PORTUGAL
Este testamento abrange o seguinte imóvel:
(a) Apartamento T3, Rua Augusta 45, 3.º andar, Lisboa, inscrito na matriz predial urbana sob o artigo XXXXX.
Valor estimado: EUR 450,000.

ARTIGO 3.º — DISPOSIÇÕES
Lego o referido imóvel à minha esposa, SARAH MORGAN, em plena propriedade.

ARTIGO 4.º — LEGÍTIMA
Reconheço que a lei portuguesa prevê a legítima (quota indisponível) a favor do cônjuge e descendentes. A presente disposição respeita os limites impostos pelo Código Civil Português.

ARTIGO 5.º — LEI APLICÁVEL
Nos termos do Regulamento (UE) n.º 650/2012, escolho a lei inglesa como lei aplicável à totalidade da minha sucessão. Contudo, este testamento respeita as normas imperativas portuguesas de proteção de herdeiros legitimários.

Feito em ________________, aos ___ dias de _______ de 2026.`;

  const morganIhtMemoContent = `INHERITANCE TAX PLANNING MEMORANDUM

MATTER: Morgan Family Estate Plan (MAT-2026-0002)
PREPARED BY: Adaeze Okonkwo, Solicitor
DATE: May 2026

1. SUMMARY OF ESTATE
• London property (Chelsea Embankment): GBP 2,100,000
• ISA portfolio (Vanguard): GBP 380,000
• Pension (SIPP): GBP 290,000 (excluded from estate for IHT if nominated to spouse)
• Portugal property: EUR 450,000 (approx. GBP 390,000) — Portuguese estate duty may apply separately
• Cash and savings: GBP 85,000
GROSS ESTATE (excl. pension): approx. GBP 2,955,000

2. AVAILABLE RELIEFS
(a) Spousal Exemption: Assets passing to Sarah are exempt from IHT.
(b) Nil-Rate Band (NRB): GBP 325,000.
(c) Residence Nil-Rate Band (RNRB): GBP 175,000 — available as the London property passes to a direct descendant via the residuary estate.
(d) RNRB Taper: Applies where net estate exceeds GBP 2,000,000. Tapered by £1 for every £2 above the threshold.

3. IHT ESTIMATE — FIRST DEATH (James)
If Sarah inherits under the will as drafted:
• Estate passing to Sarah (exempt): ~ GBP 2,250,000
• Estate to children (Oliver + Emily at 20% each): ~ GBP 705,000
• NRB + RNRB available: GBP 500,000
• Taxable on children's share: GBP 205,000
• IHT at 40%: GBP 82,000

4. SECOND DEATH PROJECTION
On Sarah's death, the combined estate will include the transferable NRB (GBP 325,000) and transferable RNRB (up to GBP 175,000), giving combined allowances of GBP 1,000,000.

5. RECOMMENDATIONS
(a) Ensure SIPP death benefit nomination names Sarah as sole beneficiary.
(b) Consider making lifetime gifts within annual exemptions (GBP 3,000 per annum).
(c) The 10% charitable rate (reducing IHT to 36%) should be considered if the family wishes to include charitable legacies of at least 10% of the net estate.
(d) Portuguese tax implications should be reviewed with local counsel.`;

  const morganClientLetterContent = `Ecobank Africa
Private & Confidential

Mr James Morgan & Mrs Sarah Morgan
15 Chelsea Embankment
London SW3

Dear Mr and Mrs Morgan,

RE: Estate Planning Engagement — MAT-2026-0002

We write to confirm our engagement to advise on your estate planning arrangements, with particular focus on:

1. Inheritance tax mitigation for your combined estate of approximately GBP 3 million;
2. Preparation of an English will for Mr Morgan covering UK assets;
3. Preparation of a separate Portuguese will for the Lisbon apartment;
4. Review of pension death benefit nominations;
5. Advice on the interplay between the Portuguese legítima and English freedom of testamentary disposition.

We note that Mrs Morgan has existing mirror will provisions which should be reviewed in tandem.

NEXT STEPS
We will arrange a meeting to discuss the IHT planning memorandum and agree the final will provisions.

Yours faithfully,
Adaeze Okonkwo
Partner, Ecobank Africa`;

  await prisma.document.createMany({
    data: [
      {
        id: "doc-morgan-ew-will",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        templateId: "template-ew-will-en",
        documentType: "will",
        jurisdictionCode: "EW",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Last Will and Testament — England & Wales",
        content: morganEwWillContent,
        hash: hash(morganEwWillContent),
        reviewStatus: "in_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-morgan-pt-will",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        templateId: "template-pt-will-pt",
        documentType: "will",
        jurisdictionCode: "PT",
        locale: "pt",
        status: "draft",
        version: "1.0",
        title: "Testamento — Portugal",
        content: morganPtWillContent,
        hash: hash(morganPtWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-morgan-iht-memo",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        documentType: "memorandum",
        jurisdictionCode: "EW",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "IHT Planning Memorandum",
        content: morganIhtMemoContent,
        hash: hash(morganIhtMemoContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "confidential",
        finalizedAt: now
      },
      {
        id: "doc-morgan-client-letter",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        documentType: "correspondence",
        jurisdictionCode: "EW",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "Client Engagement Letter",
        content: morganClientLetterContent,
        hash: hash(morganClientLetterContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "restricted",
        finalizedAt: now
      }
    ]
  });

  // Morgan reviews
  await prisma.review.createMany({
    data: [
      {
        id: "review-morgan-ew-will",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        documentId: "doc-morgan-ew-will",
        reviewType: "legal_review",
        status: "in_progress",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "English will requires IHT compliance and RNRB qualification review"
      },
      {
        id: "review-morgan-pt-will",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        documentId: "doc-morgan-pt-will",
        reviewType: "legal_review",
        status: "pending",
        reviewerUserId: notary.id,
        mandatory: true,
        triggerReason: "Portuguese will requires local counsel review for legítima compliance"
      },
      {
        id: "review-morgan-iht",
        tenantId: tenant.id,
        matterId: ewMatter.id,
        documentId: "doc-morgan-iht-memo",
        reviewType: "compliance_review",
        status: "approved",
        reviewerUserId: solicitor.id,
        mandatory: false,
        triggerReason: "IHT calculations verified against current HMRC thresholds",
        decision: "approved",
        rationale: "NRB, RNRB, and taper calculations are correct as of 2025/26 tax year",
        completedAt: now
      }
    ]
  });

  // --- Abdullahi (Islamic) matter documents ---
  const abdullahiNgWillContent = `LAST WILL AND TESTAMENT (WASIYYAH)

I, IBRAHIM ABDULLAHI, of Abuja, Federal Republic of Nigeria, being of sound mind and acting in accordance with Islamic principles, hereby revoke all former wills and testamentary dispositions relating to my Nigerian assets and declare this to be my last will.

BISMILLAHIR RAHMANIR RAHEEM
(In the name of Allah, the Most Gracious, the Most Merciful)

ARTICLE I — DECLARATION OF FAITH
I bear witness that there is no God but Allah and that Muhammad (peace be upon him) is His messenger.

ARTICLE II — DEBTS AND FUNERAL EXPENSES
All my debts shall be paid in full before any distribution, including the outstanding business loan to Zenith Bank and the personal loan to my cousin Aliyu Abdullahi. My funeral shall be conducted according to Islamic rites.

ARTICLE III — WASIYYAH (BEQUEATHABLE PORTION)
In accordance with Islamic law, I bequeath up to one-third (1/3) of my net estate as follows:
(a) 15% of my net estate to the Abuja Central Mosque Building Fund;
(b) 10% of my net estate to the Ibrahim Abdullahi Educational Foundation for scholarships;
(c) The remainder of the one-third to be distributed at the discretion of the executor.

ARTICLE IV — FARAID (COMPULSORY SHARES)
The remaining two-thirds (2/3) of my net estate shall be distributed strictly in accordance with the Faraid principles of Islamic inheritance law:
(a) My wife Fatima Abdullahi — 1/8 share (shared with Aisha);
(b) My wife Aisha Abdullahi — 1/8 share (shared with Fatima);
(c) My mother Halima Abdullahi — 1/6 share;
(d) My sons Yusuf, Umar, and Hassan — residuary (asaba), receiving double the share of daughters;
(e) My daughters Maryam and Zainab — residuary, receiving half the share of sons.

ARTICLE V — EXECUTOR
I appoint Alhaji Suleiman Bello, Islamic scholar and legal practitioner, of Abuja, as executor of this will.

ARTICLE VI — GOVERNING LAW
This will shall be governed by Islamic personal law as applicable in the Federal Republic of Nigeria, and the Wills Act 1958 (Lagos State) insofar as formal validity is concerned.

ARTICLE VII — NIGERIAN ASSETS
This will covers:
(a) Abuja family compound (NGN 250,000,000);
(b) Kano commercial plaza (NGN 180,000,000);
(c) GTBank current account (NGN 85,000,000);
(d) First National Bank account (NGN 55,000,000);
(e) Cattle ranch, Kaduna (NGN 45,000,000).

Signed this ___ day of _______ 2026 in the presence of two Muslim witnesses.`;

  const abdullahiKeWillContent = `LAST WILL AND TESTAMENT (KENYA)

I, IBRAHIM ABDULLAHI, a citizen of Nigeria, holding Kenyan foreign resident permit number KE-XXXXXX, hereby declare this to be my last will and testament insofar as it relates to my property situated in the Republic of Kenya.

1. REVOCATION
I revoke all previous wills and codicils made by me insofar as they relate to my property in Kenya.

2. KENYAN PROPERTY
This will governs the following asset situated in Kenya:
(a) Apartment at Westlands, Nairobi, registered under title number NBI/XXXXXX, valued at KES 18,000,000.

3. APPLICABLE LAW
I am a Muslim, and I request that my Kenyan property be distributed in accordance with Islamic personal law as recognized under Section 2(3) of the Kenya Law of Succession Act (Cap 160).

4. DISTRIBUTION
Subject to the provisions of Islamic law:
(a) The Nairobi apartment shall be sold and the net proceeds distributed among my Faraid heirs in the proportions determined by the Kadhi's Court.

5. EXECUTOR
I appoint my eldest son, YUSUF ABDULLAHI, as executor of this will for Kenya.

6. ADVISORY NOTE
I am aware that the Kenya Law of Succession Act may impose provisions that differ from strict Faraid distribution. In the event of a conflict, I request that the Kadhi's Court be petitioned to apply Islamic personal law.

Signed this ___ day of _______ 2026.`;

  const abdullahiFaraidMemoContent = `FARAID COMPLIANCE MEMORANDUM

MATTER: Abdullahi Family Islamic Estate Plan (MAT-2026-0003)
PREPARED BY: Adaeze Okonkwo, Solicitor (in consultation with Alhaji Suleiman Bello)
DATE: May 2026

1. ESTATE SUMMARY
Total assets: NGN 633,000,000
Total liabilities: NGN 43,000,000
Net estate: NGN 590,000,000

2. WASIYYAH (ONE-THIRD BEQUEST)
Ibrahim wishes to dedicate up to 1/3 of his net estate to charitable purposes:
• Mosque building fund: 15% of net estate = NGN 88,500,000
• Educational foundation: 10% of net estate = NGN 59,000,000
• Discretionary: remaining 8.33% = NGN 49,166,667
Total wasiyyah: NGN 196,666,667

3. FARAID DISTRIBUTION (TWO-THIRDS = NGN 393,333,333)
Applying standard Faraid with two wives, mother, three sons, and two daughters:

| Heir               | Quranic Share          | Percentage | Amount (NGN)    |
|---------------------|----------------------|------------|----------------|
| Fatima (wife 1)     | 1/8 shared with wife 2 | 6.25%      | 24,583,333     |
| Aisha (wife 2)      | 1/8 shared with wife 1 | 6.25%      | 24,583,333     |
| Halima (mother)     | 1/6                    | 16.67%     | 65,555,556     |
| Yusuf (son)         | Residuary (asaba)      | 17.71%     | 69,662,760     |
| Umar (son)          | Residuary              | 17.71%     | 69,662,760     |
| Hassan (son)        | Residuary              | 17.71%     | 69,662,760     |
| Maryam (daughter)   | Residuary              | 8.85%      | 34,831,380     |
| Zainab (daughter)   | Residuary              | 8.85%      | 34,831,380     |
| TOTAL               |                        | 100%       | 393,373,262    |

4. CROSS-BORDER CONSIDERATIONS
(a) Nigeria: Islamic personal law applies in the northern states. Ibrahim's domicile in Abuja (FCT) requires reference to the Area Courts.
(b) Kenya: Section 2(3) of the Law of Succession Act exempts Muslims from Part V (intestate succession). The Kadhi's Court has jurisdiction.
(c) The Nairobi apartment (KES 18M ≈ NGN 58M) will be distributed separately under Kenyan procedure but following Faraid proportions.

5. ADVISORY
• The wasiyyah cannot exceed one-third without unanimous consent of all heirs.
• Lifetime gifts to Yusuf (NGN 15M) and Maryam (NGN 8M) are treated as advancements under some madhabs; we recommend a family conference to address this.
• Zakat obligations should be settled from the estate before Faraid distribution.`;

  const abdullahiClientLetterContent = `Ecobank Africa
Private & Confidential

Alhaji Ibrahim Abdullahi
Abuja Family Compound
Abuja, Federal Capital Territory
Nigeria

Assalamu Alaikum Alhaji Ibrahim,

RE: Islamic Estate Planning Engagement — MAT-2026-0003

We are honoured to confirm our engagement to advise on your estate plan, which will be prepared in full compliance with Islamic inheritance law (Faraid).

SCOPE OF ENGAGEMENT
1. Preparation of a Nigerian will (wasiyyah) covering your assets in Nigeria;
2. Preparation of a Kenyan will for the Nairobi apartment;
3. Faraid calculation for your entire estate, taking into account two wives, five children, and your mother;
4. Analysis of the interplay between Nigerian statutory law and Islamic personal law;
5. Review of the Kenya Law of Succession Act provisions for Muslim estates;
6. Advisory on lifetime gifts (hiba) already made to Yusuf and Maryam.

ISLAMIC LAW COMPLIANCE
We have engaged Alhaji Suleiman Bello as our Islamic law consultant to ensure that all documents comply with Sharia principles. The wasiyyah portion will not exceed one-third of the net estate.

We will arrange a family meeting (majlis) to present the Faraid calculations and seek consensus on the wasiyyah allocations.

Wa Alaikum Assalam,
Adaeze Okonkwo
Partner, Ecobank Africa`;

  await prisma.document.createMany({
    data: [
      {
        id: "doc-abdullahi-ng-will",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        templateId: "template-ng-will-en",
        documentType: "will",
        jurisdictionCode: "NG",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Wasiyyah — Nigerian Will (Islamic)",
        content: abdullahiNgWillContent,
        hash: hash(abdullahiNgWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-abdullahi-ke-will",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentType: "will",
        jurisdictionCode: "KE",
        locale: "en",
        status: "draft",
        version: "1.0",
        title: "Last Will and Testament — Kenya",
        content: abdullahiKeWillContent,
        hash: hash(abdullahiKeWillContent),
        reviewStatus: "pending_review",
        executionStatus: "drafted",
        sensitivityClass: "confidential"
      },
      {
        id: "doc-abdullahi-faraid-memo",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentType: "memorandum",
        jurisdictionCode: "NG",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "Faraid Compliance Memorandum",
        content: abdullahiFaraidMemoContent,
        hash: hash(abdullahiFaraidMemoContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "confidential",
        finalizedAt: now
      },
      {
        id: "doc-abdullahi-client-letter",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentType: "correspondence",
        jurisdictionCode: "NG",
        locale: "en",
        status: "final",
        version: "1.0",
        title: "Client Engagement Letter",
        content: abdullahiClientLetterContent,
        hash: hash(abdullahiClientLetterContent),
        reviewStatus: "approved",
        executionStatus: "not_applicable",
        sensitivityClass: "restricted",
        finalizedAt: now
      }
    ]
  });

  // Abdullahi reviews
  await prisma.review.createMany({
    data: [
      {
        id: "review-abdullahi-ng-will",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentId: "doc-abdullahi-ng-will",
        reviewType: "legal_review",
        status: "pending",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "Wasiyyah requires Islamic law compliance review by consultant scholar"
      },
      {
        id: "review-abdullahi-ke-will",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentId: "doc-abdullahi-ke-will",
        reviewType: "legal_review",
        status: "pending",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "Kenya will requires review for Kadhi's Court procedure and Succession Act compliance"
      },
      {
        id: "review-abdullahi-faraid",
        tenantId: tenant.id,
        matterId: abdullahiMatter.id,
        documentId: "doc-abdullahi-faraid-memo",
        reviewType: "compliance_review",
        status: "approved",
        reviewerUserId: solicitor.id,
        mandatory: true,
        triggerReason: "Faraid calculations verified against standard Sunni methodology",
        decision: "approved",
        rationale: "Heir shares correctly computed; wasiyyah within 1/3 limit; cross-border advisory adequate",
        completedAt: now
      }
    ]
  });

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
