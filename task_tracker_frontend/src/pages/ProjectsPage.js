import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { createApiFlow } from '../api/flow';
import { Modal } from '../components/Modal';
import { CommentsPanel } from '../components/CommentsPanel';

/**
 * PUBLIC_INTERFACE
 * Projects page:
 * - left list of projects
 * - task list for selected project
 * - task selection + comments for selected task
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
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const [busyProjects, setBusyProjects] = useState(false);
  const [busyTasks, setBusyTasks] = useState(false);
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

  const projectsFlow = useMemo(
    () =>
      createApiFlow({
        operation: 'projects.list',
        setBusy: setBusyProjects,
        setError: setErr,
        call: () => api.listProjects(),
        onSuccess: (res) => {
          const list = res?.projects || [];
          setProjects(list);
          // Keep selection stable; if none selected, pick first.
          if (!selectedProjectId && list?.[0]?.id) setSelectedProjectId(list[0].id);
        },
      }),
    [selectedProjectId]
  );

  const tasksFlow = useMemo(
    () =>
      createApiFlow({
        operation: 'tasks.list',
        setBusy: setBusyTasks,
        setError: setErr,
        call: async () => {
          if (!selectedProjectId) return { tasks: [] };
          return api.listTasks(selectedProjectId);
        },
        onSuccess: (res) => {
          const list = res?.tasks || [];
          setTasks(list);

          // Reset selected task if it no longer exists.
          if (selectedTaskId && !list.some((t) => t.id === selectedTaskId)) {
            setSelectedTaskId('');
          }
        },
      }),
    [selectedProjectId, selectedTaskId]
  );

  useEffect(() => {
    projectsFlow.run();
  }, [projectsFlow]);

  useEffect(() => {
    setSelectedTaskId('');
    tasksFlow.run();
  }, [tasksFlow, selectedProjectId]);

  async function createProject(e) {
    e.preventDefault();
    setErr('');

    const flow = createApiFlow({
      operation: 'projects.create',
      setError: setErr,
      call: async () => api.createProject({ name: newProjectName, description: newProjectDesc }),
      onSuccess: async (res) => {
        setProjectModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        await projectsFlow.run();
        if (res?.project?.id) setSelectedProjectId(res.project.id);
      },
    });

    await flow.run();
  }

  async function createTask(e) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setErr('');

    const flow = createApiFlow({
      operation: 'tasks.create',
      setError: setErr,
      call: async () =>
        api.createTask({
          projectId: selectedProjectId,
          title: newTaskTitle,
          description: newTaskDesc,
          status: newTaskStatus,
          priority: newTaskPriority,
          dueDate: newTaskDue ? newTaskDue : null,
        }),
      onSuccess: async () => {
        setTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDue('');
        await tasksFlow.run();
      },
    });

    await flow.run();
  }

  async function quickUpdateTask(task, patch) {
    setErr('');

    const flow = createApiFlow({
      operation: 'tasks.update',
      setError: setErr,
      call: async () => api.updateTask(task.id, patch),
      onSuccess: async () => {
        await tasksFlow.run();
      },
    });

    await flow.run();
  }

  const pageBusy = busyProjects || busyTasks;

  return (
    <div className="tt-split">
      <div className="tt-card">
        <div className="tt-row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Projects</h3>
          <button className="tt-btn primary" type="button" onClick={() => setProjectModalOpen(true)}>
            New project
          </button>
        </div>

        {pageBusy ? (
          <small style={{ color: 'var(--tt-muted)', marginTop: 10, display: 'block' }}>Loading…</small>
        ) : null}
        {err ? <div style={{ color: 'var(--tt-danger)', marginTop: 10 }}>{err}</div> : null}

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
          {projects.length === 0 && !busyProjects ? (
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

          <div className="tt-grid" style={{ marginTop: 12 }}>
            {busyTasks ? <small style={{ color: 'var(--tt-muted)' }}>Loading tasks…</small> : null}

            {tasks.map((t) => (
              <div
                key={t.id}
                className="tt-row"
                style={{
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  border: '1px solid var(--tt-border)',
                  borderRadius: 12,
                  background: selectedTaskId === t.id ? 'rgba(59, 130, 246, 0.08)' : 'var(--tt-surface)',
                }}
              >
                <button
                  type="button"
                  className="tt-btn"
                  onClick={() => setSelectedTaskId(t.id)}
                  style={{
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <strong style={{ display: 'block' }}>{t.title}</strong>
                  <small style={{ color: 'var(--tt-muted)' }}>
                    {t.status} · {t.priority}
                    {t.due_date ? ` · due ${t.due_date}` : ''}
                  </small>
                </button>

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

            {tasks.length === 0 && !busyTasks ? (
              <small style={{ color: 'var(--tt-muted)' }}>No tasks for this project yet.</small>
            ) : null}
          </div>
        </div>

        <CommentsPanel taskId={selectedTaskId} />
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
