import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from '@wb-sso/ui';
import { PortalDto } from '@wb-sso/types';
import { apiFetch } from '../lib/api';
import { X, CheckCircle, ShieldAlert, ArrowRight, Building, HeartHandshake, Store } from 'lucide-react';

interface LinkPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkPortalModal: React.FC<LinkPortalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [linkablePortals, setLinkablePortals] = useState<PortalDto[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<PortalDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regNumber, setRegNumber] = useState('');
  const [challengeId, setChallengeId] = useState('');

  // Fetch linkable portals on open
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setSelectedPortal(null);
      setRegNumber('');
      apiFetch<PortalDto[]>('portals/linkable')
        .then((data) => setLinkablePortals(data))
        .catch((e) => setError(e.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPortal = async (portal: PortalDto) => {
    setSelectedPortal(portal);
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>(`portals/${portal.id}/link/start`, {
        method: 'POST',
      });
      setChallengeId(res.challengeId);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to start linking process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!selectedPortal) return;
    setIsLoading(true);
    setError(null);

    try {
      await apiFetch(`portals/${selectedPortal.id}/link/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          challengeId,
          externalUserId: regNumber || `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        }),
      });
      setStep(3);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm portal link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in transition-colors"
    >
      <div className="bg-white dark:bg-[#0F1D35] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-gray-200 dark:border-slate-800 relative transition-colors">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-xl transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <h2 id="link-portal-title" className="text-xl font-bold text-[#0B2545] dark:text-white mb-1 transition-colors">
          {t('linkModalTitle')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
          {t('linkDisclaimer')}
        </p>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between text-xs font-semibold mb-6 border-b border-gray-100 dark:border-slate-800 pb-3">
          <span className={step >= 1 ? 'text-[#FF7A00] dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-slate-500'}>
            {t('step1')}
          </span>
          <span className="text-gray-300 dark:text-slate-600">→</span>
          <span className={step >= 2 ? 'text-[#FF7A00] dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-slate-500'}>
            {t('step2')}
          </span>
          <span className="text-gray-300 dark:text-slate-600">→</span>
          <span className={step === 3 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-slate-500'}>
            {t('step3')}
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Portal */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-slate-300 font-medium">
              {t('choosePortalPrompt')}
            </p>
            {linkablePortals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-800 rounded-2xl text-sm text-gray-500 dark:text-slate-400">
                All department portals eligible for your role are already linked.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {linkablePortals.map((portal) => (
                  <button
                    key={portal.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSelectPortal(portal)}
                    className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-[#FF7A00] dark:hover:border-[#FF7A00] hover:bg-orange-50/40 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-slate-800 border border-orange-200/80 dark:border-slate-700 text-[#FF7A00] flex items-center justify-center shrink-0 shadow-2xs">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0B2545] dark:text-white group-hover:text-[#FF7A00] dark:group-hover:text-amber-400 transition-colors">
                          {i18n.language === 'bn' ? portal.nameBn : portal.nameEn}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                          {i18n.language === 'bn' ? portal.descriptionBn : portal.descriptionEn}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-[#FF7A00] dark:group-hover:text-amber-400 shrink-0 ml-2 transition-colors" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                {t('cancelBtn')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verification Challenge */}
        {step === 2 && selectedPortal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
              <span className="text-[10px] text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider block">Linking Target</span>
              <div className="text-sm font-bold text-[#0B2545] dark:text-white mt-0.5">
                {i18n.language === 'bn' ? selectedPortal.nameBn : selectedPortal.nameEn}
              </div>
            </div>

            <div>
              <label
                htmlFor="regNumber"
                className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide"
              >
                {t('enterRegNumber')} (or Reference Code) *
              </label>
              <input
                id="regNumber"
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. WB-LIC-2026-99"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
              <strong>Security Protocol:</strong> By continuing, your identity will be mapped to the department database. Access is strictly audited.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isLoading}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmLink}
                isLoading={isLoading}
              >
                {t('confirmLinkBtn')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0B2545] dark:text-white">
              {t('linkingSuccess')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Refreshing your portal entitlements...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
