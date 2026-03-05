/* eslint-disable no-console */

/**
 * PUBLIC_INTERFACE
 * Minimal API client for the Task Tracker backend.
 *
 * Contract:
 * - Uses REACT_APP_API_BASE_URL as the backend base URL (e.g. http://localhost:3001).
 * - Automatically attaches Authorization: Bearer <token> when available.
 * - Throws Error on non-2xx responses with message from server when available.
 */
export class ApiClient {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getToken() {
    return localStorage.getItem('tt_token');
  }

  setToken(token) {
    if (!token) localStorage.removeItem('tt_token');
    else localStorage.setItem('tt_token', token);
  }

  async request(path, { method = 'GET', body } = {}) {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const message = data?.message || data?.error || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  // Auth
  async register(payload) {
    return this.request('/auth/register', { method: 'POST', body: payload });
  }

  async login(payload) {
    return this.request('/auth/login', { method: 'POST', body: payload });
  }

  async me() {
    return this.request('/auth/me');
  }

  // Projects
  async listProjects() {
    return this.request('/projects');
  }

  async createProject(payload) {
    return this.request('/projects', { method: 'POST', body: payload });
  }

  // Tasks
  async listTasks(projectId) {
    return this.request(`/tasks?projectId=${encodeURIComponent(projectId)}`);
  }

  async createTask(payload) {
    return this.request('/tasks', { method: 'POST', body: payload });
  }

  async updateTask(taskId, payload) {
    return this.request(`/tasks/${taskId}`, { method: 'PATCH', body: payload });
  }

  // Comments
  async listComments(taskId) {
    return this.request(`/comments?taskId=${encodeURIComponent(taskId)}`);
  }

  async createComment(payload) {
    return this.request('/comments', { method: 'POST', body: payload });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }
}

export const api = new ApiClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
});
