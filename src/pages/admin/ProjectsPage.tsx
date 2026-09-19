import { useCallback, useEffect, useState } from "react";
import { PRODUCTION_STATUS_COLOURS, PRODUCTION_STATUS_LABELS, PRODUCTION_STATUSES, ProductionStatus, Project } from "../../domain/project";
import { timesheetService } from "../../services/service";
import { LoadingState } from "../../components/common/LoadingState";
import { ErrorState } from "../../components/common/ErrorState";
import { Table, TableHeader, TableCell, TableRow } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Select } from "../../components/common/Select";
import { useRowEditor } from "../../hooks/useRowEditor";
import { EditDelete } from "../../components/common/EditDelete";
import { EditableText } from "../../components/common/EditableText";
import { ActiveToggle } from "../../components/common/ActiveToggle";
import { useAuth } from "../../auth/AuthContext";
import { CreateProjectForm } from "../../components/admin/CreateProjectForm";
import { Modal } from "../../components/common/Modal";
import { NewProjectInput } from "../../services/TimesheetService";

export function ProjectsPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const [ projects, setProjects ] = useState<Project[]>([]);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(false);
  const [ _, setSaveError ] = useState(false);
  const [ filter, setFilter ] = useState<'active' | 'inactive' | 'all'>('active');
  const [ isCreateModalOpen, setIsCreateModalOpen ] = useState(false);
  const [ sort, setSort ] = useState<'customer' | 'name' | 'prjNumber'>('customer');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const projectList = await timesheetService.getProjects();
      setProjects(projectList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const {
    editingItem: editingProject,
    startEditing,
    cancelEditing,
    updateField,
    isEditing,
  } = useRowEditor<Project>();

  async function handleSave() {
    if (!editingProject) return;
    try {
      await timesheetService.updateProject(editingProject.id, editingProject);
      cancelEditing();
      await load();
    } catch {
      setSaveError(true);
    }
  };

  async function handleCreateProject(project: NewProjectInput) {
    await timesheetService.createProject(project);
    setIsCreateModalOpen(false);
    await load();
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === 'active') return project.active;
    if (filter === 'inactive') return !project.active;
    return true; // 'all'
  }).sort((a, b) => {
    if (sort === 'customer') return a.customer.localeCompare(b.customer);
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'prjNumber') return a.projectNumber.localeCompare(b.projectNumber);
    return 0;
  });
  
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <Button variant={filter === "active" ? "primary" : "secondary"} onClick={() => setFilter('active')}>Active</Button>
          <Button variant={filter === "inactive" ? "primary" : "secondary"} onClick={() => setFilter('inactive')}>Inactive</Button>
          <Button variant={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter('all')}>All</Button>
        </div>
        <div>
          <Button variant="primary" onClick={() => { setIsCreateModalOpen(true); }}>Create Project</Button>
        </div>
      </div>
      <div className="mb-4">
          <label htmlFor="customer-filter" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
            Sort by
          </label>
        <Select value={sort} onChange={(e) => { setSort(e.target.value as 'customer' | 'name' | 'prjNumber'); }}>
          <option value="customer">Customer</option>
          <option value="name">Name</option>
          <option value="prjNumber">PRJ #</option>
        </Select>
      </div>

      {loading && <LoadingState label="Loading projects..." />}
      {!loading && error && <ErrorState message="Unable to load projects. Please try again." onRetry={load} />}
      
      {!loading && !error && (
        <div>
          <Table striped rounded bordered>
            <thead>
              <tr>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Project Name</TableHeader>
                <TableHeader>PRJ #</TableHeader>
                <TableHeader>Active</TableHeader>
                <TableHeader>Production Status</TableHeader>
                {isAdmin && <TableHeader/>}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center text-navy-950/50">
                    No projects found.
                  </td>
                </tr>
              )}
              {filteredProjects.length > 0 && filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <EditableText
                      text={isEditing(project) ? editingProject?.customer ?? '' : project.customer}
                      isEditing={isEditing(project)}
                      onEdit={(newText) => updateField('customer', newText)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableText
                      text={isEditing(project) ? editingProject?.name ?? '' : project.name}
                      isEditing={isEditing(project)}
                      onEdit={(newText) => updateField('name', newText)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableText
                      text={isEditing(project) ? editingProject?.projectNumber ?? '' : project.projectNumber}
                      isEditing={isEditing(project)}
                      onEdit={(newText) => updateField('projectNumber', newText)}
                    />
                  </TableCell>
                  <TableCell>
                    <ActiveToggle
                      active={isEditing(project) ? editingProject?.active ?? false : project.active}
                      editing={isEditing(project)}
                      onToggle={(e) => updateField('active', e.target.value === 'Active')}
                    />
                  </TableCell>
                  <TableCell>
                    {isEditing(project) ? (
                      <Select 
                        value={editingProject?.productionStatus ?? ''}
                        variant="inline"
                        onChange={(e) => updateField('productionStatus', e.target.value as ProductionStatus)}
                        className="rounded-full px-0 py-0"
                      >
                        {PRODUCTION_STATUSES.map((option: ProductionStatus) => (
                          <option key={option} value={option}>
                            {PRODUCTION_STATUS_LABELS[option]}
                          </option>
                        ))} 
                      </Select>
                    ) : (
                        <div className={PRODUCTION_STATUS_COLOURS[project.productionStatus] + "w-fit whitespace-nowrap rounded-full px-2 py-1 text-center text-xs font-bold"}>
                          {PRODUCTION_STATUS_LABELS[project.productionStatus]}
                        </div>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <EditDelete
                        isEditing={isEditing(project)}
                        onEdit={() => startEditing(project)}
                        onCancelEdit={cancelEditing}
                        onSave={handleSave}               
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Project">
        <CreateProjectForm onCreateProject={handleCreateProject} />
      </Modal>
    </div>
  );
}
