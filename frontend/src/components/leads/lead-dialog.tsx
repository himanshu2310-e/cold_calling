// ============================================
// Create & Edit Lead Dialog
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LEAD_SOURCES, INDUSTRIES } from '@/constants';
import type { ILead, IUser } from '@/types';
import leadService from '@/services/lead.service';
import userService from '@/services/user.service';
import DuplicateWarningDialog from './duplicate-warning-dialog';

const leadFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(5, 'Phone number must be at least 5 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  company: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  leadSource: z.string().optional(),
  assignedTo: z.string().min(1, 'Assigned agent is required'),
  status: z.enum([
    'not_called', 'called', 'interested', 'callback',
    'follow_up', 'converted', 'invalid_number', 'duplicate',
  ]),
  priority: z.enum(['hot', 'warm', 'cold', 'vip', 'high', 'medium', 'low']),
  description: z.string().optional(),
  tagsInput: z.string().optional(),
});

type LeadFormInput = z.infer<typeof leadFormSchema>;

interface LeadDialogProps {
  lead?: ILead | null; // Null means create, Lead means edit
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
  currentUserId: string;
}

export default function LeadDialog({
  lead,
  isOpen,
  onClose,
  onSuccess,
  isAdmin,
  currentUserId,
}: LeadDialogProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate Check state
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [formDataToSubmit, setFormDataToSubmit] = useState<LeadFormInput | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      company: '',
      industry: '',
      website: '',
      linkedin: '',
      city: '',
      state: '',
      country: '',
      leadSource: '',
      assignedTo: '',
      status: 'not_called',
      priority: 'medium',
      description: '',
      tagsInput: '',
    },
  });

  // Load agents
  useEffect(() => {
    if (isOpen) {
      userService.getUsers()
        .then((res) => setUsers(res.data || []))
        .catch(console.error);
    }
  }, [isOpen]);

  // Set default values when editing
  useEffect(() => {
    if (isOpen) {
      if (lead) {
        reset({
          fullName: lead.fullName,
          phone: lead.phone,
          email: lead.email || '',
          company: lead.company || '',
          industry: lead.industry || '',
          website: lead.website || '',
          linkedin: lead.linkedin || '',
          city: lead.city || '',
          state: lead.state || '',
          country: lead.country || '',
          leadSource: lead.leadSource || '',
          assignedTo: typeof lead.assignedTo === 'object' ? lead.assignedTo._id : lead.assignedTo || '',
          status: lead.status,
          priority: lead.priority,
          description: lead.description || '',
          tagsInput: lead.tags?.join(', ') || '',
        });
      } else {
        reset({
          fullName: '',
          phone: '',
          email: '',
          company: '',
          industry: '',
          website: '',
          linkedin: '',
          city: '',
          state: '',
          country: '',
          leadSource: LEAD_SOURCES[0],
          assignedTo: isAdmin ? '' : currentUserId,
          status: 'not_called',
          priority: 'medium',
          description: '',
          tagsInput: '',
        });
      }
      setDuplicateWarning(null);
      setFormDataToSubmit(null);
    }
  }, [isOpen, lead, reset, isAdmin, currentUserId]);

  const onSubmit = async (data: LeadFormInput) => {
    // If creating, check for duplicate name/phone
    if (!lead && !formDataToSubmit) {
      try {
        const dupCheck = await leadService.checkDuplicate(data.fullName, data.phone);
        if (dupCheck.data.isDuplicate) {
          setFormDataToSubmit(data);
          setDuplicateWarning(dupCheck.data);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    await saveLead(data);
  };

  const saveLead = async (data: LeadFormInput) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      tags: data.tagsInput
        ? data.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      if (lead) {
        await leadService.updateLead(lead._id, payload);
        toast.success('Lead updated successfully');
      } else {
        await leadService.createLead(payload);
        toast.success('Lead created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save lead record');
    } finally {
      setIsSubmitting(false);
      setDuplicateWarning(null);
      setFormDataToSubmit(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#0B0B0F]/70 backdrop-blur-md flex items-center justify-center p-4">
        <div
          className="w-full max-w-[640px] rounded-2xl border flex flex-col max-h-[90vh] overflow-hidden"
          style={{ background: '#171717', borderColor: '#27272A' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              {lead ? 'Edit Lead Profile' : 'Add New Lead'}
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Fox"
                  {...register('fullName')}
                  className="input-field"
                />
                {errors.fullName && <p className="text-[10px] text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 123-4567"
                  {...register('phone')}
                  className="input-field"
                />
                {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. robert@company.com"
                  {...register('email')}
                  className="input-field"
                />
                {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  {...register('company')}
                  className="input-field"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Industry</label>
                <select {...register('industry')} className="input-field">
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Source</label>
                <select {...register('leadSource')} className="input-field">
                  <option value="">Select Source</option>
                  {LEAD_SOURCES.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">City</label>
                <input type="text" placeholder="City" {...register('city')} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">State</label>
                <input type="text" placeholder="State" {...register('state')} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Country</label>
                <input type="text" placeholder="Country" {...register('country')} className="input-field" />
              </div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Website</label>
                <input type="text" placeholder="https://..." {...register('website')} className="input-field" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">LinkedIn URL</label>
                <input type="text" placeholder="https://linkedin.com/in/..." {...register('linkedin')} className="input-field" />
              </div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Status</label>
                <select {...register('status')} className="input-field">
                  <option value="not_called">Not Called</option>
                  <option value="called">Called</option>
                  <option value="interested">Interested</option>
                  <option value="callback">Callback</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="converted">Converted</option>
                  <option value="invalid_number">Invalid Number</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Priority</label>
                <select {...register('priority')} className="input-field">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Assign Agent</label>
                <select {...register('assignedTo')} className="input-field" disabled={!isAdmin}>
                  <option value="">Select Agent</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                {errors.assignedTo && <p className="text-[10px] text-red-500">{errors.assignedTo.message}</p>}
              </div>
            </div>

            {/* Row 7 */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Type lead description, context, or special requirements here..."
                  rows={2}
                  {...register('description')}
                  className="input-field py-2.5 resize-none text-xs"
                />
              </div>
            </div>

            {/* Row 8 */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="sales, referral, tech"
                {...register('tagsInput')}
                className="input-field"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-1.5 cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Lead</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate warning confirmation dialog overlay */}
      {duplicateWarning && (
        <DuplicateWarningDialog
          duplicate={duplicateWarning}
          onCancel={() => {
            setDuplicateWarning(null);
            setFormDataToSubmit(null);
          }}
          onConfirm={() => {
            if (formDataToSubmit) {
              saveLead(formDataToSubmit);
            }
          }}
        />
      )}
    </>
  );
}
