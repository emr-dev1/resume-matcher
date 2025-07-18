const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async get(endpoint) {
    const response = await this.request(endpoint);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async postFormData(endpoint, formData) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Project endpoints
  async createProject(name) {
    return this.post('/api/projects', { name });
  }

  async listProjects() {
    return this.get('/api/projects');
  }

  async getProject(id) {
    return this.get(`/api/projects/${id}`);
  }

  async deleteProject(id) {
    return this.delete(`/api/projects/${id}`);
  }

  // Upload endpoints
  async uploadPositions(projectId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.postFormData(`/api/projects/${projectId}/positions`, formData);
  }

  async confirmPositions(projectId, file, embeddingColumns, outputColumns) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('embedding_columns', JSON.stringify(embeddingColumns));
    formData.append('output_columns', JSON.stringify(outputColumns));
    return this.postFormData(`/api/projects/${projectId}/positions/confirm`, formData);
  }

  async uploadResumes(projectId, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.postFormData(`/api/projects/${projectId}/resumes`, formData);
  }

  async getPositionColumns(projectId) {
    return this.get(`/api/projects/${projectId}/columns`);
  }

  // Processing endpoints
  async startProcessing(projectId) {
    return this.post(`/api/projects/${projectId}/process`, {});
  }

  async getJobStatus(jobId) {
    return this.get(`/api/jobs/${jobId}/status`);
  }

  // Results endpoints
  async getProjectMatches(projectId, positionId = null, limit = 100, offset = 0) {
    let url = `/api/projects/${projectId}/matches?limit=${limit}&offset=${offset}`;
    if (positionId) {
      url += `&position_id=${positionId}`;
    }
    return this.get(url);
  }

  async getMatchDetails(matchId) {
    return this.get(`/api/matches/${matchId}`);
  }

  // Get positions for a project
  async getPositions(projectId) {
    return this.get(`/api/projects/${projectId}/positions`);
  }

  // Get resumes for a project
  async getResumes(projectId) {
    return this.get(`/api/projects/${projectId}/resumes`);
  }

  async exportResults(projectId, format = 'csv') {
    const response = await this.request(`/api/projects/${projectId}/export?format=${format}`);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matches_project_${projectId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default new ApiClient();