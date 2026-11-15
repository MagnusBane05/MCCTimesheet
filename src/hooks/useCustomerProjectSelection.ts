import { useMemo, useState } from 'react';
import { Project } from '../domain/project';
import { getDefaultProjectIdForCustomer, getProjectsWithCustomer, getUniqueCustomers } from '../utils/projects';

interface CustomerProjectSelectionOptions {
  pinnedProject?: Project;
}

export function useCustomerProjectSelection(
  projects: Project[],
  { pinnedProject }: CustomerProjectSelectionOptions = {}
) {
  const [customer, setCustomer] = useState(pinnedProject?.customer ?? '');
  const [projectId, setProjectId] = useState<number | null>(pinnedProject?.id ?? null);

  const customerOptions = useMemo(() => getUniqueCustomers(projects), [projects]);

  const projectOptions = useMemo(() => {
    const customerProjects = getProjectsWithCustomer(projects, customer);
    const options = pinnedProject
      && pinnedProject.customer === customer
      && !customerProjects.some((project) => project.id === pinnedProject.id)
      ? [...customerProjects, pinnedProject]
      : customerProjects;
    return [...options].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, customer, pinnedProject]);

  function selectCustomer(newCustomer: string) {
    setCustomer(newCustomer);
    setProjectId(getDefaultProjectIdForCustomer(newCustomer, projects));
  }

  function syncToProjects(nextProjects: Project[]) {
    if (projectId === null || nextProjects.some((project) => project.id === projectId)) return;
    if (getProjectsWithCustomer(nextProjects, customer).length === 0) {
      setCustomer('');
      setProjectId(null);
    } else {
      setProjectId(getDefaultProjectIdForCustomer(customer, nextProjects));
    }
  }

  function reset() {
    setCustomer(pinnedProject?.customer ?? '');
    setProjectId(pinnedProject?.id ?? null);
  }

  return {
    customer,
    projectId,
    customerOptions,
    projectOptions,
    selectCustomer,
    setProjectId,
    syncToProjects,
    reset,
  };
}
