import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const data = await apiFetch<{ user: any }>("auth.php?action=session");
      if (!data?.user) throw new Error("Not logged in");
      return { user: data.user };
    } catch (e) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
