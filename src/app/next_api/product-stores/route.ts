import CrudOperations from "@/lib/crud-operations";
import { createSuccessResponse } from "@/lib/create-response";
import { requestMiddleware, parseQueryParams, ApiParams } from "@/lib/api-utils";

export const GET = requestMiddleware(
  async (request, params: ApiParams) => {
    const { limit, offset, search } = parseQueryParams(request);

    const storesCrud = new CrudOperations("product_stores", params.token);
    let data = await storesCrud.findMany({}, { limit, offset });

    if (search && data) {
      const s = search.toLowerCase();
      data = data.filter((st: any) => (st.name?.toLowerCase() ?? "").includes(s));
    }

    return createSuccessResponse(data);
  },
  false
);
