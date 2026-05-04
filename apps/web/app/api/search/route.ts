import { jsonError, jsonOk } from "@/backend/http/http";
import { parseSearchInput } from "@/backend/http/inputs";
import { search } from "@/backend/search/search.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { query, tag } = parseSearchInput(searchParams);
    const results = await search(query, { tag });
    return jsonOk({ results, query, tag: tag ?? null });
  } catch (error) {
    return jsonError(error);
  }
}
