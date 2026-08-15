# Next.js & React Three Fiber Integration Guide

This project is built with WebGL (Three.js), GLSL Shaders, and GSAP. If you want to deploy or convert this project into a **Next.js + TypeScript + React Three Fiber (R3F)** app, follow the instructions below.

---

## 1. Installation

```bash
npx create-next-app@latest my-obsidian-portfolio --typescript --tailwind --eslint
cd my-obsidian-portfolio

# Install Three.js, React Three Fiber, Drei, and GSAP
npm install three @types/three @react-three/fiber @react-three/drei gsap lucide-react
```

---

## 2. React Three Fiber Shader Component (`components/LiquidMirror.tsx`)

```tsx
'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uIdleStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float idleWave = sin(pos.x * 2.5 + uTime * 1.2) * cos(pos.y * 2.0 + uTime * 1.0) * 0.15;
    pos.z += idleWave;
    vElevation = pos.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 baseColor = vec3(0.03, 0.04, 0.06);
    vec3 goldHighlight = vec3(0.83, 0.68, 0.21);
    vec3 col = mix(baseColor, goldHighlight * 0.4, smoothstep(-0.1, 0.2, vElevation));
    gl_FragColor = vec4(col, 0.95);
  }
`;

function MirrorPlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[6, 4, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export default function LiquidMirrorCanvas() {
  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <MirrorPlane />
      </Canvas>
    </div>
  );
}
```

---

## 3. Running Locally & Deploying

To run locally:
```bash
npm run dev
```
To deploy to Vercel:
```bash
git push origin main
# Import repository on https://vercel.com
```
