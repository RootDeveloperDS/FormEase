import React from 'react';
import {
  Shield,
  Keyboard,
  Zap,
  Mail,
  Globe,
  Building2,
  ArrowUpRight,
  Sparkles,
  LayoutGrid,
  CheckCircle2,
  Sliders,
  FileCheck,
} from 'lucide-react';
import { FormEaseLogo } from '../common/FormEaseLogo';
import { useDossierStore } from '../../store/useDossierStore';
import { usePresetStore } from '../../store/usePresetStore';
import { DEFAULT_PRESETS } from '../../core/presets/defaultPresets';

export const Footer: React.FC = () => {
  const { setMode } = useDossierStore();
  const { setActivePreset } = usePresetStore();

  const handleNavToMode = (mode: 'dossier' | 'sandbox') => {
    setMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    setMode('dossier');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    {
      name: 'Developer Portfolio',
      href: 'https://devanshsharma.vercel.app/',
      icon: <Globe className="w-4 h-4" />,
      tooltip: 'devanshsharma.vercel.app',
      handle: 'Portfolio',
    },
    {
      name: 'Business Website',
      href: 'https://rootdeveloperds.odoo.com',
      icon: <Building2 className="w-4 h-4" />,
      tooltip: 'rootdeveloperds.odoo.com',
      handle: 'RootDeveloperDS',
    },
    {
      name: 'Email Contact',
      href: 'mailto:developersofroot@gmail.com',
      icon: <Mail className="w-4 h-4" />,
      tooltip: 'developersofroot@gmail.com',
      handle: 'Direct Mail',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/RootDeveloperDS',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
      tooltip: '@RootDeveloperDS',
      handle: 'RootDeveloperDS',
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/in/devanshsharma987',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.76v8.37H6.46v-8.37M7.84 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
        </svg>
      ),
      tooltip: 'in/devanshsharma987',
      handle: 'devanshsharma987',
    },
    {
      name: 'Twitter / X',
      href: 'https://x.com/devanshsha6563',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      tooltip: '@devanshsha6563',
      handle: '@devanshsha6563',
    },
    {
      name: 'Telegram',
      href: 'https://t.me/developerofroot',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      tooltip: '@developerofroot',
      handle: '@developerofroot',
    },
  ];

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/95 py-12 px-4 sm:px-6 lg:px-8 mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Badges & Sovereignty Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-800/70">
          {/* Sovereign Security */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                100% Client-Side Sovereign
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Biometric passports, identity documents, and signatures are processed exclusively in your browser's local memory. Zero remote server uploads, guaranteed.
              </p>
            </div>
          </div>

          {/* WCAG & Ergonomics */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                WCAG 2.1 AA Ergonomics
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Accessible keyboard navigation with precision nudge controls: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Arrow Keys</kbd> for 1px, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Shift + Arrows</kbd> for 10px.
              </p>
            </div>
          </div>

          {/* Deployxa Edge Hosting */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Deployxa Edge Verified
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deployed natively on Deployxa edge infrastructure with immutable asset caching headers and instant cold-start sub-millisecond delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Directory & Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Identity & Mission (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <FormEaseLogo size={36} showText={true} />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              FormEase is a sovereign client-side biometric dossier & document engine. Formats, verifies, and packages official application assets entirely in your browser memory with zero outbound server transmission.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero Data Leaves Device
              </span>
            </div>

            {/* Direct Contact Action Button */}
            <div className="pt-2">
              <a
                href="mailto:developersofroot@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Creator (Direct Mail)</span>
              </a>
            </div>
          </div>

          {/* Primary Navigation: Workspaces */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Workspaces</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavToMode('dossier')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Guided Dossier Slots</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavToMode('sandbox')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Batch Sandbox Studio</span>
                </button>
              </li>
              <li>
                <a
                  href="#dossier"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavToMode('dossier');
                  }}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Interactive Biometric Cropper</span>
                </a>
              </li>
              <li>
                <a
                  href="#dossier"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavToMode('dossier');
                  }}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Shadow Ink Bleach Engine</span>
                </a>
              </li>
              <li>
                <a
                  href="#dossier"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavToMode('dossier');
                  }}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Pre-Flight ZIP Bundler</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Primary Navigation: Portal Presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Portal Presets</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {DEFAULT_PRESETS.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-left truncate max-w-full"
                    title={p.name}
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="truncate">{p.name}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => handleNavToMode('dossier')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Custom Preset Architect</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Engine & Security Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Engine Specs</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Binary Search Quality Loop</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>HTML5 Canvas & Web Workers</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Offline EXIF Auto-Orientation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Single-Page PDF & JPEG Output</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Browser LocalStorage Persistence</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Comprehensive Social Presence Bar */}
        <div className="pt-8 border-t border-slate-800/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Connect with the Creator & Engineering Team
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Portfolio, open-source repositories, business inquiries, and direct communication channels
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              Product by Devansh Sharma
            </span>
          </div>

          {/* Social Links Interactive Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 hover:shadow-lg hover:shadow-emerald-500/10 text-slate-300 hover:text-white transition-all duration-200"
                title={`${social.name} • ${social.tooltip}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform duration-200 shrink-0">
                    {social.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                      {social.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 truncate group-hover:text-slate-400">
                      {social.handle}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0 ml-1" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">FormEase</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              v3.0
            </span>
            <span className="text-slate-700">•</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-300 font-medium">Product by Devansh Sharma</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Hyperbloom Hackathon Entry</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-400 font-semibold font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Deterministic 92%-98% Convergence Loop
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
