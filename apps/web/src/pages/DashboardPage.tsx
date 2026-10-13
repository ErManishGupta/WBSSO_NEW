import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardResponse, NotificationDto } from '@wb-sso/types';
import { apiFetch } from '../lib/api';
import { LinkPortalModal } from './LinkPortalModal';
import {
  ExternalLink,
  Plus,
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  Building,
  HeartHandshake,
  Store,
  Layers,
  HelpCircle,
  FileText,
  Phone,
  MoreVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<'all' | 'action'>('all');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  // 1. Fetch Entitled Dashboard Data
  const { data: dashboard, isLoading: isDashboardLoading, error: dashboardError } =
    useQuery<DashboardResponse>({
      queryKey: ['dashboard'],
      queryFn: () => apiFetch<DashboardResponse>('dashboard'),
    });

  // 2. Fetch Notifications
  const { data: notifications = [] } = useQuery<NotificationDto[]>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationDto[]>('notifications'),
  });

  // Mark notification read
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiFetch('notifications/read/all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Unlink Portal mutation
  const unlinkMutation = useMutation({
    mutationFn: (portalId: string) =>
      apiFetch(`portals/${portalId}/link`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // 3. SSO Launch Portal Action
  const handleLaunchPortal = async (portalId: string) => {
    setLaunchingId(portalId);
    try {
      const res = await apiFetch<{ launchUrl: string }>(`portals/${portalId}/launch`, {
        method: 'POST',
      });
      // Launch target portal with one-time RS256 token in new window/tab
      window.open(res.launchUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setLaunchingId(null);
    }
  };

  const getPortalIcon = (iconKey: string) => {
    switch (iconKey) {
      case 'Factory':
        return <Building size={24} className="text-[#FF7A00] dark:text-[#FF8A1A]" />;
      case 'HeartHandshake':
        return <HeartHandshake size={24} className="text-[#138A36] dark:text-emerald-400" />;
      case 'Store':
        return <Store size={24} className="text-[#B54708] dark:text-amber-400" />;
      default:
        return <Layers size={24} className="text-[#0B2545] dark:text-sky-300" />;
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 dark:bg-slate-800 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-56 bg-gray-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
            <div className="h-56 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl text-center">
          <AlertTriangle className="mx-auto text-red-600 dark:text-red-400 mb-2" size={32} />
          <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Failed to load dashboard</h2>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{(dashboardError as any)?.message || 'Please sign in again.'}</p>
        </div>
      </div>
    );
  }

  const filteredNotifications = notifications.filter((n) =>
    notificationTab === 'action' ? n.level === 'ACTION' || n.level === 'WARNING' : true
  );

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8 transition-colors duration-300"
    >
      {/* 1. Welcome & Status Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 mb-8 border border-amber-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-32 bg-orange-400/10 dark:bg-orange-400/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2545] dark:text-white transition-colors">
              {t('welcome')}, {dashboard.user.name}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/50 text-[#D34D09] dark:text-amber-300 border border-orange-200 dark:border-orange-800/60">
              {dashboard.user.userType}
            </span>
          </div>
          <div className="text-xs text-[#57534E] dark:text-slate-400 mt-1.5 flex items-center gap-2">
            <Clock size={13} className="text-[#D34D09] dark:text-amber-400" />
            <span>
              {t('lastLogin')}: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span className="font-semibold text-[#1C1917] dark:text-slate-200">Active Portals: {dashboard.stats.totalLinked}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLinkModalOpen(true)}
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-orange-300 dark:border-orange-800/80 text-[#D34D09] dark:text-amber-300 bg-white dark:bg-slate-800 hover:bg-orange-50/80 dark:hover:bg-slate-700 hover:border-[#D34D09] transition shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>{t('linkAnotherPortal')}</span>
        </button>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Entitled Portals Grid */}
        <section aria-labelledby="portals-heading" className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="portals-heading" className="text-lg font-bold text-[#0B2545] dark:text-white transition-colors">
                {t('myPortals')}
              </h2>
              <p className="text-xs text-[#57534E] dark:text-slate-400">
                {t('myPortalsSubtitle')}
              </p>
            </div>
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-950/50 text-[#D34D09] dark:text-amber-300 px-3 py-1 rounded-full border border-orange-200/60 dark:border-orange-800/50">
              {dashboard.portals.length} Linked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Active Entitlement Tiles */}
            {dashboard.portals.map((account) => {
              const isOfficer = dashboard.user.userType === 'OFFICER';
              const isLaunching = launchingId === account.portal.id;

              return (
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  key={account.id}
                  className="glass-card glass-card-hover rounded-2xl p-5 border border-amber-200/70 dark:border-slate-800 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-50/80 dark:bg-slate-800 border border-orange-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                        {getPortalIcon(account.portal.iconKey)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-emerald-950/50 text-[#138A36] dark:text-emerald-400 border border-green-200 dark:border-emerald-800/40">
                          {t('activeStatus')}
                        </span>
                        {isOfficer && (account.pendingCount || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-[#B54708] dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            {account.pendingCount} {t('pendingDossiers')}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#0B2545] dark:text-white mb-1 leading-snug line-clamp-2 transition-colors">
                      {i18n.language === 'bn' ? account.portal.nameBn : account.portal.nameEn}
                    </h3>
                    <p className="text-xs text-[#57534E] dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                      {i18n.language === 'bn' ? account.portal.descriptionBn : account.portal.descriptionEn}
                    </p>
                  </div>

                  <div>
                    <div className="bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 mb-4 text-xs shadow-2xs transition-colors">
                      <div className="text-[#8E320F] dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                        Role & Registration
                      </div>
                      <div className="font-bold text-[#1C1917] dark:text-slate-200 truncate">
                        {account.portalRole}
                      </div>
                      <div className="text-[11px] text-[#57534E] dark:text-slate-400 font-mono">
                        ID: {account.externalUserId}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isLaunching}
                        onClick={() => handleLaunchPortal(account.portal.id)}
                        className="flex-1 btn-saffron-glow font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none text-xs"
                      >
                        <span>{isLaunching ? t('opening') : t('openPortal')}</span>
                        {!isLaunching && <ExternalLink size={14} />}
                      </button>

                      <button
                        type="button"
                        title="Unlink Portal"
                        onClick={() => {
                          if (confirm(`Unlink ${account.portal.nameEn}? You can re-link anytime.`)) {
                            unlinkMutation.mutate(account.portal.id);
                          }
                        }}
                        className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Dashed "Link another portal" card */}
            <motion.button
              whileHover={{ y: -2 }}
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-900/30 hover:bg-amber-50/80 dark:hover:bg-slate-900/60 hover:border-[#D34D09] dark:hover:border-[#FF8A1A] cursor-pointer p-6 flex flex-col items-center justify-center text-center transition min-h-[220px] group focus:outline-none focus:ring-2 focus:ring-[#D34D09]"
            >
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-[#D34D09] dark:text-amber-400 group-hover:bg-[#D34D09] group-hover:text-white dark:group-hover:bg-[#FF8A1A] flex items-center justify-center mb-3 transition shadow-xs">
                <Plus size={24} />
              </div>
              <span className="text-sm font-bold text-[#1C1917] dark:text-white group-hover:text-[#D34D09] dark:group-hover:text-amber-400">
                {t('linkAnotherPortal')}
              </span>
              <p className="text-xs text-[#57534E] dark:text-slate-400 mt-1 max-w-[200px]">
                {t('linkSubtitle')}
              </p>
            </motion.button>
          </div>
        </section>

        {/* Right Column: Notifications, Quick Links & Helpline */}
        <aside aria-labelledby="notifications-heading" className="lg:col-span-4 space-y-6">
          {/* Notifications Panel */}
          <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#FF7A00] dark:text-[#FF8A1A]" />
                <h2 id="notifications-heading" className="text-sm font-bold text-[#0B2545] dark:text-white">
                  {t('notifications')}
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-[#C62828] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-[#D34D09] dark:text-amber-400 hover:underline font-semibold"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {/* Notification Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-800 text-xs mb-3">
              <button
                type="button"
                onClick={() => setNotificationTab('all')}
                className={`pb-2 px-2 font-semibold transition border-b-2 ${
                  notificationTab === 'all'
                    ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
                    : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
                }`}
              >
                {t('allTab')} ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setNotificationTab('action')}
                className={`pb-2 px-2 font-semibold transition border-b-2 ${
                  notificationTab === 'action'
                    ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
                    : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
                }`}
              >
                {t('actionNeededTab')}
              </button>
            </div>

            {/* Notification Items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredNotifications.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-slate-400 py-4 text-center">
                  {t('noNotifications')}
                </p>
              ) : (
                filteredNotifications.map((n) => {
                  const isAction = n.level === 'ACTION' || n.level === 'WARNING';
                  return (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition ${
                        n.readAt
                          ? 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 opacity-75'
                          : isAction
                          ? 'bg-[#FFFAEB] dark:bg-amber-950/30 border-[#B54708]/30 dark:border-amber-800/40'
                          : 'bg-[#F8FAFC] dark:bg-slate-850 border-orange-200/40 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <strong className="text-[#0B2545] dark:text-white font-bold line-clamp-1">
                          {i18n.language === 'bn' ? n.titleBn : n.titleEn}
                        </strong>
                        {!n.readAt && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={() => markReadMutation.mutate(n.id)}
                            className="text-[#64748B] hover:text-[#D34D09] dark:hover:text-amber-400"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[#475467] dark:text-slate-300 leading-relaxed mb-1.5">
                        {i18n.language === 'bn' ? n.bodyBn : n.bodyEn}
                      </p>
                      <div className="text-[10px] text-[#64748B] dark:text-slate-400 flex items-center justify-between">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        {n.portal && (
                          <span className="font-semibold text-[#D34D09] dark:text-amber-400">
                            {n.portal.slug}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
            <h3 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#faq"
                  className="flex items-center justify-between text-[#0B2545] dark:text-slate-200 hover:text-[#D34D09] dark:hover:text-amber-400 p-1 transition"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={15} />
                    {t('faqHelp')}
                  </span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="#manuals"
                  className="flex items-center justify-between text-[#0B2545] dark:text-slate-200 hover:text-[#D34D09] dark:hover:text-amber-400 p-1 transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={15} />
                    {t('actManuals')}
                  </span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Contact Card */}
          <div className="bg-orange-50/50 dark:bg-slate-900/60 border border-orange-200/60 dark:border-slate-800 rounded-2xl p-5 text-xs transition-colors">
            <div className="flex items-center gap-2 text-[#D34D09] dark:text-amber-400 font-bold mb-1">
              <Phone size={16} />
              <span>{t('helplineTitle')}</span>
            </div>
            <p className="text-[#475467] dark:text-slate-400 leading-relaxed mb-3">
              {t('helplineDesc')}
            </p>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400">
              Email assistance: <strong className="text-[#0B2545] dark:text-white">support.labour-wb@gov.in</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Stepper Modal for Linking Portal */}
      <LinkPortalModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
      />
    </motion.div>
  );
};
