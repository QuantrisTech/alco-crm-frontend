"use client"
import React from 'react'
import PageHeader from '@/app/component/dashboard/page-header'
import ProtectedRoute from '@/app/component/protected-route'
import { BarChart2 } from 'lucide-react'

export default function Reports() {
  return (
    <ProtectedRoute>
      {/* Header */}
      <PageHeader
        title="Reports"
        subtitle="View and manage reports"
        titleIcon={<BarChart2 size={24} />}
        totalCount={6}
      // onAdd={() => setIsAddOpen(true)}
      // onDeleteAll={() => setShowDeleteAll(true)}
      />
    </ProtectedRoute>
  )
}
