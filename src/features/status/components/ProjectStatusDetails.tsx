import { useId, useState } from "react";
import { ExpandIcon, ExternalIcon, RefreshIcon } from "../../../components/ui/Icons";
import { useProjectStatus } from "../hooks/useProjectStatus";
import type { PartState } from "../types";
import {
    ALL_EXPLANATIONS,
    ALL_HEADLINES,
    HEADLINES,
    PART_HOSTS,
    PART_LABELS,
    SHOWN_PARTS,
    explainStatus,
    isBusy,
    partLabel,
} from "../utils/statusModel";
import { StableText } from "./StableText";
import { StatusMark } from "./StatusMark";
import "./Status.css";

const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });

/** A part's mark uses the badge's colours; anything still on its way up reads as waking. */
const markState = (state: PartState) => (state === "unknown" ? "waking" : state);

export interface ProjectStatusDetailsProps {
    url: string;
    demoUrl?: string;
}

/**
 * One line saying how the demo is doing, with the way into it beside it in every state, and the parts on
 * request. Nothing changes size as the state changes: text holds room for its longest form.
 */
export function ProjectStatusDetails({ url, demoUrl }: ProjectStatusDetailsProps) {
    const snapshot = useProjectStatus(url);
    const { state, report, exhausted, recheck } = snapshot;
    const [open, setOpen] = useState(false);
    const detailsId = useId();
    const busy = isBusy(snapshot);
    const checkedAt = report ? new Date(report.checkedAt) : null;

    return (
        <section className="status-details" aria-label="Live demo">
            <p className="sr-only" role="status">
                {HEADLINES[state]}
            </p>
            <div className="status-details__row">
                <button
                    type="button"
                    className={`status-details__toggle status-badge--${state}`}
                    aria-expanded={open}
                    aria-controls={detailsId}
                    onClick={() => setOpen((value) => !value)}
                >
                    <StatusMark busy={busy} />
                    <StableText text={HEADLINES[state]} variants={ALL_HEADLINES} />
                    <span className="status-details__more">
                        <span className="sr-only">Details</span>
                        <ExpandIcon className="status-details__chevron" />
                    </span>
                </button>
                {demoUrl && (
                    <a className="status-details__open" href={demoUrl} target="_blank" rel="noreferrer">
                        Open live demo <ExternalIcon />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                )}
            </div>

            <div id={detailsId} className="status-details__drawer" data-open={open} inert={!open}>
                <div className="status-details__clip">
                    <div className="status-details__box">
                        <ul className="status-details__parts">
                            {SHOWN_PARTS.map((part) => {
                                const value = report?.parts[part];
                                const label = value ? partLabel(value, exhausted) : busy ? "Checking" : "No answer";
                                const waiting = busy && value !== "ready" && value !== "down";
                                return (
                                    <li key={part} className="status-details__part">
                                        <span className="status-details__name">
                                            {PART_LABELS[part]}
                                            <small>{PART_HOSTS[part]}</small>
                                        </span>
                                        <span
                                            className={`status-badge status-badge--${value ? markState(value) : "checking"}`}
                                        >
                                            <span key={label} className="status-badge__label">
                                                {label}
                                            </span>
                                            <StatusMark busy={waiting} />
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <p className="status-details__note">
                            <StableText text={explainStatus(snapshot)} variants={ALL_EXPLANATIONS} />
                        </p>

                        <div className="status-details__footer">
                            <span>
                                {checkedAt && !Number.isNaN(checkedAt.getTime())
                                    ? `Last checked ${TIME.format(checkedAt)}`
                                    : "Not checked yet"}
                            </span>
                            <button type="button" className="status-details__again" onClick={recheck} disabled={busy}>
                                <RefreshIcon size={14} className={busy ? "status-mark__spinner" : undefined} />
                                Check again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProjectStatusDetails;
