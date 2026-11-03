import { Navigate, useParams } from "react-router-dom";
import { ProjectScreen, findProject } from "../features/projects";
import { ReadingPage } from "./ReadingPage";

export function ProjectPage() {
    const { slug } = useParams();
    const project = findProject(slug);

    if (!project) return <Navigate to="/projects" replace />;

    return (
        <ReadingPage sectionId="projects" escapeTo="/projects">
            <ProjectScreen project={project} />
        </ReadingPage>
    );
}

export default ProjectPage;
