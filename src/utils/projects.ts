import { Project } from "../domain/project";

export function getProjectDisplayName(project: Project) {
  return project.name ? project.name : `Work for ${project.customer}`;
}