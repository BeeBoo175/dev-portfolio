/* ApexAuto's mark is that project's own app icon, copied from its repository */
import apexAutoMark from "./icons/apexauto.svg";
/* from the suika-bot-site repository; the artwork belongs to Suika World, as that project's page says */
import suikaWatermelon from "./icons/suika-watermelon.webp";
import "./ProjectIcon.css";

const ICONS: Record<string, string> = {
    apexauto: apexAutoMark,
    "suika-bot": suikaWatermelon,
};

export function ProjectIcon({ slug }: { slug: string }) {
    const source = ICONS[slug];
    if (!source) return null;

    return (
        <span className={`project-icon project-icon--${slug}`} aria-hidden="true">
            <img src={source} alt="" />
        </span>
    );
}

export default ProjectIcon;
