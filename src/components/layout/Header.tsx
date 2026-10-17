import React from 'react';
import {
  FolderArchive,
  FileCheck2,
  Bookmark,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { useDossierStore } from '../../store/useDossierStore';
import { useNavigationStore, type AppPage } from '../../store/useNavigationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { PresetSelector } from '../presets/PresetSelector';
import { ActionButton } from '../common/ActionButton';
import { FormEaseLogo } from '../common/FormEaseLogo';

interface HeaderProps {
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExportModal }) => {
  const { activeMode, photoSlot, signatureSlot, documentSlot, sandboxQueue } = useDossierStore();
  const { currentPage, navigateTo } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();

  const hasItems =
    activeMode === 'dossier'
      ? !!(photoSlot.processedBlob || signatureSlot.processedBlob || documentSlot.processedBlob)
      : sandboxQueue.length > 0;

  const navItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'prepare', label: 'Prepare files', icon: <FileCheck2 className="w-4 h-4" /> },
    { page: 'presets', label: 'My presets', icon: <Bookmark className="w-4 h-4" /> },
    { page: 'about', label: 'How it works', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <button
          type="button"
          onClick={() => navigateTo('prepare')}
          className="flex items-center gap-2.5 shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring text-left"
        >
          <FormEaseLogo size={32} />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-display tracking-tight text-foreground">
              Form<span className="text-primary font-extrabold">Ease</span>
            </span>
            <span className="inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20 uppercase tracking-wider">
              v4.0
            </span>
          </div>
        </button>

        {/* Center: Navigation Links */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-2xl">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => navigateTo(item.page)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Controls & Telemetry */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Fast Preset Switcher at a glance */}
          {activeMode === 'dossier' && <PresetSelector />}

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-card"
            title={`Switch to ${theme === 'dark' ? 'Paper Light' : 'Midnight Dark'} theme`}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" />
            )}
          </button>

          {/* Master Export Button */}
          <ActionButton
            onClick={onOpenExportModal}
            disabled={!hasItems}
            variant="primary"
            size="sm"
            leftIcon={<FolderArchive className="w-4 h-4" />}
          >
            Export
          </ActionButton>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-t border-border px-4 py-1.5 flex items-center justify-around bg-background/95">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigateTo(item.page)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
