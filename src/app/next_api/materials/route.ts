import CrudOperations from "@/lib/crud-operations";
import { createSuccessResponse } from "@/lib/create-response";
import { requestMiddleware, parseQueryParams, ApiParams } from "@/lib/api-utils";

export const GET = requestMiddleware(
  async (request, params: ApiParams) => {
    const { limit, offset, search } = parseQueryParams(request);

    const searchParams = request.nextUrl.searchParams;
    const category_id = searchParams.get("category_id");

    const materialsCrud = new CrudOperations("materials", params.token);

    const filters: Record<string, any> = {};
    if (category_id) {
      filters.category_id = parseInt(category_id, 10);
    }

    let data = await materialsCrud.findMany(filters, { limit, offset });

    if (search && data) {
      const searchLower = search.toLowerCase();
      data = data.filter((material: any) => {
        const name = material.name?.toLowerCase() ?? "";
        const description = material.description?.toLowerCase() ?? "";
        return name.includes(searchLower) || description.includes(searchLower);
      });
    }

    return createSuccessResponse(data);
  },
  false // público: no requiere login
);
