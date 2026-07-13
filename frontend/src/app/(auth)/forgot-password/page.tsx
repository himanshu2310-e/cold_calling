// ============================================
// Forgot Password Page
// ============================================
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { Loader2, Mail, ArrowLeft, Key } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormInput = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormInput>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormInput) => {
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(data);
      setIsSent(true);
      toast.success('Password reset link sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request reset. Verify your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="card w-full space-y-6"
      style={{
        background: '#171717',
        borderColor: '#27272A',
      }}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400"
          style={{
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <Key className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans mt-2">
          Reset password
        </h2>
        <p className="text-xs text-zinc-500 font-sans">
          We will send you a secure link to reset your account credentials.
        </p>
      </div>

      {isSent ? (
        <div className="text-center p-4 bg-zinc-800/10 border border-zinc-800 rounded-xl space-y-3">
          <p className="text-xs text-zinc-300 font-sans">
            Please check your inbox. If the email exists, we have sent instructions.
          </p>
          <Link href="/login" className="btn-secondary w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="admin@coldconnect.com"
                {...register('email')}
                className="input-field pl-10"
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Requesting Link...</span>
              </>
            ) : (
              <span>Request Reset Link</span>
            )}
          </button>

          <Link href="/login" className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 font-sans font-bold text-center mt-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and Sign In</span>
          </Link>
        </form>
      )}
    </div>
  );
}
