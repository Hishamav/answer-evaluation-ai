import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring, Text, MeshDistortMaterial, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

function OrbitingParticles({ color }) {
  const pointsRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 50; i++) {
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * Math.PI * 2;
        const r = 2 + Math.random() * 0.5;
        temp.push(new THREE.Vector3(r * Math.cos(t) * Math.sin(u), r * Math.sin(t) * Math.sin(u), r * Math.cos(u)));
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
        pointsRef.current.rotation.y += 0.01;
        pointsRef.current.rotation.z += 0.005;
    }
  });

  return (
    <group ref={pointsRef}>
      {particles.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ScoreRing({ score }) {
  const ringRef = useRef();
  const targetScale = score / 100;
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
        ringRef.current.rotation.z = t * 0.4;
    }
  });

  const color = new THREE.Color().setHSL(targetScale * 0.35, 1, 0.5);

  return (
    <group>
      {/* Outer Glow Ring - Scaled down */}
      <Ring args={[1.2, 1.3, 64]}>
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </Ring>
      
      {/* Dynamic Score Ring - Scaled down */}
      <Ring ref={ringRef} args={[1.0, 1.15, 64, 1, 0, Math.PI * 2 * targetScale]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </Ring>

      {/* Center Text - Simplified text component */}
      <Text
        position={[0, 0, 0.2]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(score)}%
      </Text>

      <OrbitingParticles color={color} />
    </group>
  );
}

export default function ThreeScore({ score }) {
  return (
    <div style={{ width: '200px', height: '200px', margin: '0 auto' }}>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="white" />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <ScoreRing score={score} />
        </Float>
      </Canvas>
    </div>
  );
}
