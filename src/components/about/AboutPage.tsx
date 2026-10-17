import React from 'react';
import { Target, PenLine, FileText, Package, ShieldCheck, Keyboard, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useNavigationStore();

  const points = [
    {
      icon: Target,
      title: 'Sharpest file that still fits',
      badge: 'Near-Ceiling Binary Search',
      body: 'Most tools squash a 50 KB photo down to 15 KB, creating blurry artifacts that fail biometric scrutiny. FormEase executes an adaptive binary-search quality loop, testing quality factors until the file lands between 92% and 98.5% of your portal limit (e.g., 48.2 KB for a 50 KB limit). If compression would create distortion, it automatically downscales dimensions slightly instead.',
    },
    {
      icon: PenLine,
      title: 'Clean signatures on pure white',
      badge: 'Luminance Thresholding',
      body: 'Phone snapshots of signatures on paper have grey desk shadows, creases, and uneven lighting. FormEase computes a real-time luminance histogram, bleaches the background paper to pure #FFFFFF white, and darkens ink strokes so your signature is crisp and readable even at strict 10 KB to 20 KB caps.',
    },
    {
      icon: FileText,
      title: 'Documents become compliant PDFs',
      badge: 'PDF-Lib Engine',
      body: 'Government portals often demand PDF documents under 200 KB. FormEase converts colour scans to ITU-R BT.709 grayscale (reducing byte payload by ~60%), applies an unsharp text sharpening convolution kernel, and wraps the result into a clean PDF with a 4 KB structural headroom guardrail.',
    },
    {
      icon: Package,
      title: 'One verified, ready-to-upload ZIP',
      badge: 'Automated Dossier Bundle',
      body: 'Instead of managing loose files, one click bundles everything into a structured .ZIP archive. Files are renamed to official portal conventions (e.g., 01_PASSPORT_PHOTO_48KB.jpg) alongside an audit manifest (VALIDATION_SUMMARY.txt) mathematically proving compliance with official portal standards.',
    },
    {
      icon: ShieldCheck,
      title: '100% sovereign client-side privacy',
      badge: 'Zero Network Exfiltration',
      body: 'There is zero backend and zero remote processing. All image cropping, rotation, scaling, and compression runs directly in your browser memory using the HTML5 Canvas API. No accounts, no cookies, no tracking. An active network interceptor monitors all fetch/XHR calls to guarantee 0 outbound uploads.',
    },
    {
      icon: Keyboard,
      title: 'Built to WCAG 2.1 AA accessibility',
      badge: 'Keyboard & Screen-Reader Ready',
      body: 'Accessible to all applicants: full keyboard navigation, 1px and 10px Arrow-key nudging for crop alignment, visible focus rings, high-contrast typography, and ARIA live regions (aria-live="polite") that announce compression status changes to screen readers.',
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 animate-in fade-in duration-200">
      {/* Title & Introduction */}
      <div className="space-y-4 max-w-3xl border-b border-border pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft border border-primary/25 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The FormEase Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-foreground leading-[1.12]">
          How FormEase Works
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Government exams, university admissions, and visa portals reject millions of applications every year for
          tiny formatting errors. FormEase replaces sketchy online compressors with an offline mathematical pipeline.
        </p>
      </div>

      {/* 6 Architectural Pillars Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {points.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-card hover:shadow-lift transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {p.badge}
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold text-foreground">
                  {p.title}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Call to Action */}
      <div className="p-8 rounded-3xl border border-border bg-card shadow-card flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-foreground">
            Ready to format your application documents?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Select your form or set custom rules. It takes less than 60 seconds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('prepare')}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-sm hover:opacity-90 flex items-center gap-2 transition-all shrink-0"
        >
          <span>Start Preparing Files</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
