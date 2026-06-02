import { redirect } from "next/navigation";

import { getViewer } from "@/backend/viewer";
import { getUserProfile } from "@/backend/users";
import { SettingsForm } from "@/features/auth/components/settings-form";

export const metadata = {
  title: "Settings — cardinalXchange",
};

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer.isAuthenticated || viewer.id === "anonymous") {
    redirect("/login?next=/settings");
  }

  const profile = await getUserProfile(viewer.id);

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink-900)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-ink-500)]">
          Manage how your name appears on questions and answers.
        </p>
      </header>
      <SettingsForm
        userId={profile.id}
        email={profile.email}
        defaultDisplayName={profile.displayName}
      />
    </div>
  );
}
