'use client';

import React, { useState, useEffect } from 'react';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  ehs_id: string | null;
  role: string | null;
}

interface Project {
  id: string;
  name: string | null;
  client_id: string | null;
  client_sub_id: string | null;
  project_id: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface Mapping {
  id: string;
  profile_id: string;
  project_id: string;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  profile: Profile | null;
  project: Project | null;
}

interface MappingsResponse {
  mappings: Mapping[];
  total: number;
}

const UserProfileMappingPage = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState<string | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rcm/ebv/profiles-projects-mapping');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch mappings');
        }
        
        const data: MappingsResponse = await response.json();
        setMappings(data.mappings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, []);

  const handleDeleteMappings = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const response = await fetch('/api/rcm/ebv/profiles-projects-mapping', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete mappings');
      }

      setDeleteSuccess(data.message);
      
      // Refresh the mappings list
      const mappingsResponse = await fetch('/api/rcm/ebv/profiles-projects-mapping');
      if (mappingsResponse.ok) {
        const mappingsData: MappingsResponse = await mappingsResponse.json();
        setMappings(mappingsData.mappings);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleInsertMappings = async () => {
    setInsertLoading(true);
    setInsertError(null);
    setInsertSuccess(null);

    try {
      const response = await fetch('/api/rcm/ebv/profiles-projects-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to insert mappings');
      }

      setInsertSuccess(data.message);
      
      // Refresh the mappings list
      const mappingsResponse = await fetch('/api/rcm/ebv/profiles-projects-mapping');
      if (mappingsResponse.ok) {
        const mappingsData: MappingsResponse = await mappingsResponse.json();
        setMappings(mappingsData.mappings);
      }
    } catch (err) {
      setInsertError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setInsertLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'manager':
        return 'bg-red-100 text-red-800';
      case 'assistant_manager':
        return 'bg-orange-100 text-orange-800';
      case 'teamLead':
        return 'bg-blue-100 text-blue-800';
      case 'qa':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientIdBadgeColor = (clientId: string | null) => {
    if (!clientId) return 'bg-gray-100 text-gray-800';
    
    // You can customize colors based on client_id patterns
    if (clientId.startsWith('CLIENT_')) {
      return 'bg-blue-100 text-blue-800';
    } else if (clientId.startsWith('PROJ_')) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-purple-100 text-purple-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mappings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Profile - Project Mapping</h1>
              <p className="mt-2 text-gray-600">Total mappings: {mappings.length}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteMappings}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : '🗑️ Delete All Mappings'}
              </button>
              <button
                onClick={handleInsertMappings}
                disabled={insertLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {insertLoading ? 'Inserting...' : '📥 Insert Test Mappings'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Success Message */}
        {deleteSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{deleteSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Error Message */}
        {deleteError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{deleteError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Insert Success Message */}
        {insertSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{insertSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {/* Insert Error Message */}
        {insertError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{insertError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mapping.profile ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {mapping.profile.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mapping.profile.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mapping.profile.email}
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-400 mr-2">
                                {mapping.profile.ehs_id || 'N/A'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(mapping.profile.role)}`}>
                                {mapping.profile.role || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Profile not found
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mapping.project ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.project.name || 'Unnamed Project'}
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div>
                              <span className="font-medium">ID:</span> {mapping.project.project_id || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Client:</span> {mapping.project.client_id || 'N/A'}
                            </div>
                            {mapping.project.client_sub_id && (
                              <div>
                                <span className="font-medium">Sub Client:</span> {mapping.project.client_sub_id}
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClientIdBadgeColor(mapping.project.client_id)}`}>
                              {mapping.project.client_id || 'No Client'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Project not found
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.created_by ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {mapping.created_by.slice(0, 8)}...
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.updated_by ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {mapping.updated_by.slice(0, 8)}...
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(mapping.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(mapping.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {mappings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No mappings found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileMappingPage;