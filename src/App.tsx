import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GalaxyLayout } from "./pages/GalaxyLayout";
import { HomePage } from "./pages/HomePage";
import { StudioPage } from "./pages/StudioPage";
import { PLANET_SECTIONS } from "./features/sections";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<GalaxyLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/studio" element={<StudioPage />} />
                    <Route path="/galaxy-studio" element={<StudioPage />} />
                    <Route path="/editor" element={<StudioPage />} />
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