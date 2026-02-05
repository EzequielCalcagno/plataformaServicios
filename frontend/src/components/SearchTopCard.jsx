// src/components/SearchTopCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, RADII, SPACING, SHADOWS, TYPO } from '../styles/theme';


export default function SearchTopCard({
  selectedLabel,
  selectedLabelColor,
  radiusDraft,
  modeLabel,
  onOpenLocationModal,
  onOpenIntro,
  onRadiusChange,
  onRadiusComplete,
}) {
  return (
    <View style={styles.topCardWrapper} pointerEvents="box-none">
      <View style={styles.topCard}>
        <View style={styles.topCardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topCardLabel}>Buscando servicios desde</Text>

            <Text style={[styles.topCardLocation, { color: selectedLabelColor }]} numberOfLines={1}>
              {selectedLabel}
            </Text>

            <Text style={styles.topCardRadiusLabel}>Radio: {Math.round(radiusDraft)} km</Text>
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

        <View style={styles.sliderRow}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCardWrapper: {
    position: 'absolute',
    top: SPACING.lg,      // 16
    left: SPACING.lg,     // 16
    right: SPACING.lg,    // 16
  },

  topCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg, // 24
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  topCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },

  topCardLabel: {
    ...TYPO.caption,
  },

  topCardLocation: {
    ...TYPO.h3,
    // color se pisa con selectedLabelColor desde props
  },

  topCardRadiusLabel: {
    ...TYPO.helper,
    marginTop: SPACING.xs,
  },

  topButtonsCol: {
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },

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

  changeLocationText: {
    ...TYPO.label,
    color: COLORS.primary,
  },

  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  sliderLabel: {
    ...TYPO.label,
  },

  sliderValue: {
    ...TYPO.label,
    color: COLORS.textMuted,
  },

  slider: {
    marginTop: SPACING.xs,
  },
});
