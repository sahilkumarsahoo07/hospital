import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/studies")({
  component: () => <Outlet />,
});
