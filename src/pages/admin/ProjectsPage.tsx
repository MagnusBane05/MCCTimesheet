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

export function ProjectsPage() {
  const [ projects, setProjects ] = useState<Project[]>([]);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(false);
  const [ saveError, setSaveError ] = useState(false);
  const [ filter, setFilter ] = useState<'active' | 'inactive' | 'all'>('active');

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
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === 'active') return project.active;
    if (filter === 'inactive') return !project.active;
    return true; // 'all'
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
          <Button variant="primary" onClick={() => { /* TODO: Open create project modal */ }}>+ Create Project</Button>
        </div>
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
                <TableHeader/>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-navy-950/50">
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
                    {isEditing(project) ? (
                      <Select
                        value={editingProject?.active ? 'Active' : 'Inactive'}
                        variant="inline"
                        onChange={(e) => updateField('active', e.target.value === 'Active')}
                        className="rounded-full px-0 py-0"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </Select>
                    ) : (
                      project.active ? (
                        <div className="bg-green-100 text-green-700 rounded-full font-bold text-xs text-center py-1 px-2 w-min">Active</div>
                      ) : (
                        <div className="bg-red-100 text-red-700 rounded-full font-bold text-xs text-center py-1 px-2 w-min">Inactive</div>
                      )
                    )}
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
                  <TableCell>
                    <EditDelete
                      isEditing={isEditing(project)}
                      onEdit={() => startEditing(project)}
                      onCancelEdit={cancelEditing}
                      onSave={handleSave}               
                    />
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
