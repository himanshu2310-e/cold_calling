// ============================================
// Login Page with High-Fidelity Physics-Smooth Animations (Clerk / Vercel style)
// ============================================
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lag-free mouse-following coordinate tracking with MotionValues
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth springs interpolation for 60fps cursor spotlight following
  const springX = useSpring(mouseX, { stiffness: 140, damping: 24, restDelta: 0.001 });
  const springY = useSpring(mouseY, { stiffness: 140, damping: 24, restDelta: 0.001 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    // Offset coordinates relative to center of the 300px spotlight div
    mouseX.set(e.clientX - rect.left - 150);
    mouseY.set(e.clientY - rect.top - 150);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);
    try {
      const user = await login(data);
      toast.success('Logged in successfully');
      setIsSuccess(true);
      // Wait for exit transition (300ms) before changing page route
      setTimeout(() => {
        const isAdmin = user.role === 'admin' || user.role === 'manager';
        router.push(isAdmin ? '/admin/dashboard' : '/agent/dashboard');
      }, 300);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={isSuccess ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 50px 0 rgba(59, 130, 246, 0.08)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6 px-8 py-10 rounded-[28px] border backdrop-blur-[24px] relative overflow-hidden"
      style={{
        background: 'rgba(13, 15, 24, 0.75)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
      suppressHydrationWarning
    >
      {/* Lag-free mouse-following radial spotlight */}
      {isHovered && (
        <motion.div
          className="absolute pointer-events-none rounded-full blur-[80px] z-[0]"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
            x: springX,
            y: springY,
          }}
        />
      )}

      {/* Brand logo with pulse and floating animations */}
      <div className="flex flex-col items-center text-center space-y-2 relative z-10">
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <motion.img
            src="/logo.png"
            alt="CodeConnect Logo"
            animate={{
              filter: [
                'drop-shadow(0 0 8px rgba(59, 130, 246, 0.25))',
                'drop-shadow(0 0 16px rgba(59, 130, 246, 0.5))',
                'drop-shadow(0 0 8px rgba(59, 130, 246, 0.25))',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-20 h-20 object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl font-bold tracking-tight text-white font-sans mt-1"
        >
          Welcome back
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs text-zinc-500 font-sans"
        >
          Sign in to your account to continue
        </motion.p>
      </div>

      {/* Inputs form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5"
        >
          <label className="text-xs font-medium text-zinc-400 block">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/70" />
            <input
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className="w-full bg-[#0B0D14] border border-[#1E2235] text-sm text-white placeholder-zinc-600 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all duration-200 animate-placeholder"
            />
          </div>
          {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5"
        >
          <label className="text-xs font-medium text-zinc-400 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/70" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              className="w-full bg-[#0B0D14] border border-[#1E2235] text-sm text-white placeholder-zinc-600 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all duration-200 animate-placeholder"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
        </motion.div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -2, scale: 1.02, boxShadow: '0 8px 24px 0 rgba(124, 58, 237, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-full flex items-center justify-center gap-2 py-3 mt-6 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer animate-gradient relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #7C3AED, #2563EB)',
            backgroundSize: '200% 200%',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
