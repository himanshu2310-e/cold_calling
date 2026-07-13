// ============================================
// Recordings Logs Page — Admin Dashboard
// ============================================
'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Mic, Play, Pause, Trash2, Clock, Calendar, Database,
  ChevronLeft, ChevronRight, Volume2, ShieldAlert
} from 'lucide-react';
import callService from '@/services/call.service';

export default function AdminRecordingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recording-logs', page, limit],
    queryFn: () => callService.getRecordingLogs({ page, limit }),
  });

  const recordings = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  useEffect(() => {
    // Setup audio element events
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setPlayingId(null);
    };

    const handlePause = () => {
      setPlayingId(null);
    };

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
        .then(() => {
          setPlayingId(rec._id);
        })
        .catch(() => {
          toast.error('Failed to play audio recording');
        });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording permanently?')) return;
    try {
      await callService.deleteRecording(id);
      toast.success('Recording deleted successfully');
      if (playingId === id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['recording-logs'] });
    } catch {
      toast.error('Failed to delete recording');
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Hidden native audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Call Recordings</h1>
        <p className="text-xs text-zinc-500 mt-1">Review, play, and manage agent call recordings uploaded to Cloudinary</p>
      </div>

      {/* Recordings Table */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 rounded-xl bg-zinc-800/30 animate-pulse" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/20 animate-pulse" />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <Mic className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No call recordings found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Recordings will automatically show up here once agents log calls and upload call files.
          </p>
        </div>
      ) : (
        <div 
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ background: '#141418', borderColor: '#1E1E22' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 text-zinc-500 font-bold uppercase tracking-wider" style={{ background: '#111115' }}>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Uploaded At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {recordings.map((rec: any, index: number) => {
                  const lead = rec.lead;
                  const agent = rec.agent;

                  return (
                    <motion.tr
                      key={rec._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-zinc-800/10 transition-colors"
                    >
                      {/* Lead */}
                      <td className="p-4">
                        {lead ? (
                          <Link 
                            href={`/admin/leads/${lead._id}`}
                            className="font-bold text-white hover:text-blue-400 hover:underline transition-colors block"
                          >
                            {lead.fullName}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 font-medium">Deleted Lead</span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{lead?.phone || '—'}</span>
                      </td>

                      {/* Agent */}
                      <td className="p-4 font-medium text-zinc-300">
                        {agent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              {agent.firstName[0]}
                            </div>
                            <span>{agent.firstName} {agent.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">System</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="p-4 text-zinc-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDuration(rec.duration)}</span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="p-4 text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-zinc-650" />
                          <span>{formatSize(rec.fileSize)}</span>
                        </div>
                      </td>

                      {/* Format */}
                      <td className="p-4">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[9px] uppercase tracking-wider font-bold">
                          {rec.format}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-zinc-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                          <span>{format(new Date(rec.createdAt), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handlePlayToggle(rec)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                              playingId === rec._id
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : 'bg-zinc-800/40 border-zinc-750 text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            {playingId === rec._id ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(rec._id)}
                            className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Recording"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-zinc-800/60 flex items-center justify-between text-zinc-400 text-xs">
              <div>
                Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="text-white font-medium">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="text-white font-medium">{pagination.total}</span> recordings
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-white">Page {page} of {pagination.totalPages}</span>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
