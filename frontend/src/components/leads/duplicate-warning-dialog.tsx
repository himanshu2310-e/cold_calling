// ============================================
// Duplicate Warning Modal Overlay
// ============================================
'use client';

import { AlertTriangle, X } from 'lucide-react';
import type { ILead } from '@/types';

interface DuplicateWarningProps {
  duplicate: {
    message: string;
    lead: ILead;
  };
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DuplicateWarningDialog({
  duplicate,
  onCancel,
  onConfirm,
}: DuplicateWarningProps) {
  const lead = duplicate.lead;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-[480px] rounded-2xl border p-6 space-y-6"
        style={{ background: '#171717', borderColor: '#EF4444' }}
      >
        {/* Title row */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              Potential Duplicate Detected
            </h3>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              A lead with the same name or phone number already exists in your database.
            </p>
          </div>
        </div>

        {/* Existing lead data box */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#121216] space-y-2.5 text-xs">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Existing Record</span>
          <div className="space-y-1 text-zinc-300">
            <p className="font-bold text-white">{lead.fullName}</p>
            <p className="font-mono text-zinc-400">{lead.phone}</p>
            {lead.email && <p className="text-zinc-500">{lead.email}</p>}
            {lead.company && <p className="text-zinc-500">{lead.company}</p>}
          </div>
        </div>

        {/* Action button row */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary cursor-pointer"
            style={{ background: '#EF4444' }}
          >
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
