"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllLeads, getNamesPrograms } from "@/utils/api";
import PageHeader from "@/app/component/dashboard/page-header";
import { Users } from "lucide-react";
import DynamicTable from "@/app/component/dashboard/dynamic-table";
import { statusColor, leadFilterFields, defaultLeadFilters } from "../shared/constants";

export default function SEOLeads() {
    const [filters, setFilters] = useState(defaultLeadFilters);
    const [filtersPage, setFiltersPage] = useState({ page: "1", limit: "10" });

    const currentPage = Number(filtersPage.page);
    const limit = Number(filtersPage.limit);

    const { data: leadsData, isLoading, isError } = useQuery({
        queryKey: ["seo-leads", filters, filtersPage],
        queryFn: () => getAllLeads({ ...filters, ...filtersPage }).then((r) => r.data),
    });

    const { data: programs } = useQuery({
        queryKey: ["program-names"],
        queryFn: getNamesPrograms,
    });

    const programMap = Object.fromEntries((programs || []).map((p: any) => [p._id, p.name]));

    const handlePageChange = (newPage: number) => {
        setFiltersPage((prev) => ({ ...prev, page: String(newPage) }));
    };

    return (
        <>
            <PageHeader
                title="Leads" subtitle="View lead status & quality" titleIcon={<Users size={24} />}
                totalCount={leadsData?.meta?.total ?? 0}
                filters={filters} setFilters={setFilters} filterFields={leadFilterFields}
            />

            <DynamicTable
                data={leadsData?.data || []} isLoading={isLoading} isError={isError}
                currentPage={currentPage} pageSize={limit}
                totalPages={Math.ceil((leadsData?.meta?.total ?? 0) / limit)}
                onPageChange={handlePageChange}
                columns={[
                    { key: "name", label: "Name", render: (lead) => <span className="font-medium text-gray-800">{lead.first_name} {lead.last_name}</span> },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "quality", label: "Quality", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.quality)}`}>{lead.quality}</span> },
                    { key: "status", label: "Status", render: (lead) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(lead.status)}`}>{lead.status}</span> },
                    { key: "program_id", label: "Program", render: (lead) => <span>{programMap?.[lead.program_id] || "—"}</span> },
                    { key: "source", label: "Source", render: (lead) => <span className="capitalize">{lead.source || "—"}</span> },
                    {
                        key: "adSource",
                        label: "Ad Details",
                        render: (lead) => (
                            lead.adSource?.campaignName || lead.adSource?.adName ? (
                                <div className="text-xs space-y-0.5">
                                    {lead.adSource.platform && <p className="capitalize text-gray-500">{lead.adSource.platform}</p>}
                                    {lead.adSource.campaignName && <p className="font-medium text-gray-700">{lead.adSource.campaignName}</p>}
                                    {lead.adSource.adName && <p className="text-gray-400">{lead.adSource.adName}</p>}
                                    {lead.adSource.formName && <p className="text-gray-400">Form: {lead.adSource.formName}</p>}
                                </div>
                            ) : <span className="text-gray-300">—</span>
                        ),
                    },
                ]}
            />
        </>
    );
}