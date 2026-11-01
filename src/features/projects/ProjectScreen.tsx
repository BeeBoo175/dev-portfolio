import { Link } from "react-router-dom";
import { PROJECTS, getProjectPath, type Project } from "./data";
import { ReadingScreen } from "../../components/reading/ReadingScreen";
import { ForwardIcon } from "../../components/ui/Icons";
import { ProjectIcon } from "./ProjectIcon";
import "./ProjectScreen.css";

export function ProjectScreen({ project }: { project: Project }) {
    const next = PROJECTS[(PROJECTS.indexOf(project) + 1) % PROJECTS.length];

    return (
        <ReadingScreen
            title={project.name}
            backTo="/projects"
            backLabel="All projects"
            icon={<ProjectIcon slug={project.slug} />}
        >
            <p className="reading-screen__summary">{project.summary}</p>

            <section className="project-screen__built" aria-labelledby="project-built-with">
                <h2 id="project-built-with">Built with</h2>
                <dl>
                    {project.builtWith.map((stack) => (
                        <div key={stack.group} className="project-screen__stack">
                            <dt>{stack.group}</dt>
                            <dd>
                                <ul>
                                    {stack.tools.map((tool) => (
                                        <li key={tool}>{tool}</li>
                                    ))}
                                </ul>
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {project.sections.map((section) => (
                <section key={section.heading} className="reading-screen__section">
                    <h2>{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </section>
            ))}

            <p className="reading-screen__note">{project.note}</p>

            {next !== project && (
                <Link to={getProjectPath(next)} className="project-screen__next">
                    <span>Next project</span>
                    <strong>
                        <ProjectIcon slug={next.slug} />
                        {next.name} <ForwardIcon />
                    </strong>
                </Link>
            )}
        </ReadingScreen>
    );
}

export default ProjectScreen;
