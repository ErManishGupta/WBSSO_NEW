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
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'portals' | 'accounts' | 'audit'>('portals');
  const [searchAccount, setSearchAccount] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // 1. Fetch Portals
  const { data: portals = [] } = useQuery<PortalDto[]>({
    queryKey: ['admin-portals'],
    queryFn: () => apiFetch<PortalDto[]>('admin/portals'),
    enabled: tab === 'portals',
  });

  // 2. Fetch Accounts
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ['admin-accounts', searchAccount],
    queryFn: () =>
      apiFetch<any[]>(
        `admin/accounts${searchAccount ? `?search=${encodeURIComponent(searchAccount)}` : ''}`
      ),
    enabled: tab === 'accounts',
  });

  // 3. Fetch Audit Logs
  const { data: auditData } = useQuery<{ logs: AuditLogDto[]; total: number }>({
    queryKey: ['admin-audit', auditActionFilter],
    queryFn: () =>
      apiFetch<{ logs: AuditLogDto[]; total: number }>(
        `admin/audit${auditActionFilter ? `?action=${encodeURIComponent(auditActionFilter)}` : ''}`
      ),
    enabled: tab === 'audit',
  });

  // Update account status mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`admin/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
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
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#0B2545] dark:text-white">
            <Shield size={24} className="text-[#FF7A00]" />
            <h1 className="text-2xl font-black m-0">Admin Management Console</h1>
          </div>
          <p className="text-xs text-[#57534E] dark:text-slate-400 mt-1">
            Department portal directory configuration, user entitlement controls and security audit trail.
          </p>
        </div>

        {tab === 'audit' && (
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download size={15} />
            <span>{t('exportCsv')}</span>
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D9DFEA] dark:border-slate-800 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('portals')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition border-b-2 ${
            tab === 'portals'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <Layers size={18} />
          <span>{t('managePortals')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('accounts')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition border-b-2 ${
            tab === 'accounts'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <Users size={18} />
          <span>{t('manageAccounts')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition border-b-2 ${
            tab === 'audit'
              ? 'border-[#FF7A00] text-[#D34D09] dark:text-amber-400'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet size={18} />
          <span>{t('auditLog')}</span>
        </button>
      </div>

      {/* Tab 1: Portals */}
      {tab === 'portals' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-slate-900/60">
            <h2 className="text-sm font-bold text-[#101828] dark:text-white">Registered Department Portals</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => alert('Add Portal Form: All registered portals are configuration records in database.')}
            >
              <Plus size={15} />
              <span>{t('addPortal')}</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Portal Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Linking Method</th>
                  <th className="p-3.5">Target URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Allowed Types</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {portals.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold text-[#101828] dark:text-white">
                      <div>{p.nameEn}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-normal">{p.nameBn}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[#D34D09] dark:text-amber-400">{p.slug}</td>
                    <td className="p-3.5">
                      <span className="font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                        {p.linkingMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-xs">
                      {p.launchUrl}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {p.status}
                      </Badge>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Accounts & Entitlements Management */}
      {tab === 'accounts' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#F8FAFC] dark:bg-slate-900/60">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                placeholder="Search citizen or reference ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9DFEA] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>
            <div className="text-xs text-[#64748B] dark:text-slate-400">
              Showing {accounts.length} active entitlement mapping records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Citizen / User</th>
                  <th className="p-3.5">Portal</th>
                  <th className="p-3.5">External ID</th>
                  <th className="p-3.5">Portal Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="font-bold text-[#101828] dark:text-white">{acc.user.name}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                        @{acc.user.username} ({acc.user.userType})
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#D34D09] dark:text-amber-400">
                      {acc.portal.nameEn}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">{acc.externalUserId}</td>
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

      {/* Tab 3: Security Audit Log */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-[#0F1D35] border border-[#D9DFEA] dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-[#F8FAFC] dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[#64748B] dark:text-slate-400" />
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-[#D9DFEA] dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-medium"
              >
                <option value="">All Security Actions</option>
                <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
                <option value="PORTAL_LAUNCH">PORTAL_LAUNCH</option>
                <option value="PORTAL_LINK">PORTAL_LINK</option>
                <option value="PORTAL_UNLINK">PORTAL_UNLINK</option>
                <option value="ADMIN_ACCOUNT_REVOKED">ADMIN_ACCOUNT_REVOKED</option>
              </select>
            </div>
            <span className="text-xs text-[#64748B] dark:text-slate-400">
              Total Events: {auditData?.total || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] dark:bg-slate-900/80 text-[#475467] dark:text-slate-300 font-semibold border-b border-[#D9DFEA] dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action Code</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Metadata / Claims</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono text-[11px]">
                {(auditData?.logs || []).map((log) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
