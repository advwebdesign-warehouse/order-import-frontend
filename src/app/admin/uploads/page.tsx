//file path: app/admin/uploads/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Trash2, Download, Eye, RefreshCw, FolderOpen } from 'lucide-react'
import { UploadAPI } from '@/app/services/uploadApi'

interface FileInfo {
  filename: string
  uploadType: string
  size: number
  sizeFormatted: string
  createdAt: string
  modifiedAt: string
  url: string
}

interface FileStats {
  totalFiles: number
  totalSize: number
  totalSizeFormatted: string
}

export default function UploadsAdminPage() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [stats, setStats] = useState<FileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const data = await UploadAPI.listFiles()
      setFiles(data.files)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching files:', error)
      alert('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Delete ${file.filename}?`)) return

    try {
      await UploadAPI.deleteFile(file.filename, file.uploadType as any)
      fetchFiles() // Refresh list
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesFilter = filter === 'all' || file.uploadType === filter
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const groupedByType = filteredFiles.reduce((acc, file) => {
    if (!acc[file.uploadType]) acc[file.uploadType] = []
    acc[file.uploadType].push(file)
    return acc
  }, {} as Record<string, FileInfo[]>)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Upload Manager</h1>
            </div>
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Size</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSizeFormatted}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Volume Path</p>
                <p className="text-sm font-mono text-gray-700 mt-2">/app/public/uploads</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Types</option>
                <option value="logos">Logos</option>
                <option value="products">Products</option>
                <option value="documents">Documents</option>
                <option value="temp">Temporary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByType).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No files found</p>
              </div>
            ) : (
              Object.entries(groupedByType).map(([type, typeFiles]) => (
                <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">
                      {type} <span className="text-gray-500 font-normal">({typeFiles.length})</span>
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Filename
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {typeFiles.map((file) => (
                          <tr key={file.filename} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-gray-900">{file.filename}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {file.sizeFormatted}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(file.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={file.url}
                                  download
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleDelete(file)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
