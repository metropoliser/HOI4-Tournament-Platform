'use client';

import { useState, useMemo, useEffect } from 'react';
import { HOI4_NATIONS, getNationsSortedByName, HOI4Nation, getFlagUrl } from '../lib/hoi4NationsComplete';
import Image from 'next/image';

interface NationSelectorProps {
  value?: string; // Format: "TAG" or "TAG_IDEOLOGY" or "TAG_variant_name"
  ideology?: string;
  onChange: (tag: string, ideology?: string, nation?: HOI4Nation) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean; // If true, variants are collapsed by default
}

const STANDARD_IDEOLOGIES = [
  { value: 'communism', label: 'Communist', color: 'bg-red-900/30 border-red-700 text-red-300' },
  { value: 'democratic', label: 'Democratic', color: 'bg-blue-900/30 border-blue-700 text-blue-300' },
  { value: 'fascism', label: 'Fascist', color: 'bg-orange-900/30 border-orange-700 text-orange-300' },
  { value: 'neutrality', label: 'Non-Aligned', color: 'bg-gray-800/30 border-gray-600 text-gray-300' },
];

export default function NationSelector({ value, ideology, onChange, placeholder = 'Select a nation...', disabled, compact = false }: NationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [variantsExpanded, setVariantsExpanded] = useState(!compact); // Collapsed by default in compact mode

  // Parse value to extract tag and ideology/variant
  const parsedValue = useMemo(() => {
    if (!value) return { tag: '', variant: ideology || '' };

    // Check if value contains underscore (TAG_VARIANT format)
    const underscoreIndex = value.indexOf('_');
    if (underscoreIndex !== -1) {
      const tag = value.substring(0, underscoreIndex);
      const variant = value.substring(underscoreIndex + 1);
      return { tag, variant };
    }

    // Value is just the tag
    return { tag: value, variant: ideology || '' };
  }, [value, ideology]);

  const [selectedVariant, setSelectedVariant] = useState<string>(parsedValue.variant);

  // Update selectedVariant when parsedValue changes
  useEffect(() => {
    setSelectedVariant(parsedValue.variant);
  }, [parsedValue.variant]);

  const sortedNations = useMemo(() => getNationsSortedByName(), []);

  const filteredNations = useMemo(() => {
    if (!searchTerm) return sortedNations;
    const term = searchTerm.toLowerCase();
    return sortedNations.filter(
      nation =>
        nation.name.toLowerCase().includes(term) ||
        nation.tag.toLowerCase().includes(term)
    );
  }, [searchTerm, sortedNations]);

  const selectedNation = parsedValue.tag ? HOI4_NATIONS[parsedValue.tag] : undefined;

  const handleSelect = (nation: HOI4Nation) => {
    onChange(nation.tag, selectedVariant || undefined, nation);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleVariantChange = (newVariant: string) => {
    setSelectedVariant(newVariant);
    if (selectedNation) {
      onChange(selectedNation.tag, newVariant || undefined, selectedNation);
    }
  };

  const getCurrentFlagUrl = (): string | null => {
    if (!selectedNation) return null;

    if (!selectedVariant) {
      // No variant selected, use base or first available
      return selectedNation.flags.base ||
             selectedNation.flags.neutrality ||
             selectedNation.flags.democratic ||
             selectedNation.flags.communism ||
             selectedNation.flags.fascism ||
             null;
    }

    // Try to get variant flag
    if (STANDARD_IDEOLOGIES.find(i => i.value === selectedVariant)) {
      const flagUrl = selectedNation.flags[selectedVariant as keyof typeof selectedNation.flags];
      return (typeof flagUrl === 'string') ? flagUrl : null;
    }

    // Check in variants
    if (selectedNation.flags.variants && selectedNation.flags.variants[selectedVariant]) {
      return selectedNation.flags.variants[selectedVariant];
    }

    // Fallback
    return selectedNation.flags.base || selectedNation.flags.neutrality || null;
  };

  const getNationFlagUrl = (nation: HOI4Nation): string | null => {
    if (!selectedVariant) {
      return nation.flags.base || nation.flags.neutrality || nation.flags.democratic || null;
    }

    // Try the selected variant for preview consistency
    if (STANDARD_IDEOLOGIES.find(i => i.value === selectedVariant)) {
      const flagUrl = nation.flags[selectedVariant as keyof typeof nation.flags];
      if (typeof flagUrl === 'string') return flagUrl;
    }

    // Fallback to base
    return nation.flags.base || nation.flags.neutrality || nation.flags.democratic || null;
  };

  // Get all available variants for selected nation
  const getAvailableVariants = (): { standard: string[], variants: { key: string, label: string }[] } => {
    if (!selectedNation) return { standard: [], variants: [] };

    const standard = STANDARD_IDEOLOGIES
      .filter(ideology => selectedNation.flags[ideology.value as keyof typeof selectedNation.flags])
      .map(i => i.value);

    const variants = selectedNation.flags.variants
      ? Object.keys(selectedNation.flags.variants).map(key => ({
          key,
          label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }))
      : [];

    return { standard, variants };
  };

  const currentFlagUrl = getCurrentFlagUrl();

  return (
    <div className="space-y-3">
      {/* Nation Selector */}
      <div className="relative w-full">
        {/* Selected Display */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center gap-4 px-5 py-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {selectedNation ? (
            <>
              {currentFlagUrl && (
                <div className="relative w-14 h-10 flex-shrink-0">
                  <Image
                    src={currentFlagUrl}
                    alt={selectedNation.name}
                    fill
                    className="object-contain rounded border border-gray-600"
                    sizes="56px"
                  />
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="font-semibold text-base text-white">{selectedNation.name}</div>
                <div className="text-sm text-gray-400">{selectedNation.tag}</div>
              </div>
            </>
          ) : (
            <div className="flex-1 text-left text-gray-400">{placeholder}</div>
          )}
          <svg
            className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-2xl max-h-[450px] overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search nations..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
            </div>

            {/* Nations List */}
            <div className="overflow-y-auto max-h-[370px] custom-scrollbar">
              {filteredNations.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No nations found</div>
              ) : (
                filteredNations.map((nation) => {
                  const nationFlagUrl = getNationFlagUrl(nation);
                  return (
                    <button
                      key={nation.tag}
                      type="button"
                      onClick={() => handleSelect(nation)}
                      className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-700 transition-colors text-left"
                    >
                      {nationFlagUrl && (
                        <div className="relative w-12 h-9 flex-shrink-0">
                          <Image
                            src={nationFlagUrl}
                            alt={nation.name}
                            fill
                            className="object-contain rounded border border-gray-600"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-white text-base">{nation.name}</div>
                        <div className="text-sm text-gray-400">{nation.tag}</div>
                      </div>
                      {parsedValue.tag === nation.tag && (
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Flag Variant Selector */}
      {selectedNation && (() => {
        const { standard, variants } = getAvailableVariants();
        const hasVariants = standard.length > 0 || variants.length > 0;

        if (!hasVariants) return null;

        // Compact mode - show collapse/expand button
        if (compact && !variantsExpanded) {
          return (
            <button
              type="button"
              onClick={() => setVariantsExpanded(true)}
              className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-sm text-gray-300 hover:text-gray-100 hover:border-gray-600 hover:bg-gray-800/50 transition-all flex items-center justify-between"
            >
              <span className="font-medium">Change flag variant</span>
              <span className="text-blue-400 font-semibold">{standard.length + variants.length} available</span>
            </button>
          );
        }

        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-semibold text-gray-200">
                Flag Variant ({standard.length + variants.length} available)
              </label>
              {compact && (
                <button
                  type="button"
                  onClick={() => setVariantsExpanded(false)}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors font-medium"
                >
                  Collapse
                </button>
              )}
            </div>

            {/* Standard Ideologies */}
            {standard.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-3 font-medium">Standard Ideologies</div>
                <div className="grid grid-cols-2 gap-3">
                  {STANDARD_IDEOLOGIES.filter(i => standard.includes(i.value)).map((ideology) => (
                    <button
                      key={ideology.value}
                      type="button"
                      onClick={() => {
                        handleVariantChange(ideology.value);
                        if (compact) setVariantsExpanded(false); // Auto-collapse in compact mode
                      }}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedVariant === ideology.value
                          ? 'border-blue-500 bg-blue-900/30'
                          : `border-gray-700 ${ideology.color} hover:border-gray-600`
                      }`}
                    >
                      {ideology.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Special Variants */}
            {variants.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-3 font-medium">Special Variants</div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {variants.map((variant) => (
                    <button
                      key={variant.key}
                      type="button"
                      onClick={() => {
                        handleVariantChange(variant.key);
                        if (compact) setVariantsExpanded(false); // Auto-collapse in compact mode
                      }}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all text-left ${
                        selectedVariant === variant.key
                          ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 text-gray-300'
                      }`}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No variant selected button */}
            <button
              type="button"
              onClick={() => {
                handleVariantChange('');
                if (compact) setVariantsExpanded(false); // Auto-collapse in compact mode
              }}
              className={`w-full mt-3 px-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all ${
                !selectedVariant
                  ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 text-gray-300'
              }`}
            >
              Default Flag
            </button>
          </div>
        );
      })()}
    </div>
  );
}
