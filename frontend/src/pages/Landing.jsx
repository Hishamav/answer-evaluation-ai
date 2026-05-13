import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Sparkles, Brain, CheckCircle, UploadCloud } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' })
      .fromTo(textRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, "-=0.4")
      .fromTo('.hero-btn', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, "-=0.2")
      .fromTo(cardsRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'power2.out' }, "-=0.2");
  }, []);

  return (
    <div className="landing-page" ref={heroRef}>
      <header className="hero-section">
        <h1 ref={titleRef}>Welcome to <br/><span className="text-gradient">EvalAI Nexus</span></h1>
        <p ref={textRef} className="hero-subtitle">
          Quantum-grade neural evaluation system. Analyze answer sheets with pinpoint OCR precision and multi-layer NLP semantic synthesis.
        </p>
        <div className="hero-btn">
          <Link to="/evaluate" className="btn btn-primary cta-btn">
            <Sparkles size={20} /> Initialize Core
          </Link>
        </div>
      </header>
      
      <section className="features-grid">
        <div className="feature-card glass-panel" ref={el => cardsRef.current[0] = el}>
          <div className="feature-icon bg-blue"><UploadCloud size={28} /></div>
          <h3>Smart Upload</h3>
          <p>Drag & drop scanned PDF or image answer sheets.</p>
        </div>
        <div className="feature-card glass-panel" ref={el => cardsRef.current[1] = el}>
          <div className="feature-icon bg-purple"><Brain size={28} /></div>
          <h3>OCR & NLP</h3>
          <p>Extracts text and applies advanced NLP processing for semantic matching.</p>
        </div>
        <div className="feature-card glass-panel" ref={el => cardsRef.current[2] = el}>
          <div className="feature-icon bg-green"><CheckCircle size={28} /></div>
          <h3>Instant Evaluation</h3>
          <p>Compare with model answer via cosine similarity and get instant marks.</p>
        </div>
      </section>
    </div>
  );
}
