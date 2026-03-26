import React, { useState } from 'react';
import api from '../../services/api';
import './PresentationGenerator.css';

const PresentationGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const generatePresentation = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.get('/presentation/data');
      const { data } = res.data;

      const html = buildPresentationHTML(data);

      // Trigger download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yodeco-awards-presentation.html';
      a.click();
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: 'Presentation downloaded successfully!' });
    } catch (err) {
      console.error('Presentation generation error:', err);
      setStatus({ type: 'error', message: 'Failed to generate presentation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="presentation-generator">
      <div className="presentation-generator__header">
        <div className="presentation-generator__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3>Awards Presentation</h3>
          <p>Generate a standalone HTML slideshow of all award categories, nominees, and winners.</p>
        </div>
      </div>

      <ul className="presentation-generator__features">
        <li>Category intro slides</li>
        <li>Award title slides</li>
        <li>Nominee showcase slides</li>
        <li>Winner / leading nominee reveal slide</li>
        <li>Keyboard &amp; click navigation, auto-play, fullscreen</li>
      </ul>

      <button
        className="presentation-generator__btn"
        onClick={generatePresentation}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="presentation-generator__spinner" />
            Generating...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V3M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Download Presentation
          </>
        )}
      </button>

      {status && (
        <div className={`presentation-generator__status presentation-generator__status--${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

// ─── HTML Builder ────────────────────────────────────────────────────────────

function buildPresentationHTML(categories) {
  const slides = [];

  categories.forEach(category => {
    // 1. Category intro slide (only once per category)
    slides.push({ type: 'category', category });

    category.awards.forEach(award => {
      // 2. Award title slide
      slides.push({ type: 'award', category, award });

      // 3. Nominees slide (all nominees together)
      if (award.nominees.length > 0) {
        slides.push({ type: 'nominees', category, award, nominees: award.nominees });
      }

      // 4. Winner / leading nominee slide
      if (award.winner) {
        slides.push({ type: 'winner', category, award, winner: award.winner });
      }
    });
  });

  const slidesJSON = JSON.stringify(slides);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>YODECO Awards Presentation</title>
<style>
${presentationCSS()}
</style>
</head>
<body>
<div id="app">
  <div id="slide-container">
    <div id="slide"></div>
  </div>
  <div class="nav-controls">
    <button class="nav-btn" id="btn-prev" onclick="prevSlide()">&#8592;</button>
    <div class="slide-info">
      <span id="slide-counter">1 / 1</span>
      <div class="progress-wrap"><div id="progress-bar"></div></div>
    </div>
    <button class="nav-btn" id="btn-next" onclick="nextSlide()">&#8594;</button>
  </div>
  <button class="autoplay-btn" id="btn-autoplay" onclick="toggleAutoplay()">&#9654; Auto</button>
  <button class="fullscreen-btn" onclick="toggleFullscreen()">&#x26F6;</button>
</div>
<script>
const SLIDES = ${slidesJSON};
let current = 0;
let autoTimer = null;

function render(idx) {
  const s = SLIDES[idx];
  const el = document.getElementById('slide');
  el.className = 'slide slide--' + s.type;
  el.innerHTML = buildSlide(s);
  document.getElementById('slide-counter').textContent = (idx+1) + ' / ' + SLIDES.length;
  const pct = ((idx+1)/SLIDES.length*100).toFixed(1);
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('btn-prev').disabled = idx === 0;
  document.getElementById('btn-next').disabled = idx === SLIDES.length - 1;
  // Animate in
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
}

function buildSlide(s) {
  if (s.type === 'category') {
    return \`<div class="slide-inner slide-category">
      <div class="category-badge">Category</div>
      <h1 class="category-name">\${esc(s.category.name)}</h1>
      \${s.category.description ? \`<p class="category-desc">\${esc(s.category.description)}</p>\` : ''}
      <div class="category-count">\${s.category.awards.length} Award\${s.category.awards.length !== 1 ? 's' : ''}</div>
    </div>\`;
  }
  if (s.type === 'award') {
    return \`<div class="slide-inner slide-award">
      <div class="award-badge">Award</div>
      <h1 class="award-title">\${esc(s.award.title)}</h1>
      \${s.award.criteria ? \`<p class="award-criteria">\${esc(s.award.criteria)}</p>\` : ''}
      <div class="award-category-tag">\${esc(s.category.name)}</div>
    </div>\`;
  }
  if (s.type === 'nominees') {
    const cards = s.nominees.map(n => \`
      <div class="nominee-card">
        <div class="nominee-img-wrap">
          \${n.imageUrl
            ? \`<img src="\${n.imageUrl}" alt="\${esc(n.name)}" onerror="this.parentElement.innerHTML='<div class=nominee-img-placeholder><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\"><path d=\\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\\" fill=\\"currentColor\\"/></svg></div>'"/>\`
            : '<div class="nominee-img-placeholder"><svg viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg></div>'
          }
        </div>
        <div class="nominee-info">
          <div class="nominee-name">\${esc(n.name)}</div>
          \${n.votes > 0 ? \`<div class="nominee-votes">\${n.votes.toLocaleString()} vote\${n.votes !== 1 ? 's' : ''}</div>\` : ''}
        </div>
      </div>\`).join('');
    return \`<div class="slide-inner slide-nominees">
      <div class="nominees-header">
        <div class="nominees-badge">Nominees</div>
        <h2 class="nominees-award-title">\${esc(s.award.title)}</h2>
      </div>
      <div class="nominees-grid nominees-grid--\${Math.min(s.nominees.length, 4)}">\${cards}</div>
    </div>\`;
  }
  if (s.type === 'winner') {
    const w = s.winner;
    return \`<div class="slide-inner slide-winner">
      <div class="winner-glow"></div>
      <div class="winner-badge">&#127942; Winner / Leading</div>
      <div class="winner-img-wrap">
        \${w.imageUrl
          ? \`<img src="\${w.imageUrl}" alt="\${esc(w.name)}" onerror="this.parentElement.innerHTML='<div class=winner-img-placeholder><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\"><path d=\\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\\" fill=\\"currentColor\\"/></svg></div>'"/>\`
          : '<div class="winner-img-placeholder"><svg viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg></div>'
        }
      </div>
      <h1 class="winner-name">\${esc(w.name)}</h1>
      <div class="winner-award">\${esc(s.award.title)}</div>
      \${w.votes > 0 ? \`<div class="winner-votes">\${w.votes.toLocaleString()} votes</div>\` : ''}
      <div class="winner-stars">&#11088; &#11088; &#11088;</div>
    </div>\`;
  }
  return '';
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nextSlide() { if (current < SLIDES.length-1) { current++; render(current); } }
function prevSlide() { if (current > 0) { current--; render(current); } }

function toggleAutoplay() {
  const btn = document.getElementById('btn-autoplay');
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.textContent = '▶ Auto';
    btn.classList.remove('active');
  } else {
    autoTimer = setInterval(() => {
      if (current < SLIDES.length-1) { current++; render(current); }
      else { clearInterval(autoTimer); autoTimer = null; btn.textContent = '▶ Auto'; btn.classList.remove('active'); }
    }, 5000);
    btn.textContent = '⏸ Auto';
    btn.classList.add('active');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

render(0);
</script>
</body>
</html>`;
}

function presentationCSS() {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#398213;--green-dark:#2d6b0f;--gold:#C19E33;--gold-dark:#a6852b;
  --bg:#0a0a0a;--surface:rgba(255,255,255,0.05);--border:rgba(255,255,255,0.1);
  --text:#fff;--text-muted:rgba(255,255,255,0.7);
}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;overflow:hidden}
#app{height:100vh;display:flex;flex-direction:column;position:relative}
#slide-container{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
#slide-container::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(57,130,19,0.15) 0%,transparent 60%),radial-gradient(ellipse at 80% 50%,rgba(193,158,51,0.1) 0%,transparent 60%);pointer-events:none}
.slide{width:100%;height:100%;display:flex;align-items:center;justify-content:center;animation:slideIn 0.5s ease}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
.slide-inner{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;position:relative}

/* Category slide */
.slide-category{background:linear-gradient(135deg,rgba(57,130,19,0.2) 0%,rgba(193,158,51,0.1) 100%)}
.category-badge{background:var(--green);color:#fff;padding:.4rem 1.2rem;border-radius:20px;font-size:.85rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:1.5rem}
.category-name{font-size:clamp(2.5rem,6vw,5rem);font-weight:900;background:linear-gradient(135deg,#fff 0%,var(--gold) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1;margin-bottom:1rem}
.category-desc{font-size:1.2rem;color:var(--text-muted);max-width:600px;line-height:1.6;margin-bottom:1.5rem}
.category-count{background:var(--surface);border:1px solid var(--border);padding:.5rem 1.5rem;border-radius:20px;font-size:1rem;color:var(--gold)}

/* Award slide */
.slide-award{background:linear-gradient(135deg,rgba(193,158,51,0.15) 0%,rgba(57,130,19,0.1) 100%)}
.award-badge{background:var(--gold);color:#111;padding:.4rem 1.2rem;border-radius:20px;font-size:.85rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:1.5rem}
.award-title{font-size:clamp(2rem,5vw,4rem);font-weight:900;color:#fff;line-height:1.2;margin-bottom:1rem;max-width:800px}
.award-criteria{font-size:1.1rem;color:var(--text-muted);max-width:600px;line-height:1.6;margin-bottom:1.5rem}
.award-category-tag{background:var(--surface);border:1px solid var(--border);padding:.4rem 1.2rem;border-radius:20px;font-size:.9rem;color:var(--green)}

/* Nominees slide */
.slide-nominees{justify-content:flex-start;padding-top:2rem}
.nominees-header{margin-bottom:2rem;text-align:center}
.nominees-badge{background:rgba(57,130,19,0.3);border:1px solid var(--green);color:var(--green);padding:.3rem 1rem;border-radius:20px;font-size:.8rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;display:inline-block;margin-bottom:.75rem}
.nominees-award-title{font-size:clamp(1.2rem,3vw,2rem);font-weight:700;color:#fff}
.nominees-grid{display:grid;gap:1.5rem;width:100%;max-width:1100px}
.nominees-grid--1{grid-template-columns:1fr;max-width:320px}
.nominees-grid--2{grid-template-columns:repeat(2,1fr)}
.nominees-grid--3{grid-template-columns:repeat(3,1fr)}
.nominees-grid--4,.nominees-grid--5,.nominees-grid--6{grid-template-columns:repeat(4,1fr)}
.nominee-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:transform .2s;display:flex;flex-direction:column}
.nominee-card:hover{transform:translateY(-4px)}
.nominee-img-wrap{aspect-ratio:1;overflow:hidden;background:rgba(57,130,19,0.1)}
.nominee-img-wrap img{width:100%;height:100%;object-fit:cover}
.nominee-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3)}
.nominee-img-placeholder svg{width:40%;height:40%}
.nominee-info{padding:.75rem;text-align:center}
.nominee-name{font-size:clamp(.8rem,1.5vw,1rem);font-weight:700;color:#fff;line-height:1.3}
.nominee-votes{font-size:.8rem;color:var(--gold);margin-top:.25rem}

/* Winner slide */
.slide-winner{background:linear-gradient(135deg,rgba(193,158,51,0.2) 0%,rgba(57,130,19,0.15) 100%)}
.winner-glow{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(193,158,51,0.3) 0%,transparent 70%);pointer-events:none;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.1);opacity:1}}
.winner-badge{background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#111;padding:.5rem 1.5rem;border-radius:20px;font-size:.9rem;font-weight:800;letter-spacing:1px;margin-bottom:1.5rem;position:relative;z-index:1}
.winner-img-wrap{width:clamp(140px,20vw,220px);height:clamp(140px,20vw,220px);border-radius:50%;overflow:hidden;border:4px solid var(--gold);box-shadow:0 0 40px rgba(193,158,51,0.5);margin-bottom:1.5rem;position:relative;z-index:1}
.winner-img-wrap img{width:100%;height:100%;object-fit:cover}
.winner-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(193,158,51,0.1);color:rgba(255,255,255,0.4)}
.winner-img-placeholder svg{width:50%;height:50%}
.winner-name{font-size:clamp(2rem,5vw,4rem);font-weight:900;background:linear-gradient(135deg,#fff 0%,var(--gold) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5rem;position:relative;z-index:1}
.winner-award{font-size:1.1rem;color:var(--text-muted);margin-bottom:.5rem;position:relative;z-index:1}
.winner-votes{font-size:1.2rem;color:var(--gold);font-weight:700;margin-bottom:1rem;position:relative;z-index:1}
.winner-stars{font-size:2rem;position:relative;z-index:1;animation:starPop .5s ease .3s both}
@keyframes starPop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}

/* Nav controls */
.nav-controls{display:flex;align-items:center;justify-content:center;gap:1rem;padding:.75rem 1.5rem;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);border-top:1px solid var(--border)}
.nav-btn{background:var(--surface);border:1px solid var(--border);color:#fff;width:44px;height:44px;border-radius:50%;font-size:1.2rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.nav-btn:hover:not(:disabled){background:var(--green);border-color:var(--green)}
.nav-btn:disabled{opacity:.3;cursor:not-allowed}
.slide-info{display:flex;flex-direction:column;align-items:center;gap:.4rem;min-width:120px}
#slide-counter{font-size:.85rem;color:var(--text-muted)}
.progress-wrap{width:120px;height:4px;background:var(--surface);border-radius:2px;overflow:hidden}
#progress-bar{height:100%;background:linear-gradient(90deg,var(--green),var(--gold));border-radius:2px;transition:width .3s ease}
.autoplay-btn{position:fixed;bottom:70px;right:1rem;background:var(--surface);border:1px solid var(--border);color:#fff;padding:.5rem 1rem;border-radius:20px;cursor:pointer;font-size:.85rem;transition:all .2s}
.autoplay-btn:hover,.autoplay-btn.active{background:var(--green);border-color:var(--green)}
.fullscreen-btn{position:fixed;bottom:70px;right:8rem;background:var(--surface);border:1px solid var(--border);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.fullscreen-btn:hover{background:var(--gold);border-color:var(--gold)}
@media(max-width:768px){
  .nominees-grid--3,.nominees-grid--4,.nominees-grid--5,.nominees-grid--6{grid-template-columns:repeat(2,1fr)}
  .slide-inner{padding:1.5rem}
}
`;
}

export default PresentationGenerator;
