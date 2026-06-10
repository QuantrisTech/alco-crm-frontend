"use client"
import React from 'react'
import PageHeader from '@/app/component/dashboard/page-header'
import ProtectedRoute from '@/app/component/protected-route'
import { Calendar } from 'lucide-react'

export default function Sessions() {
  return (
    <ProtectedRoute>
          {/* Header */}
          <PageHeader
            title="Sessions"
            subtitle="Manage all Sessions"
            titleIcon={<Calendar size={24} />}
            totalCount={6}
          // onAdd={() => setIsAddOpen(true)}
          // onDeleteAll={() => setShowDeleteAll(true)}
          />
        </ProtectedRoute>
  )
}
