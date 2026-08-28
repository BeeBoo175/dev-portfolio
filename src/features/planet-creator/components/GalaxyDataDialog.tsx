interface GalaxyDataDialogProps {
    isOpen: boolean;
    importJsonText: string;
    onTextChange: (text: string) => void;
    onExportJSON: () => void;
    onImportJSON: () => void;
    onClose: () => void;
}

export function GalaxyDataDialog({
    isOpen,
    importJsonText,
    onTextChange,
    onExportJSON,
    onImportJSON,
    onClose,
}: GalaxyDataDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="planet-studio__dialog-backdrop" onClick={onClose}>
            <div className="planet-studio__dialog" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>
                        Galaxy Configuration Data
                    </div>
                    <button className="planet-studio__close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    Export your custom solar system setup as JSON or paste an existing configuration to load.
                </p>

                <button className="planet-studio__btn planet-studio__btn--secondary" onClick={onExportJSON}>
                    Copy Galaxy JSON
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>
                        Paste JSON to Import:
                    </span>
                    <textarea
                        className="planet-studio__json-textarea"
                        placeholder="Paste OrbitConfig[] JSON array here..."
                        value={importJsonText}
                        onChange={(e) => onTextChange(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button className="planet-studio__btn planet-studio__btn--secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="planet-studio__btn planet-studio__btn--primary" onClick={onImportJSON}>
                            Import &amp; Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GalaxyDataDialog;
