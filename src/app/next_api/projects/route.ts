
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody, ApiParams } from "@/lib/api-utils";

export const GET = requestMiddleware(async (request, params: ApiParams) => {
  const { limit, offset } = parseQueryParams(request);
  const user_id = params.payload?.sub;
  
  if (!user_id) {
    return createErrorResponse({
      errorMessage: "User ID is required",
      status: 400,
    });
  }

  const projectsCrud = new CrudOperations("projects", params.token);
  const data = await projectsCrud.findMany(
    { user_id: parseInt(user_id) },
    { 
      limit, 
      offset,
      orderBy: { column: 'created_at', direction: 'desc' }
    }
  );
  
  return createSuccessResponse(data);
});

export const POST = requestMiddleware(async (request, params: ApiParams) => {
  const body = await validateRequestBody(request);
  const user_id = params.payload?.sub;
  
  if (!user_id) {
    return createErrorResponse({
      errorMessage: "User ID is required",
      status: 400,
    });
  }

  if (!body.name || !body.project_type) {
    return createErrorResponse({
      errorMessage: "Name and project type are required",
      status: 400,
    });
  }

  const projectsCrud = new CrudOperations("projects", params.token);
  const data = await projectsCrud.create({
    user_id: parseInt(user_id),
    name: body.name,
    project_type: body.project_type,
    description: body.description,
    dimensions: body.dimensions,
    status: body.status || 'planning',
  });
  
  return createSuccessResponse(data, 201);
});
