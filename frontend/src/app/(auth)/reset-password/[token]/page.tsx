// ============================================
// Reset Password Page with Token params
// ============================================
'use client';

import { useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { Loader2, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type ResetFormInput = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormInput>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormInput) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        token,
        newPassword: data.password,
      });
      toast.success('Password updated successfully. You can now login.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Token is invalid or has expired');
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
          className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-400"
          style={{
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <RefreshCw className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans mt-2">
          Update your password
        </h2>
        <p className="text-xs text-zinc-500 font-sans">
          Create a strong, unique password for your ColdConnect account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="input-field pl-10"
            />
          </div>
          {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="input-field pl-10"
            />
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 mt-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>

        <Link href="/login" className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 font-sans font-bold text-center mt-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel and Sign In</span>
        </Link>
      </form>
    </div>
  );
}
