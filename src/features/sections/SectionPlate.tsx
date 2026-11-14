import { Link } from "react-router-dom";
import type { PlateContent } from "./content";
import { CopyEmailButton } from "./CopyEmailButton";
import { ProjectIcon } from "../projects/ProjectIcon";
import { LocalTimes } from "../timezone/LocalTimes";
import { LocationBadge } from "../timezone/LocationBadge";
import { ExternalIcon, ForwardIcon, GithubIcon } from "../../components/ui/Icons";
import { GmailIcon, OutlookIcon } from "../../components/ui/BrandIcons";

const COMPOSE_ICONS = { gmail: GmailIcon, outlook: OutlookIcon };

export interface SectionPlateProps {
    numeral: string;
    content: PlateContent;
    /** The first plate carries the page’s main heading; the rest sit under it. */
    isLead?: boolean;
}

export function SectionPlate({ numeral, content, isLead = false }: SectionPlateProps) {
    const Heading = isLead ? "h1" : "h2";
    const EntryHeading = isLead ? "h2" : "h3";
    const { title, body, availability, rows, history, links, copy, compose, profile, whereabouts } = content;

    return (
        <div className="sections-overlay__card">
            <p className="sections-overlay__plate">Plate {numeral}</p>
            <Heading className="sections-overlay__title">{title}</Heading>
            {availability && (
                <p className="sections-overlay__availability">
                    {/* "entry-level" and "on-site" stay whole instead of breaking at their hyphens */}
                    {availability.split(/(\S+-\S+)/).map((part, index) =>
                        index % 2 ? (
                            <span key={part} className="sections-overlay__keep">
                                {part}
                            </span>
                        ) : (
                            part
                        )
                    )}
                </p>
            )}
            {whereabouts && (
                <div className="sections-overlay__meta">
                    <LocationBadge />
                    {profile && (
                        <a className="sections-overlay__profile pill" href={profile.href} target="_blank" rel="noreferrer">
                            <GithubIcon /> {profile.label} <ExternalIcon />
                            <span className="sr-only">(opens in a new tab)</span>
                        </a>
                    )}
                </div>
            )}
            {body && <p className="sections-overlay__subtitle">{body}</p>}
            {rows && (
                <dl className="sections-overlay__list">
                    {rows.map((row) => (
                        <div key={row.label} className="sections-overlay__row">
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {history && (
                <ol className="sections-overlay__list sections-overlay__history">
                    {history.map((entry) => (
                        <li key={entry.title} className="sections-overlay__entry">
                            <EntryHeading>{entry.title}</EntryHeading>
                            <span className="sections-overlay__when">{entry.when}</span>
                            <p>{entry.detail}</p>
                        </li>
                    ))}
                </ol>
            )}
            {links && (
                <ul className="sections-overlay__list">
                    {links.map((item) => (
                        <li key={item.to}>
                            <Link to={item.to} className="sections-overlay__row sections-overlay__row--link sections-overlay__row--project">
                                <ProjectIcon slug={item.slug} />
                                <strong>{item.label}</strong>
                                <span>
                                    {item.detail} <ForwardIcon />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            {copy && <CopyEmailButton address={copy} />}
            {compose && (
                <div className="sections-overlay__compose" role="group" aria-label="Write an email with">
                    <p aria-hidden="true">Or write with</p>
                    {compose.map((option) => {
                        const Icon = COMPOSE_ICONS[option.id];
                        return (
                            <a
                                key={option.id}
                                className="sections-overlay__profile pill"
                                href={option.href}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Icon /> {option.label} <ExternalIcon />
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        );
                    })}
                </div>
            )}
            {profile && !whereabouts && (
                <a className="sections-overlay__profile pill" href={profile.href} target="_blank" rel="noreferrer">
                    <GithubIcon /> {profile.label} <ExternalIcon />
                    <span className="sr-only">(opens in a new tab)</span>
                </a>
            )}
            {whereabouts && <LocalTimes />}
        </div>
    );
}

export default SectionPlate;
