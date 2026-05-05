import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth", () => ({
  getViewerFromSession: vi.fn(),
}));

import { getViewerFromSession } from "@/backend/auth";
import { getViewer, ANONYMOUS_VIEWER } from "../viewer";

const mockedSession = getViewerFromSession as unknown as ReturnType<
  typeof vi.fn
>;

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  mockedSession.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTH_DEV_BYPASS;
  delete process.env.DEV_VIEWER_ID;
  delete process.env.DEV_VIEWER_NAME;
  delete process.env.DEV_VIEWER_META;
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("getViewer", () => {
  it("returns the live session as an authenticated viewer", async () => {
    mockedSession.mockResolvedValueOnce({
      userId: "u-123",
      email: "alice@stanford.edu",
      name: "Alice",
      image: null,
      emailVerified: true,
    });

    const viewer = await getViewer();

    expect(viewer.id).toBe("u-123");
    expect(viewer.displayName).toBe("Alice");
    expect(viewer.meta).toBe("alice@stanford.edu");
    expect(viewer.source).toBe("session");
    expect(viewer.isAuthenticated).toBe(true);
  });

  it("falls back to the email when name is empty", async () => {
    mockedSession.mockResolvedValueOnce({
      userId: "u-456",
      email: "bob@stanford.edu",
      name: "  ",
      image: null,
      emailVerified: true,
    });

    const viewer = await getViewer();

    expect(viewer.displayName).toBe("bob@stanford.edu");
  });

  it("returns the anonymous viewer when there is no session", async () => {
    mockedSession.mockResolvedValueOnce(null);

    const viewer = await getViewer();

    expect(viewer).toEqual(ANONYMOUS_VIEWER);
    expect(viewer.isAuthenticated).toBe(false);
  });

  it("honors AUTH_DEV_BYPASS=1 + DEV_VIEWER_* when no session is present", async () => {
    mockedSession.mockResolvedValueOnce(null);
    process.env.AUTH_DEV_BYPASS = "1";
    process.env.DEV_VIEWER_ID = "dev-1";
    process.env.DEV_VIEWER_NAME = "Dev Viewer";

    const viewer = await getViewer();

    expect(viewer.id).toBe("dev-1");
    expect(viewer.displayName).toBe("Dev Viewer");
    expect(viewer.source).toBe("dev");
    expect(viewer.isAuthenticated).toBe(true);
  });

  it("ignores DEV_VIEWER_* without AUTH_DEV_BYPASS=1", async () => {
    mockedSession.mockResolvedValueOnce(null);
    process.env.DEV_VIEWER_ID = "dev-1";
    process.env.DEV_VIEWER_NAME = "Dev Viewer";

    const viewer = await getViewer();

    expect(viewer.isAuthenticated).toBe(false);
    expect(viewer.id).toBe("anonymous");
  });
});
