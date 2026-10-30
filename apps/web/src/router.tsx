import { createBrowserRouter } from "react-router";
import { AppShell } from "./ui/AppShell";
import { ROUTES } from "./routes";

// Data-mode router is the React Router 7 default; real console routes
// (login, map) arrive with T-008/T-009.
export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppShell />,
  },
]);
