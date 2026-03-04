
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, ApiParams } from "@/lib/api-utils";

export const GET = requestMiddleware(async (request, params: ApiParams) => {
  const user_id = params.payload?.sub;
  
  if (!user_id) {
    return createErrorResponse({
      errorMessage: "User ID is required",
      status: 400,
    });
  }

  const profilesCrud = new CrudOperations("user_profiles", params.token);
  const profiles = await profilesCrud.findMany({ user_id: parseInt(user_id) });
  
  if (!profiles || profiles.length === 0) {
    return createErrorResponse({
      errorMessage: "Profile not found",
      status: 404,
    });
  }

  return createSuccessResponse(profiles[0]);
});
