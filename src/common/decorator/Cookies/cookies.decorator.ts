import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest() as Request;
  return data ? request.cookies?.[data] : request.cookies;
});
