import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge } from '@wb-sso/ui';
import { PortalDto, AuditLogDto } from '@wb-sso/types';
import { apiFetch } from '../lib/api';
import {
  Shield,
  Layers,
  Users,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle2,
  Globe,
  Power,
  RotateCcw,
  Trash2,
  Edit3,
  KeyRound,
  Monitor,
  Cpu,
  ExternalLink,
  Activity,
  Clock,
  Eye,
  Lock,
  Terminal,
  FileCheck2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'portals' | 'accounts' | 'sessions' | 'audit' | 'security'>('portals');

  // Search & Filters
  const [portalSearch, setPortalSearch] = useState('');
  const [portalStatusFilter, setPortalStatusFilter] = useState<string>('ALL');
  const [searchAccount, setSearchAccount] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('ALL');
  const [accountPortalFilter, setAccountPortalFilter] = useState<string>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Modals state
  const [isAddPortalOpen, setIsAddPortalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<PortalDto | null>(null);
  const [isLinkAccountOpen, setIsLinkAccountOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Portal form state
  const [portalForm, setPortalForm] = useState({
    slug: '',
    nameEn: '',
    nameBn: '',
    descriptionEn: '',
    descriptionBn: '',
    iconKey: 'Layers',
    baseUrl: '',
    launchUrl: '',
    linkingMethod: 'SIGNED_TOKEN_HANDOFF',
    status: 'ACTIVE',
    allowedUserTypes: ['APPLICANT', 'OFFICER'],
    sortOrder: 1,
  });

  // Link account form state
  const [linkAccountForm, setLinkAccountForm] = useState({
    userId: '',
    portalId: '',
    externalUserId: '',
    portalRole: 'Registered Citizen / Applicant',
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 1. Fetch Executive Stats & Metrics
  const { data: stats, refetch: refetchStats } = useQuery<{
    totalPortals: number;
    activePortals: number;
    maintenancePortals: number;
    totalAccounts: number;
    activeAccounts: number;
    totalUsers: number;
    activeSessions: number;
    totalAuditLogs: number;
    todayAuditLogs: number;
    systemHealth: string;
    keyAlgorithm: string;
  }>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch('admin/stats'),
    refetchInterval: 30000,
  });

  // 2. Fetch Portals
  const { data: portals = [], refetch: refetchPortals } = useQuery<PortalDto[]>({
    queryKey: ['admin-portals'],
    queryFn: () => apiFetch<PortalDto[]>('admin/portals'),
    enabled: tab === 'portals' || isLinkAccountOpen,
  });

  // 3. Fetch Accounts
  const { data: accounts = [], refetch: refetchAccounts } = useQuery<any[]>({
    queryKey: ['admin-accounts', searchAccount, accountStatusFilter, accountPortalFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchAccount) params.append('search', searchAccount);
      if (accountStatusFilter !== 'ALL') params.append('status', accountStatusFilter);
      if (accountPortalFilter !== 'ALL') params.append('portalId', accountPortalFilter);
      return apiFetch<any[]>(`admin/accounts?${params.toString()}`);
    },
    enabled: tab === 'accounts',
  });

  // 4. Fetch Active Sessions
  const { data: sessions = [], refetch: refetchSessions, isFetching: isFetchingSessions } = useQuery<any[]>({
    queryKey: ['admin-sessions'],
    queryFn: () => apiFetch<any[]>('admin/sessions'),
    enabled: tab === 'sessions',
    refetchInterval: 15000,
  });

  // 5. Fetch Users for Linking Modal
  const { data: usersList = [] } = useQuery<any[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch<any[]>('admin/users'),
    enabled: isLinkAccountOpen,
  });

  // 6. Fetch Audit Logs
  const { data: auditData, refetch: refetchAudit } = useQuery<{ logs: AuditLogDto[]; total: number }>({
    queryKey: ['admin-audit', auditActionFilter],
    queryFn: () =>
      apiFetch<{ logs: AuditLogDto[]; total: number }>(
        `admin/audit${auditActionFilter ? `?action=${encodeURIComponent(auditActionFilter)}` : ''}`
      ),
    enabled: tab === 'audit',
  });

  // Mutations
  const createPortalMutation = useMutation({
    mutationFn: (newPortal: typeof portalForm) =>
      apiFetch('admin/portals', {
        method: 'POST',
        body: JSON.stringify(newPortal),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-portals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsAddPortalOpen(false);
      setModalError(null);
      showToast(`Department portal "${res.nameEn}" successfully registered.`);
    },
    onError: (err: any) => {
      setModalError(err.message || 'Failed to create department portal');
    },
  });

  const updatePortalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`admin/portals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-portals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setEditingPortal(null);
      showToast('Portal configuration updated successfully.');
    },
    onError: (err: any) => {
      setModalError(err.message || 'Failed to update portal');
    },
  });

  const deletePortalMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`admin/portals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-portals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast('Portal deregistered successfully from SSO gateway.');
    },
    onError: (err: any) => {
      alert(`Deletion failed: ${err.message}`);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`admin/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast('User account entitlement status updated.');
    },
  });

  const linkAccountMutation = useMutation({
    mutationFn: (payload: typeof linkAccountForm) =>
      apiFetch('admin/accounts/link', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsLinkAccountOpen(false);
      showToast('Account mapping established successfully.');
    },
    onError: (err: any) => {
      setModalError(err.message || 'Failed to map user account');
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`admin/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast('Session terminated successfully.');
    },
    onError: (err: any) => {
      alert(`Session termination failed: ${err.message}`);
    },
  });

  const handleExportCsv = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/audit/export/csv', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sso-audit-compliance-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Statutory Audit CSV exported successfully.');
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  // Filtered Portals
  const filteredPortals = portals.filter((p) => {
    const matchesSearch =
      p.nameEn.toLowerCase().includes(portalSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(portalSearch.toLowerCase()) ||
      p.nameBn.includes(portalSearch);
    const matchesStatus =
      portalStatusFilter === 'ALL' || p.status === portalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = (auditData?.logs || []).filter((log) => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actor?.username || '').toLowerCase().includes(q) ||
      (log.actor?.name || '').toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 transition-colors duration-300"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-[#138808] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 text-[#0B2545] dark:text-white">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 flex items-center justify-center text-[#FF7A00] shadow-2xs">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black m-0 tracking-tight">
                Admin Management Console
              </h1>
              <p className="text-xs text-[#57534E] dark:text-slate-400">
                Government of West Bengal • Central Single Sign-On Gateway & Federation Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stats?.systemHealth || 'OPERATIONAL'} • RS256 Active</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              refetchStats();
              if (tab === 'portals') refetchPortals();
              if (tab === 'accounts') refetchAccounts();
              if (tab === 'sessions') refetchSessions();
              if (tab === 'audit') refetchAudit();
              showToast('Data refreshed.');
            }}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Executive KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Integrated Portals
            </div>
            <div className="text-xl font-black text-[#0B2545] dark:text-white">
              {stats?.totalPortals ?? portals.length}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-slate-500">
              {stats?.activePortals ?? portals.filter((p) => p.status === 'ACTIVE').length} Active • {stats?.maintenancePortals ?? 0} Maint.
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Linked Entitlements
            </div>
            <div className="text-xl font-black text-[#0B2545] dark:text-white">
              {stats?.totalAccounts ?? accounts.length}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-slate-500">
              {stats?.activeAccounts ?? accounts.filter((a) => a.status === 'ACTIVE').length} Active mappings
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-slate-800 text-[#138808] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Monitor size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Active SSO Sessions
            </div>
            <div className="text-xl font-black text-[#0B2545] dark:text-white">
              {stats?.activeSessions ?? sessions.length}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Live terminal sessions
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-slate-800 text-[#D34D09] dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Audit Events Logged
            </div>
            <div className="text-xl font-black text-[#0B2545] dark:text-white">
              {stats?.totalAuditLogs ?? auditData?.total ?? 0}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-slate-500">
              +{stats?.todayAuditLogs ?? 0} in last 24h
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D9DFEA] dark:border-slate-800 gap-1 sm:gap-2 mb-6 overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          type="button"
          onClick={() => setTab('portals')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 ${
            tab === 'portals'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <Layers size={17} />
          <span>Department Portals ({portals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('accounts')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 ${
            tab === 'accounts'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <Users size={17} />
          <span>Accounts & Entitlements ({accounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 ${
            tab === 'sessions'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <Monitor size={17} />
          <span>Active Sessions ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 ${
            tab === 'audit'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet size={17} />
          <span>Security Audit Log ({auditData?.total ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('security')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-xs sm:text-sm transition border-b-2 ${
            tab === 'security'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <KeyRound size={17} />
          <span>Security & Keys</span>
        </button>
      </div>

      {/* TAB 1: PORTALS DIRECTORY */}
      {tab === 'portals' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#F8FAFC] dark:bg-slate-900/60">
            <div>
              <h2 className="text-sm font-bold text-[#101828] dark:text-white">Registered Department Portals</h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                Single Sign-On gateways, handoff protocols, and maintenance states.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search portal..."
                  value={portalSearch}
                  onChange={(e) => setPortalSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={portalStatusFilter}
                onChange={(e) => setPortalStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="MAINTENANCE">Maintenance Only</option>
                <option value="DISABLED">Disabled Only</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalError(null);
                  setIsAddPortalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Add Portal</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Portal Details</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Protocol</th>
                  <th className="p-3.5">Target Launch URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Allowed Roles</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredPortals.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold text-[#101828] dark:text-white">
                      <div>{p.nameEn}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-normal">{p.nameBn}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[#D34D09] dark:text-amber-400 font-semibold">{p.slug}</td>
                    <td className="p-3.5">
                      <span className="font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                        {p.linkingMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-xs">
                      {p.launchUrl}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          updatePortalMutation.mutate({ id: p.id, data: { status: e.target.value } })
                        }
                        className={`text-xs px-2 py-1 rounded-lg border font-bold cursor-pointer ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : p.status === 'MAINTENANCE'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {p.allowedUserTypes.map((type) => (
                          <span
                            key={type}
                            className="bg-orange-50 dark:bg-orange-950/40 text-[#D34D09] dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-orange-200/60 dark:border-orange-900/40"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          setModalError(null);
                          setEditingPortal(p);
                        }}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          if (confirm(`Are you sure you want to deregister ${p.nameEn}?`)) {
                            deletePortalMutation.mutate(p.id);
                          }
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS & ENTITLEMENTS */}
      {tab === 'accounts' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#F8FAFC] dark:bg-slate-900/60">
            <div>
              <h2 className="text-sm font-bold text-[#101828] dark:text-white">Citizen & Staff Entitlement Mappings</h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                Cross-department portal bindings, identity assertions and access moderation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchAccount}
                  onChange={(e) => setSearchAccount(e.target.value)}
                  placeholder="Search citizen or ID..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={accountPortalFilter}
                onChange={(e) => setAccountPortalFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Portals</option>
                {portals.map((p) => (
                  <option key={p.id} value={p.id}>{p.nameEn}</option>
                ))}
              </select>

              <select
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REVOKED">REVOKED</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalError(null);
                  setIsLinkAccountOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Link Account</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Citizen / User</th>
                  <th className="p-3.5">Department Portal</th>
                  <th className="p-3.5">External ID</th>
                  <th className="p-3.5">Portal Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="font-bold text-[#101828] dark:text-white">{acc.user.name}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                        @{acc.user.username} ({acc.user.userType}) • {acc.user.mobile}
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#D34D09] dark:text-amber-400">
                      {acc.portal.nameEn}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {acc.externalUserId}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{acc.portalRole}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          acc.status === 'ACTIVE'
                            ? 'success'
                            : acc.status === 'SUSPENDED'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {acc.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {acc.status === 'ACTIVE' ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() =>
                              updateAccountMutation.mutate({ id: acc.id, status: 'SUSPENDED' })
                            }
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() =>
                              updateAccountMutation.mutate({ id: acc.id, status: 'REVOKED' })
                            }
                          >
                            Revoke
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() =>
                            updateAccountMutation.mutate({ id: acc.id, status: 'ACTIVE' })
                          }
                        >
                          Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {tab === 'sessions' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-slate-900/60">
            <div>
              <h2 className="text-sm font-bold text-[#101828] dark:text-white">Active Terminal SSO Sessions</h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                Real-time active authenticated user sessions across the state network.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isFetchingSessions}
              onClick={() => refetchSessions()}
            >
              <RotateCcw size={14} />
              <span>Refresh Sessions</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">User Identity</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Terminal / User Agent</th>
                  <th className="p-3.5">Login Timestamp</th>
                  <th className="p-3.5">Expires</th>
                  <th className="p-3.5 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="font-bold text-[#101828] dark:text-white">{sess.user?.name}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                        @{sess.user?.username} ({sess.user?.mobile})
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="role" size="sm">{sess.user?.userType}</Badge>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{sess.ip}</td>
                    <td className="p-3.5 text-gray-500 dark:text-slate-400 truncate max-w-xs">{sess.userAgent}</td>
                    <td className="p-3.5 text-gray-500 dark:text-slate-400">
                      {new Date(sess.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 text-gray-500 dark:text-slate-400">
                      {new Date(sess.expiresAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          if (confirm(`Immediately terminate session for @${sess.user?.username}?`)) {
                            terminateSessionMutation.mutate(sess.id);
                          }
                        }}
                      >
                        <Power size={12} />
                        <span>Terminate</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT LOG */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC] dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs by IP, actor, action..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-medium"
              >
                <option value="">All Security Actions</option>
                <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
                <option value="AUTH_OTP_LOGIN_SUCCESS">AUTH_OTP_LOGIN_SUCCESS</option>
                <option value="PORTAL_LAUNCH">PORTAL_LAUNCH</option>
                <option value="PORTAL_LINK">PORTAL_LINK</option>
                <option value="PORTAL_UNLINK">PORTAL_UNLINK</option>
                <option value="ADMIN_PORTAL_CREATE">ADMIN_PORTAL_CREATE</option>
                <option value="ADMIN_PORTAL_UPDATE">ADMIN_PORTAL_UPDATE</option>
                <option value="ADMIN_ACCOUNT_SUSPENDED">ADMIN_ACCOUNT_SUSPENDED</option>
                <option value="ADMIN_ACCOUNT_REVOKED">ADMIN_ACCOUNT_REVOKED</option>
                <option value="ADMIN_SESSION_TERMINATED">ADMIN_SESSION_TERMINATED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] dark:text-slate-400">
                Total Events: {auditData?.total || 0}
              </span>
              <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                <Download size={14} />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action Code</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Client IP</th>
                  <th className="p-3.5">Forensic Metadata</th>
                  <th className="p-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-[#101828] dark:text-white">
                      {log.actor?.name || log.actorId}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#D34D09] dark:text-amber-400 font-bold border border-orange-200/60 dark:border-orange-800/40">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-slate-700 dark:text-slate-300">
                      {log.entityType} ({log.entityId.substring(0, 8)}...)
                    </td>
                    <td className="p-3.5 text-gray-500 dark:text-slate-400">{log.ip}</td>
                    <td className="p-3.5 text-gray-600 dark:text-slate-400 truncate max-w-xs font-mono text-[10px]">
                      {JSON.stringify(log.metadata)}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        <Eye size={11} />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & CRYPTOGRAPHIC KEYS */}
      {tab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#FF7A00] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0B2545] dark:text-white">RS256 Public Key</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                2048-bit RSA asymmetric cryptography with SHA-256 digital signatures for portal token exchange.
              </p>
              <div className="pt-2">
                <a
                  href="http://localhost:3000/.well-known/jwks.json"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D34D09] dark:text-amber-400 hover:underline"
                >
                  <ExternalLink size={13} />
                  <span>Inspect JWKS Public Keys</span>
                </a>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 text-[#138808] flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0B2545] dark:text-white">Anti-Replay Nonce Burn</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Tokens contain a unique JTI recorded in central state. Redeemed tokens are burnt immediately upon first arrival.
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                TTL: 60 Seconds
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center">
                <FileCheck2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-[#0B2545] dark:text-white">CERT-In Compliance</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Complies with Ministry of Electronics and IT (MeitY) guidelines for statutory audit trails and single sign-on security.
              </p>
              <Button variant="secondary" size="sm" onClick={handleExportCsv} className="mt-2 text-xs">
                <Download size={13} />
                <span>Export Audit CSV</span>
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-[#0F1D35] dark:to-slate-900 border border-orange-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-[#0B2545] dark:text-white flex items-center gap-2">
              <Terminal size={16} className="text-[#FF7A00]" />
              <span>Departmental Verification Flow</span>
            </h3>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 shadow-inner">
              <div className="text-slate-400">// Step 1: Destination portal receives redirect:</div>
              <div className="text-emerald-400">GET https://your-portal.wblabour.gov.in/sso/callback?token=&lt;RS256_JWT&gt;</div>
              <div className="text-slate-400 pt-2">// Step 2: Validate RS256 signature using JWKS & burn token:</div>
              <div className="text-amber-300">POST http://localhost:3000/api/v1/portals/verify-handoff</div>
              <div className="text-slate-300">&#123; "jti": payload.jti, "portalSlug": "wb_boiler" &#125;</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PORTAL */}
      <AnimatePresence>
        {isAddPortalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-[#FF7A00]" />
                  <h3 className="text-lg font-black text-[#0B2545] dark:text-white">
                    Register New Department Portal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPortalOpen(false)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPortalMutation.mutate(portalForm);
                }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Portal Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. wb_boiler"
                      value={portalForm.slug}
                      onChange={(e) => setPortalForm({ ...portalForm, slug: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={portalForm.sortOrder}
                      onChange={(e) =>
                        setPortalForm({ ...portalForm, sortOrder: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Portal Name (English) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Directorate of Boilers"
                      value={portalForm.nameEn}
                      onChange={(e) => setPortalForm({ ...portalForm, nameEn: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Portal Name (Bengali)
                    </label>
                    <input
                      type="text"
                      placeholder="বয়লার অধিকার"
                      value={portalForm.nameBn}
                      onChange={(e) => setPortalForm({ ...portalForm, nameBn: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Base URL
                    </label>
                    <input
                      type="url"
                      placeholder="http://localhost:5175"
                      value={portalForm.baseUrl}
                      onChange={(e) => setPortalForm({ ...portalForm, baseUrl: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Target Launch URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="http://localhost:5175/sso/callback"
                      value={portalForm.launchUrl}
                      onChange={(e) => setPortalForm({ ...portalForm, launchUrl: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddPortalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={createPortalMutation.isPending}>
                    Register Portal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT PORTAL */}
      <AnimatePresence>
        {editingPortal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 size={20} className="text-[#FF7A00]" />
                  <h3 className="text-lg font-black text-[#0B2545] dark:text-white">
                    Edit Portal: {editingPortal.nameEn}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPortal(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePortalMutation.mutate({
                    id: editingPortal.id,
                    data: {
                      nameEn: editingPortal.nameEn,
                      nameBn: editingPortal.nameBn,
                      descriptionEn: editingPortal.descriptionEn,
                      baseUrl: editingPortal.baseUrl,
                      launchUrl: editingPortal.launchUrl,
                      status: editingPortal.status,
                      allowedUserTypes: editingPortal.allowedUserTypes,
                      sortOrder: editingPortal.sortOrder,
                    },
                  });
                }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Portal Name (English)
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPortal.nameEn}
                      onChange={(e) => setEditingPortal({ ...editingPortal, nameEn: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                      Portal Name (Bengali)
                    </label>
                    <input
                      type="text"
                      value={editingPortal.nameBn}
                      onChange={(e) => setEditingPortal({ ...editingPortal, nameBn: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    Target Launch URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editingPortal.launchUrl}
                    onChange={(e) => setEditingPortal({ ...editingPortal, launchUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingPortal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={updatePortalMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: MANUAL ACCOUNT LINK */}
      <AnimatePresence>
        {isLinkAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-[#FF7A00]" />
                  <h3 className="text-lg font-black text-[#0B2545] dark:text-white">
                    Manual Citizen Entitlement Link
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLinkAccountOpen(false)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  linkAccountMutation.mutate(linkAccountForm);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={linkAccountForm.userId}
                    onChange={(e) => setLinkAccountForm({ ...linkAccountForm, userId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Select Citizen / Officer --</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) • {u.userType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    Target Portal <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={linkAccountForm.portalId}
                    onChange={(e) => setLinkAccountForm({ ...linkAccountForm, portalId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Select Department Portal --</option>
                    {portals.map((p) => (
                      <option key={p.id} value={p.id}>{p.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    External Department ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOILER-LIC-2026-991"
                    value={linkAccountForm.externalUserId}
                    onChange={(e) => setLinkAccountForm({ ...linkAccountForm, externalUserId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    Department Role Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Boiler Chief Engineer"
                    value={linkAccountForm.portalRole}
                    onChange={(e) => setLinkAccountForm({ ...linkAccountForm, portalRole: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsLinkAccountOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={linkAccountMutation.isPending}>
                    Establish Link
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: FORENSIC AUDIT EVENT DETAIL */}
      <AnimatePresence>
        {selectedAuditLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0F1D35] border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-[#FF7A00]" />
                  <div>
                    <h3 className="text-base font-bold text-[#0B2545] dark:text-white">
                      Security Forensic Event Inspector
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{selectedAuditLog.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditLog(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 font-mono">
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase">Action Code:</span>
                    <strong className="text-[#D34D09] dark:text-amber-400">{selectedAuditLog.action}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase">Timestamp:</span>
                    <span>{new Date(selectedAuditLog.createdAt).toISOString()}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase">Client IP Address:</span>
                    <span>{selectedAuditLog.ip}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase">Actor Username:</span>
                    <span>{selectedAuditLog.actor?.username || selectedAuditLog.actorId}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                    Event Metadata & Claims:
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto shadow-inner">
                    {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" onClick={() => setSelectedAuditLog(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
