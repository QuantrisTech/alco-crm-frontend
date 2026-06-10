"use client"
import React from 'react'
import PageHeader from '@/app/component/dashboard/page-header'
import ProtectedRoute from '@/app/component/protected-route'
import { Award } from 'lucide-react'

export default function Certifications() {
  return (
    <ProtectedRoute>
      {/* Header */}
      <PageHeader
        title="Certifications"
        subtitle="Manage all certifications"
        titleIcon={<Award size={24} />}
        totalCount={6}
      // onAdd={() => setIsAddOpen(true)}
      // onDeleteAll={() => setShowDeleteAll(true)}
      />
    </ProtectedRoute>
  )
}
