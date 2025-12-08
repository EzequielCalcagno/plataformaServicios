// src/screens/Search.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, SPACING, RADII } from '../styles/theme';

// MOCK por ahora
type Service = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
};

const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    title: 'Plomero 24 hs',
    category: 'Plomería',
    latitude: -34.9011,
    longitude: -56.1645,
  },
  {
    id: '2',
    title: 'Electricista certificado',
    category: 'Electricidad',
    latitude: -34.9035,
    longitude: -56.19,
  },
];

const POPULAR_RUBROS = [
  'Plomería',
  'Electricidad',
  'Pintura',
  'Carpintería',
  'Gas',
  'Limpieza',
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Service[]>(MOCK_SERVICES);
  const [showRubros, setShowRubros] = useState(false);

  const applyFilter = (text: string) => {
    const normalized = text.toLowerCase();
    if (!normalized) {
      setResults(MOCK_SERVICES);
      return;
    }

    setResults(
      MOCK_SERVICES.filter(
        s =>
          s.title.toLowerCase().includes(normalized) ||
          s.category.toLowerCase().includes(normalized),
      ),
    );
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    applyFilter(text);
  };

  const handleRubrosChipPress = (rubro: string) => {
    setQuery(rubro);
    applyFilter(rubro);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Mapa pantalla completa */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -34.9011,
          longitude: -56.1645,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {results.map(service => (
          <Marker
            key={service.id}
            coordinate={{
              latitude: service.latitude,
              longitude: service.longitude,
            }}
            title={service.title}
            description={service.category}
          />
        ))}
      </MapView>

      {/* Panel inferior: buscador + rubros + resultados */}
      <View style={styles.bottomPanel}>
        {/* Buscador abajo */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por servicio (plomero, electricista...)"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          onFocus={() => setShowRubros(true)}
        />

        {/* Chips de rubros populares cuando hace foco */}
        {showRubros && (
          <View style={styles.rubrosRow}>
            {POPULAR_RUBROS.map(rubro => (
              <TouchableOpacity
                key={rubro}
                style={styles.rubroChip}
                onPress={() => handleRubrosChipPress(rubro)}
                activeOpacity={0.8}
              >
                <Text style={styles.rubroChipText}>{rubro}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Resultados */}
        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            style={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} activeOpacity={0.8}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultCategory}>{item.category}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No encontramos servicios para “{query}”.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '45%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  searchInput: {
    fontSize: 14,
    color: COLORS.text,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  rubrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  rubroChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  rubroChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  resultsList: {
    marginTop: SPACING.xs,
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
