import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestId(request: Request, response: Response, next: NextFunction) {
  const id = request.headers["x-request-id"]?.toString() || randomUUID();
  response.setHeader("x-request-id", id);
  response.locals.requestId = id;
  next();
}
