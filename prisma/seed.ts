import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { encode } from "../server/services/json";
import { AI_RELEASE_THRESHOLDS, DEFERRED_REQUIREMENTS } from "../shared/constants";

const prisma = new PrismaClient();

const now = new Date("2026-05-12T00:00:00.000Z");
const nextQuarter = new Date("2026-08-12T00:00:00.000Z");
const nextYear = new Date("2027-05-12T00:00:00.000Z");

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function reset() {
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
      name: "Atlas Estate Law",
      slug: "atlas-estate-law",
      deploymentModel: "b2b-direct",
      dataRegion: "uk",
      defaultLocale: "en-GB",
      enabledCountries: encode(["EW", "PT"]),
      securityPolicy: encode({ mfaRequired: true, sessionMinutes: 60, dataResidency: ["uk", "eu"] })
    }
  });

  const solicitor = await prisma.user.create({
    data: {
      id: "user-solicitor",
      email: "solicitor@example.test",
      displayName: "Avery Solicitor",
      preferredLocale: "en-GB",
      mfaEnabled: true,
      professionalLicense: "SRA-DEMO-001"
    }
  });

  const notary = await prisma.user.create({
    data: {
      id: "user-notary",
      email: "notary@example.test",
      displayName: "Marta Notary",
      preferredLocale: "pt-PT",
      mfaEnabled: true,
      professionalLicense: "ON-DEMO-001"
    }
  });

  const paralegal = await prisma.user.create({
    data: {
      id: "user-paralegal",
      email: "paralegal@example.test",
      displayName: "Riley Paralegal",
      preferredLocale: "en-GB",
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
      {
        code: "EW",
        name: "England & Wales",
        legalSystem: "common_law",
        defaultLocale: "en-GB",
        currency: "GBP",
        timeZone: "Europe/London",
        phaseStatus: "phase_1_active",
        dataRegion: "uk",
        sourceSummary: "GOV.UK inheritance tax, UK execution formalities, local counsel pack."
      },
      {
        code: "PT",
        name: "Portugal",
        legalSystem: "civil_law",
        defaultLocale: "pt-PT",
        currency: "EUR",
        timeZone: "Europe/Lisbon",
        phaseStatus: "phase_1_active",
        dataRegion: "eu",
        sourceSummary: "European e-Justice Portal Portugal succession and local counsel pack."
      }
    ]
  });

  const ewPack = await prisma.jurisdictionPack.create({
    data: {
      id: "pack-ew",
      jurisdictionCode: "EW",
      name: "England & Wales Wills Pack",
      ownerRole: "jurisdiction_counsel",
      status: "active",
      activeVersion: "1.0.0",
      enabledProductModes: encode(["planning"]),
      enabledDocTypes: encode(["will"]),
      languages: encode(["en-GB", "pt-PT"]),
      publicationBlockers: encode([])
    }
  });

  const ptPack = await prisma.jurisdictionPack.create({
    data: {
      id: "pack-pt",
      jurisdictionCode: "PT",
      name: "Portugal Wills Pack",
      ownerRole: "jurisdiction_counsel",
      status: "active",
      activeVersion: "1.0.0",
      enabledProductModes: encode(["planning"]),
      enabledDocTypes: encode(["will"]),
      languages: encode(["en-GB", "pt-PT"]),
      publicationBlockers: encode([])
    }
  });

  for (const pack of [ewPack, ptPack]) {
    await prisma.packVersion.create({
      data: {
        packId: pack.id,
        version: "1.0.0",
        status: "active",
        effectiveFrom: now,
        sourceRefs: encode(pack.id === "pack-ew" ? ["S6", "S14"] : ["S4", "S9", "S11"]),
        approvalRefs: encode(["legal-content-lead", "jurisdiction-counsel", "ai-safety-lead"]),
        snapshotHash: hash(`${pack.id}:1.0.0`),
        rollbackPlan: "Rollback to previous immutable pack snapshot after tenant notification.",
        testEvidence: encode(["unit", "scenario", "golden-document", "localization", "ai-evaluation"])
      }
    });
  }

  await prisma.sourceNote.createMany({
    data: [
      {
        packId: ewPack.id,
        sourceCode: "S6",
        title: "GOV.UK Inheritance Tax",
        url: "https://www.gov.uk/inheritance-tax",
        citation: "UK IHT threshold and rate reference.",
        effectiveFrom: now,
        reviewedBy: "jurisdiction-counsel-ew",
        reviewStatus: "approved"
      },
      {
        packId: ewPack.id,
        sourceCode: "S14",
        title: "UPL professional-boundary reference",
        url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_5_5_unauthorized_practice_of_law_multijurisdictional_practice_of_law/comment_on_rule_5_5_unauthorized_practice_of_law_multijurisdictional_practice_of_law/",
        citation: "Professional boundary reference used for configurable UPL gate design.",
        effectiveFrom: now,
        reviewedBy: "compliance-lead",
        reviewStatus: "approved"
      },
      {
        packId: ptPack.id,
        sourceCode: "S4",
        title: "European e-Justice Portal Portugal Succession",
        url: "https://e-justice.europa.eu/topics/family-matters-inheritance/inheritance/succession/pt_en",
        citation: "Portugal succession and reserved-share reference.",
        effectiveFrom: now,
        reviewedBy: "jurisdiction-counsel-pt",
        reviewStatus: "approved"
      },
      {
        packId: ptPack.id,
        sourceCode: "S9",
        title: "European Commission Data Protection",
        url: "https://commission.europa.eu/law/law-topic/data-protection_en",
        citation: "EU GDPR and cross-border transfer controls.",
        effectiveFrom: now,
        reviewedBy: "privacy-lead",
        reviewStatus: "approved"
      },
      {
        packId: ptPack.id,
        sourceCode: "S11",
        title: "eIDAS",
        url: "https://digital-strategy.ec.europa.eu/en/policies/discover-eidas",
        citation: "EU electronic-identification framework; wills remain pack-gated.",
        effectiveFrom: now,
        reviewedBy: "compliance-lead",
        reviewStatus: "approved"
      }
    ]
  });

  await prisma.rule.createMany({
    data: [
      {
        packId: ewPack.id,
        ruleCode: "EW-WILL-WITNESS-2",
        category: "execution_formality",
        name: "Two witness execution warning",
        description: "E&W will execution requires two witnesses at signing ceremony.",
        expression: "documentType == 'will' && witnessCount < 2",
        severity: "blocker",
        phase: "1",
        sourceCode: "S6",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-EW-001", "GOLDEN-EW-WILL"])
      },
      {
        packId: ewPack.id,
        ruleCode: "EW-IHT-THRESHOLD",
        category: "tax_threshold",
        name: "UK IHT threshold flag",
        description: "Flags estates above the current configured IHT threshold for professional review.",
        expression: "estateValueGBP > 325000",
        severity: "warning",
        phase: "1",
        sourceCode: "S6",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-EW-002"])
      },
      {
        packId: ptPack.id,
        ruleCode: "PT-RESERVED-SHARE",
        category: "reserved_share",
        name: "Portugal reserved-share flag",
        description: "Flags scenarios that may impair protected heirs' reserved share.",
        expression: "hasProtectedHeirs && nonProtectedBeneficiaryPercentage > 33",
        severity: "blocker",
        phase: "1",
        sourceCode: "S4",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-PT-001", "GOLDEN-PT-WILL"])
      },
      {
        packId: ptPack.id,
        ruleCode: "PT-NOTARIAL-EXECUTION",
        category: "execution_formality",
        name: "Portugal notarial execution",
        description: "Portugal Phase-1 wills route to notarial execution instructions.",
        expression: "documentType == 'will'",
        severity: "warning",
        phase: "1",
        sourceCode: "S4",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-PT-002"])
      },
      {
        packId: ewPack.id,
        ruleCode: "COMMON-MINOR-BENEFICIARY",
        category: "minor_beneficiary",
        name: "Minor beneficiary review",
        description: "Minor beneficiaries require professional review and guardianship/trust consideration.",
        expression: "beneficiaryAge < minorAge",
        severity: "warning",
        phase: "1",
        sourceCode: "S14",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-COMMON-001"])
      },
      {
        packId: ptPack.id,
        ruleCode: "COMMON-MINOR-BENEFICIARY",
        category: "minor_beneficiary",
        name: "Minor beneficiary review",
        description: "Minor beneficiaries require professional review and guardianship consideration.",
        expression: "beneficiaryAge < minorAge",
        severity: "warning",
        phase: "1",
        sourceCode: "S4",
        effectiveFrom: now,
        status: "active",
        testRefs: encode(["RULE-COMMON-001"])
      }
    ]
  });

  for (const pack of [ewPack, ptPack]) {
    const workflow = await prisma.workflow.create({
      data: {
        packId: pack.id,
        workflowCode: "planning-will",
        name: `${pack.jurisdictionCode} Planning Will Workflow`,
        productMode: "planning",
        documentType: "will",
        status: "active",
        version: "1.0.0"
      }
    });

    await prisma.workflowNode.createMany({
      data: [
        { workflowId: workflow.id, nodeCode: "intake", label: "Intake", ownerRole: "paralegal", nodeType: "form" },
        { workflowId: workflow.id, nodeCode: "rule-scan", label: "Rule scan", ownerRole: "solicitor", nodeType: "automation" },
        { workflowId: workflow.id, nodeCode: "professional-review", label: "Professional review", ownerRole: pack.id === "pack-ew" ? "solicitor" : "notary", nodeType: "approval" },
        { workflowId: workflow.id, nodeCode: "execution", label: "Execution", ownerRole: pack.id === "pack-ew" ? "solicitor" : "notary", nodeType: "checklist" }
      ]
    });
  }

  const ewTemplate = await prisma.documentTemplate.create({
    data: {
      id: "template-ew-will-en",
      packId: ewPack.id,
      templateCode: "will-standard",
      documentType: "will",
      locale: "en-GB",
      version: "1.0.0",
      status: "approved",
      title: "England & Wales Will",
      body: "Last Will and Testament\n\nTestator: {{testator}}\nJurisdiction: England & Wales\nResidue: {{residue}}\nExecutor: {{executor}}\n\nExecution: Sign in wet ink in the presence of two witnesses.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "wet_ink_two_witnesses", witnessCount: 2 }),
      glossaryLintRules: encode(["executor", "beneficiary", "residue"])
    }
  });

  const ptTemplate = await prisma.documentTemplate.create({
    data: {
      id: "template-pt-will-pt",
      packId: ptPack.id,
      templateCode: "will-standard",
      documentType: "will",
      locale: "pt-PT",
      version: "1.0.0",
      status: "approved",
      title: "Testamento Portugal",
      body: "Testamento\n\nTestador: {{testator}}\nJurisdição: Portugal\nRemanescente: {{residue}}\nExecutor: {{executor}}\n\nExecução: Encaminhar para formalidade notarial ou instruções de testamento holográfico conforme revisão profissional.",
      executionPolicy: encode({ eSignatureAllowed: false, ceremony: "notarial_or_holographic", notaryRequired: true }),
      glossaryLintRules: encode(["testador", "herdeiro", "legítima"])
    }
  });

  await prisma.clause.createMany({
    data: [
      { templateId: ewTemplate.id, clauseCode: "residue", title: "Residue", body: "I give the residue of my estate to {{residue}}.", sourceCode: "S6" },
      { templateId: ewTemplate.id, clauseCode: "executor", title: "Executor", body: "I appoint {{executor}} as executor.", sourceCode: "S6" },
      { templateId: ptTemplate.id, clauseCode: "residue", title: "Remanescente", body: "Deixo o remanescente dos meus bens a {{residue}}.", sourceCode: "S4" },
      { templateId: ptTemplate.id, clauseCode: "reserved-share-warning", title: "Legítima", body: "A disposição está sujeita à revisão da legítima.", condition: "reservedShareRisk", sourceCode: "S4" }
    ]
  });

  await prisma.localizationString.createMany({
    data: [
      { packId: ewPack.id, contentKey: "nav.dashboard", locale: "en-GB", sourceText: "Dashboard", translatedText: "Dashboard", status: "approved" },
      { packId: ewPack.id, contentKey: "nav.dashboard", locale: "pt-PT", sourceText: "Dashboard", translatedText: "Painel", status: "approved" },
      { packId: ptPack.id, contentKey: "matter.status.review", locale: "en-GB", sourceText: "Review", translatedText: "Review", status: "approved" },
      { packId: ptPack.id, contentKey: "matter.status.review", locale: "pt-PT", sourceText: "Review", translatedText: "Revisão", status: "approved" }
    ]
  });

  await prisma.legalGlossaryTerm.createMany({
    data: [
      { packId: ewPack.id, termKey: "executor", locale: "en-GB", preferredTerm: "executor", prohibitedTerms: encode(["administrator"]), definition: "Person appointed to administer a will.", status: "approved" },
      { packId: ewPack.id, termKey: "beneficiary", locale: "en-GB", preferredTerm: "beneficiary", prohibitedTerms: encode([]), definition: "Person or entity receiving benefit.", status: "approved" },
      { packId: ptPack.id, termKey: "reserved_share", locale: "pt-PT", preferredTerm: "legítima", prohibitedTerms: encode(["quota reservada"]), definition: "Parte legalmente protegida da sucessão.", status: "approved" },
      { packId: ptPack.id, termKey: "testator", locale: "pt-PT", preferredTerm: "testador", prohibitedTerms: encode(["autor"]), definition: "Pessoa que faz o testamento.", status: "approved" }
    ]
  });

  for (const pack of [ewPack, ptPack]) {
    await prisma.aiPolicy.create({
      data: {
        packId: pack.id,
        policyCode: "phase-1-estate-planning",
        allowedModes: encode(["plain_language_explanation", "issue_summary", "draft_questions"]),
        escalationRules: encode(["cross_border", "minor_beneficiary", "tax_threshold", "reserved_share", "disinheritance", "contested"]),
        prohibitedIntents: encode(["tax_evasion", "asset_concealment", "fabricate_evidence", "bypass_formalities", "unauthorized_legal_advice"]),
        confidenceFloor: 0.8,
        status: "active"
      }
    });

    await prisma.aiEvaluationRun.create({
      data: {
        packId: pack.id,
        locale: pack.id === "pack-ew" ? "en-GB" : "pt-PT",
        modelVersion: "local-policy-evaluator-v1",
        promptSetVersion: "phase-1-2026-q2",
        groundingRate: AI_RELEASE_THRESHOLDS.groundingRate,
        citationAccuracy: AI_RELEASE_THRESHOLDS.citationAccuracy,
        escalationRate: AI_RELEASE_THRESHOLDS.escalationRate,
        hallucinatedCitationRate: 0,
        languageParityGap: 0,
        redTeamRefusalRate: AI_RELEASE_THRESHOLDS.redTeamRefusalRate,
        sensitiveLeakEvents: 0,
        sourceStaleRate: 0,
        releaseGateStatus: "pass",
        signedOffBy: encode(["ai-safety-lead", "legal-content-lead", "jurisdiction-counsel"])
      }
    });
  }

  await prisma.uplOpinion.createMany({
    data: [
      {
        jurisdictionCode: "EW",
        opinionDate: now,
        refreshDueAt: new Date("2029-05-12T00:00:00.000Z"),
        counselName: "E&W retained counsel",
        status: "current",
        functionsCovered: encode(["intake", "asset_inventory", "document_assembly", "professional_review_routing"]),
        requiredControls: encode(["b2b_only", "professional_review", "disclaimer_acknowledgement"])
      },
      {
        jurisdictionCode: "PT",
        opinionDate: now,
        refreshDueAt: new Date("2029-05-12T00:00:00.000Z"),
        counselName: "PT retained counsel",
        status: "current",
        functionsCovered: encode(["intake", "asset_inventory", "document_assembly", "notarial_review_routing"]),
        requiredControls: encode(["b2b_only", "notarial_review", "disclaimer_acknowledgement"])
      }
    ]
  });

  await prisma.insuranceRecord.createMany({
    data: [
      {
        coverageType: "tech_eo",
        coverageAmount: 10000000,
        currency: "GBP",
        carrier: "Demo Carrier",
        policyRef: "TECH-EO-DEMO",
        expiresAt: nextYear,
        status: "active"
      },
      {
        coverageType: "cyber_liability",
        coverageAmount: 10000000,
        currency: "GBP",
        carrier: "Demo Carrier",
        policyRef: "CYBER-DEMO",
        expiresAt: nextYear,
        status: "active"
      }
    ]
  });

  await prisma.releaseGate.createMany({
    data: [
      "pack-ew",
      "pack-pt"
    ].flatMap((packId) => [
      { packId, gateCode: "upl-opinion", gateType: "compliance", status: "pass", evidence: "Current UPL opinion record present." },
      { packId, gateCode: "translation-complete", gateType: "localization", status: "pass", evidence: "Mandatory en-GB and pt-PT strings approved." },
      { packId, gateCode: "golden-document", gateType: "qa", status: "pass", evidence: "Phase-1 will template golden tests seeded." },
      { packId, gateCode: "ai-safety", gateType: "ai", status: "pass", evidence: "Seeded evaluation run meets §14 thresholds." },
      { packId, gateCode: "source-references", gateType: "legal-content", status: "pass", evidence: "Approved source notes are linked." }
    ])
  });

  await prisma.regulatoryMonitor.createMany({
    data: [
      { jurisdictionCode: "EW", authority: "SRA / CILEx / Legal Services Board", topic: "UPL and professional regulation", cadence: "quarterly", lastCheckedAt: now, nextCheckAt: nextQuarter, status: "active" },
      { jurisdictionCode: "PT", authority: "Ordem dos Notários / Ordem dos Advogados", topic: "Notarial and succession updates", cadence: "quarterly", lastCheckedAt: now, nextCheckAt: nextQuarter, status: "active" },
      { jurisdictionCode: "PT", authority: "European Commission", topic: "EU succession, data protection, eIDAS", cadence: "quarterly", lastCheckedAt: now, nextCheckAt: nextQuarter, status: "active" }
    ]
  });

  await prisma.packVelocityRecord.createMany({
    data: [
      { packId: ewPack.id, packOrdinal: 1, conceptStartedAt: new Date("2025-09-01T00:00:00.000Z"), gaPublishedAt: now, elapsedDays: 254, launchCost: 560000, targetElapsedPct: 100, targetCostPct: 100, status: "baseline" },
      { packId: ptPack.id, packOrdinal: 2, conceptStartedAt: new Date("2025-11-01T00:00:00.000Z"), gaPublishedAt: now, elapsedDays: 192, launchCost: 390000, targetElapsedPct: 80, targetCostPct: 80, status: "on_track" }
    ]
  });

  await prisma.integrationProvider.createMany({
    data: [
      { providerType: "document_storage", providerName: "Local Document Vault", enabledPhases: encode(["1"]), status: "enabled", configuration: encode({ encryptedAtRest: true }) },
      { providerType: "practice_management", providerName: "Practice Management API Adapter", enabledPhases: encode(["1"]), status: "sandbox", configuration: encode({ supportedEvents: ["matter.created", "document.finalized"] }) },
      { providerType: "identity_verification", providerName: "Tenant Supplied IDV", enabledPhases: encode(["2"]), status: "deferred" },
      { providerType: "esignature", providerName: "E-signature Provider", enabledPhases: encode(["2"]), status: "deferred_for_wills" }
    ]
  });

  await prisma.featureGate.createMany({
    data: [
      ...DEFERRED_REQUIREMENTS.map((requirement) => ({
        featureCode: requirement,
        phase: requirement.startsWith("FR-03") || requirement === "FR-019" ? "3" : requirement === "FR-010" || requirement === "FR-012" || requirement === "SEC-011" ? "4" : "2",
        enabled: false,
        requiredControls: encode(["regulatory_clearance", "pack_activation", "tenant_entitlement"]),
        reason: "Deferred by BRD v2 phase roadmap."
      })),
      {
        featureCode: "D2C_DEPLOYMENT",
        phase: "3+",
        enabled: false,
        requiredControls: encode(["per_jurisdiction_upl_clearance", "consumer_terms", "insurance_review"]),
        reason: "B2B only at Phase 1."
      }
    ]
  });

  await prisma.servicePackage.createMany({
    data: [
      {
        tenantId: tenant.id,
        packageCode: "phase-1-will-ew",
        name: "E&W Will Planning",
        jurisdictionCodes: encode(["EW"]),
        priceCurrency: "GBP",
        priceAmount: 450,
        includedDocTypes: encode(["will"]),
        status: "active"
      },
      {
        tenantId: tenant.id,
        packageCode: "phase-1-will-pt",
        name: "Portugal Will Planning",
        jurisdictionCodes: encode(["PT"]),
        priceCurrency: "EUR",
        priceAmount: 500,
        includedDocTypes: encode(["will"]),
        status: "active"
      }
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
      id: "matter-demo-ew-pt",
      tenantId: tenant.id,
      matterNumber: "MAT-2026-0001",
      title: "Morgan family cross-border will",
      mode: "planning",
      status: "intake",
      primaryJurisdictionCode: "EW",
      additionalJurisdictions: encode(["PT"]),
      languageOfRecord: "en-GB",
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
      legalName: "Morgan Taylor",
      preferredName: "Morgan",
      dateOfBirth: new Date("1978-04-12T00:00:00.000Z"),
      email: "morgan@example.test",
      nationality: "GB",
      residenceCountry: "GB",
      domicileCountry: "GB",
      habitualResidence: "GB",
      taxResidency: "GB",
      maritalStatus: "married",
      preferredLanguage: "en-GB"
    }
  });

  const spouse = await prisma.person.create({
    data: {
      id: "person-spouse",
      tenantId: tenant.id,
      matterId: matter.id,
      legalName: "Alex Taylor",
      dateOfBirth: new Date("1979-06-20T00:00:00.000Z"),
      nationality: "PT",
      residenceCountry: "PT",
      domicileCountry: "PT",
      habitualResidence: "PT",
      taxResidency: "PT",
      maritalStatus: "married",
      preferredLanguage: "pt-PT"
    }
  });

  const child = await prisma.person.create({
    data: {
      id: "person-child",
      tenantId: tenant.id,
      matterId: matter.id,
      legalName: "Jordan Taylor",
      dateOfBirth: new Date("2014-02-03T00:00:00.000Z"),
      nationality: "GB",
      residenceCountry: "GB",
      domicileCountry: "GB",
      habitualResidence: "GB",
      maritalStatus: "single",
      preferredLanguage: "en-GB"
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
      { tenantId: tenant.id, matterId: matter.id, personId: testator.id, consentType: "privacy_notice", locale: "en-GB", textVersion: "2026.05", acknowledged: true, acknowledgedAt: now, legalBasis: "contract" },
      { tenantId: tenant.id, matterId: matter.id, personId: testator.id, consentType: "professional_disclaimer", locale: "en-GB", textVersion: "2026.05", acknowledged: true, acknowledgedAt: now, legalBasis: "professional_engagement" }
    ]
  });

  await prisma.asset.createMany({
    data: [
      {
        tenantId: tenant.id,
        matterId: matter.id,
        ownerPersonId: testator.id,
        assetClass: "real_estate",
        description: "London residence",
        jurisdictionCode: "EW",
        situsCountry: "GB",
        currency: "GBP",
        valuation: 850000,
        valuationDate: now,
        valuationSource: "client_estimate",
        confidenceLevel: "medium",
        ownershipType: "joint_tenancy",
        ownershipShare: 50,
        evidenceRefs: encode(["title-register-placeholder"])
      },
      {
        tenantId: tenant.id,
        matterId: matter.id,
        ownerPersonId: testator.id,
        assetClass: "real_estate",
        description: "Porto apartment",
        jurisdictionCode: "PT",
        situsCountry: "PT",
        currency: "EUR",
        valuation: 320000,
        valuationDate: now,
        valuationSource: "client_estimate",
        confidenceLevel: "low",
        ownershipType: "sole",
        evidenceRefs: encode([])
      }
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
      { tenantId: tenant.id, matterId: matter.id, scenarioId: scenario.id, giftType: "residue", beneficiaryPersonId: spouse.id, beneficiaryLabel: "Alex Taylor", percentage: 100, perStirpes: false },
      { tenantId: tenant.id, matterId: matter.id, scenarioId: scenario.id, giftType: "percentage", beneficiaryPersonId: child.id, beneficiaryLabel: "Jordan Taylor contingent", percentage: 100, survivorshipDays: 30, perStirpes: true }
    ]
  });

  await prisma.notificationTemplate.createMany({
    data: [
      { tenantId: tenant.id, templateCode: "review-required", locale: "en-GB", channel: "email", subject: "Review required", body: "A matter requires professional review.", status: "active" },
      { tenantId: tenant.id, templateCode: "review-required", locale: "pt-PT", channel: "email", subject: "Revisão necessária", body: "Um processo requer revisão profissional.", status: "active" }
    ]
  });

  await prisma.retentionPolicy.createMany({
    data: [
      { tenantId: tenant.id, jurisdictionCode: "EW", recordType: "will_matter", retentionYears: 12, status: "active" },
      { tenantId: tenant.id, jurisdictionCode: "PT", recordType: "will_matter", retentionYears: 12, status: "active" },
      { recordType: "ai_interaction", retentionYears: 7, status: "active" }
    ]
  });

  await prisma.reportSnapshot.create({
    data: {
      tenantId: tenant.id,
      reportCode: "phase-1-kpis",
      title: "Phase-1 KPI Snapshot",
      periodStart: new Date("2026-01-01T00:00:00.000Z"),
      periodEnd: now,
      metrics: encode({
        payingTenants: 1,
        finalizedWills: 0,
        arr: 5400,
        aiGroundingRate: 95,
        materialUplIncidents: 0,
        materialSecurityIncidents: 0
      })
    }
  });

  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      matterId: matter.id,
      actorUserId: solicitor.id,
      actorRole: "solicitor",
      eventType: "seed.created",
      entityType: "Matter",
      entityId: matter.id,
      metadata: encode({ source: "prisma/seed.ts", brd: "Estate_Planning_Platform_BRD_v2.md" })
    }
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
