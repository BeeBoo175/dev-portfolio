import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { StudioPage } from "./pages/StudioPage";
import { ProjectPage } from "./pages/ProjectPage";
import { PLANET_SECTIONS } from "./features/sections";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/studio" element={<StudioPage />} />
                    <Route path="/projects/:slug" element={<ProjectPage />} />
                    <Route path="/galaxy-studio" element={<Navigate to="/studio" replace />} />
                    <Route path="/editor" element={<Navigate to="/studio" replace />} />
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