import React, { useRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer, loadAsync, THREE } from 'expo-three';
import { Asset } from 'expo-asset';

interface Props {
  onExit: () => void;
}

export function HouseWalkthrough({ onExit }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutable state shared with the render loop
  const stateRef = useRef({
    yaw: Math.PI,          // start looking toward the house
    pitch: -0.15,
    keys: new Set<string>(),
    // Mobile look
    looking: false,
    lastX: 0,
    lastY: 0,
    // Mobile move stick
    stickActive: false,
    stickX: 0,             // -1 .. 1
    stickY: 0,
  });

  // ─── Mobile touch handlers ────────────────────────────────────────────────
  const lookPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        stateRef.current.looking = true;
        stateRef.current.lastX = e.nativeEvent.pageX;
        stateRef.current.lastY = e.nativeEvent.pageY;
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const s = stateRef.current;
        if (!s.looking) return;
        const dx = e.nativeEvent.pageX - s.lastX;
        const dy = e.nativeEvent.pageY - s.lastY;
        s.lastX = e.nativeEvent.pageX;
        s.lastY = e.nativeEvent.pageY;

        const sensitivity = 0.004;
        s.yaw -= dx * sensitivity;
        s.pitch -= dy * sensitivity;
        s.pitch = Math.max(-1.4, Math.min(1.4, s.pitch));
      },
      onPanResponderRelease: () => {
        stateRef.current.looking = false;
      },
    })
  ).current;

  const onContextCreate = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x87ceeb);
      // @ts-ignore
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 40, 140);

      const camera = new THREE.PerspectiveCamera(
        70,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.08,
        250
      );
      // Start a few meters outside, facing the long side of the container
      camera.position.set(0, 1.65, 12);

      // Lights
      const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 1.0);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xfff5e6, 1.6);
      sun.position.set(15, 30, 12);
      scene.add(sun);

      const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
      fill.position.set(-12, 10, -8);
      scene.add(fill);

      // Simple ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 60),
        new THREE.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.95 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      scene.add(ground);

      // Load model
      const asset = Asset.fromModule(require('../../assets/container_house.glb'));
      await asset.downloadAsync();

      const gltf = await loadAsync(asset.localUri || asset.uri);
      const model = gltf.scene;

      // Center the model on the ground
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y; // sit on y=0

      model.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material) {
            obj.material.side = THREE.DoubleSide;
          }
        }
      });

      scene.add(model);
      setReady(true);

      // ─── Web keyboard + pointer lock ───────────────────────────────────────
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const canvas: HTMLCanvasElement =
          (gl as any).canvas || document.querySelector('canvas');

        const onKeyDown = (e: KeyboardEvent) => stateRef.current.keys.add(e.code);
        const onKeyUp = (e: KeyboardEvent) => stateRef.current.keys.delete(e.code);

        const onMouseMove = (e: MouseEvent) => {
          if (document.pointerLockElement !== canvas) return;
          const sens = 0.002;
          stateRef.current.yaw -= e.movementX * sens;
          stateRef.current.pitch -= e.movementY * sens;
          stateRef.current.pitch = Math.max(-1.45, Math.min(1.45, stateRef.current.pitch));
        };

        const onClick = () => canvas?.requestPointerLock?.();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousemove', onMouseMove);
        canvas?.addEventListener('click', onClick);
      }

      // ─── Render / simulation loop ──────────────────────────────────────────
      const clock = new THREE.Clock();
      const SPEED = 3.8;
      const EYE = 1.65;

      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const s = stateRef.current;

        // Look
        camera.rotation.order = 'YXZ';
        camera.rotation.y = s.yaw;
        camera.rotation.x = s.pitch;

        // Movement vector in camera space
        let mx = 0;
        let mz = 0;

        if (Platform.OS === 'web') {
          if (s.keys.has('KeyW') || s.keys.has('ArrowUp')) mz -= 1;
          if (s.keys.has('KeyS') || s.keys.has('ArrowDown')) mz += 1;
          if (s.keys.has('KeyA') || s.keys.has('ArrowLeft')) mx -= 1;
          if (s.keys.has('KeyD') || s.keys.has('ArrowRight')) mx += 1;
        } else {
          // Virtual stick values written by the UI
          mx = s.stickX;
          mz = s.stickY;
        }

        if (mx !== 0 || mz !== 0) {
          const len = Math.hypot(mx, mz) || 1;
          mx /= len;
          mz /= len;

          const sin = Math.sin(s.yaw);
          const cos = Math.cos(s.yaw);

          // forward = (-sin, 0, -cos), right = (cos, 0, -sin)
          const dx = (-sin * -mz + cos * mx) * SPEED * dt;
          const dz = (-cos * -mz + -sin * mx) * SPEED * dt;

          camera.position.x += dx;
          camera.position.z += dz;
        }

        camera.position.y = EYE;

        renderer.render(scene, camera);
        gl.endFrameEXP();
        requestAnimationFrame(tick);
      };

      tick();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load model');
    }
  }, []);

  // Simple virtual joystick for mobile
  const stickPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        stateRef.current.stickActive = true;
      },
      onPanResponderMove: (_, gesture) => {
        const max = 50;
        const x = Math.max(-max, Math.min(max, gesture.dx)) / max;
        const y = Math.max(-max, Math.min(max, gesture.dy)) / max;
        stateRef.current.stickX = x;
        stateRef.current.stickY = y; // positive dy = backward
      },
      onPanResponderRelease: () => {
        stateRef.current.stickActive = false;
        stateRef.current.stickX = 0;
        stateRef.current.stickY = 0;
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />

      {/* Full-screen look area (mobile) */}
      {Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill} {...lookPan.panHandlers} />
      )}

      {/* HUD */}
      <View style={styles.hud} pointerEvents="box-none">
        <Pressable style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </Pressable>

        {!ready && !error && (
          <View style={styles.centerOverlay}>
            <Text style={styles.loadingText}>Loading container house…</Text>
            <Text style={styles.loadingSub}>41 MB · first load may take a moment</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {ready && Platform.OS === 'web' && (
          <Text style={styles.bottomHint}>
            Click scene to capture mouse · WASD / Arrows to walk · Esc releases pointer
          </Text>
        )}

        {/* Virtual joystick (mobile only) */}
        {Platform.OS !== 'web' && ready && (
          <View style={styles.joystickZone} {...stickPan.panHandlers}>
            <View style={styles.joystickBase}>
              <View style={styles.joystickKnob} />
            </View>
            <Text style={styles.joystickLabel}>Move</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gl: {
    flex: 1,
  },
  hud: {
    ...StyleSheet.absoluteFillObject,
  },
  exitBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  exitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSub: {
    color: '#999',
    marginTop: 8,
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomHint: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  joystickZone: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickBase: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickKnob: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  joystickLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 6,
  },
});
