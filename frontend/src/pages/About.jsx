import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Brain, Shield, Zap, Globe, Cpu, FileSearch, Database, FileCheck, Layers, ClipboardCheck } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

function Hologram() {
  const meshRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
        meshRef.current.rotation.x = Math.cos(t / 4) / 4;
        meshRef.current.rotation.y = Math.sin(t / 2) / 2;
        meshRef.current.rotation.z = Math.sin(t / 8) / 4;
    }
  });

  return (
    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#6366f1"
          emissive="#22d3ee"
          emissiveIntensity={1}
          distort={0.45}
          speed={3}
          metalness={0.9}
          roughness={0.1}
          wireframe
        />
      </Sphere>
    </Float>
  );
}

export default function About() {
  const sectionsRef = useRef([]);

  useEffect(() => {
    sectionsRef.current.forEach((section, i) => {
      if (!section) return;
      gsap.fromTo(section, 
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, []);

  return (
    <div className="about-container">
      <header className="about-hero" ref={el => sectionsRef.current[0] = el}>
        <div className="hologram-wrapper">
          <Canvas camera={{ position: [0, 0, 3] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#22d3ee" />
            <Hologram />
          </Canvas>
          <div className="hologram-glow" />
        </div>
        <div className="about-hero-text">
          <h1>THE <span className="text-gradient">GENESIS</span></h1>
          <p>EvalAI Nexus is the world's most advanced autonomous answer evaluation platform. We've built an ecosystem that decodes student logic with the precision of a master scholar and the speed of a supercomputer.</p>
        </div>
      </header>

      {/* NEW: Product Definition */}
      <section className="about-intro-section glass-panel" ref={el => sectionsRef.current[6] = el}>
        <div className="section-head">
            <Layers size={40} className="icon-blue" />
            <h2>What is EvalAI Nexus?</h2>
        </div>
        <p className="heavy-text">
           EvalAI Nexus is an end-to-end "Artificial Evaluator" designed to automate the painful process of grading handwritten and printed academic papers. 
           Unlike traditional OMR systems that only check bubbles, the Nexus understands **Semantic Meaning**—meaning it can grade sentences, essays, and technical definitions correctly even if the words don't match the key word-for-word.
        </p>
      </section>

      {/* NEW: How it Works */}
      <section className="how-it-works" ref={el => sectionsRef.current[7] = el}>
          <h2 className="center-title">The Evaluation Lifecycle</h2>
          <div className="workflow-steps">
                <div className="workflow-item glass-panel">
                    <div className="step-num">01</div>
                    <Database size={24} className="icon-purple" />
                    <h4>Define Schema</h4>
                    <p>Teachers define the exam structure, sections, and mark weightage in seconds using our intuitive config suite.</p>
                </div>
                <div className="workflow-item glass-panel">
                    <div className="step-num">02</div>
                    <FileSearch size={24} className="icon-blue" />
                    <h4>OCR Ingestion</h4>
                    <p>Scanned PDFs are fed into our neural pipeline. We extract questions from the Master Key and answers from student scripts.</p>
                </div>
                <div className="workflow-item glass-panel">
                    <div className="step-num">03</div>
                    <Brain size={24} className="icon-pink" />
                    <h4>Semantic Sync</h4>
                    <p>Our NLP models compare the "Context" of the student's answer against the Master Key using Cosine Similarity metrics.</p>
                </div>
                <div className="workflow-item glass-panel">
                    <div className="step-num">04</div>
                    <ClipboardCheck size={24} className="icon-green" />
                    <h4>Holistic Report</h4>
                    <p>Get a detailed PDF report with breakdown scores, total marks, and semantic match efficiency logs.</p>
                </div>
          </div>
      </section>

      <section className="about-grid">
        <div className="about-card glass-panel" ref={el => sectionsRef.current[1] = el}>
          <div className="about-icon neon-blue"><Cpu size={32} /></div>
          <h3>Neural Extraction</h3>
          <p>Our custom-trained OCR engine decodes complex handwriting from any document fragment with pinpoint accuracy.</p>
        </div>
        
        <div className="about-card glass-panel" ref={el => sectionsRef.current[2] = el}>
          <div className="about-icon neon-purple"><Shield size={32} /></div>
          <h3>Bias Elimination</h3>
          <p>Eliminate human grading inconsistencies. Our semantic algorithm ensures every answer is evaluated objectively.</p>
        </div>

        <div className="about-card glass-panel" ref={el => sectionsRef.current[3] = el}>
          <div className="about-icon neon-pink"><Zap size={32} /></div>
          <h3>Real-time Speed</h3>
          <p>Process entire batches of answer sheets in seconds, reducing evaluation cycles from weeks to minutes.</p>
        </div>

        <div className="about-card glass-panel" ref={el => sectionsRef.current[4] = el}>
          <div className="about-icon neon-green"><Globe size={32} /></div>
          <h3>Universal Protocol</h3>
          <p>Supporting multiple global academic standards, the Nexus is the ultimate evaluation companion.</p>
        </div>
      </section>

      <footer className="about-footer glass-panel" ref={el => sectionsRef.current[5] = el}>
        <h2>Ready to Upgrade Your Institution?</h2>
        <p>Join the Nexus and experience the evolution of automatic evaluation.</p>
        <div className="footer-links" style={{ marginTop: '2rem' }}>
          <a href="/evaluate" className="btn btn-primary">GO TO EVALUATOR</a>
          <a href="/" className="btn btn-secondary">BACK TO HOME</a>
        </div>
      </footer>
    </div>
  );
}
