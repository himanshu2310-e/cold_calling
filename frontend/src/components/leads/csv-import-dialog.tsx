// ============================================
// CSV Import Dialog Component
// ============================================
'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import leadService from '@/services/lead.service';

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportDialog({
  isOpen,
  onClose,
  onSuccess,
}: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
    } else {
      toast.error('Only CSV files are accepted');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast.error('Could not read CSV file contents');
        setIsUploading(false);
        return;
      }

      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        setIsUploading(false);
        return;
      }

      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ';' : ',';

      const parseCSVLine = (textLine: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < textLine.length; i++) {
          const char = textLine[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, '').trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, '').trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      
      const parsedLeads = lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const leadObj: any = {};
        let firstName = '';
        let lastName = '';

        headers.forEach((header, index) => {
          const val = values[index];
          if (val === undefined || val === null || val === '') return;

          // Normalize header key (e.g. "Phone Number" -> "phonenumber")
          const cleanKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (['fullname', 'name', 'leadname'].includes(cleanKey)) {
            leadObj.fullName = val;
          } else if (['firstname', 'fname', 'first'].includes(cleanKey)) {
            firstName = val;
          } else if (['lastname', 'lname', 'last'].includes(cleanKey)) {
            lastName = val;
          } else if (
            ['phone', 'telephone', 'phonenumber', 'mobile', 'contact', 'contactnumber', 'phone1', 'phone2', 'mobile1', 'mobile2'].includes(cleanKey) ||
            cleanKey.startsWith('phone') ||
            cleanKey.startsWith('mobile')
          ) {
            // Only set phone if not already populated (e.g. prioritize Phone 1 over Phone 2)
            if (!leadObj.phone) {
              leadObj.phone = val;
            }
          } else if (['email', 'emailaddress', 'email1', 'email2'].includes(cleanKey)) {
            leadObj.email = val;
          } else if (['company', 'companyname', 'organization'].includes(cleanKey)) {
            leadObj.company = val;
          } else if (['industry', 'sector'].includes(cleanKey)) {
            leadObj.industry = val;
          } else if (['website', 'site', 'url'].includes(cleanKey)) {
            leadObj.website = val;
          } else if (['source', 'leadsource', 'sourceinfo'].includes(cleanKey)) {
            leadObj.leadSource = val;
          } else if (['priority'].includes(cleanKey)) {
            leadObj.priority = val.toLowerCase();
          } else if (['city'].includes(cleanKey)) {
            leadObj.city = val;
          } else if (['state', 'region'].includes(cleanKey)) {
            leadObj.state = val;
          } else if (['country'].includes(cleanKey)) {
            leadObj.country = val;
          }
        });

        if (!leadObj.fullName && firstName) {
          leadObj.fullName = `${firstName} ${lastName}`.trim();
        }

        return leadObj;
      }).filter((l) => l.fullName && l.phone);

      try {
        const res = await leadService.importLeadsJSON(parsedLeads, duplicateAction);
        setResult(res.data);
        toast.success('CSV import completed successfully');
        onSuccess();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to process CSV file');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0B0B0F]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-[480px] rounded-2xl border p-6 space-y-6"
        style={{ background: '#171717', borderColor: '#27272A' }}
      >
        {/* Title header */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Import CSV File
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          /* Results panel */
          <div className="space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Import Summary Metrics</h4>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-800 bg-[#121216] text-xs font-mono">
              <div className="space-y-0.5 text-left">
                <span className="text-zinc-500">Processed</span>
                <p className="text-zinc-200 font-bold text-lg">{result.totalRecords || 0}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-zinc-500">Imported</span>
                <p className="text-green-400 font-bold text-lg">{result.createdCount || 0}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-zinc-500">Updated</span>
                <p className="text-blue-400 font-bold text-lg">{result.updatedCount || 0}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-zinc-500">Duplicates Skipped</span>
                <p className="text-zinc-400 font-bold text-lg">{result.skippedCount || 0}</p>
              </div>
            </div>

            <button onClick={onClose} className="btn-secondary w-full py-2 cursor-pointer">
              Close Dialog
            </button>
          </div>
        ) : (
          /* Drag and drop view */
          <div className="space-y-5">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#27272A] rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 bg-[#121216]/50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />

              {file ? (
                <>
                  <FileText className="w-10 h-10 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[280px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-zinc-600" />
                  <div>
                    <p className="text-xs font-bold text-white">Drag & drop CSV file or click to browse</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Only .csv spreadsheets up to 10MB are accepted</p>
                  </div>
                </>
              )}
            </div>

            {/* Select duplicate parsing action */}
            {file && (
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Duplicate Lead Rules</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDuplicateAction('skip')}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition-colors cursor-pointer ${
                      duplicateAction === 'skip'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-zinc-800 bg-[#121216] text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Skip Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateAction('overwrite')}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition-colors cursor-pointer ${
                      duplicateAction === 'overwrite'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-zinc-800 bg-[#121216] text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Overwrite Info
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              {file && (
                <button onClick={handleRemoveFile} className="btn-secondary mr-auto">
                  Clear
                </button>
              )}
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn-primary flex items-center gap-1.5 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Upload Spreadsheet</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
