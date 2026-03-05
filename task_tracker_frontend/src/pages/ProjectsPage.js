import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

/**
 * PUBLIC_INTERFACE
 * Projects page:
 * - left list of projects
 * - task list for selected project
 * - modals to create project/task
 */
export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState('');

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDue, setNewTaskDue] = useState('');

  async function refreshProjects() {
    const res = await api.listProjects();
    setProjects(res.projects || []);
    if (!selectedProjectId && res.projects?.[0]?.id) setSelectedProjectId(res.projects[0].id);
  }

  async function refreshTasks(pid) {
    if (!pid) {
      setTasks([]);
      return;
    }
    const res = await api.listTasks(pid);
    setTasks(res.tasks || []);
  }

  useEffect(() => {
    let active = true;
    setErr('');
    refreshProjects().catch((e) => {
      if (active) setErr(e.message || 'Failed to load projects.');
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    setErr('');
    refreshTasks(selectedProjectId).catch((e) => {
      if (active) setErr(e.message || 'Failed to load tasks.');
    });
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await api.createProject({ name: newProjectName, description: newProjectDesc });
      setProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      await refreshProjects();
      setSelectedProjectId(res.project.id);
    } catch (e2) {
      setErr(e2.message || 'Failed to create project.');
    }
  }

  async function createTask(e) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setErr('');
    try {
      await api.createTask({
        projectId: selectedProjectId,
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        priority: newTaskPriority,
        dueDate: newTaskDue ? newTaskDue : null,
      });
      setTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDue('');
      await refreshTasks(selectedProjectId);
    } catch (e2) {
      setErr(e2.message || 'Failed to create task.');
    }
  }

  async function quickUpdateTask(task, patch) {
    setErr('');
    try {
      await api.updateTask(task.id, patch);
      await refreshTasks(selectedProjectId);
    } catch (e2) {
      setErr(e2.message || 'Failed to update task.');
    }
  }

  return (
    <div className="tt-split">
      <div className="tt-card">
        <div className="tt-row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Projects</h3>
          <button className="tt-btn primary" type="button" onClick={() => setProjectModalOpen(true)}>
            New project
          </button>
        </div>

        <div className="tt-grid" style={{ marginTop: 12 }}>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`tt-btn ${p.id === selectedProjectId ? 'primary' : ''}`}
              onClick={() => setSelectedProjectId(p.id)}
              style={{ textAlign: 'left' }}
            >
              <strong style={{ display: 'block' }}>{p.name}</strong>
              <small style={{ opacity: 0.9 }}>{p.description || '—'}</small>
            </button>
          ))}
          {projects.length === 0 ? (
            <small style={{ color: 'var(--tt-muted)' }}>No projects yet. Create one to start.</small>
          ) : null}
        </div>
      </div>

      <div className="tt-grid">
        <div className="tt-card">
          <div className="tt-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>Tasks</h3>
              <small style={{ color: 'var(--tt-muted)' }}>
                {selectedProject ? selectedProject.name : 'Select a project'}
              </small>
            </div>
            <button
              className="tt-btn primary"
              type="button"
              disabled={!selectedProjectId}
              onClick={() => setTaskModalOpen(true)}
            >
              New task
            </button>
          </div>

          {err ? <div style={{ color: 'var(--tt-danger)', marginTop: 10 }}>{err}</div> : null}

          <div className="tt-grid" style={{ marginTop: 12 }}>
            {tasks.map((t) => (
              <div key={t.id} className="tt-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{t.title}</strong>
                  <small style={{ color: 'var(--tt-muted)' }}>
                    {t.status} · {t.priority}
                    {t.due_date ? ` · due ${t.due_date}` : ''}
                  </small>
                </div>
                <div className="tt-row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <select
                    className="tt-select"
                    style={{ width: 160 }}
                    value={t.status}
                    onChange={(e) => quickUpdateTask(t, { status: e.target.value })}
                  >
                    <option value="todo">todo</option>
                    <option value="in_progress">in_progress</option>
                    <option value="blocked">blocked</option>
                    <option value="done">done</option>
                  </select>
                  <select
                    className="tt-select"
                    style={{ width: 140 }}
                    value={t.priority}
                    onChange={(e) => quickUpdateTask(t, { priority: e.target.value })}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>
            ))}
            {tasks.length === 0 ? (
              <small style={{ color: 'var(--tt-muted)' }}>No tasks for this project yet.</small>
            ) : null}
          </div>
        </div>

        <div className="tt-card">
          <h3 style={{ marginTop: 0 }}>Comments</h3>
          <small style={{ color: 'var(--tt-muted)' }}>
            Comments UI can be added per-task (API is available at /comments).
          </small>
        </div>
      </div>

      <Modal open={projectModalOpen} title="Create project" onClose={() => setProjectModalOpen(false)}>
        <form onSubmit={createProject} className="tt-grid">
          <div>
            <label className="tt-label" htmlFor="pname">
              Project name
            </label>
            <input
              id="pname"
              className="tt-input"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="tt-label" htmlFor="pdesc">
              Description
            </label>
            <textarea
              id="pdesc"
              className="tt-textarea"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              rows={3}
            />
          </div>
          <button className="tt-btn primary" type="submit">
            Create
          </button>
        </form>
      </Modal>

      <Modal open={taskModalOpen} title="Create task" onClose={() => setTaskModalOpen(false)}>
        <form onSubmit={createTask} className="tt-grid">
          <div>
            <label className="tt-label" htmlFor="ttitle">
              Title
            </label>
            <input
              id="ttitle"
              className="tt-input"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="tt-label" htmlFor="tdesc">
              Description
            </label>
            <textarea
              id="tdesc"
              className="tt-textarea"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              rows={4}
            />
          </div>
          <div className="tt-row">
            <div style={{ flex: 1 }}>
              <label className="tt-label" htmlFor="tstatus">
                Status
              </label>
              <select
                id="tstatus"
                className="tt-select"
                value={newTaskStatus}
                onChange={(e) => setNewTaskStatus(e.target.value)}
              >
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="blocked">blocked</option>
                <option value="done">done</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="tt-label" htmlFor="tpriority">
                Priority
              </label>
              <select
                id="tpriority"
                className="tt-select"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
          </div>

          <div>
            <label className="tt-label" htmlFor="tdue">
              Due date
            </label>
            <input
              id="tdue"
              className="tt-input"
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
            />
          </div>

          <button className="tt-btn primary" type="submit">
            Create
          </button>
        </form>
      </Modal>
    </div>
  );
}
