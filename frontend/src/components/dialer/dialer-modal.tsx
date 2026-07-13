// ============================================
// Premium CRM Call Dialer Panel / Session Modal
// ============================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Phone, PhoneOff, Play, Square, Video, Shield, Calendar, Tag, ChevronDown, Check, ArrowRight } from 'lucide-react';
import callService from '@/services/call.service';
import type { ILead } from '@/types';
import { LEAD_STATUS_CONFIG, LEAD_PRIORITY_CONFIG } from '@/constants';

interface DialerModalProps {
  isOpen: boolean;
  lead: ILead;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'callback', label: 'Requested Callback' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy Line' },
  { value: 'voicemail', label: 'Left Voicemail' },
  { value: 'converted', label: 'Converted / Won' },
  { value: 'wrong_number', label: 'Wrong Number' },
];

export default function DialerModal({ isOpen, lead, onClose, onSuccess }: DialerModalProps) {
  const [session, setSession] = useState<'idle' | 'calling' | 'active' | 'logging'>('idle');
  const [callId, setCallId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');
  const [statusAfterCall, setStatusAfterCall] = useState<string>(lead.status);
  const [priorityAfterCall, setPriorityAfterCall] = useState<string>(lead.priority);
  const [nextFollowUp, setNextFollowUp] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live recording refs & state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Recording upload choice states
  const [recordingSource, setRecordingSource] = useState<'auto' | 'manual' | 'none'>('auto');
  const [manualFile, setManualFile] = useState<File | null>(null);

  // Clean timer & media stream on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Duration ticking
  useEffect(() => {
    if (session === 'active') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  const startRecording = async (activeCallId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `call-${activeCallId}.webm`, { type: 'audio/webm' });
        setRecordedFile(file);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access denied or not available:', err);
      toast.error('Microphone not detected or permission denied. Call will not be recorded.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  const handleStartCall = async () => {
    setSession('calling');
    try {
      const res = await callService.startCall(lead._id);
      const activeCallId = res.data?._id || res.data?.data?._id || null;
      setCallId(activeCallId);
      setSession('active');
      setDuration(0);
      setRecordedFile(null);
      setManualFile(null);
      setRecordingSource('auto');
      toast.success('Call session started');

      if (activeCallId) {
        startRecording(activeCallId);
      }
      
      // Trigger native device/system calling app
      window.location.href = `tel:${lead.phone}`;
    } catch (err: any) {
      setSession('idle');
      toast.error(err.response?.data?.message || 'Failed to start call session');
    }
  };

  const handleHangUp = () => {
    stopRecording();
    setSession('logging');
  };

  const handleSubmitOutcomes = async () => {
    if (!callId) {
      toast.error('No active call session found');
      return;
    }

    let fileToUpload: File | null = null;
    if (recordingSource === 'auto') {
      fileToUpload = recordedFile;
      if (!fileToUpload) {
        toast.error('No conversation recording captured. Choose manual upload or skip.');
        return;
      }
    } else if (recordingSource === 'manual') {
      fileToUpload = manualFile;
      if (!fileToUpload) {
        toast.error('Please select an audio file to upload manually.');
        return;
      }
    }

    const toastId = toast.loading('Saving call outcomes...');
    try {
      await callService.endCall(callId, {
        outcome,
        duration,
        notes,
        statusAfterCall,
        priorityAfterCall,
        nextFollowUp: nextFollowUp || undefined,
      });

      if (fileToUpload) {
        toast.loading('Uploading call recording to server...', { id: toastId });
        await callService.uploadRecording(lead._id, callId, fileToUpload);
      }

      toast.success('Call logged successfully', { id: toastId });
      setSession('idle');
      setRecordedFile(null);
      setManualFile(null);
      setRecordingSource('auto');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save call outcomes', { id: toastId });
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-[500px] rounded-3xl border overflow-hidden shadow-2xl"
        style={{ background: '#141418', borderColor: '#222226' }}
      >
        {/* Session header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{lead.fullName}</h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{lead.phone}</p>
            </div>
          </div>
          {session === 'active' && (
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider font-mono">REC</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider font-mono">Live</span>
              </div>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6">
          {session === 'idle' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Start Call Session</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                  Ready to dial? Click start call to open a live session and log outcomes automatically.
                </p>
              </div>
              <div className="flex justify-center gap-2.5 pt-2">
                <button onClick={onClose} className="btn-secondary text-xs cursor-pointer">Cancel</button>
                <button onClick={handleStartCall} className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Dialing</span>
                </button>
              </div>
            </div>
          )}

          {session === 'calling' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto animate-pulse">
                <Phone className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Initiating Call...</p>
                <p className="text-xs text-zinc-500 mt-1">Connecting to server session...</p>
              </div>
            </div>
          )}

          {session === 'active' && (
            <div className="text-center py-6 space-y-6">
              <div className="space-y-1">
                <p className="text-4xl font-bold text-white font-mono tracking-tight">{formatDuration(duration)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Duration</p>
              </div>
              <button
                onClick={handleHangUp}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white mx-auto shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}

          {session === 'logging' && (
            <div className="space-y-4">
              {/* Outcome Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Call Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="input-field"
                >
                  {OUTCOMES.map((oc) => (
                    <option key={oc.value} value={oc.value}>{oc.label}</option>
                  ))}
                </select>
              </div>

              {/* Status and Priority Updates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Status</label>
                  <select
                    value={statusAfterCall}
                    onChange={(e) => setStatusAfterCall(e.target.value)}
                    className="input-field"
                  >
                    {Object.entries(LEAD_STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Lead Priority</label>
                  <select
                    value={priorityAfterCall}
                    onChange={(e) => setPriorityAfterCall(e.target.value)}
                    className="input-field"
                  >
                    {Object.entries(LEAD_PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label} Priority</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next Follow Up (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Next Follow Up (Optional)</label>
                <input
                  type="datetime-local"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Call Recording Source Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Call Recording Upload</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!recordedFile}
                    onClick={() => setRecordingSource('auto')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recordingSource === 'auto'
                        ? 'bg-zinc-800 border-blue-500 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Auto-Recorded</span>
                    <span className="text-[8px] text-zinc-500">Live chat audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordingSource('manual')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recordingSource === 'manual'
                        ? 'bg-zinc-800 border-blue-500 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Manual File</span>
                    <span className="text-[8px] text-zinc-500">Upload from disk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordingSource('none')}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      recordingSource === 'none'
                        ? 'bg-zinc-800 border-blue-500 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Skip Upload</span>
                    <span className="text-[8px] text-zinc-500">No recording</span>
                  </button>
                </div>

                {/* File picker for manual upload */}
                {recordingSource === 'manual' && (
                  <div className="mt-2 p-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center">
                    <input
                      type="file"
                      id="manualCallAudio"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setManualFile(file);
                        if (file) toast.success(`Selected file: ${file.name}`);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="manualCallAudio" className="cursor-pointer block space-y-1 py-1">
                      <span className="text-[10px] font-bold text-blue-400 hover:text-blue-300 block">
                        {manualFile ? 'Change audio file' : 'Click to select audio file'}
                      </span>
                      <span className="text-[9px] text-zinc-500 block truncate">
                        {manualFile ? manualFile.name : 'Supports .mp3, .wav, .webm, etc.'}
                      </span>
                    </label>
                  </div>
                )}

                {/* Info about auto-recorded file */}
                {recordingSource === 'auto' && recordedFile && (
                  <p className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    Auto-recorded conversation captured successfully ({ (recordedFile.size / 1024).toFixed(1) } KB)
                  </p>
                )}
              </div>

              {/* Call Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Call Notes</label>
                <textarea
                  placeholder="Enter summary notes for this call..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field min-h-[90px] py-2.5 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setSession('active')}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Resume Call
                </button>
                <button
                  onClick={handleSubmitOutcomes}
                  className="btn-primary text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Log Outcomes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
