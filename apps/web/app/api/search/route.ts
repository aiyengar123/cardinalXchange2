import { jsonError, jsonOk } from "@/server/http/http";
import { parseSearchInput } from "@/server/http/inputs";
import { search } from "@/server/search/search.service";

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
