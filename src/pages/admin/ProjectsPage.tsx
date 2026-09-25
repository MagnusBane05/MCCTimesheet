import { useCallback, useEffect, useState } from "react";
import { PRODUCTION_STATUS_COLOURS, PRODUCTION_STATUS_LABELS, PRODUCTION_STATUSES, ProductionStatus, Project } from "../../domain/project";
import { timesheetService } from "../../services/service";
import { LoadingState } from "../../components/common/LoadingState";
import { ErrorState } from "../../components/common/ErrorState";
import { Table, TableHeader, TableCell, TableRow } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { useRowEditor } from "../../hooks/useRowEditor";
import { EditDelete } from "../../components/common/EditDelete";
import { useAuth } from "../../auth/useAuth";
import { CreateProjectForm } from "../../components/admin/CreateProjectForm";
import { Modal } from "../../components/common/Modal";
import { NewProjectInput } from "../../services/TimesheetService";
import { validateProject } from "../../utils/validation";
import { SelectField } from "../../components/form/SelectField";
import { TextField } from "../../components/form/TextField";
import { Badge } from "../../components/common/Badge";

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
  const [ hasAttemptedSubmit, setHasAttemptedSubmit ] = useState(false);

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

  const errors = editingProject ? validateProject(editingProject) : {};
  const visibleErrors = hasAttemptedSubmit ? errors : {};

  async function handleSave() {
    if (!editingProject) return;
    setHasAttemptedSubmit(true);
    if (Object.keys(errors).length > 0) return;
    try {
      await timesheetService.updateProject(editingProject.id, editingProject);
      cancelEditing();
      await load();
    } catch {
      setSaveError(true);
    } finally {
      setHasAttemptedSubmit(false);
    }
  };

  async function handleCreateProject(project: NewProjectInput) {
    await timesheetService.createProject(project);
    setIsCreateModalOpen(false);
    await load();
  }

  function handleCancel() {
    setHasAttemptedSubmit(false);
    cancelEditing();
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
      <SelectField 
        id="projects-sort" 
        ariaLabel="Sort by"
        label="Sort by" value={sort} 
        labelVariant="small"
        onChange={(e) => { setSort(e.target.value as 'customer' | 'name' | 'prjNumber'); }}
        pt={{ container: "mb-4" }} >
        <option value="customer">Customer</option>
        <option value="name">Name</option>
        <option value="prjNumber">PRJ #</option>
      </SelectField>

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
                  <td colSpan={isAdmin ? 6 : 5} className="text-center text-midnight-950/50">
                    No projects found.
                  </td>
                </tr>
              )}
              {filteredProjects.length > 0 && filteredProjects.map((project) => {
                const editing = isEditing(project);
                const displayProject = editing ? editingProject : project;
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <TextField
                        id={`customer-${project.id}`}
                        ariaLabel="Customer"
                        value={displayProject?.customer ?? ''}
                        readOnly={!editing}
                        onChange={(e) => updateField('customer', e.target.value)}
                        error={editing ? visibleErrors.customer : undefined}
                        variant="inline"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        id={`name-${project.id}`}
                        ariaLabel="Project Name"
                        value={displayProject?.name ?? ''}
                        readOnly={!editing}
                        onChange={(e) => updateField('name', e.target.value)}
                        variant="inline"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        id={`projectNumber-${project.id}`}  
                        ariaLabel="Project Number"
                        value={displayProject?.projectNumber ?? ''}
                        readOnly={!editing}
                        variant="inline"
                        onChange={(e) => updateField('projectNumber', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <SelectField
                        id={`active-${project.id}`}
                        ariaLabel="Active Status"
                        value={displayProject?.active ? 'Active' : 'Inactive'}
                        readOnly={!editing}
                        variant="inline"
                        onChange={(e) => updateField('active', e.target.value === 'Active')}
                        readOnlyContent={
                          displayProject?.active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="danger">Inactive</Badge>
                          )
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </SelectField>
                    </TableCell>
                    <TableCell>
                      <SelectField 
                        id={`productionStatus-${project.id}`}
                        ariaLabel="Production Status"
                        value={displayProject?.productionStatus ?? ''}
                        onChange={(e) => updateField('productionStatus', e.target.value as ProductionStatus)}
                        readOnly={!editing}
                        variant="inline"
                        readOnlyContent={
                          <div className={PRODUCTION_STATUS_COLOURS[project.productionStatus] + "w-fit whitespace-nowrap rounded-full px-2 py-1 text-center text-xs font-bold"}>
                            {PRODUCTION_STATUS_LABELS[project.productionStatus]}
                          </div>
                        }
                      >
                        {PRODUCTION_STATUSES.map((option: ProductionStatus) => (
                          <option key={option} value={option}>
                            {PRODUCTION_STATUS_LABELS[option]}
                          </option>
                        ))}
                      </SelectField>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <EditDelete
                          isEditing={isEditing(project)}
                          onEdit={() => startEditing(project)}
                          onCancelEdit={handleCancel}
                          onSave={handleSave}               
                        />
                      </TableCell>
                    )}
                  </TableRow>
              )})}
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
