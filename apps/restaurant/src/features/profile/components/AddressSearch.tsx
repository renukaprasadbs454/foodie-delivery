import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Text, TextInput, useTheme } from 'foodie-shared-rn';
import type { AddressSuggestion } from '../location/locationTypes';
import { searchAddressSuggestions } from '../location/locationService';

interface Props {
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
}

const ACCENT_COLOR = '#F59E0B';

export function AddressSearch({ onSelectSuggestion }: Props) {
  const { tokens } = useTheme();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      void (async () => {
        try {
          const results = await searchAddressSuggestions(query);
          setSuggestions(results);
        } catch (_err) {
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (item: AddressSuggestion) => {
    setQuery(item.title);
    setSuggestions([]);
    onSelectSuggestion(item);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
  };

  return (
    <View style={{ position: 'relative', zIndex: 30 }}>
      {/* Search Input Box */}
      <View style={{ position: 'relative' }}>
        <TextInput
          label=""
          value={query}
          onChangeText={setQuery}
          placeholder="🔍 Search restaurant address, area, or landmark..."
          accessibilityLabel="Search restaurant address"
        />

        {/* Clear & Loading Action Overlays */}
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color={ACCENT_COLOR} />
          ) : query ? (
            <Pressable
              onPress={handleClear}
              style={{
                padding: 4,
                borderRadius: 12,
                backgroundColor: '#E2E8F0',
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
            >
              <Text style={{ fontSize: 12, color: '#475569' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Suggestions Dropdown Card */}
      {suggestions.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#CBD5E1',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            maxHeight: 220,
            overflow: 'hidden',
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {suggestions.map((item, index) => (
              <Pressable
                key={item.id || index}
                onPress={() => handleSelect(item)}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                  borderBottomColor: '#F1F5F9',
                  backgroundColor: pressed ? '#FEF3C7' : '#FFFFFF',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                })}
                accessibilityRole="button"
                accessibilityLabel={`Select address: ${item.title}`}
              >
                <Text style={{ fontSize: 16 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#0F172A',
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      color: '#64748B',
                      fontSize: 12,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
