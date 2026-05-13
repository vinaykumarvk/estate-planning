import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createServicePackageSchema, updateServicePackageSchema } from "../../shared/schemas";
import { encode } from "../services/json";
import { audit } from "../services/auditService";

export const servicePackagesRouter = Router();

servicePackagesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const tenantId = response.locals.tenantId as string;
    const packages = await prisma.servicePackage.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
    response.json({ packages });
  })
);

servicePackagesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createServicePackageSchema.parse(request.body);
    const pkg = await prisma.servicePackage.create({
      data: {
        tenantId: data.tenantId,
        packageCode: data.packageCode,
        name: data.name,
        jurisdictionCodes: encode(data.jurisdictionCodes),
        priceCurrency: data.priceCurrency,
        priceAmount: data.priceAmount,
        includedDocTypes: encode(data.includedDocTypes),
        status: data.status
      }
    });
    await audit({
      tenantId: data.tenantId,
      actorRole: "platform_admin",
      eventType: "service_package.created",
      entityType: "ServicePackage",
      entityId: pkg.id,
      metadata: { requirementRefs: ["FR-045"] }
    });
    response.status(201).json({ package: pkg });
  })
);

servicePackagesRouter.patch(
  "/:packageId",
  asyncHandler(async (request, response) => {
    const updates = updateServicePackageSchema.parse(request.body);
    const data: Record<string, unknown> = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.packageCode !== undefined) data.packageCode = updates.packageCode;
    if (updates.jurisdictionCodes !== undefined) data.jurisdictionCodes = encode(updates.jurisdictionCodes);
    if (updates.priceCurrency !== undefined) data.priceCurrency = updates.priceCurrency;
    if (updates.priceAmount !== undefined) data.priceAmount = updates.priceAmount;
    if (updates.includedDocTypes !== undefined) data.includedDocTypes = encode(updates.includedDocTypes);
    if (updates.status !== undefined) data.status = updates.status;

    const pkg = await prisma.servicePackage.update({ where: { id: request.params.packageId }, data });
    response.json({ package: pkg });
  })
);

servicePackagesRouter.delete(
  "/:packageId",
  asyncHandler(async (request, response) => {
    await prisma.servicePackage.delete({ where: { id: request.params.packageId } });
    response.json({ deleted: true });
  })
);
