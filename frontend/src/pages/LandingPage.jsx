import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// ── Animated counter hook ────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ── Intersection observer hook ───────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Floating particle ────────────────────────────────────────
function Particle({ x, y, size, delay, duration }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(245,158,11,0.15)',
      animation: `floatUp ${duration}s ${delay}s infinite ease-in-out`,
      pointerEvents: 'none',
    }} />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 6 + 2,
  delay: Math.random() * 4,
  duration: Math.random() * 4 + 4,
}));

export default function LandingPage() {
  const navigate = useNavigate();
  const [statsRef, statsInView] = useInView();
  const [heroVisible, setHeroVisible] = useState(false);
  const c1 = useCounter(10000, 2200, statsInView);
  const c2 = useCounter(500, 1800, statsInView);
  const c3 = useCounter(99, 1500, statsInView);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const [featRef, featInView] = useInView(0.1);
  const [pricingRef, pricingInView] = useInView(0.1);

  return (
    <div style={{ minHeight: '100vh', background: '#080809', color: '#fff', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflowX: 'hidden' }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.7; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); }
          50%       { box-shadow: 0 0 50px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.3); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes boltPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.6)); }
          50%       { filter: drop-shadow(0 0 24px rgba(245,158,11,1)); }
        }
        .btn-primary-land:hover {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 0 60px rgba(245,158,11,0.5) !important;
        }
        .btn-secondary-land:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.4) !important;
        }
        .feature-card:hover {
          border-color: rgba(245,158,11,0.4) !important;
          transform: translateY(-4px) !important;
          background: rgba(245,158,11,0.05) !important;
        }
        .nav-link:hover { color: #f59e0b !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080809; }
        ::-webkit-scrollbar-thumb { background: #f59e0b44; border-radius: 3px; }
      `}</style>

      {/* ── Background effects ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Radial amber glow top */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '60vh',
          background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Floating particles */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: 'rgba(8,8,9,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.6s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, animation: 'boltPulse 3s ease-in-out infinite',
          }}>⚡</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px' }}>AttendFlow</span>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500,
              textDecoration: 'none', transition: 'color 0.2s',
            }}>{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} className="btn-secondary-land" style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.8)', padding: '8px 18px', borderRadius: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
          }}>Sign In</button>
          <button onClick={() => navigate('/register')} className="btn-primary-land" style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#000', padding: '8px 18px', borderRadius: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 0.25s',
          }}>Get Started →</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '110px 24px 80px', maxWidth: 860, margin: '0 auto' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#f59e0b',
          marginBottom: 32, fontWeight: 500,
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulseGlow 2s infinite' }} />
          Modern Attendance Management Platform
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: 'clamp(40px, 7vw, 76px)',
          fontWeight: 800, lineHeight: 1.05, marginBottom: 28, letterSpacing: '-2px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s 0.15s ease',
        }}>
          <span style={{ color: '#fff' }}>Track Teams.</span><br />
          <span style={{
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}>Real-time.</span><br />
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>Effortlessly.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
          maxWidth: 520, margin: '0 auto 44px',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s 0.3s ease',
        }}>
          One platform for check-ins, attendance reports, and team management.
          Built for modern companies — office, remote, and hybrid.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s 0.45s ease',
        }}>
          <button onClick={() => navigate('/register')} className="btn-primary-land" style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', color: '#000', padding: '15px 36px', borderRadius: 10,
            cursor: 'pointer', fontSize: 16, fontWeight: 700, transition: 'all 0.25s',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}>Start Free Trial →</button>
          <button onClick={() => navigate('/login')} className="btn-secondary-land" style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.8)', padding: '15px 36px', borderRadius: 10,
            cursor: 'pointer', fontSize: 16, fontWeight: 500, transition: 'all 0.2s',
          }}>Sign In to Dashboard</button>
        </div>

        <p style={{
          marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.2)',
          opacity: heroVisible ? 1 : 0, transition: 'opacity 0.7s 0.6s ease',
        }}>No credit card required · Try For Free!</p>

        {/* Decorative ring */}
        <div style={{
          position: 'absolute', top: '10%', right: '-5%', width: 300, height: 300,
          border: '1px solid rgba(245,158,11,0.08)', borderRadius: '50%',
          animation: 'rotateSlow 20s linear infinite', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
            border: '1px solid rgba(245,158,11,0.05)', borderRadius: '50%',
          }} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'center', gap: 0,
        maxWidth: 700, margin: '0 auto 80px',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20,
        overflow: 'hidden', background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
      }}>
        {[
          { value: c1, suffix: '+', label: 'Check-ins Tracked' },
          { value: c2, suffix: '+', label: 'Companies' },
          { value: c3, suffix: '.9%', label: 'Uptime SLA' },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, padding: '32px 24px', textAlign: 'center',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800,
              color: '#f59e0b', lineHeight: 1,
            }}>{s.value.toLocaleString()}{s.suffix}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featRef} style={{ position: 'relative', zIndex: 1, padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>FEATURES</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
            Team Attendance
          </h2>
	  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 14 }}>
            Finally Tracked & Apparently Logged.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Built for modern workplaces. No bloat, no complexity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {[
            { icon: '⚡', title: 'One-Click Check In', desc: 'Check in from any device in seconds. Office, WFH, or remote — all tracked instantly.', color: '#f59e0b' },
            { icon: '📊', title: 'Live Dashboard', desc: "See who's in, who's WFH, and who's absent in real-time. No manual roll calls.", color: '#06b6d4' },
            { icon: '📈', title: 'Powerful Reports', desc: 'Attendance trends, daily breakdowns, and one-click CSV exports for payroll.', color: '#10b981' },
            { icon: '👥', title: 'Team Management', desc: 'Invite employees by email, manage roles, and organise departments effortlessly.', color: '#8b5cf6' },
            { icon: '🔒', title: 'Multi-tenant Security', desc: "Each company's data is fully isolated. Enterprise-grade security out of the box.", color: '#f43f5e' },
            { icon: '📋', title: 'Full Audit Trail', desc: 'Every action logged. Know exactly what happened, when, and by whom.', color: '#f59e0b' },
          ].map((f, i) => (
            <div key={f.title} className="feature-card" style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '28px 24px', transition: 'all 0.3s ease', cursor: 'default',
              opacity: featInView ? 1 : 0, transform: featInView ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.5s ${i * 0.08}s ease, transform 0.5s ${i * 0.08}s ease, border-color 0.3s, background 0.3s`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                background: `${f.color}18`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricingRef} style={{
        position: 'relative', zIndex: 1, padding: '80px 24px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>PRICING</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Start free, upgrade as you grow.</p>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 960, margin: '0 auto' }}>
          {[
            {
              plan: 'Free', price: '$0', period: '/trial', seats: 'Up to 10 seats',
              features: ['Basic check-in / check-out', 'Attendance dashboard', 'Email invites', '7-day audit log'],
              cta: 'Get Started Free',
              style: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', accent: 'rgba(255,255,255,0.7)', btnBg: 'transparent', btnBorder: 'rgba(255,255,255,0.15)', btnColor: '#fff' },
            },
            {
              plan: 'Pro', price: '$49', period: '/month', seats: 'Up to 100 seats',
              features: ['Everything in Free', 'Advanced analytics', 'CSV & PDF exports', 'Priority support', '90-day audit log'],
              cta: 'Start Pro Trial', popular: true,
              style: { background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.35)', accent: '#f59e0b', btnBg: 'linear-gradient(135deg,#f59e0b,#d97706)', btnBorder: 'none', btnColor: '#000' },
            },
            {
              plan: 'Enterprise', price: '$199', period: '/month', seats: 'Up to 500 seats',
              features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'Unlimited audit log'],
              cta: 'Contact Sales',
              style: { background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.25)', accent: '#a78bfa', btnBg: 'transparent', btnBorder: 'rgba(139,92,246,0.4)', btnColor: '#a78bfa' },
            },
          ].map((p, i) => (
            <div key={p.plan} style={{
              width: 280, borderRadius: 20, padding: '32px 28px', position: 'relative',
              background: p.style.background, border: p.style.border,
              opacity: pricingInView ? 1 : 0,
              transform: pricingInView ? 'translateY(0)' : 'translateY(32px)',
              transition: `opacity 0.6s ${i * 0.15}s ease, transform 0.6s ${i * 0.15}s ease`,
              ...(p.popular ? { boxShadow: '0 0 60px rgba(245,158,11,0.12)', transform: pricingInView ? 'translateY(-8px)' : 'translateY(32px)' } : {}),
            }}>
              {p.popular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000', fontSize: 11, fontWeight: 800,
                  padding: '5px 16px', borderRadius: 100, letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>
              )}

              <div style={{ fontSize: 13, color: p.style.accent, fontWeight: 700, marginBottom: 10, letterSpacing: '0.5px' }}>{p.plan.toUpperCase()}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>
                {p.price}
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 400, letterSpacing: 0 }}>{p.period}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '8px 0 24px', fontWeight: 500 }}>{p.seats}</div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: p.style.accent, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => navigate('/register')} className="btn-primary-land" style={{
                width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: p.style.btnBg, border: `1px solid ${p.style.btnBorder}`,
                color: p.style.btnColor, fontWeight: 700, fontSize: 14,
                transition: 'all 0.25s', fontFamily: 'inherit',
              }}>{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        margin: '40px 24px 80px', borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))',
        border: '1px solid rgba(245,158,11,0.2)',
        padding: '64px 24px', textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: '200%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
          Organized Layout, Unlike Your Group Chats.

        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 36 }}>
          Join hundreds of teams already using AttendFlow.
        </p>
        <button onClick={() => navigate('/register')} className="btn-primary-land" style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', color: '#000', padding: '16px 44px', borderRadius: 12,
          cursor: 'pointer', fontSize: 17, fontWeight: 800, transition: 'all 0.25s',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}>Start Free — No Credit Card Needed, As Of Now→</button>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>⚡</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>AttendFlow</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>© 2026 AttendFlow. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
