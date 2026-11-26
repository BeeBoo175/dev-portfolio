import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { ProjectPage } from "./pages/ProjectPage";
import { PLANET_SECTIONS } from "./features/sections";
import { StudioRoute } from "./pages/StudioRoute";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/studio" element={<StudioRoute />} />
                    <Route path="/projects/:slug" element={<ProjectPage />} />
                    <Route path="/galaxy-studio" element={<Navigate to="/studio" replace />} />
                    <Route path="/editor" element={<Navigate to="/studio" replace />} />
                    {/* a mistyped or stale link lands on the first plate, not on a blank screen */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                    {PLANET_SECTIONS.map((section) => (
                        <Route
                            key={section.id}
                            path={section.path}
                            element={<HomePage />}
                        />
                    ))}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;