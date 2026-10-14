import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, PhoneCall, Mail, MapPin, ExternalLink, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#08182B] dark:bg-[#040A14] text-white/90 border-t border-white/10 dark:border-white/5 mt-auto text-sm relative select-none transition-colors duration-300">
      {/* 1. Indian Tricolor Accent Stripe on Footer Top */}
      <div className="w-full h-1 flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          {/* Column 1: Directorate Identity & Mandate */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm shrink-0">
                <img
                  src="/wb.png"
                  alt="State Emblem of India"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                  LABOUR DEPARTMENT
                </h3>
                <p className="text-xs font-semibold text-white/70">
                  Government of West Bengal
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Official Single Sign-On and Entitlement Gateway providing unified, secure, and audited digital access to statutory compliance, factory licences, boiler approvals, and labour welfare schemes across West Bengal.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <div className="inline-flex items-center gap-2 text-xs text-amber-300 font-semibold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck size={15} className="text-[#FF9933] shrink-0" />
                <span>GIGW 3.0 & WCAG 2.1 AA Compliant</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-emerald-300 font-semibold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Award size={15} className="text-[#138808] shrink-0" />
                <span>Digital India Certified Architecture</span>
              </div>
            </div>
          </div>

          {/* Column 2: Key Portals & Single Window Clearances */}
          <div>
            <h4 className="text-xs font-bold text-[#FF9933] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <span>Key Portals & Services</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <a
                  href="https://wbfactories.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 hover:underline transition flex items-center gap-1.5"
                >
                  <ExternalLink size={12} className="text-[#FF9933]" />
                  <span>Directorate of Factories Portal</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wblabour.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 hover:underline transition flex items-center gap-1.5"
                >
                  <ExternalLink size={12} className="text-[#FF9933]" />
                  <span>Department of Labour Portal</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wb.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 hover:underline transition flex items-center gap-1.5"
                >
                  <ExternalLink size={12} className="text-[#FF9933]" />
                  <span>Government of West Bengal (wb.gov.in)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://edistrict.wb.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 hover:underline transition flex items-center gap-1.5"
                >
                  <ExternalLink size={12} className="text-[#FF9933]" />
                  <span>e-District West Bengal</span>
                </a>
              </li>
              <li>
                <a
                  href="#citizen-charter"
                  className="hover:text-amber-300 hover:underline transition flex items-center gap-1.5"
                >
                  <span>Citizen Charter & Timelines</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal, Security & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-[#FF9933] uppercase tracking-wider mb-3.5">
              Legal & Standards
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <a href="#privacy" className="hover:text-amber-300 hover:underline transition">
                  {t('privacyPolicy')}
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-amber-300 hover:underline transition">
                  {t('termsOfUse')}
                </a>
              </li>
              <li>
                <a href="#hyperlink" className="hover:text-amber-300 hover:underline transition">
                  Hyperlinking Policy
                </a>
              </li>
              <li>
                <a href="#copyright" className="hover:text-amber-300 hover:underline transition">
                  Copyright Policy & Disclaimers
                </a>
              </li>
              <li>
                <a href="#accessibility" className="hover:text-amber-300 hover:underline transition">
                  {t('accessibilityStatement')}
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-amber-300 hover:underline transition">
                  Security & Audit Framework
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Department Contacts & Helpdesk */}
          <div>
            <h4 className="text-xs font-bold text-[#FF9933] uppercase tracking-wider mb-3.5">
              Directorate Helpdesk
            </h4>
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-2.5">
                <PhoneCall size={16} className="text-[#FF9933] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold text-sm">1800-103-0009</strong>
                  <span className="text-white/60 text-[11px]">Toll-Free Helpline (Mon-Fri, 10 AM - 5 PM)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail size={16} className="text-[#FF9933] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">support.labour@wb.gov.in</span>
                  <p className="text-white/60 text-[11px]">Technical Assistance & Portal Queries</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#FF9933] shrink-0 mt-0.5" />
                <div className="text-white/70 text-[11px] leading-relaxed">
                  <strong>Labour Department, Govt. of West Bengal</strong>
                  <br />
                  New Secretariat Buildings (8th Floor),
                  <br />
                  1, K.S. Roy Road, Kolkata - 700001
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 gap-3">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} Labour Department, Government of West Bengal. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-amber-200/80">
            <span>Website Designed & Maintained as per State IT Policy</span>
            <span>•</span>
            <span>{t('lastUpdated')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
