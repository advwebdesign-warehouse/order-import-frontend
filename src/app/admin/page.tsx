//file path: app/admin/page.tsx
'use client'

import Link from 'next/link'
import { UserPlus, FolderOpen } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Account Card */}
          <Link
            href="/admin/create-account"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
            </div>
            <p className="text-gray-600">
              Create new accounts with initial admin user and configuration.
            </p>
          </Link>

          {/* Upload Manager Card */}
          <Link
            href="/admin/uploads"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Manager</h2>
            </div>
            <p className="text-gray-600">
              View, manage, and delete uploaded files in the Railway volume.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
