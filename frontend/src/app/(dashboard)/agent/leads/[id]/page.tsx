import { use, useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft, Phone, Mail, Building2, Globe, MapPin, Tag, Star, Edit, Trash2, Clock, FileText,
  Upload, Play, Pause, Volume2, Loader2
} from 'lucide-react';
import leadService from '@/services/lead.service';
import callService from '@/services/call.service';
import noteService from '@/services/note.service';
import { LEAD_STATUS_CONFIG, LEAD_PRIORITY_CONFIG } from '@/constants';
import type { ILead } from '@/types';
import LeadDialog from '@/components/leads/lead-dialog';
import DialerModal from '@/components/dialer/dialer-modal';
import { useAuthStore } from '@/stores/auth.store';
import { motion } from 'framer-motion';

export default function AgentLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');

  // Recording upload state
  const [uploadingCallId, setUploadingCallId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadService.getLeadById(id) });
  const { data: timelineData } = useQuery({ queryKey: ['timeline', id], queryFn: () => callService.getTimeline(id) });
  const { data: recordingsData } = useQuery({ queryKey: ['recordings', id], queryFn: () => callService.getRecordingsByLead(id) });
  const { data: notesData } = useQuery({ queryKey: ['notes', id], queryFn: () => noteService.getNotesByLead(id) });

  const lead: ILead | null = data?.data || null;
  const timeline = timelineData?.data || [];
  const recordings = recordingsData?.data || [];
  const notes = notesData?.data || [];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await noteService.createNote({ lead: id, content: newNote });
      toast.success('Note added successfully');
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent.trim()) return;

    try {
      await noteService.updateNote(noteId, editingContent);
      toast.success('Note updated successfully');
      setEditingNoteId(null);
      setEditingContent('');
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
    } catch {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteService.deleteNote(noteId);
      toast.success('Note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
    } catch {
      toast.error('Failed to delete note');
    }
  };

  if (isLoading) return <div className="p-8 max-w-[1600px] mx-auto"><div className="h-96 rounded-2xl bg-zinc-800/30 animate-pulse" /></div>;
  if (!lead) return (
    <div className="p-8 max-w-[1600px] mx-auto text-center py-20">
      <h2 className="text-lg font-bold text-white mb-2">Lead not found</h2>
      <button onClick={() => router.push('/agent/leads')} className="btn-primary cursor-pointer mt-4">Back to Leads</button>
    </div>
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setPlayingId(null);
    const handlePause = () => setPlayingId(null);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const handlePlayToggle = (rec: any) => {
    if (!audioRef.current) return;
    if (playingId === rec._id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioUrl !== rec.url) {
        setAudioUrl(rec.url);
        audioRef.current.src = rec.url;
      }
      audioRef.current.play()
        .then(() => setPlayingId(rec._id))
        .catch(() => toast.error('Failed to play audio recording'));
    }
  };

  const handleUploadClick = (callId: string) => {
    setUploadingCallId(callId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingCallId) return;

    try {
      setUploadProgress(0);
      await callService.uploadRecording(id, uploadingCallId, file, (progress) => {
        setUploadProgress(progress);
      });
      toast.success('Recording uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['recordings', id] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload recording');
    } finally {
      setUploadingCallId(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusConfig = LEAD_STATUS_CONFIG[lead.status] || { label: lead.status, color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)' };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/agent/leads')} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /><span>Back to Leads</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setDialerOpen(true)} className="btn-primary flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 text-white border-none">
            <Phone className="w-3.5 h-3.5 fill-current" /><span>Call</span>
          </button>
          <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-1.5 cursor-pointer">
            <Edit className="w-3.5 h-3.5" /><span>Edit</span>
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6" style={{ background: '#141418', borderColor: '#1E1E22' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold">{lead.fullName[0]}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{lead.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ color: statusConfig.color, background: statusConfig.bg }}>{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'notes', label: 'Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="relative px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
            style={{ color: activeTab === tab.id ? '#FFFFFF' : '#71717A' }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="leadTabAgent"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-500"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <h3 className="text-sm font-bold text-white">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { icon: Phone, label: 'Phone', value: lead.phone },
                { icon: Mail, label: 'Email', value: lead.email || '—' },
                { icon: Building2, label: 'Company', value: lead.company || '—' },
                { icon: Globe, label: 'Website', value: lead.website || '—' },
                { icon: MapPin, label: 'Location', value: [lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—' },
                { icon: Tag, label: 'Source', value: lead.leadSource || '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50">
                  <item.icon className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{item.label}</span>
                    <span className="text-zinc-300 mt-0.5 block">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <h3 className="text-sm font-bold text-white">Call Timeline</h3>
            {timeline.length === 0 ? (
              <div className="py-6 text-center"><Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" /><p className="text-xs text-zinc-500">No calls yet</p></div>
            ) : (
              <div className="space-y-2.5">
                {timeline.slice(0, 5).map((entry: any) => {
                  const callRecording = recordings.find(
                    (r: any) => r.call === entry._id || r.call?._id === entry._id
                  );

                  return (
                    <div key={entry._id} className="p-3 rounded-xl bg-zinc-900/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{entry.outcome || 'Call'}</p>

                        <div className="flex items-center gap-2">
                          {callRecording ? (
                            <button
                              onClick={() => handlePlayToggle(callRecording)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                playingId === callRecording._id
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                              }`}
                            >
                              {playingId === callRecording._id ? (
                                <>
                                  <Pause className="w-2.5 h-2.5 fill-current" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Play</span>
                                </>
                              )}
                            </button>
                          ) : uploadingCallId === entry._id ? (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-400">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              <span>{uploadProgress}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUploadClick(entry._id)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 transition-colors cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {entry.notes && <p className="text-[10px] text-zinc-500">{entry.notes}</p>}
                      <p className="text-[9px] text-zinc-600 font-mono">
                        {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d, h:mm a') : '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add Note Form */}
          <div className="rounded-2xl border p-5" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <h3 className="text-sm font-bold text-white mb-3">Add a Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                required
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type a new note here (e.g. details about caller, callback preference)..."
                className="input-field py-2.5 resize-none text-xs text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </div>
            </form>
          </div>

          {/* Notes List */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#141418', borderColor: '#1E1E22' }}>
            <h3 className="text-sm font-bold text-white mb-2">Notes History</h3>

            {notes.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-zinc-400">No notes recorded yet</h4>
                <p className="text-[10px] text-zinc-650 max-w-xs mx-auto mt-1">Keep track of key discussion points by adding notes above.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notes.map((note: any) => {
                  const author = note.createdBy || {};
                  const isAuthor = author._id === user?._id;
                  const isPrivileged = user?.role === 'admin' || user?.role === 'manager';
                  const canManage = isAuthor || isPrivileged;
                  const isEditing = editingNoteId === note._id;

                  return (
                    <div
                      key={note._id}
                      className="p-4 rounded-xl border space-y-2 hover:border-zinc-700 transition-all duration-300"
                      style={{ background: '#0D0D11', borderColor: '#1E1E22' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6.5 h-6.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[9px] font-bold">
                            {author.firstName ? author.firstName[0] : '?'}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-200">
                              {author.firstName} {author.lastName}
                              <span className="text-[8px] text-zinc-550 uppercase font-mono ml-2 border border-zinc-800 px-1 rounded bg-zinc-900/50">
                                {author.role}
                              </span>
                            </p>
                            <p className="text-[8px] text-zinc-550 font-mono mt-0.5">
                              {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                              {note.isEdited && <span className="ml-1 text-zinc-600">(edited)</span>}
                            </p>
                          </div>
                        </div>

                        {canManage && !isEditing && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingNoteId(note._id);
                                setEditingContent(note.content);
                              }}
                              className="text-[9px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                            >
                              Edit
                            </button>
                            <span className="text-zinc-700 text-[9px]">•</span>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="text-[9px] font-bold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            className="input-field py-2 resize-none text-xs text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingContent('');
                              }}
                              className="px-2.5 py-1 border rounded text-[9px] font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                              style={{ borderColor: '#1E1E22' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateNote(note._id)}
                              className="px-2.5 py-1 rounded text-[9px] font-bold text-white transition hover:opacity-90 cursor-pointer"
                              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap pt-1 font-normal">
                          {note.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <LeadDialog lead={lead} isOpen={editOpen} onClose={() => setEditOpen(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lead', id] })} isAdmin={false} currentUserId={user?._id || ''} />
      <DialerModal isOpen={dialerOpen} lead={lead} onClose={() => setDialerOpen(false)} onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ['lead', id] });
        queryClient.invalidateQueries({ queryKey: ['timeline', id] });
      }} />
      {/* Hidden input and audio components */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
