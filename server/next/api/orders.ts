import orderController from "@/server/controllers/order.controller";

import { getAuthUser, jsonResponse, methodNotAllowed, readJsonBody, runController } from "../route-utils";

const unauthorizedResponse = () => jsonResponse({ message: "Unauthorized" }, 401);
const forbiddenResponse = () => jsonResponse({ message: "Forbidden" }, 403);

export const dispatchOrdersRoute = async (request: Request, segments: string[] = []) => {
  const [first] = segments;

  if (!first) {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorizedResponse();

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      if (body instanceof Response) return body;
      return runController(request, orderController.createOrder, { body, user: auth });
    }

    if (request.method === "GET") {
      if (auth.role !== "ADMIN") return forbiddenResponse();
      return runController(request, orderController.listOrders, { user: auth });
    }

    return methodNotAllowed(["GET", "POST"]);
  }

  if (first === "my" && request.method === "GET") {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    return runController(request, orderController.getMyOrders, { user: auth });
  }

  if (first === "weekly-metrics" && request.method === "GET") {
    return runController(request, orderController.getWeeklyBusinessMetrics);
  }

  if ((first === "check-coupon" || first === "check-coupons") && request.method === "GET") {
    return runController(request, orderController.checkCouponStatus);
  }

  if ((first === "check-recovery-status" || first === "check-recent") && request.method === "GET") {
    return runController(request, orderController.checkCustomerRecoveryStatus);
  }

  if (first === "track" && request.method === "GET") {
    const url = new URL(request.url);
    const orderNumber = url.searchParams.get("number") || url.searchParams.get("id");
    if (!orderNumber) {
      return jsonResponse({ message: "Order number is required" }, 400);
    }
    return runController(request, orderController.getOrder, {
      params: { id: orderNumber.trim() },
    });
  }

  if (request.method === "GET") {
    const auth = await getAuthUser(request);
    return runController(request, orderController.getOrder, {
      user: auth || undefined,
      params: { id: first },
    });
  }

  if (request.method === "PATCH") {
    const auth = await getAuthUser(request);
    if (!auth) return unauthorizedResponse();
    if (auth.role !== "ADMIN") return forbiddenResponse();

    const body = await readJsonBody(request);
    if (body instanceof Response) return body;
    return runController(request, orderController.updateOrder, {
      body,
      user: auth,
      params: { id: first },
    });
  }

  return jsonResponse({ message: "Not Found" }, 404);
};
