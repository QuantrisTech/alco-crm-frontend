"use client"
import React from 'react'
import PageHeader from '@/app/component/dashboard/page-header'
import ProtectedRoute from '@/app/component/protected-route'
import { UserCog } from 'lucide-react'

export default function Students() {
  return (
    <ProtectedRoute>
          {/* Header */}
          <PageHeader
            title="Students"
            subtitle="Manage all students"
            titleIcon={<UserCog size={24} />}
            totalCount={6}
          // onAdd={() => setIsAddOpen(true)}
          // onDeleteAll={() => setShowDeleteAll(true)}
          />
        </ProtectedRoute>
  )
}
