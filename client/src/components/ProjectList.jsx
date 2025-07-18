import React from 'react';

function ProjectList({ projects, onSelectProject, onDeleteProject, selectedProjectId }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Projects</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {projects.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No projects yet. Create your first project to get started.
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                selectedProjectId === project.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelectProject(project)}
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-500">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectList;