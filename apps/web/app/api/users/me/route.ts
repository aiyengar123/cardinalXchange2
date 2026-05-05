import {
  deleteOwnAccount,
  getUserProfile,
  setUserDisplayName,
} from "@/backend/users";
import { HttpError, jsonError, jsonOk, readPayload } from "@/backend/http/http";
import { parseUpdateUserProfileInput } from "@/backend/http/inputs";
import { getViewer } from "@/backend/viewer";

export async function GET() {
  try {
    const viewer = await getViewer();
    if (!viewer.isAuthenticated) {
      throw new HttpError(401, "auth_required", "Sign in required.");
    }
    const profile = await getUserProfile(viewer.id);
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const viewer = await getViewer();
    if (!viewer.isAuthenticated) {
      throw new HttpError(401, "auth_required", "Sign in required.");
    }
    const payload = await readPayload(request);
    const parsed = parseUpdateUserProfileInput(payload);
    await setUserDisplayName(viewer.id, parsed.displayName ?? null);
    const profile = await getUserProfile(viewer.id);
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  try {
    const viewer = await getViewer();
    if (!viewer.isAuthenticated) {
      throw new HttpError(401, "auth_required", "Sign in required.");
    }
    await deleteOwnAccount(viewer.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
