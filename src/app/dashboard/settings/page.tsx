"use client"
import React from 'react'
import PageHeader from '@/app/component/dashboard/page-header'
import ProtectedRoute from '@/app/component/protected-route'
import { Settings } from 'lucide-react'

export default function Setting() {
  return (
    <ProtectedRoute>
          {/* Header */}
          <PageHeader
            title="Settings"
            subtitle="Manage system settings"
            titleIcon={<Settings size={24} />}
            totalCount={6}
          // onAdd={() => setIsAddOpen(true)}
          // onDeleteAll={() => setShowDeleteAll(true)}
          />
        </ProtectedRoute>
  )
}
