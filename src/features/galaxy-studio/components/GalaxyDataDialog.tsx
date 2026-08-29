import { useState } from "react";
import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";

export interface GalaxyDataDialogProps {
    isOpen: boolean;
    planets: OrbitConfig[];
    asteroidBelt: AsteroidBeltConfig;
    sun: SunConfig;
    defaultPlanetId?: string;
    onClose: () => void;
    onImport: (importedData: {
        planets?: OrbitConfig[];
        asteroidBelt?: AsteroidBeltConfig;
        sun?: SunConfig;
        defaultPlanetId?: string;
    }) => void;
    onResetDefaults: () => void;
}

export function GalaxyDataDialog({
    isOpen,
    planets,
    asteroidBelt,
    sun,
    defaultPlanetId,
    onClose,
    onImport,
    onResetDefaults,
}: GalaxyDataDialogProps) {
    const [importText, setImportText] = useState("");
    const [copySuccess, setCopySuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const exportedJson = JSON.stringify({ planets, asteroidBelt, sun, defaultPlanetId }, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(exportedJson);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            setErrorMsg("Failed to copy to clipboard.");
        }
    };

    const handleApplyImport = () => {
        try {
            const parsed = JSON.parse(importText);
            if (Array.isArray(parsed)) {
                onImport({ planets: parsed });
                onClose();
                return;
            }
            if (typeof parsed === "object" && parsed !== null) {
                onImport({
                    planets: Array.isArray(parsed.planets) ? parsed.planets : undefined,
                    asteroidBelt: parsed.asteroidBelt,
                    sun: parsed.sun,
                    defaultPlanetId: typeof parsed.defaultPlanetId === "string" ? parsed.defaultPlanetId : undefined,
                });
                onClose();
                return;
            }
            setErrorMsg("Invalid JSON structure.");
        } catch (e) {
            setErrorMsg("Invalid JSON format.");
        }
    };

    return (
        <div className="studio-modal-backdrop" onClick={onClose}>
            <div
                className="studio-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Galaxy Data Import and Export"
            >
                <div className="studio-modal__header">
                    <h3>System Data (JSON)</h3>
                    <button
                        type="button"
                        className="studio-modal__close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        x
                    </button>
                </div>

                <div className="studio-modal__body">
                    {errorMsg && <div className="studio-modal__alert">{errorMsg}</div>}

                    <div className="studio-field">
                        <div className="studio-field__label-row">
                            <label>Export Current System</label>
                            <button
                                type="button"
                                className="studio-btn studio-btn--secondary studio-btn--sm"
                                onClick={handleCopy}
                            >
                                {copySuccess ? "Copied!" : "Copy JSON"}
                            </button>
                        </div>
                        <textarea
                            className="studio-textarea"
                            rows={6}
                            readOnly
                            value={exportedJson}
                        />
                    </div>

                    <div className="studio-field" style={{ marginTop: "1rem" }}>
                        <label>Import System JSON</label>
                        <textarea
                            className="studio-textarea"
                            rows={5}
                            placeholder="Paste custom galaxy JSON here..."
                            value={importText}
                            onChange={(e) => {
                                setImportText(e.target.value);
                                setErrorMsg(null);
                            }}
                        />
                    </div>
                </div>

                <div className="studio-modal__footer">
                    <button
                        type="button"
                        className="studio-btn studio-btn--danger studio-btn--sm"
                        onClick={() => {
                            if (window.confirm("Reset all planets, sun, and asteroid belt to defaults?")) {
                                onResetDefaults();
                                onClose();
                            }
                        }}
                    >
                        Reset All to Defaults
                    </button>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="studio-btn studio-btn--primary studio-btn--sm"
                            onClick={handleApplyImport}
                            disabled={!importText.trim()}
                        >
                            Apply Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalaxyDataDialog;
