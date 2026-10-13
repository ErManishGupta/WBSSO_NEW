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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#D9DFEA] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-lg"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <h2 id="link-portal-title" className="text-xl font-bold text-[#14306B] mb-1">
          {t('linkModalTitle')}
        </h2>
        <p className="text-xs text-[#64748B] mb-5">
          {t('linkDisclaimer')}
        </p>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between text-xs font-semibold mb-6 border-b border-gray-100 pb-3">
          <span className={step >= 1 ? 'text-[#14306B]' : 'text-gray-400'}>
            {t('step1')}
          </span>
          <span className="text-gray-300">→</span>
          <span className={step >= 2 ? 'text-[#14306B]' : 'text-gray-400'}>
            {t('step2')}
          </span>
          <span className="text-gray-300">→</span>
          <span className={step === 3 ? 'text-[#138A36]' : 'text-gray-400'}>
            {t('step3')}
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-[#FFEBEE] border border-[#C62828]/30 text-[#C62828] p-3 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Portal */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#344054]">
              {t('choosePortalPrompt')}
            </p>
            {linkablePortals.length === 0 ? (
              <div className="text-center py-8 bg-[#F4F6FA] rounded-xl text-sm text-[#64748B]">
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
                    className="w-full text-left p-4 rounded-xl border border-[#D9DFEA] hover:border-[#14306B] hover:bg-[#F4F6FA] transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#14306B]/10 text-[#14306B] flex items-center justify-center shrink-0">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#101828] group-hover:text-[#14306B]">
                          {i18n.language === 'bn' ? portal.nameBn : portal.nameEn}
                        </div>
                        <div className="text-xs text-[#64748B] line-clamp-1">
                          {i18n.language === 'bn' ? portal.descriptionBn : portal.descriptionEn}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-[#64748B] group-hover:text-[#14306B] shrink-0 ml-2" />
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
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] uppercase font-semibold">Linking Target</span>
              <div className="text-sm font-bold text-[#14306B]">
                {i18n.language === 'bn' ? selectedPortal.nameBn : selectedPortal.nameEn}
              </div>
            </div>

            <div>
              <label
                htmlFor="regNumber"
                className="block text-xs font-semibold text-[#344054] mb-1.5"
              >
                {t('enterRegNumber')} (or Reference Code) *
              </label>
              <input
                id="regNumber"
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. WB-LIC-2026-99"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D9DFEA] text-sm focus:outline-none focus:ring-2 focus:ring-[#14306B]"
              />
            </div>

            <div className="bg-[#FFFAEB] border border-[#B54708]/30 rounded-lg p-3 text-xs text-[#B54708]">
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
            <div className="w-14 h-14 bg-green-100 text-[#138A36] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#101828]">
              {t('linkingSuccess')}
            </h3>
            <p className="text-xs text-[#64748B]">
              Refreshing your portal entitlements...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
