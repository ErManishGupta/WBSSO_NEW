import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { SafeUser } from '@wb-sso/types';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Building2,
  Flame,
  PhoneCall,
  Phone,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Card,
  Badge,
  SegmentedControl,
  PageTransition,
} from '../components/ui';

interface LoginPageProps {
  onLoginSuccess: (user: SafeUser) => void;
}

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username, email or mobile is required'),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState<'enter_mobile' | 'enter_otp'>('enter_mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // 1. Password Login Mutation (Zero Axios)
  const loginMutation = useMutation({
    mutationFn: async (payload: { identifier: string; password?: string }) => {
      return apiFetch<{ user: SafeUser }>('auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      onLoginSuccess(res.user);
    },
    onError: (err: any) => {
      setServerError(
        err.message || 'Authentication failed. Please verify your credentials.'
      );
    },
  });

  // 2. Request / Send OTP Mutation (Zero Axios)
  const sendOtpMutation = useMutation({
    mutationFn: async (mobile: string) => {
      return apiFetch<{ success: boolean; maskedMobile: string; message: string }>('auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      });
    },
    onSuccess: (res) => {
      const masked = res.maskedMobile || `XXXXXX${mobileNumber.slice(-4)}`;
      setMaskedMobile(masked);
      setOtpStep('enter_otp');
      setOtpCode('');
      setOtpTimer(30);
      setCanResendOtp(false);
      setServerError(null);
      setMobileError(null);
      setOtpError(null);
    },
    onError: (err: any) => {
      setMobileError(
        err.message || 'No registered account found for this mobile number.'
      );
    },
  });

  // 3. Verify OTP Mutation (Zero Axios)
  const verifyOtpMutation = useMutation({
    mutationFn: async (payload: { identifier: string; code: string }) => {
      return apiFetch<{ user: SafeUser }>('auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      onLoginSuccess(res.user);
    },
    onError: (err: any) => {
      setOtpError(
        err.message || 'Invalid OTP code. Please enter the valid 6-digit OTP.'
      );
    },
  });

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (authMode === 'otp' && otpStep === 'enter_otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, otpTimer]);

  const handleResendOtp = () => {
    if (!canResendOtp || sendOtpMutation.isPending) return;
    setOtpError(null);
    setServerError(null);
    sendOtpMutation.mutate(mobileNumber.trim());
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  // Password Submit
  const onPasswordSubmit = (values: LoginFormValues) => {
    setServerError(null);
    loginMutation.mutate({
      identifier: values.identifier,
      password: values.password,
    });
  };

  // OTP Step 1 Submit (Send OTP)
  const onSendOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError(null);
    setServerError(null);

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile) {
      setMobileError('Please enter your mobile number.');
      return;
    }
    if (!/^\d{10}$/.test(cleanMobile)) {
      setMobileError('Please enter a valid 10-digit mobile number (e.g. 9830000002).');
      return;
    }

    sendOtpMutation.mutate(cleanMobile);
  };

  // OTP Step 2 Submit (Verify OTP)
  const onVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setServerError(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setOtpError('OTP must be exactly 6 digits.');
      return;
    }

    verifyOtpMutation.mutate({
      identifier: mobileNumber.trim(),
      code: cleanOtp,
    });
  };

  const handleModeChange = (mode: 'password' | 'otp') => {
    setAuthMode(mode);
    setServerError(null);
    setMobileError(null);
    setOtpError(null);
    if (mode === 'otp') {
      setOtpStep('enter_mobile');
    }
  };

  return (
    <PageTransition className="flex-1 w-full min-h-[calc(100vh-100px)] flex flex-col justify-center items-center px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-12 relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] dark:from-[#070D18] dark:via-[#0B1528] dark:to-[#070E1B] transition-colors duration-300">
      {/* Decorative Ambient Aura Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-10 w-[550px] h-[550px] bg-gradient-to-br from-[#FF7A00]/15 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-[#138808]/15 via-emerald-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10">
        
        {/* Mobile Header Banner (< lg only) */}
        <div className="lg:hidden w-full text-center space-y-2 order-1 px-1">
          <div className="flex justify-center">
            <Badge variant="saffron" size="sm" pulseDot>
              Official Government Portal
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] dark:text-white tracking-tight leading-tight">
            Single Sign-On Access for State Labour Services
          </h1>
          <p className="text-xs text-[#57534E] dark:text-slate-400 max-w-md mx-auto">
            Unified digital compliance & entitlement gateway • Govt. of West Bengal
          </p>
        </div>

        {/* Primary Action: Authentication Card (Order 2 on mobile, col-span-5 on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5 order-2 lg:order-2"
        >
          <div
            id="login-form-card"
            className="bg-white/95 dark:bg-[#0F1D35]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(11,37,69,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_70px_rgba(11,37,69,0.12)]"
          >
            {/* Top Tricolour Micro Accent Ribbon */}
            <div className="w-full h-1.5 flex">
              <div className="w-1/3 bg-[#FF7A00]" />
              <div className="w-1/3 bg-[#FFFFFF] border-y border-gray-200 dark:border-slate-700" />
              <div className="w-1/3 bg-[#138808]" />
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {/* Card Title & Seal */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-black text-[#0B2545] dark:text-white tracking-tight uppercase leading-none">
                    Sign In to Portal
                  </h2>
                  <p className="text-xs text-[#57534E] dark:text-slate-400 mt-1">
                    Enter your verified government credentials
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <img src="/wb.png" alt="Emblem" className="w-full h-full object-contain filter drop-shadow-xs" />
                </div>
              </div>

              {/* Next-Gen Sliding Segmented Auth Mode Switcher */}
              <SegmentedControl
                id="auth-mode"
                className="mb-5"
                value={authMode}
                onChange={handleModeChange}
                options={[
                  {
                    value: 'password',
                    label: 'Password',
                    icon: <Lock size={13} />,
                  },
                  {
                    value: 'otp',
                    label: 'Mobile OTP',
                    icon: <KeyRound size={13} />,
                  },
                ]}
              />

              {/* Password Mode Flow */}
              {authMode === 'password' && (
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {/* Server Error Notice */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        role="alert"
                        className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                        <div>
                          <strong className="block font-bold">Authentication Failed</strong>
                          <span>{serverError}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Identifier Field */}
                  <Input
                    id="identifier"
                    label={t('usernameOrMobile')}
                    required
                    autoComplete="username"
                    leadingIcon={<User size={16} />}
                    placeholder="e.g. applicant_factory or 9830000002"
                    error={errors.identifier?.message}
                    {...register('identifier')}
                  />

                  {/* Password Field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider">
                        {t('password')} <span className="text-red-500">*</span>
                      </span>
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Password recovery link dispatched to your registered mobile and email.');
                        }}
                        className="text-xs font-bold text-[#D34D09] dark:text-amber-400 hover:underline"
                      >
                        {t('forgotPassword')}
                      </a>
                    </div>

                    <Input
                      id="password"
                      isPassword
                      autoComplete="current-password"
                      onKeyUp={handleKeyUp}
                      leadingIcon={<Lock size={16} />}
                      placeholder="Enter your account password"
                      capsLockWarning={capsLockActive}
                      error={errors.password?.message}
                      {...register('password')}
                    />
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#57534E] dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#FF7A00] focus:ring-[#FF7A00] w-4 h-4 cursor-pointer"
                      />
                      <span>Remember on this terminal</span>
                    </label>
                  </div>

                  {/* Sign In Primary Action Button */}
                  <Button
                    type="submit"
                    variant="saffron"
                    size="lg"
                    isLoading={loginMutation.isPending}
                    rightIcon={<ArrowRight size={17} />}
                    className="w-full mt-2 shadow-md hover:shadow-lg"
                  >
                    {loginMutation.isPending ? 'Authenticating...' : 'Sign In to Unified Portal'}
                  </Button>
                </form>
              )}

              {/* Mobile OTP Flow - Step 1: Ask Mobile Number */}
              {authMode === 'otp' && otpStep === 'enter_mobile' && (
                <form onSubmit={onSendOtpSubmit} className="space-y-4">
                  {/* Validation Error Banner */}
                  <AnimatePresence>
                    {mobileError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        role="alert"
                        className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                        <div>
                          <strong className="block font-bold">Mobile Verification Failed</strong>
                          <span>{mobileError}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <label htmlFor="mobile-input" className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider">
                      Registered Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex rounded-xl shadow-2xs">
                      <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold text-xs select-none">
                        🇮🇳 +91
                      </div>
                      <input
                        id="mobile-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value.replace(/\D/g, ''));
                          if (mobileError) setMobileError(null);
                        }}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full rounded-r-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-[#57534E] dark:text-slate-400 leading-normal">
                      We will dispatch a secure 6-digit OTP code to verify your registered account.
                    </p>

                    {/* Quick Demo Helper */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-orange-50/70 dark:bg-amber-950/20 border border-orange-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span>Registered Test Mobile: <strong>9830000002</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNumber('9830000002');
                          setMobileError(null);
                        }}
                        className="font-bold underline text-[#D34D09] dark:text-amber-400 hover:opacity-85 cursor-pointer"
                      >
                        Use Test Number
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="saffron"
                    size="lg"
                    isLoading={sendOtpMutation.isPending}
                    rightIcon={<ArrowRight size={17} />}
                    className="w-full mt-2 shadow-md hover:shadow-lg"
                  >
                    {sendOtpMutation.isPending ? 'Sending OTP Code...' : 'Send OTP to Mobile'}
                  </Button>
                </form>
              )}

              {/* Mobile OTP Flow - Step 2: Show XXXXXXlast4 Mobile & Ask OTP */}
              {authMode === 'otp' && otpStep === 'enter_otp' && (
                <form onSubmit={onVerifyOtpSubmit} className="space-y-4">
                  {/* Masked Mobile Dispatch Card */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50/70 dark:from-slate-900/90 dark:to-slate-800/70 border border-orange-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-slate-700 flex items-center justify-center text-[#FF7A00] shrink-0">
                        <Phone size={15} />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#57534E] dark:text-slate-400 tracking-wider">
                          OTP Sent To Mobile
                        </span>
                        <span className="text-xs font-mono font-extrabold text-[#0B2545] dark:text-white">
                          +91 {maskedMobile || `XXXXXX${mobileNumber.slice(-4)}`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('enter_mobile');
                        setOtpError(null);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D34D09] dark:text-amber-400 hover:underline px-2 py-1 rounded-lg hover:bg-orange-100/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Edit2 size={12} />
                      <span>Change</span>
                    </button>
                  </div>

                  {/* OTP Validation Error Banner */}
                  <AnimatePresence>
                    {otpError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        role="alert"
                        className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                        <div>
                          <strong className="block font-bold">Invalid OTP Code</strong>
                          <span>{otpError}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* OTP Code Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="otp-code-input" className="block text-xs font-bold text-[#1F2937] dark:text-slate-200 uppercase tracking-wider">
                        Enter 6-Digit OTP <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        disabled={!canResendOtp || sendOtpMutation.isPending}
                        onClick={handleResendOtp}
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          canResendOtp && !sendOtpMutation.isPending
                            ? 'text-[#D34D09] dark:text-amber-400 hover:underline cursor-pointer'
                            : 'text-gray-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <RotateCcw size={11} className={sendOtpMutation.isPending ? 'animate-spin' : ''} />
                        <span>{canResendOtp ? 'Resend OTP' : `Resend in ${otpTimer}s`}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="otp-code-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpCode(val);
                          if (otpError) setOtpError(null);
                        }}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-center text-xl font-mono font-bold tracking-[0.4em] text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Dev Test OTP Auto-fill */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={13} className="text-[#138808] dark:text-emerald-400" />
                        <span>Default test OTP: <strong>123456</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode('123456');
                          if (otpError) setOtpError(null);
                        }}
                        className="font-bold underline text-[#138808] dark:text-emerald-400 hover:opacity-85 cursor-pointer"
                      >
                        Auto-fill 123456
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#57534E] dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#FF7A00] focus:ring-[#FF7A00] w-4 h-4 cursor-pointer"
                      />
                      <span>Remember on this terminal</span>
                    </label>
                  </div>

                  {/* Verify OTP & Sign In Action Button */}
                  <Button
                    type="submit"
                    variant="saffron"
                    size="lg"
                    isLoading={verifyOtpMutation.isPending}
                    rightIcon={<CheckCircle2 size={17} />}
                    className="w-full mt-2 shadow-md hover:shadow-lg"
                  >
                    {verifyOtpMutation.isPending ? 'Verifying OTP Code...' : 'Verify OTP & Sign In'}
                  </Button>
                </form>
              )}

              {/* Compliance & Standard Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                  <ShieldCheck size={14} className="text-[#138808] dark:text-emerald-400" />
                  <span>256-Bit SSL Encrypted • West Bengal State Cyber Security</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary Info: Official Government Statutory & Digital Trust Showcase (Order 3 on mobile, col-span-7 on desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full lg:col-span-7 space-y-6 order-3 lg:order-1"
        >
          {/* Header Title & National Trust Emblem (Shown on lg+) */}
          <div className="hidden lg:block space-y-3">
            <Badge variant="saffron" size="md" pulseDot>
              Official Government Authentication Portal
            </Badge>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0B2545] dark:text-white tracking-tight leading-tight transition-colors">
              Single Sign-On Access for All State Labour Services
            </h1>

            <p className="text-xs sm:text-sm text-[#475467] dark:text-slate-300 leading-relaxed max-w-xl">
              Unified digital compliance and entitlement gateway for factory owners, safety managers, inspecting officers, and registered workers under the Government of West Bengal.
            </p>
          </div>

          {/* 3 Statutory Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <Card
              variant="glow"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-slate-800 border border-orange-200/80 dark:border-slate-700 text-[#FF7A00] flex items-center justify-center mb-3 shadow-2xs">
                <Building2 size={20} />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-[#0B2545] dark:text-white mb-1">
                Factories Act 1948
              </h2>
              <p className="text-[11px] text-[#57534E] dark:text-slate-400 leading-relaxed">
                Licence applications, auto-renewals & statutory annual returns.
              </p>
            </Card>

            <Card
              variant="glow"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 text-[#138808] dark:text-emerald-400 flex items-center justify-center mb-3 shadow-2xs">
                <FileCheck2 size={20} />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-[#0B2545] dark:text-white mb-1">
                Labour Welfare Schemes
              </h2>
              <p className="text-[11px] text-[#57534E] dark:text-slate-400 leading-relaxed">
                Statutory welfare disbursements & worker health security.
              </p>
            </Card>

            <Card
              variant="glow"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 text-[#D34D09] dark:text-amber-400 flex items-center justify-center mb-3 shadow-2xs">
                <Flame size={20} />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-[#0B2545] dark:text-white mb-1">
                Boiler Approvals
              </h2>
              <p className="text-[11px] text-[#57534E] dark:text-slate-400 leading-relaxed">
                Pressure vessel inspections & safety certification dossier.
              </p>
            </Card>
          </div>

          {/* Security Guarantee Ribbons */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-white/90 to-orange-50/50 dark:from-[#0F1D35]/90 dark:to-slate-900/60 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#0B2545] dark:text-slate-200 font-semibold">
              <ShieldCheck size={18} className="text-[#138808] dark:text-emerald-400 shrink-0" />
              <span>Cryptographic RS256 Tokens • Anti-Replay Security Standard</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#57534E] dark:text-slate-400">
              <PhoneCall size={14} className="text-[#FF7A00]" />
              <span>Toll-Free: <strong>1800-103-0009</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};


