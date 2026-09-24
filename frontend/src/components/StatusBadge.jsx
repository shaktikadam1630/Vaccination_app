import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
    switch (status?.toLowerCase()) {
        case 'pending':
            return (
                <span className="badge-pending">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                </span>
            );
        case 'completed':
            return (
                <span className="badge-completed">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Administered
                </span>
            );
        case 'overdue':
            return (
                <span className="badge-overdue">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Overdue
                </span>
            );
        case 'approved':
            return (
                <span className="badge-approved">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approved
                </span>
            );
        case 'rejected':
            return (
                <span className="badge-rejected">
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected
                </span>
            );
        default:
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {status || 'Unknown'}
                </span>
            );
    }
}
