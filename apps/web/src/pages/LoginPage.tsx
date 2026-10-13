import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiFetch } from '../lib/api';
import { SafeUser } from '@wb-sso/types';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLoginSuccess: (user: SafeUser) => void;
}

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username, email or mobile is required'),
  password: z.string().optional(),
  otpCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [useOtp, setUseOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      otpCode: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      if (useOtp) {
        const res = await apiFetch<{ user: SafeUser }>('auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({
            identifier: values.identifier,
            code: values.otpCode || '123456',
          }),
        });
        onLoginSuccess(res.user);
      } else {
        const res = await apiFetch<{ user: SafeUser }>('auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: values.identifier,
            password: values.password,
          }),
        });
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setServerError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] dark:from-[#070D18] dark:via-[#0B1528] dark:to-[#070E1B] transition-colors duration-300">
      {/* Subtle Geometric & Ambient Backdrops */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF9933]/15 to-amber-400/5 dark:from-[#FF9933]/10 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-gradient-to-bl from-[#138808]/15 to-emerald-400/5 dark:from-[#138808]/10 dark:to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md sm:max-w-lg relative z-10"
      >
        {/* Unified Authentication Card */}
        <div
          id="login-form-card"
          className="bg-white/95 dark:bg-[#0F1D35]/95 backdrop-blur-xl border border-gray-200/90 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(11,37,69,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(11,37,69,0.12)] dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
        >
          {/* Top Tricolor Accent Bar */}
          <div className="w-full h-1.5 flex">
            <div className="w-1/3 bg-[#FF9933]" />
            <div className="w-1/3 bg-[#FFFFFF] border-y border-gray-200 dark:border-slate-700" />
            <div className="w-1/3 bg-[#138808]" />
          </div>

          <div className="p-6 sm:p-8 md:p-9">
            {/* Seal & Department Branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-orange-50 to-white dark:from-slate-800 dark:to-slate-900 border border-orange-200/80 dark:border-slate-700 shadow-xs mb-3.5">
                <img
                  src="/wb.png"
                  alt="State Emblem of India"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-xs dark:brightness-110"
                />
              </div>

              <h2 className="text-lg sm:text-xl font-black text-[#0B2545] dark:text-white tracking-tight uppercase leading-tight font-sans transition-colors duration-200">
                DIRECTORATE OF FACTORIES
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#134074] dark:text-sky-300 mt-0.5 transition-colors duration-200">
                Labour Department, Government of West Bengal
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700 transition-colors duration-200">
                <ShieldCheck size={13} className="text-[#138808] dark:text-emerald-400" />
                <span>Single Sign-On Authentication Gateway</span>
              </div>
            </div>

            {/* Error Notice */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                role="alert"
                className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="leading-snug">
                  <strong className="block font-bold">Authentication Failed</strong>
                  <span>{serverError}</span>
                </div>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username / Mobile / Email Field */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider mb-1.5 transition-colors"
                >
                  {t('usernameOrMobile')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    {...register('identifier')}
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/70 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition"
                    placeholder="Enter registered username or mobile number"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password Mode vs OTP Mode */}
              {!useOtp ? (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider transition-colors"
                    >
                      {t('password')} <span className="text-red-500">*</span>
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password reset instructions will be sent to your registered mobile and email.');
                      }}
                      className="text-xs font-bold text-[#D34D09] dark:text-amber-400 hover:underline transition-colors"
                    >
                      {t('forgotPassword')}
                    </a>
                  </div>

                  {/* Password Input with Leading Lock and Eye Toggle */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password')}
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/70 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition"
                      placeholder="Enter your account password"
                    />
                    {/* View Eye Password Toggle Button */}
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-slate-400 hover:text-[#D34D09] dark:hover:text-amber-400 transition focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'View password'}
                      aria-label={showPassword ? 'Hide password' : 'View password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="otpCode"
                    className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider mb-1.5 transition-colors"
                  >
                    {t('otpCode')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                      <KeyRound size={16} />
                    </div>
                    <input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      {...register('otpCode')}
                      defaultValue="123456"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/70 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition"
                      placeholder="123456"
                    />
                  </div>
                  <p className="text-[11px] text-[#138A36] dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>{t('devOtpNote')}</span>
                  </p>
                </div>
              )}

              {/* OTP Toggle Option */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setUseOtp(!useOtp)}
                  className="text-xs font-bold text-[#D34D09] dark:text-amber-400 hover:text-[#B03C0D] dark:hover:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <KeyRound size={13} />
                  <span>
                    {useOtp ? 'Switch to Password Sign In' : 'Sign in using One-Time Password (OTP)'}
                  </span>
                </button>
              </div>

              {/* Sign In Submission Button with Animated Physics */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-5 rounded-xl bg-gradient-to-r from-[#FF7A00] via-[#FF8C1A] to-[#E65100] hover:from-[#FF8C1A] hover:to-[#D84315] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{t('signingIn')}</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to Unified Portal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security Guarantee & Helpline Details */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800 space-y-2 text-center transition-colors">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                <ShieldCheck size={14} className="text-[#138808] dark:text-emerald-400" />
                <span>256-Bit SSL Encrypted • State Cyber Security Standard</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#57534E] dark:text-slate-400">
                <HelpCircle size={14} className="text-[#D34D09] dark:text-amber-400" />
                <span>Toll-Free Technical Helpline: <strong className="text-gray-800 dark:text-slate-200">1800-103-0009</strong></span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
