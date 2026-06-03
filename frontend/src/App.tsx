import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { AlertsPage } from "./routes/AlertsPage";
import { MetricsPage } from "./routes/MetricsPage";
import { SessionDetailPage } from "./routes/SessionDetailPage";
import { SessionsPage } from "./routes/SessionsPage";
import { SettingsPage } from "./routes/SettingsPage";
import { TracesPage } from "./routes/TracesPage";
import { VoiceConsolePage } from "./routes/VoiceConsolePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <VoiceConsolePage /> },
      { path: "sessions", element: <SessionsPage /> },
      { path: "sessions/:id", element: <SessionDetailPage /> },
      { path: "traces", element: <TracesPage /> },
      { path: "metrics", element: <MetricsPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
