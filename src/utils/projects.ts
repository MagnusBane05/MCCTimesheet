import { Project } from "../domain/project";

export function getProjectDisplayName(project: Project) {
  return project.name ? project.name : `Work for ${project.customer}`;
}

export function getUniqueCustomers(projects: Project[]): string[] {
  const allCustomers = projects.map((project) => project.customer);
  return Array.from(new Set(allCustomers));
}

export function getProjectsWithCustomer(projects: Project[], customer: string): Project[] {
  return projects.filter((project) => project.customer === customer);
}

export function getDefaultProjectIdForCustomer(customer: string, projects: Project[]): number | null {
  const customerProjects = getProjectsWithCustomer(projects, customer);
  if (customerProjects.length === 1) {
    return customerProjects[0].id;
  } else {
    return null;
  }
}
