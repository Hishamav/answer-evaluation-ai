import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Octahedron, Sphere } from '@react-three/drei';

function LogoCore() {
  const outerRef = useRef<any>(null);
  const innerRef = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRef.current) {
        outerRef.current.rotation.y = t * 0.4;
        outerRef.current.rotation.z = t * 0.2;
    }
    if (innerRef.current) {
        innerRef.current.rotation.y = -t * 0.6;
        innerRef.current.scale.setScalar(0.45 + Math.sin(t * 1.5) * 0.05);
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Octahedron ref={outerRef} args={[1.1, 0]}>
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.2}
            wireframe={true}
            transparent={true}
            opacity={0.5}
          />
        </Octahedron>
        
        <Sphere ref={innerRef} args={[0.5, 32, 32]}>
          <MeshDistortMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.8}
            distort={0.4}
            speed={4}
            roughness={0}
            metalness={1}
          />
        </Sphere>
      </Float>
    </group>
  );
}

export default function ThreeLogo() {
  return (
    <div style={{ width: '42px', height: '42px', position: 'relative' }}>
      <Canvas 
        camera={{ position: [0, 0, 3] }} 
        dpr={[1, 2]} 
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
        <LogoCore />
      </Canvas>
    </div>
  );
}
