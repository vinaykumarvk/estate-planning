import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createAssetTaxonomySchema } from "../../shared/schemas";
import { encode } from "../services/json";
import { audit } from "../services/auditService";

export const assetTaxonomyRouter = Router();

assetTaxonomyRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const taxonomies = await prisma.assetTaxonomy.findMany({ orderBy: { assetClass: "asc" } });
    response.json({ taxonomies });
  })
);

assetTaxonomyRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createAssetTaxonomySchema.parse(request.body);
    const taxonomy = await prisma.assetTaxonomy.create({
      data: {
        jurisdictionCode: data.jurisdictionCode,
        assetClass: data.assetClass,
        fieldDefinitions: encode(data.fieldDefinitions),
        status: data.status
      }
    });
    await audit({
      tenantId: "platform",
      actorRole: "legal_content_lead",
      eventType: "asset_taxonomy.created",
      entityType: "AssetTaxonomy",
      entityId: taxonomy.id,
      metadata: { requirementRefs: ["FR-016"] }
    });
    response.status(201).json({ taxonomy });
  })
);

assetTaxonomyRouter.patch(
  "/:taxonomyId",
  asyncHandler(async (request, response) => {
    const data: Record<string, unknown> = {};
    if (request.body.fieldDefinitions) data.fieldDefinitions = encode(request.body.fieldDefinitions);
    if (request.body.status) data.status = request.body.status;

    const taxonomy = await prisma.assetTaxonomy.update({
      where: { id: request.params.taxonomyId },
      data
    });
    response.json({ taxonomy });
  })
);

assetTaxonomyRouter.delete(
  "/:taxonomyId",
  asyncHandler(async (request, response) => {
    await prisma.assetTaxonomy.delete({ where: { id: request.params.taxonomyId } });
    response.json({ deleted: true });
  })
);
