import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';
import { SafeUser } from '@wb-sso/types';
import {
  LogOut,
  Shield,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  user?: SafeUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    textSize,
    setTextSize,
  } = useUiStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50 select-none transition-colors duration-300">
      {/* 1. Precision Indian Tricolour Micro-Accent Line */}
      <div className="w-full h-[2.5px] bg-gradient-to-r from-[#FF7A00] via-[#FFFFFF] dark:via-slate-600 to-[#138808]" />

      {/* 2. Unified Modern Next-Gen Glassmorphic Bar */}
      <div className="w-full bg-white/90 dark:bg-[#070E1B]/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left Brand Identity: Clean, Authoritative, Next-Gen Government Identity */}
          <Link
            to="/"
            className="flex items-center gap-3.5 sm:gap-4 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] rounded-2xl p-1 group shrink-0"
          >
            {/* Luminous State Emblem Frame */}
            <div className="relative">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200/90 dark:border-slate-700/80 p-1 flex items-center justify-center shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                <img
                  src="/wb.png"
                  alt="State Emblem of India"
                  className="w-full h-full object-contain filter drop-shadow-xs dark:brightness-110"
                />
              </div>
              {/* Subtle Tricolor Dot Indicator */}
              <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-0.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              </div>
            </div>

            {/* Next-Gen Typography Hierarchy */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-[#0B2545] dark:text-white tracking-tight leading-none uppercase font-sans transition-colors">
                  DIRECTORATE OF FACTORIES
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-[#D34D09] dark:text-amber-300 text-[10px] font-bold">
                  <Sparkles size={10} />
                  <span>SSO Gateway</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#134074] dark:text-sky-300 mt-1 leading-tight transition-colors">
                <span>Labour Department</span>
                <span className="text-gray-300 dark:text-slate-600">•</span>
                <span className="text-gray-600 dark:text-slate-400 font-medium">Government of West Bengal</span>
              </div>
            </div>
          </Link>

          {/* Right Section: Compact Next-Gen Utility & User Dock */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Modern Glass Pill Controls Group */}
            <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-1 shadow-inner transition-colors">
              {/* 1. Language Pill Switcher */}
              <div className="flex items-center rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-gray-200/60 dark:border-slate-700 shadow-2xs text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    language === 'en'
                      ? 'bg-[#FF7A00] text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    language === 'bn'
                      ? 'bg-[#FF7A00] text-white shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  বাং
                </button>
              </div>

              {/* 2. Text Size Accessibility Controls */}
              <div className="hidden md:flex items-center gap-0.5 px-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTextSize('normal')}
                  title="Normal Text Size"
                  className={`px-1.5 py-0.5 rounded-md transition ${
                    textSize === 'normal'
                      ? 'text-[#FF7A00] bg-white dark:bg-slate-800 shadow-2xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('large')}
                  title="Large Text Size"
                  className={`px-1.5 py-0.5 rounded-md transition ${
                    textSize === 'large'
                      ? 'text-[#FF7A00] bg-white dark:bg-slate-800 shadow-2xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('xlarge')}
                  title="Extra Large Text Size"
                  className={`px-1.5 py-0.5 rounded-md transition ${
                    textSize === 'xlarge'
                      ? 'text-[#FF7A00] bg-white dark:bg-slate-800 shadow-2xs font-black'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  A+
                </button>
              </div>

              {/* 3. Next-Gen Light / Dark Theme Switcher Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, rotate: 180 }}
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-amber-400 hover:border-[#FF7A00] transition shadow-2xs cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} className="text-[#0B2545]" />
                )}
              </motion.button>
            </div>

            {/* Authenticated User Menu Dropdown (when signed in) */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  id="user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] shadow-xs transition text-left focus:ring-2 focus:ring-[#FF7A00] cursor-pointer"
                  aria-expanded={userMenuOpen}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#E65100] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-bold text-[#0B2545] dark:text-white leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="font-semibold text-[#FF7A00]">@{user.username}</span>
                      <span>({user.userType})</span>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 dark:text-slate-400 ml-1" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 rounded-3xl shadow-xl py-2 z-50 text-xs overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 md:hidden bg-gray-50/50 dark:bg-slate-900/50">
                        <div className="font-bold text-sm text-[#0B2545] dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">@{user.username} ({user.userType})</div>
                      </div>

                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 font-semibold transition"
                        >
                          <Settings size={15} className="text-[#FF7A00]" />
                          <span>{t('myProfile')}</span>
                        </Link>

                        {user.userType === 'ADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#FF7A00] font-bold hover:bg-orange-50 dark:hover:bg-slate-800 transition"
                          >
                            <Shield size={15} />
                            <span>{t('adminConsole')}</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-slate-800 my-1" />

                      <div className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold transition cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>{t('signOut')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
