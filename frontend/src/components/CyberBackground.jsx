import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Ring, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function MouseLight({ mouse }) {
  const lightRef = useRef();
  
  useFrame(() => {
    if (lightRef.current) {
        // Move light directly to normalized mouse position
        const x = (mouse.current[0] / window.innerWidth) * 20;
        const y = -(mouse.current[1] / window.innerHeight) * 20;
        lightRef.current.position.set(x, y, 5);
    }
  });

  return <pointLight ref={lightRef} intensity={3} distance={15} color="#22d3ee" />;
}

function CyberRings({ mouse }) {
  const outerRef = useRef();
  const innerRef = useRef();
  const outerGroup = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRef.current) outerRef.current.rotation.z = -t * 0.15;
    if (innerRef.current) innerRef.current.rotation.x = t * 0.3;
    if (innerRef.current) innerRef.current.rotation.y = t * 0.4;
    
    // EXTREMELY Smooth Parallax
    if (outerGroup.current) {
        const targetX = (mouse.current[0] * 0.003);
        const targetY = (mouse.current[1] * -0.003);
        
        // Slower Lerp (0.012) for ultra smoothness
        outerGroup.current.position.x += (targetX - outerGroup.current.position.x) * 0.012;
        outerGroup.current.position.y += (targetY - outerGroup.current.position.y) * 0.012;
    }
  });

  return (
    <group ref={outerGroup}>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.2} floatingRange={[-0.3, 0.3]}>
        <Ring ref={outerRef} args={[3.2, 3.3, 6]} rotation={[Math.PI / 2.5, 0, 0]}>
          <meshBasicMaterial color="#22d3ee" wireframe />
        </Ring>

        <Ring ref={innerRef} args={[2.0, 2.1, 16]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.5} wireframe />
        </Ring>
        
        <Sphere args={[1.2, 64, 64]}>
          <MeshDistortMaterial 
            color="#6366f1" 
            emissive="#4f46e5" 
            emissiveIntensity={1.2} 
            distort={0.4} 
            speed={1.5} 
            roughness={0.1}
            metalness={0.9}
            wireframe={true}
          />
        </Sphere>
      </Float>
    </group>
  );
}

function Particles({ mouse }) {
  const count = 200;
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 50;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Target position based on mouse
      const mX = (mouse.current[0] / window.innerWidth) * 20;
      const mY = -(mouse.current[1] / window.innerHeight) * 20;
      
      particle.mx += (mX - particle.mx) * 0.01;
      particle.my += (mY - particle.my) * 0.01;

      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * s + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.1, 0]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

export default function CyberBackground() {
  const mouse = useRef([0, 0]);

  const onMouseMove = (e) => {
    mouse.current = [e.clientX - window.innerWidth / 2, e.clientY - window.innerHeight / 2];
  };

  return (
    <div 
      onMouseMove={onMouseMove}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: '#020617', overflow: 'hidden' }}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <MouseLight mouse={mouse} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={2} />
        <CyberRings mouse={mouse} />
        <Particles mouse={mouse} />
      </Canvas>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, transparent 0%, #020617 100%)', pointerEvents: 'none' }} />
    </div>
  );
}
