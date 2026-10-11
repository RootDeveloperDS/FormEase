import React from 'react';
import { Shield, Keyboard, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-10 px-4 sm:px-6 lg:px-8 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Badges & Statements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800/60">
          {/* Sovereign Security */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                100% Client-Side Sovereign
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Biometric passports, identity documents, and signatures are processed entirely in your browser's local memory using HTML5 Canvas & Web Workers. Zero remote server uploads.
              </p>
            </div>
          </div>

          {/* WCAG & Ergonomics */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                WCAG 2.1 AA Ergonomics
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full keyboard accessibility. Crop canvas nudging: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Arrow Keys</kbd> for 1px shift, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Shift + Arrows</kbd> for 10px shift.
              </p>
            </div>
          </div>

          {/* Deployxa Edge Hosting */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Deployxa Edge Verified
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deployed natively on Deployxa edge infrastructure with immutable asset caching headers and zero cold-start latency.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FormEase</span>
            <span>•</span>
            <span>Precision Biometric & Application Dossier Preparation Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Built for Hyperbloom Hackathon</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Deterministic 92%-98% Convergence Loop
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
