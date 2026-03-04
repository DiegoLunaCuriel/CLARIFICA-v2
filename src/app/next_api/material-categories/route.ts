import CrudOperations from "@/lib/crud-operations";
import { createSuccessResponse } from "@/lib/create-response";
import { requestMiddleware, parseQueryParams, ApiParams } from "@/lib/api-utils";

export const GET = requestMiddleware(
  async (request, params: ApiParams) => {
    const { limit, offset, search } = parseQueryParams(request);

    const categoriesCrud = new CrudOperations("material_categories", params.token);

    let data = await categoriesCrud.findMany({}, { limit, offset });

    if (search && data) {
      const s = search.toLowerCase();
      data = data.filter((c: any) => {
        const name = c.name?.toLowerCase() ?? "";
        const desc = c.description?.toLowerCase() ?? "";
        return name.includes(s) || desc.includes(s);
      });
    }

    return createSuccessResponse(data);
  },
  false
);
