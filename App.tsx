import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HouseWalkthrough } from './src/components/HouseWalkthrough';

export default function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    // Small delay so the loading UI shows before the heavy GLB load begins
    setTimeout(() => {
      setStarted(true);
      setLoading(false);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {!started ? (
        <View style={styles.menu}>
          <Text style={styles.title}>40ft Container House</Text>
          <Text style={styles.subtitle}>First-person walkthrough</Text>
          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Click to lock pointer · WASD to move · Mouse to look'
              : 'Drag to look · Virtual joystick to move'}
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enter House</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <HouseWalkthrough onExit={() => setStarted(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  menu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 32,
  },
  hint: {
    fontSize: 13,
    color: '#707080',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
