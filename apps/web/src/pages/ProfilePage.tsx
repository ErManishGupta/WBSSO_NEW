import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge } from '@wb-sso/ui';
import { SafeUser, SessionDto } from '@wb-sso/types';
import { apiFetch } from '../lib/api';
import { useUiStore } from '../store/uiStore';
import {
  Monitor,
  ShieldCheck,
  Globe,
  SunMoon,
  Type,
  Sun,
  Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfilePageProps {
  user: SafeUser;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    contrastMode,
    toggleContrast,
    textSize,
    setTextSize,
  } = useUiStore();

  const { data: sessions = [] } = useQuery<SessionDto[]>({
    queryKey: ['my-sessions'],
    queryFn: () => apiFetch<SessionDto[]>('me/sessions'),
  });

  const terminateOtherSessionsMutation = useMutation({
    mutationFn: () => apiFetch('me/sessions/others', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
      alert('All other active sessions have been terminated.');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 transition-colors duration-300"
    >
      <h1 className="text-2xl font-black text-[#0B2545] dark:text-white mb-2 transition-colors">
        Profile & Security Settings
      </h1>
      <p className="text-xs text-[#57534E] dark:text-slate-400 mb-8">
        Manage your user preferences, accessibility options, and active Single Sign-On sessions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9933] to-[#D34D09] text-white flex items-center justify-center font-extrabold text-2xl mx-auto mb-4 shadow-sm">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-center font-bold text-base text-[#101828] dark:text-white mb-1">{user.name}</h2>
          <div className="flex justify-center mb-4">
            <Badge variant="role">{user.userType}</Badge>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
            <div>
              <span className="text-[#64748B] dark:text-slate-400 block">Username</span>
              <strong className="text-[#101828] dark:text-slate-200">@{user.username}</strong>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400 block">Email</span>
              <strong className="text-[#101828] dark:text-slate-200">{user.email}</strong>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-slate-400 block">Mobile Number</span>
              <strong className="text-[#101828] dark:text-slate-200">+91 {user.mobile}</strong>
            </div>
          </div>
        </div>

        {/* Preferences & Active Sessions */}
        <div className="md:col-span-2 space-y-6">
          {/* Accessibility Settings */}
          <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-[#101828] dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#FF7A00] dark:text-[#FF8A1A]" />
              <span>Theme, Language & Accessibility</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Color Theme Preference */}
              <div className="p-3 bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-[#101828] dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  {theme === 'dark' ? <Moon size={14} className="text-sky-400" /> : <Sun size={14} className="text-amber-500" />}
                  <span>Display Theme</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant={theme === 'light' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => theme === 'dark' && toggleTheme()}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => theme === 'light' && toggleTheme()}
                  >
                    Dark
                  </Button>
                </div>
              </div>

              {/* Language Preference */}
              <div className="p-3 bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-[#101828] dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Globe size={14} className="text-[#FF7A00]" />
                  <span>Language</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant={language === 'en' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'bn' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setLanguage('bn')}
                  >
                    বাংলা
                  </Button>
                </div>
              </div>

              {/* Text Size Preference */}
              <div className="p-3 bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-[#101828] dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Type size={14} />
                  <span>Text Size</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={textSize === 'normal' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setTextSize('normal')}
                  >
                    A-
                  </Button>
                  <Button
                    variant={textSize === 'large' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setTextSize('large')}
                  >
                    A
                  </Button>
                  <Button
                    variant={textSize === 'xlarge' ? 'primary' : 'secondary'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setTextSize('xlarge')}
                  >
                    A+
                  </Button>
                </div>
              </div>

              {/* High Contrast Preference */}
              <div className="p-3 bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-[#101828] dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <SunMoon size={14} />
                  <span>High Contrast</span>
                </div>
                <Button
                  variant={contrastMode === 'high' ? 'primary' : 'secondary'}
                  size="sm"
                  className="h-8 text-xs w-full"
                  onClick={toggleContrast}
                >
                  {contrastMode === 'high' ? 'High Contrast On' : 'Standard View'}
                </Button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#101828] dark:text-white">Active Single Sign-On Sessions</h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Devices and locations with active credentials for your account.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => terminateOtherSessionsMutation.mutate()}
                className="text-xs text-[#C62828] dark:text-red-400 border-[#C62828]/40 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Sign Out Other Sessions
              </Button>
            </div>

            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-[#D9DFEA] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 flex justify-between items-center text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#D9DFEA] dark:border-slate-700 text-[#FF7A00] dark:text-amber-400">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-[#101828] dark:text-white flex items-center gap-2">
                        <span>{s.ip}</span>
                        {s.isCurrent && (
                          <Badge variant="success" size="sm">
                            Current Device
                          </Badge>
                        )}
                      </div>
                      <div className="text-[#64748B] dark:text-slate-400 text-[11px] truncate max-w-xs">
                        {s.userAgent}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[#64748B] dark:text-slate-400">
                    Established: {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
