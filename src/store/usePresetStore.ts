import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRESETS } from '../core/presets/defaultPresets';
import type { PortalPreset } from '../core/presets/presetTypes';

interface PresetState {
  activePresetId: string;
  customPresets: PortalPreset[];
  allPresets: () => PortalPreset[];
  getActivePreset: () => PortalPreset;
  setActivePreset: (id: string) => void;
  saveCustomPreset: (preset: PortalPreset) => void;
  deleteCustomPreset: (id: string) => void;
  duplicateCustomPreset: (id: string) => void;
  exportPresetsJson: () => string;
  importPresetsJson: (json: string) => boolean;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      activePresetId: 'in-upsc', // High-traffic benchmark default
      customPresets: [],

      allPresets: () => {
        const { customPresets } = get();
        return [...DEFAULT_PRESETS, ...customPresets];
      },

      getActivePreset: () => {
        const { activePresetId, allPresets } = get();
        const found = allPresets().find((p) => p.id === activePresetId);
        return found || DEFAULT_PRESETS[0];
      },

      setActivePreset: (id: string) => {
        set({ activePresetId: id });
      },

      saveCustomPreset: (preset: PortalPreset) => {
        set((state) => {
          const exists = state.customPresets.some((p) => p.id === preset.id);
          if (exists) {
            return {
              customPresets: state.customPresets.map((p) => (p.id === preset.id ? preset : p)),
            };
          }
          return { customPresets: [...state.customPresets, { ...preset, isCustom: true }] };
        });
      },

      deleteCustomPreset: (id: string) => {
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.id !== id),
          activePresetId: state.activePresetId === id ? DEFAULT_PRESETS[0].id : state.activePresetId,
        }));
      },

      duplicateCustomPreset: (id: string) => {
        const target = get().allPresets().find((p) => p.id === id);
        if (!target) return;

        const copy: PortalPreset = {
          ...target,
          id: `custom_${Date.now()}`,
          name: `${target.name} (Copy)`,
          country: 'CUSTOM',
          countryFlag: '⚙️',
          isCustom: true,
        };

        set((state) => ({
          customPresets: [...state.customPresets, copy],
          activePresetId: copy.id,
        }));
      },

      exportPresetsJson: () => {
        const { customPresets } = get();
        return JSON.stringify(customPresets, null, 2);
      },

      importPresetsJson: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!Array.isArray(parsed)) return false;

          const validated: PortalPreset[] = parsed.map((item) => ({
            ...item,
            id: item.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            isCustom: true,
            country: 'CUSTOM',
            countryFlag: '⚙️',
          }));

          set((state) => ({
            customPresets: [...state.customPresets, ...validated],
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'formease-user-presets-v1',
      partialize: (state) => ({
        activePresetId: state.activePresetId,
        customPresets: state.customPresets,
      }),
    }
  )
);
