import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';
import { useTheme } from '../context/ThemeContext';
import { SafeUser } from '@wb-sso/types';
import {
  LogOut,
  Shield,
  Settings,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ui';

interface HeaderProps {
  user?: SafeUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const {
    language,
    setLanguage,
    textSize,
    setTextSize,
  } = useUiStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <header className="w-full sticky top-0 z-50 select-none transition-colors duration-300">
      {/* 1. Next-Gen Animated Flowing Indian Tricolour Micro-Line */}
      <div className="w-full h-[3px] tricolor-flow-bar shadow-xs" />

      {/* 2. Unified Modern Next-Gen Glassmorphic Bar with Animated Living Tricolour Mesh Backdrop */}
      <div className="relative w-full header-animated-mesh backdrop-blur-2xl border-b border-gray-200/70 dark:border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-3 sm:px-6 lg:px-8 py-2.5 transition-colors duration-300">

        {/* Animated Floating Tricolour Aurora Glow Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Saffron Luminous Flowing Orb (Left) */}
          <div className="absolute -top-10 left-10 w-80 h-36 bg-gradient-to-r from-[#FF7A00]/25 via-[#FFA733]/15 to-transparent rounded-full blur-2xl animate-orb-saffron pointer-events-none" />

          {/* Pearl / Sky Center Shimmering Beam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-white/40 dark:bg-sky-400/10 rounded-full blur-xl animate-orb-center pointer-events-none" />

          {/* Emerald Green Luminous Flowing Orb (Right) */}
          <div className="absolute -bottom-8 right-12 w-88 h-36 bg-gradient-to-l from-[#138808]/20 via-[#2ECC71]/15 to-transparent rounded-full blur-2xl animate-orb-green pointer-events-none" />
        </div>

        {/* Content Container (Layered above animated backdrop) */}
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4 relative z-10">

          {/* Left Brand Identity: Flag + Emblem + Directorate Typography */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 md:gap-4 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] rounded-2xl p-0.5 sm:p-1 group min-w-0 flex-1 sm:flex-initial"
          >
            {/* Realistic Animated Fluttering Indian National Flag */}
            <div className="hidden xs:flex sm:flex items-center shrink-0">
              {/* Golden Metallic Mast / Pole */}
              <div className="w-0.5 sm:w-1 h-9 sm:h-12 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 rounded-full shadow-xs flex flex-col justify-start items-center">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 -mt-1 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-xs border border-amber-600" />
              </div>

              {/* Fluttering Flag Fabric with Silk Sheen & Ashoka Chakra */}
              <div className="animate-flag-wave relative w-10 sm:w-14 h-6.5 sm:h-9 rounded-r-md overflow-hidden shadow-md -ml-0.5 border-y border-r border-black/10">
                {/* 1. Saffron Band */}
                <div className="w-full h-1/3 bg-[#FF9933]" />

                {/* 2. White Band with 24-Spoke Navy Ashoka Chakra */}
                <div className="w-full h-1/3 bg-white relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#000080]"
                    fill="currentColor"
                  >
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
                    <circle cx="50" cy="50" r="10" fill="currentColor" />
                    {/* 24 radiating spokes */}
                    {[...Array(24)].map((_, i) => (
                      <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        transform={`rotate(${i * 15} 50 50)`}
                      />
                    ))}
                  </svg>
                </div>

                {/* 3. Emerald Green Band */}
                <div className="w-full h-1/3 bg-[#138808]" />

                {/* Silk Light Ripple Sheen Overlay */}
                <div className="absolute inset-0 pointer-events-none flag-sheen-overlay" />
              </div>
            </div>

            {/* State Emblem of India (wb.png) - Always Pure White Background */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-white border border-gray-200/90 dark:border-white/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-200 shrink-0">
              <img
                src="/wb.png"
                alt="State Emblem of India"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>

            {/* Department Typography & Live Gateway Beacon */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base md:text-xl font-black text-[#0B2545] dark:text-white tracking-tight uppercase leading-tight font-sans transition-colors drop-shadow-2xs truncate">
                  LABOUR DEPARTMENT
                </h1>

                {/* Next-Gen Live Security Gateway Beacon */}
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#138808] dark:text-emerald-300 text-[10px] font-bold shadow-2xs shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Unified SSO Gateway</span>
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-[#134074] dark:text-sky-300 mt-0.5 leading-tight transition-colors truncate">
                <span className="truncate">Single Sign-On Portal</span>
                <span className="hidden sm:inline text-gray-300 dark:text-slate-600">•</span>
                <span className="hidden sm:inline text-gray-600 dark:text-slate-400 font-medium">Government of West Bengal</span>
              </div>
            </div>
          </Link>

          {/* Right Section: Compact Next-Gen Utility & User Dock */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Integrated Glass Pill Dock for Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 shadow-xs transition-colors">
              {/* 1. Modern Language Switcher Pill */}
              <div className="flex items-center rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-gray-200/60 dark:border-slate-700 shadow-2xs text-[10px] sm:text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${language === 'en'
                    ? 'bg-gradient-to-r from-[#FF7A00] to-[#E65100] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${language === 'bn'
                    ? 'bg-gradient-to-r from-[#FF7A00] to-[#E65100] text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  বাং
                </button>
              </div>

              {/* 2. Text Size Accessibility Controls */}
              <div className="hidden xl:flex items-center gap-0.5 px-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTextSize('normal')}
                  title="Normal Text Size"
                  className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${textSize === 'normal'
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
                  className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${textSize === 'large'
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
                  className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${textSize === 'xlarge'
                    ? 'text-[#FF7A00] bg-white dark:bg-slate-800 shadow-2xs font-black'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  A+
                </button>
              </div>

              {/* 3. Next-Gen Light / Dark Theme Switcher Button */}
              <ThemeToggle size="sm" className="sm:hidden" />
              <ThemeToggle size="md" className="hidden sm:flex" />
            </div>

            {/* Authenticated User Menu Dropdown (when signed in) */}
            {user && (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  id="user-menu-button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-gray-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] shadow-xs transition text-left focus:ring-2 focus:ring-[#FF7A00] cursor-pointer"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
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
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 dark:text-slate-400 ml-1 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#FF7A00]' : ''
                      }`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      role="menu"
                      className="absolute right-0 mt-2.5 w-64 bg-white/95 dark:bg-[#0F1D35]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-slate-700/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] py-2 z-50 text-xs overflow-hidden"
                    >
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/profile"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 font-semibold transition"
                        >
                          <Settings size={15} className="text-[#FF7A00]" />
                          <span>{t('myProfile')}</span>
                        </Link>

                        {user.userType === 'ADMIN' && (
                          <Link
                            to="/admin"
                            role="menuitem"
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
                          role="menuitem"
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
