// src/components/SearchTopCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, RADII, SPACING, SHADOWS, TYPO } from '../styles/theme';

type Props = {
  selectedLabel: string;
  selectedLabelColor: string;
  radiusDraft: number;
  modeLabel: string;
  onOpenLocationModal: () => void;
  onOpenIntro: () => void;
  onRadiusChange: (v: number) => void;
  onRadiusComplete: (v: number) => void;
  variant?: 'compact' | 'full';
};

export default function SearchTopCard({
  selectedLabel,
  selectedLabelColor,
  radiusDraft,
  modeLabel,
  onOpenLocationModal,
  onOpenIntro,
  onRadiusChange,
  onRadiusComplete,
  variant = 'full',
}: Props) {
  const isCompact = variant === 'compact';

  // en compacto ocultamos el slider por defecto (expandible)
  const [showRadius, setShowRadius] = useState(!isCompact);

  return (
    <View style={styles.topCardWrapper} pointerEvents="box-none">
      <View style={[styles.topCard, isCompact && styles.topCardCompact]}>
        <View style={[styles.topCardHeaderRow, isCompact && styles.topCardHeaderRowCompact]}>
          <View style={{ flex: 1 }}>
            {!isCompact && <Text style={styles.topCardLabel}>Buscando servicios desde</Text>}

            <Text style={[styles.topCardLocation, { color: selectedLabelColor }]} numberOfLines={1}>
              {selectedLabel}
            </Text>

            <View style={styles.rowInline}>
              <Text style={styles.topCardRadiusLabel}>Radio: {Math.round(radiusDraft)} km</Text>

              {isCompact && (
                <TouchableOpacity
                  style={styles.radiusToggleBtn}
                  onPress={() => setShowRadius((v) => !v)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={showRadius ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
                  <Text style={styles.radiusToggleText}>{showRadius ? 'Ocultar' : 'Ajustar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.topButtonsCol}>
            <TouchableOpacity style={styles.changeLocationButton} onPress={onOpenLocationModal}>
              <Ionicons name="swap-vertical-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.changeLocationText}>Cambiar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.changeLocationButton} onPress={onOpenIntro}>
              <Ionicons name="options-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.changeLocationText}>{modeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showRadius && (
          <>
            <View style={[styles.sliderRow, isCompact && styles.sliderRowCompact]}>
              <Text style={styles.sliderLabel}>Radio de búsqueda</Text>
              <Text style={styles.sliderValue}>{Math.round(radiusDraft)} km</Text>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={30}
              step={1}
              value={radiusDraft}
              onValueChange={onRadiusChange}
              onSlidingComplete={onRadiusComplete}
              minimumTrackTintColor="#0284c7"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#0284c7"
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCardWrapper: {
    position: 'absolute',
    top: SPACING.md, // más cerca
    left: SPACING.lg,
    right: SPACING.lg,
  },

  topCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  topCardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  topCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },

  topCardHeaderRowCompact: {
    marginBottom: 6,
    gap: 10,
  },

  topCardLabel: { ...TYPO.caption },

  topCardLocation: { ...TYPO.h3 },

  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },

  topCardRadiusLabel: { ...TYPO.helper },

  radiusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgScreen,
  },

  radiusToggleText: { ...TYPO.label, color: COLORS.primary },

  topButtonsCol: { gap: SPACING.sm, alignItems: 'flex-end' },

  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgScreen,
  },

  changeLocationText: { ...TYPO.label, color: COLORS.primary },

  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  sliderRowCompact: { marginTop: 8 },

  sliderLabel: { ...TYPO.label },

  sliderValue: { ...TYPO.label, color: COLORS.textMuted },

  slider: { marginTop: SPACING.xs },
});
