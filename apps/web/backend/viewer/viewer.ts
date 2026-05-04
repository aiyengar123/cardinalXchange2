export type Viewer = {
  id: string;
  displayName: string;
  meta: string;
  role: "student" | "moderator";
  source: "dev";
};

export async function getViewer(): Promise<Viewer> {
  return {
    id: process.env.DEV_VIEWER_ID ?? "dev-viewer",
    displayName: process.env.DEV_VIEWER_NAME ?? "Stanford Student",
    meta: process.env.DEV_VIEWER_META ?? "Dev viewer",
    role: "student",
    source: "dev",
  };
}
