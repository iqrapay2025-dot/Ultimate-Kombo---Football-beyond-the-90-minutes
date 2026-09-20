import { useState, useEffect, useRef } from 'react';
import { takes, DEFAULT_TAKE } from './data/takes';
import { predictions } from './data/predictions';
import { feed as feedItems, type FeedItem } from './data/feed';
import { boards as dataBoards, sampleBoard, type Board } from './data/boards';

const TIKTOK = 'https://www.tiktok.com/@ultimatekombo2';

// ── Images ────────────────────────────────────────────────────────────────
const IMG = {
  carousel: [
    'https://i.pinimg.com/originals/3d/31/3c/3d313c79796c35cbc4cdb43b90f84803.jpg',
    'https://i.pinimg.com/originals/31/69/f4/3169f409f7b86c346748f63949e3237c.jpg',
    'https://i.pinimg.com/originals/e3/c0/7d/e3c07dd4bd53c567950a359cb54382ad.jpg',
    'https://i.pinimg.com/originals/94/00/39/940039a3fa04dca7941a6d66b16e1ade.jpg',
  ],
  featVid: 'https://i.pinimg.com/originals/62/18/14/621814076e12ea30f62d81f56d9e1a9b.jpg',
  feed: [
    'https://i.pinimg.com/originals/20/27/5c/20275c4e78e6a496e340c09098e71557.png',
    'https://i.pinimg.com/originals/5a/ef/35/5aef35e719889ba3c7273807991b5cf4.jpg',
    'https://i.pinimg.com/originals/1f/1c/29/1f1c29e486f255ec3d7ac0a49b6ca0a9.webp',
    'https://i.pinimg.com/originals/76/4c/21/764c21bfaabe5bdaca748069d1c4449c.png',
    'https://i.pinimg.com/originals/cb/3d/b9/cb3db94b336b3aab78a3ec42643c3783.jpg',
    'https://i.pinimg.com/originals/0e/7c/15/0e7c15ec33080ba5f491e170f3202c5e.jpg',
    'https://i.pinimg.com/originals/ff/9d/4d/ff9d4d153272e38e6f470b3e6d0ed4ea.jpg',
    'https://i.pinimg.com/originals/f6/97/31/f69731fda4deb64e14856da1d53c08fa.jpg',
  ],
  barca: [
    'https://i.pinimg.com/originals/ff/9d/4d/ff9d4d153272e38e6f470b3e6d0ed4ea.jpg',
    'https://i.pinimg.com/originals/f6/97/31/f69731fda4deb64e14856da1d53c08fa.jpg',
    'https://i.pinimg.com/originals/7d/91/5f/7d915f2b2626ffc0b3b9905b510b4a68.jpg',
  ],
};

// ── Live matches endpoint ─────────────────────────────────────────────────
const MATCHES_URL = '/api/matches';

// ── Match types ────────────────────────────────────────────────────────────
type MatchTeam = { name: string; tla: string; crest?: string | null };
type Match = {
  id: number; utc: string; status: string; comp: string;
  home: MatchTeam; away: MatchTeam;
  hs: number | null; as: number | null;
};

// ── Team badge: crest image with colored-circle fallback ──────────────────
function TeamBadge({ team, lg }: { team: MatchTeam; lg?: boolean }) {
  const [err, setErr] = useState(false);
  const sz = lg ? 52 : 28;
  const tla = (team.tla ?? '').trim().slice(0, 3).toUpperCase() || 'TBD';
  return (
    <div
      className={`badge${lg ? '' : ' sm'}`}
      style={{
        background: badgeColor(tla),
        width: sz, height: sz,
        padding: team.crest && !err ? (lg ? 5 : 3) : 0,
      }}
    >
      {team.crest && !err ? (
        <img
          src={team.crest}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={() => setErr(true)}
        />
      ) : (
        tla
      )}
    </div>
  );
}

// ── Match helpers ──────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  FCB:'#A50044', BAR:'#A50044', ARS:'#EF0107', MCI:'#6CABDD', LIV:'#C8102E',
  CHE:'#034694', TOT:'#132257', MUN:'#DA020A', NEW:'#241F20', AVL:'#670E36',
  NOT:'#DD0000', BRE:'#E30613', FUL:'#CC0000', CRY:'#1B458F', EVE:'#003399',
  WHU:'#7A263A', WOL:'#FDB913', BOU:'#DA291C',
  RMA:'#E8D128', ATM:'#CB3524', SEV:'#F10020', VIL:'#FFD500', RSO:'#0067B3',
  BAY:'#DC052D', BVB:'#FDE100', LEV:'#E32221', FRE:'#E32221', HOF:'#1C63B7',
  INT:'#0068A8', JUV:'#000000', MIL:'#AC0B2E', NAP:'#12A0C3', ROM:'#8B1A1A',
  PSG:'#004170',
};
function badgeColor(tla: string): string {
  if (TEAM_COLORS[tla]) return TEAM_COLORS[tla];
  let h = 5381;
  for (let i = 0; i < tla.length; i++) h = (h * 33 ^ tla.charCodeAt(i)) & 0xffffff;
  return `hsl(${(Math.abs(h) % 300) + 20}, 60%, 32%)`;
}
const isLive = (m: Match) => m.status === 'IN_PLAY' || m.status === 'PAUSED';
const isUpcoming = (m: Match) => ['SCHEDULED','TIMED','IN_PLAY','PAUSED','POSTPONED'].includes(m.status);

export function getRecord(matches: Match[] = []) {
  const finished = matches.filter((m) => m.status === 'FINISHED' && Object.prototype.hasOwnProperty.call(predictions, m.id));
  const total = finished.length;
  const exact = finished.filter((m) => {
    const pick = predictions[m.id];
    return pick && m.hs === pick.home && m.as === pick.away;
  }).length;
  const hits = finished.filter((m) => {
    const pick = predictions[m.id];
    if (!pick) return false;
    const actual = (m.hs ?? 0) - (m.as ?? 0);
    const predicted = pick.home - pick.away;
    return actual === 0 ? predicted === 0 : (actual > 0 && predicted > 0) || (actual < 0 && predicted < 0);
  }).length;

  return {
    total,
    hits,
    exact,
    accuracy: total ? Math.round((hits / total) * 100) : null,
  };
}

function predictStatus(match: Match): { text: string; result?: 'Hit' | 'Exact' | 'Miss'; color?: string } | null {
  const pick = predictions[match.id];
  if (!pick) return null;

  if (match.status !== 'FINISHED') {
    return {
      text: `His pick: ${match.home.name} ${pick.home}–${pick.away} ${match.away.name}`,
    };
  }

  const actualDiff = (match.hs ?? 0) - (match.as ?? 0);
  const pickDiff = pick.home - pick.away;
  const correctResult = actualDiff === pickDiff || (actualDiff > 0 && pickDiff > 0) || (actualDiff < 0 && pickDiff < 0) || (actualDiff === 0 && pickDiff === 0);

  if (match.hs === pick.home && match.as === pick.away) {
    return { text: 'Exact', result: 'Exact', color: 'gold' };
  }
  if (correctResult) {
    return { text: 'Hit', result: 'Hit', color: 'green' };
  }
  return { text: 'Miss', result: 'Miss', color: 'red' };
}

function fmtStatus(m: Match): string {
  if (m.status === 'FINISHED') return `FT · ${m.hs ?? 0}–${m.as ?? 0}`;
  if (isLive(m)) return `LIVE · ${m.hs ?? 0}–${m.as ?? 0}`;
  if (m.status === 'POSTPONED') return 'Postponed';
  const d = new Date(m.utc);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function matchDate(utc: string): string {
  if (!utc) return '';
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = (dateOnly.getTime() - today.getTime()) / 86400000;

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function matchTime(utc: string): string {
  if (!utc) return '';
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const isBarca = (m: Match) =>
  /barcelona|barça|barca/i.test(m.home.name) ||
  /barcelona|barça|barca/i.test(m.away.name);

// ── Sample fallback matches ────────────────────────────────────────────────
const SAMPLE_MATCHES: Match[] = [
  { id:1, utc:'', status:'FINISHED', comp:'LaLiga', home:{name:'Barcelona',tla:'FCB'}, away:{name:'Real Madrid',tla:'RMA'}, hs:3, as:1 },
  { id:2, utc:'', status:'FINISHED', comp:'Premier League', home:{name:'Man City',tla:'MCI'}, away:{name:'Liverpool',tla:'LIV'}, hs:2, as:2 },
  { id:3, utc:'', status:'FINISHED', comp:'Premier League', home:{name:'Chelsea',tla:'CHE'}, away:{name:'Arsenal',tla:'ARS'}, hs:0, as:1 },
  { id:4, utc:'', status:'FINISHED', comp:'Serie A', home:{name:'Juventus',tla:'JUV'}, away:{name:'Inter',tla:'INT'}, hs:1, as:1 },
  { id:5, utc: new Date(Date.now()+3600000).toISOString(), status:'TIMED', comp:'Champions League', home:{name:'Bayern',tla:'BAY'}, away:{name:'Dortmund',tla:'BVB'}, hs:null, as:null },
  { id:6, utc: new Date(Date.now()+7200000).toISOString(), status:'SCHEDULED', comp:'Premier League', home:{name:'Arsenal',tla:'ARS'}, away:{name:'Man City',tla:'MCI'}, hs:null, as:null },
  { id:7, utc: new Date(Date.now()+10800000).toISOString(), status:'SCHEDULED', comp:'Premier League', home:{name:'Liverpool',tla:'LIV'}, away:{name:'Chelsea',tla:'CHE'}, hs:null, as:null },
];

// ── SVG social icons (inline, fill=currentColor) ───────────────────────────
function IconTikTok() {
  return <svg viewBox="0 0 24 24" style={{width:19,height:19,fill:'currentColor'}}><path d="M16.5 3c.3 2.3 1.7 3.9 4 4.1v3.3c-1.5 0-2.9-.4-4-1.2v6.2c0 3.4-2.7 5.6-5.6 5.6S5.5 18.8 5.5 15.7c0-3.3 2.8-5.7 6.1-5.3v3.4c-1.6-.5-2.8.6-2.8 1.9 0 1.2.9 2.1 2.1 2.1 1.3 0 2.2-.9 2.2-2.4V3h3.4z"/></svg>;
}
function IconYouTube() {
  return <svg viewBox="0 0 24 24" style={{width:19,height:19,fill:'currentColor'}}><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>;
}
function IconInstagram() {
  return <svg viewBox="0 0 24 24" style={{width:19,height:19,fill:'currentColor'}}><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5z"/></svg>;
}
function IconX() {
  return <svg viewBox="0 0 24 24" style={{width:19,height:19,fill:'currentColor'}}><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>;
}
function IconArrowUp() {
  return <svg viewBox="0 0 18 18" style={{width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}}><path d="M9 14V4M3.5 9.5L9 4l5.5 5.5"/></svg>;
}

// ── Nav ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Matchday',    href: '#matchday'    },
  { label: 'Analysis',   href: '#analysis'    },
  { label: 'Tactics',    href: '#board'        },
  { label: 'Squad',      href: '#squad'        },
  { label: 'Feed',       href: '#feed'         },
  { label: 'Opinions',   href: '#debate'       },
  { label: 'Predictions',href: '#predictions'  },
];

function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(`#${e.target.id}`); });
      },
      { rootMargin: '-50% 0px -45% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <nav>
        <div className="nav-inner">
          {/* Logo */}
          <a className="logo" href="#top">Ultimate <i>Kombo</i></a>

          {/* Desktop links — hidden on ≤900px via CSS */}
          <div className="nav-links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={active === l.href ? 'active' : ''}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Socials */}
          <div className="nav-soc">
            <a href={TIKTOK} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IconTikTok /></a>
            <a href="#" aria-label="YouTube"><IconYouTube /></a>
            <a href="#" aria-label="Instagram"><IconInstagram /></a>
            <a href="#" aria-label="X"><IconX /></a>
          </div>

          {/* CTA (hidden on very small mobile) */}
          <a className="btn sm nav-follow" href={TIKTOK} target="_blank" rel="noopener noreferrer">
            Follow on TikTok
          </a>

          {/* Hamburger — visible only on ≤900px via CSS */}
          <button
            className="ham-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 4L18 18M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="10" width="13" height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="15" width="18" height="2" rx="1" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mob-menu ${open ? 'open' : ''}`}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}

// ── Hero Carousel ──────────────────────────────────────────────────────────
const SLIDES = [
  { img: IMG.carousel[0], caption: 'Football beyond the 90 minutes. From Barcelona to the Champions League.' },
  { img: IMG.carousel[1], caption: 'Tactics, analysis and opinions — when the debate doesn\'t stop at the final whistle.' },
  { img: IMG.carousel[2], caption: 'From the big moments to the hidden stories. Every angle, his eyes.' },
  { img: IMG.carousel[3], caption: 'Barcelona. Premier League. Champions League. Real talk on all of it.' },
];

function Hero() {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const goTo = (i: number) => setSlide((i + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5500);
    return () => clearInterval(timerRef.current);
  }, []);

  const prev = () => { clearInterval(timerRef.current); goTo(slide - 1); };
  const next = () => { clearInterval(timerRef.current); goTo(slide + 1); };

  return (
    <header className="hero" id="top">
      {/* ── Full-screen carousel ─────────────────────────────────────────── */}
      <div className="hero-carousel" aria-roledescription="carousel">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`hero-slide ${i === slide ? 'active' : ''}`}
            aria-hidden={i !== slide}
          >
            <img
              className="hero-slide-img"
              src={s.img}
              alt=""
              aria-hidden="true"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="hero-overlay" />
            <div className="hero-stripe" />
          </div>
        ))}

        {/* Content (always on top, outside slides so it doesn't flicker) */}
        <div className="hero-inner">
          <div className="who">Jumah</div>
          <h1 className="hero-h1">
            The game,<span>through his eyes.</span>
          </h1>
          <p className="hero-caption" aria-live="polite">
            {SLIDES[slide].caption}
          </p>
          <p className="formats">Analysis · Tactics · Opinions · Stories</p>
          <div className="hero-cta">
            <a className="btn" href="#feed">Watch the latest</a>
            <a className="btn alt" href="#debate">Join the debate</a>
          </div>
        </div>

        {/* Handwritten annotation */}
        <div className="hero-script" aria-hidden="true">
          More than<br />90 minutes.
        </div>

        {/* Prev / Next arrows */}
        <button className="hero-arr hero-arr-prev" onClick={prev} aria-label="Previous slide">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="hero-arr hero-arr-next" onClick={next} aria-label="Next slide">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="hero-nav" role="tablist" aria-label="Carousel slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === slide ? 'active' : ''}`}
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}`}
              onClick={() => { clearInterval(timerRef.current); goTo(i); }}
            />
          ))}
        </div>
      </div>

      {/* ── Featured video strip — below carousel ────────────────────────── */}
      <div className="featured">
        <div className="vid">
          <img className="vid-bg" src={IMG.featVid} alt="" aria-hidden="true" />
          <button
            className="play-btn"
            aria-label="Watch the latest analysis on TikTok"
            onClick={() => window.open(TIKTOK, '_blank', 'noopener')}
          />
          <span className="vid-time">8:24</span>
        </div>
        <div className="featured-txt">
          <span className="pill">Latest analysis</span>
          <h3>Why Barça&apos;s midfield still needs more</h3>
          <p>Tactics · Barça · 2.4M views (sample)</p>
          <a className="btn sm" style={{ width: 'max-content' }} href={TIKTOK} target="_blank" rel="noopener noreferrer">
            Watch on TikTok
          </a>
        </div>
      </div>
    </header>
  );
}

function MatchdaySkeleton() {
  return (
    <section id="matchday">
      <div className="wrap">
        <div className="head">
          <div>
            <h2>Matchday</h2>
            <p className="lede">Big games. Bigger talk. Results, fixtures and his take on every key match.</p>
            <div className="status-line" aria-live="polite">
              <span className="status-dot sample" />
              <span>Loading matches…</span>
            </div>
          </div>
        </div>

        <div className="md">
          <div className="match-main skeleton-card" aria-hidden="true">
            <div className="team">
              <span className="badge skeleton-block" style={{ margin: '0 auto 8px' }} />
              <span className="skeleton-line skeleton-line-xs" />
            </div>
            <div>
              <div className="skeleton-line skeleton-line-sm" style={{ width: 96, margin: '0 auto 10px' }} />
              <div className="skeleton-score" />
            </div>
            <div className="team">
              <span className="badge skeleton-block" style={{ margin: '0 auto 8px' }} />
              <span className="skeleton-line skeleton-line-xs" />
            </div>
            <div className="match-meta">
              <span className="skeleton-line skeleton-line-sm" style={{ width: 120 }} />
              <span className="skeleton-line skeleton-line-sm" style={{ width: 90 }} />
            </div>
          </div>

          <div className="fixbox" aria-hidden="true">
            <div className="skeleton-line skeleton-line-sm" style={{ width: 140, margin: '18px 0 14px' }} />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="fx skeleton-row" style={{ padding: '12px 0' }}>
                <div className="skeleton-block" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                  <div className="skeleton-line skeleton-line-md" />
                  <div className="skeleton-line skeleton-line-sm" style={{ width: '62%' }} />
                </div>
                <div className="skeleton-line skeleton-line-sm" style={{ width: 70 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Matchday (live data) ───────────────────────────────────────────────────
function Matchday() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => localDateKey(new Date().toISOString()));
  const [filter, setFilter] = useState<'all' | 'barca' | 'Premier League' | 'La Liga' | 'Champions League' | 'Serie A' | 'Bundesliga' | 'Ligue 1'>('all');

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'barca', label: 'Barça' },
    { key: 'Premier League', label: 'Premier League' },
    { key: 'La Liga', label: 'La Liga' },
    { key: 'Champions League', label: 'Champions League' },
    { key: 'Serie A', label: 'Serie A' },
    { key: 'Bundesliga', label: 'Bundesliga' },
    { key: 'Ligue 1', label: 'Ligue 1' },
  ] as const;

  const getTakeUrl = (match: Match) => takes[match.id] ?? DEFAULT_TAKE;
  const normalizeComp = (value: string) => {
    switch (value) {
      case 'Premier League': return 'Premier League';
      case 'Primera Division': return 'La Liga';
      case 'UEFA Champions League': return 'Champions League';
      case 'Serie A': return 'Serie A';
      case 'Bundesliga': return 'Bundesliga';
      case 'Ligue 1': return 'Ligue 1';
      default: return value;
    }
  };
  const matchMatchesFilter = (m: Match) => {
    if (filter === 'all') return true;
    if (filter === 'barca') {
      return /barcelona|barça|barca/i.test(m.home.name) || /barcelona|barça|barca/i.test(m.away.name);
    }
    return normalizeComp(m.comp) === filter;
  };

  const fetchMatches = async () => {
    try {
      const r = await fetch(MATCHES_URL);
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      const nextMatches = d.matches ?? [];
      setMatches(nextMatches);
      setUpdatedAt(d.updated);
      setIsSample(false);
      setLoading(false);
      setSelectedDay((current) => normalizeDaySelection(current, nextMatches));
    } catch {
      setMatches(SAMPLE_MATCHES);
      setUpdatedAt(null);
      setIsSample(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const id = setInterval(fetchMatches, 60_000);
    return () => clearInterval(id);
  }, []);

  const allDayKeys = Array.from(new Set(matches.map((m) => localDateKey(m.utc)))).sort();
  const dayKeys = allDayKeys.length > 0 ? allDayKeys : [selectedDay];
  const currentDayMatches = matches
    .filter((m) => localDateKey(m.utc) === selectedDay)
    .sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());

  const filteredCurrentDayMatches = currentDayMatches.filter(matchMatchesFilter);
  const groupedMatches = filteredCurrentDayMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = normalizeComp(m.comp) || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const dayIndex = dayKeys.indexOf(selectedDay);
  const prevDay = () => {
    if (dayIndex <= 0) return;
    setSelectedDay(dayKeys[dayIndex - 1]);
  };
  const nextDay = () => {
    if (dayIndex === -1 || dayIndex >= dayKeys.length - 1) return;
    setSelectedDay(dayKeys[dayIndex + 1]);
  };

  useEffect(() => {
    if (!dayKeys.includes(selectedDay)) {
      setSelectedDay(dayKeys[0] ?? localDateKey(new Date().toISOString()));
    }
  }, [dayKeys, selectedDay]);

  // Featured score card: live Barça → latest Barça result → first match
  const featured: Match =
    matches.find((m) => isBarca(m) && isLive(m)) ??
    matches.filter((m) => isBarca(m) && m.status === 'FINISHED')
           .sort((a, b) => new Date(b.utc).getTime() - new Date(a.utc).getTime())[0] ??
    matches[0] ??
    SAMPLE_MATCHES[0];

  const featStatus = (() => {
    if (!featured) return '';
    if (featured.status === 'FINISHED') return `${featured.comp} · ${matchDate(featured.utc)} · Full time`;
    if (isLive(featured)) return `${featured.comp} · ${matchDate(featured.utc)} · Live`;
    if (featured.utc) return `${featured.comp} · ${matchDate(featured.utc)} · ${matchTime(featured.utc)}`;
    return featured.comp;
  })();

  const featScore = featured
    ? featured.hs != null
      ? `${featured.hs} – ${featured.as}`
      : 'vs'
    : '3 – 1';

  const featuredPrediction = featured ? predictStatus(featured) : null;

  const [nextBarca, setNextBarca] = useState<Match | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchNextBarca = async () => {
      try {
        const r = await fetch('/api/next-barca');
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        setNextBarca(d?.match ?? null);
      } catch {
        setNextBarca(null);
      }
    };

    fetchNextBarca();
    const minuteId = setInterval(() => setNow(Date.now()), 60_000);
    const fetchId = setInterval(fetchNextBarca, 5 * 60_000);
    return () => { clearInterval(minuteId); clearInterval(fetchId); };
  }, []);

  const nextBarcaInfo = (() => {
    if (!nextBarca) return null;

    const comp = normalizeComp(nextBarca.comp || '');
    const kickoff = new Date(nextBarca.utc).getTime();
    const msLeft = kickoff - now;

    let countdown = '';
    if (nextBarca.status === 'IN_PLAY' || nextBarca.status === 'PAUSED') {
      countdown = 'LIVE';
    } else if (msLeft <= 0) {
      countdown = 'LIVE';
    } else if (msLeft < 60 * 60 * 1000) {
      const mins = Math.max(1, Math.round(msLeft / 60000));
      countdown = `in ${mins} min`;
    } else {
      const totalHours = Math.floor(msLeft / (60 * 60 * 1000));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      countdown = days > 0 ? `in ${days}d ${hours}h` : `in ${totalHours}h`;
    }

    return {
      home: nextBarca.home,
      away: nextBarca.away,
      comp,
      kickoff,
      countdown,
      illive: nextBarca.status === 'IN_PLAY' || nextBarca.status === 'PAUSED' || msLeft <= 0,
    };
  })();

  if (loading) {
    return <MatchdaySkeleton />;
  }

  return (
    <section id="matchday">
      <div className="wrap">
        <div className="head">
          <div>
            <h2>Matchday</h2>
            <p className="lede">Big games. Bigger talk. Results, fixtures and his take on every key match.</p>
            <div className="status-line" aria-live="polite">
              <span className={`status-dot ${isSample ? 'sample' : ''}`} />
              {isSample
                ? 'Showing sample matches'
                : `Live data · updated ${new Date(updatedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
        </div>

        {nextBarcaInfo && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              background: 'var(--card)', border: '1px solid var(--line)', padding: '10px 16px',
              marginTop: 18, marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Next up
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamBadge team={nextBarcaInfo.home} />
                <span style={{ fontWeight: 700, color: 'var(--fg)' }}>{nextBarcaInfo.home.name} v {nextBarcaInfo.away.name}</span>
                <TeamBadge team={nextBarcaInfo.away} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{nextBarcaInfo.comp}</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{`${matchDate(nextBarca!.utc)} · ${matchTime(nextBarca!.utc)}`}</span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: nextBarcaInfo.illive ? '#22c55e' : 'var(--fg)',
                  fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
                }}
              >
                {nextBarcaInfo.illive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />}
                {nextBarcaInfo.countdown}
              </span>
            </div>
          </div>
        )}

        <div className="md">
          {/* Featured score card */}
          <div className="match-main">
            <div className="team">
              <TeamBadge team={featured.home} lg />
              {featured.home.name}
            </div>
            <div>
              {isLive(featured) && <div style={{ textAlign: 'center', marginBottom: 4 }}><span className="live-badge">LIVE</span></div>}
              <div className="score">{featScore}</div>
            </div>
            <div className="team">
              <TeamBadge team={featured.away} lg />
              {featured.away.name}
            </div>
            <div className="match-meta">
              <span>{featStatus}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {featuredPrediction && (
                  <span
                    style={{
                      color: featuredPrediction.color === 'green' ? '#22c55e' : featuredPrediction.color === 'gold' ? 'var(--gold)' : featuredPrediction.color === 'red' ? '#f87171' : 'var(--muted)',
                      fontSize: '.74rem', fontWeight: 700, letterSpacing: '.03em',
                    }}
                  >
                    {featuredPrediction.result ? featuredPrediction.result : featuredPrediction.text}
                  </span>
                )}
                <a
                  href={getTakeUrl(featured)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: takes[featured.id] ? 'var(--gold)' : 'var(--muted)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {takes[featured.id] && (
                    <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1 }}>▶</span>
                  )}
                  His take
                </a>
              </div>
            </div>
          </div>

          {/* Fixture list */}
          <div className="fixbox">
            <div className="chips" role="group" aria-label="Match filters" style={{ overflowX: 'auto', whiteSpace: 'nowrap', margin: '8px 0 12px' }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className="chip"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  style={{ flexShrink: 0 }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 10px' }}>
              <button
                type="button"
                aria-label="Previous day"
                onClick={prevDay}
                disabled={dayIndex <= 0}
                style={{
                  background: 'transparent', border: '0', color: dayIndex <= 0 ? 'var(--muted)' : 'var(--fg)',
                  width: 28, height: 28, borderRadius: 999, cursor: dayIndex <= 0 ? 'not-allowed' : 'pointer',
                  display: 'grid', placeItems: 'center', opacity: dayIndex <= 0 ? 0.5 : 1,
                }}
              >
                <span aria-hidden="true">‹</span>
              </button>

              <div
                role="tablist"
                aria-label="Match dates"
                style={{
                  display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
                  flex: 1, whiteSpace: 'nowrap', paddingBottom: 2,
                }}
              >
                {dayKeys.map((dayKey) => {
                  const dayMatchesCount = matches.filter((m) => localDateKey(m.utc) === dayKey).length;
                  const isSelected = selectedDay === dayKey;
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedDay(dayKey)}
                      className={isSelected ? 'active' : ''}
                      style={{
                        background: 'transparent', border: 0, borderBottom: isSelected ? '3px solid var(--garnet)' : '3px solid transparent',
                        color: isSelected ? 'var(--fg)' : 'var(--muted)', font: '600 .9rem var(--body)',
                        padding: '10px 10px 11px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span>{dayChipLabel(dayKey)}</span>
                      <span style={{ display: 'inline-flex', minWidth: 18, height: 18, borderRadius: 999, background: 'rgba(255,255,255,.08)', color: 'var(--fg)', fontSize: '.7rem', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{dayMatchesCount}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Next day"
                onClick={nextDay}
                disabled={dayIndex === -1 || dayIndex >= dayKeys.length - 1}
                style={{
                  background: 'transparent', border: '0', color: dayIndex === -1 || dayIndex >= dayKeys.length - 1 ? 'var(--muted)' : 'var(--fg)',
                  width: 28, height: 28, borderRadius: 999, cursor: dayIndex === -1 || dayIndex >= dayKeys.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'grid', placeItems: 'center', opacity: dayIndex === -1 || dayIndex >= dayKeys.length - 1 ? 0.5 : 1,
                }}
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>

            <div
              style={{
                maxHeight: 560,
                overflowY: 'auto',
                paddingRight: 8,
                position: 'relative',
              }}
            >
              {filteredCurrentDayMatches.length === 0 && (
                <p style={{ padding: '16px 0', color: 'var(--muted)', fontSize: '.9rem' }}>
                  No matches to show right now.
                  <span style={{ display: 'block', marginTop: 4, color: 'var(--muted)' }}>Check the other tab or come back later.</span>
                </p>
              )}

              {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
                <div key={groupName} style={{ paddingTop: 12 }}>
                  <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, padding: '0 0 8px' }}>
                    {groupName}
                  </div>
                  {groupMatches.map((m) => {
                    const pred = predictStatus(m);
                    return (
                      <div key={m.id} className="fx">
                        <div className="b2">
                          <TeamBadge team={m.home} />
                          <TeamBadge team={m.away} />
                        </div>
                        <div>
                          <span className="fx-name">{m.home.name} <i>vs</i> {m.away.name}</span>
                          {pred && (
                            <small className="fx-sub" style={{ display: 'block', marginTop: 4 }}>
                              {pred.result ? pred.result : pred.text}
                            </small>
                          )}
                          <a
                            href={getTakeUrl(m)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '.72rem',
                              color: takes[m.id] ? 'var(--gold)' : 'var(--muted)', textDecoration: 'none',
                            }}
                          >
                            {takes[m.id] && <span aria-hidden="true" style={{ fontSize: 9, lineHeight: 1 }}>▶</span>}
                            His take
                          </a>
                        </div>
                        <div className="fx-status">
                          {m.status === 'FINISHED'
                            ? `FT ${m.hs ?? 0}–${m.as ?? 0}`
                            : isLive(m)
                              ? <span className="live-badge">LIVE {m.hs ?? 0}–{m.as ?? 0}</span>
                              : matchTime(m.utc)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div
                aria-hidden="true"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  height: 20,
                  background: 'linear-gradient(to top, rgba(9, 15, 25, 0.42), rgba(9, 15, 25, 0))',
                  pointerEvents: 'none',
                  marginTop: -18,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function localDateKey(utc: string): string {
  if (!utc) return '';
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDaySelection(current: string, matches: Match[]): string {
  const days = Array.from(new Set(matches.map((m) => localDateKey(m.utc)))).sort();
  if (!days.length) return current;
  if (days.includes(current)) return current;

  const today = localDateKey(new Date().toISOString());
  return days.includes(today) ? today : days[0];
}

function dayChipLabel(dayKey: string): string {
  if (!dayKey) return '';
  const [year, month, day] = dayKey.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return '';

  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(d, tomorrow)) return 'Tomorrow';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

type StandingsRow = {
  pos: number;
  name: string;
  tla: string;
  crest?: string | null;
  p: number;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
};

type StandingsLeague = {
  name?: string;
  table: StandingsRow[];
};

type LeagueKey = 'PL' | 'PD' | 'SA' | 'BL1' | 'FL1';

const STANDINGS_TABS: { key: LeagueKey; label: string }[] = [
  { key: 'PL', label: 'Premier League' },
  { key: 'PD', label: 'La Liga' },
  { key: 'SA', label: 'Serie A' },
  { key: 'BL1', label: 'Bundesliga' },
  { key: 'FL1', label: 'Ligue 1' },
];

function LeagueTables() {
  const [data, setData] = useState<Record<string, StandingsLeague> | null>(null);
  const [activeTab, setActiveTab] = useState<LeagueKey>('PD');
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const r = await fetch('/api/standings');
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (!cancelled && d?.leagues) {
          setData(d.leagues);
        }
      } catch {
        if (!cancelled) setData(null);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const league = data[activeTab] ?? data.PD ?? Object.values(data)[0];
  if (!league || !league.table || !league.table.length) return null;

  const rowsToShow = showFull ? league.table : league.table.slice(0, 6);

  return (
    <section className="standings" aria-label="League tables">
      <div className="wrap">
        <div className="head" style={{ marginBottom: 14 }}>
          <div>
            <h2>League tables</h2>
            <p className="lede">Standings across Europe and the domestic fight at the top.</p>
          </div>
        </div>

        <div className="standings-shell">
          <div className="standings-tabs" role="tablist" aria-label="League tables">
            {STANDINGS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`standings-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setShowFull(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="standings-table-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th style={{ width: 54 }}>Pos</th>
                  <th>Club</th>
                  <th>P</th>
                  <th>GD</th>
                  <th>Pts</th>
                  <th className="standings-hide-mobile">W</th>
                  <th className="standings-hide-mobile">D</th>
                  <th className="standings-hide-mobile">L</th>
                </tr>
              </thead>
              <tbody>
                {rowsToShow.map((row) => {
                  const isBarca = /barcelona|barça|barca/i.test(row.name);
                  return (
                    <tr key={`${league.name}-${row.pos}-${row.name}`} className={isBarca ? 'standings-row-barca' : ''}>
                      <td>{row.pos}</td>
                      <td>
                        <div className="standings-club">
                          <TeamBadge team={{ name: row.name, tla: row.tla || row.name.slice(0, 3).toUpperCase(), crest: row.crest ?? null }} />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td>{row.p}</td>
                      <td>{row.gd}</td>
                      <td>{row.pts}</td>
                      <td className="standings-hide-mobile">{row.w}</td>
                      <td className="standings-hide-mobile">{row.d}</td>
                      <td className="standings-hide-mobile">{row.l}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {league.table.length > 6 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn alt sm" onClick={() => setShowFull((prev) => !prev)}>
                {showFull ? 'Show top 6' : 'Show full table'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Analysis ───────────────────────────────────────────────────────────────
const CARDS = [
  { h: 'Hot takes',          p: 'Bold opinions. Real talk. The ones that start arguments in the group chat.',              link: '#feed',  label: 'Watch the takes' },
  { h: 'Tactical breakdown', p: 'Systems, movements, what really happens. Why a team won or lost.',                        link: '#board', label: 'Open the board' },
  { h: 'Post-match',         p: 'Reactions and key insights within the hour, while the result still stings.',              link: '#feed',  label: 'Latest reactions' },
  { h: 'Opinion',            p: 'The bigger picture on managers, players and big decisions.',                              link: '#debate',label: 'Vote on it' },
  { h: 'Transfer talk',      p: "Rumours, deals, what's next, and whether it makes sense.",                               link: '#feed',  label: 'Transfer videos' },
  { h: 'Barça corner',       p: 'The club that shaped his eye for the game.',                                             link: '#barca', label: 'Enter the corner' },
];

function Analysis() {
  return (
    <section id="analysis" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>The analysis</h2>
            <p className="lede">Different angles. Same game. Each card maps to one of his video formats.</p>
          </div>
          <a className="btn alt sm" href="#feed">View all</a>
        </div>
        <div className="cards">
          {CARDS.map((c) => (
            <article key={c.h} className="card">
              <h3>{c.h}</h3>
              <p>{c.p}</p>
              <a href={c.link}>{c.label}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Tactical Board ─────────────────────────────────────────────────────────
function TacticalBoard() {
  const boardList = dataBoards.length ? dataBoards : [sampleBoard];
  const [boardId, setBoardId] = useState(boardList[0]?.id ?? sampleBoard.id);
  const [phase, setPhase] = useState(0);
  const [selected, setSelected] = useState(6);

  const board = boardList.find((b) => b.id === boardId) ?? boardList[0] ?? sampleBoard;
  const ph = board.phases[phase] ?? board.phases[0];
  const selectedIndex = Math.min(Math.max(selected, 0), Math.max(board.players.length - 1, 0));
  const activePlayer = board.players[selectedIndex] ?? board.players[0];

  useEffect(() => {
    setPhase(0);
    setSelected(6);
  }, [boardId]);

  return (
    <section className="board-sec" id="board">
      <div className="wrap">
        <h2>Breaking down the game</h2>
        <p className="lede">Formations. Movements. Decisions. The details that make the difference. Pick a phase, then tap a player.</p>
        <div className="board">
          <div>
            <div className="chips" role="group" aria-label="Select tactical board" style={{ marginTop: 0 }}>
              {boardList.map((item) => (
                <button
                  key={item.id}
                  className="chip"
                  aria-pressed={board.id === item.id}
                  onClick={() => setBoardId(item.id)}
                  type="button"
                >
                  {item.title}
                </button>
              ))}
            </div>

            <svg className="pitch-svg" viewBox="0 0 700 450" role="group" aria-label="Interactive tactical pitch">
              <defs>
                <marker id="tac-arrowhead" markerWidth="8" markerHeight="8" refX="6.5" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--gold)" />
                </marker>
              </defs>
              {[0,1,2,3,4].map((i) => (
                <rect key={i} className="pitch-stripe" x={10+i*2*68} y="10" width="68" height="430"/>
              ))}
              <rect className="pitch-ln" x="10" y="10" width="680" height="430"/>
              <line className="pitch-ln" x1="350" y1="10" x2="350" y2="440"/>
              <circle className="pitch-ln" cx="350" cy="225" r="55"/>
              <rect className="pitch-ln" x="10" y="115" width="105" height="220"/>
              <rect className="pitch-ln" x="10" y="170" width="38" height="110"/>
              <rect className="pitch-ln" x="585" y="115" width="105" height="220"/>
              <rect className="pitch-ln" x="652" y="170" width="38" height="110"/>
              {ph.zone && (
                <rect className="tac-zone on" x={ph.zone.x} y={ph.zone.y} width={ph.zone.w} height={ph.zone.h} />
              )}
              {ph.arrows.map(([x1, y1, x2, y2], i) => (
                <path
                  key={`${board.id}-${phase}-${i}`}
                  className="tac-arrow on"
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  markerEnd="url(#tac-arrowhead)"
                />
              ))}
              {ph.op.map(([x, y], i) => (
                <g key={`op-${board.id}-${phase}-${i}`} className="pl-g opp" style={{ transform: `translate(${x}px,${y}px)` }}>
                  <circle r="16"/>
                  <text>{i + 1}</text>
                </g>
              ))}
              {board.players.map((player, i) => (
                <g
                  key={`pl-${board.id}-${i}`}
                  className={`pl-g${i % 2 === 0 ? '' : ' b'}${selectedIndex === i ? ' sel' : ''}`}
                  style={{ transform: `translate(${ph.us[i]?.[0] ?? 0}px,${ph.us[i]?.[1] ?? 0}px)` }}
                  onClick={() => setSelected(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${player.name}, ${player.pos}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i); } }}
                >
                  <circle r="16"/>
                  <text>{player.num}</text>
                </g>
              ))}
            </svg>

            <div className="legend">
              <span><i style={{ background: 'var(--garnet)' }}/>{board.team} ({board.title})</span>
              <span><i style={{ background: '#F6F0E4' }}/>{'Opponent'}</span>
              <span>{board.formation}</span>
            </div>
            <div className="board-meta">
              <small>{board.source}</small>
              {board.videoUrl && (
                <a href={board.videoUrl} target="_blank" rel="noopener noreferrer">Watch the breakdown</a>
              )}
            </div>
          </div>

          <div>
            <div className="steps" role="group" aria-label="Tactical phases">
              {board.phases.map((phaseItem, i) => (
                <button
                  key={phaseItem.label}
                  className="step"
                  aria-pressed={phase === i}
                  onClick={() => setPhase(i)}
                  type="button"
                >
                  <b>{phaseItem.label}</b>
                  <span>{phaseItem.desc}</span>
                </button>
              ))}
            </div>
            <p className="cap" aria-live="polite">{ph.caption}</p>
            <div className="pcard" aria-live="polite">
              <div className="top">
                <div className="av">{activePlayer.num}</div>
                <div>
                  <h4>{activePlayer.name}</h4>
                  <small>{activePlayer.pos} · {board.formation}</small>
                </div>
              </div>
              <ul>
                {activePlayer.notes.map((note) => (
                  <li key={`${activePlayer.name}-${note}`}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Squad ──────────────────────────────────────────────────────────────────
const SQUAD = [
  ['Joan Garcia',1,'GK'],['Wojciech Szczęsny',13,'GK'],['Dominik Livaković',25,'GK'],
  ['João Cancelo',2,'DEF'],['Alejandro Balde',3,'DEF'],['Brian Fariñas',4,'DEF'],
  ['Pau Cubarsí',5,'DEF'],['Xavi Espart',12,'DEF'],['Andreas Christensen',15,'DEF'],
  ['Gerard Martín',18,'DEF'],['Jules Koundé',23,'DEF'],['Eric García',24,'DEF'],
  ['Gavi',6,'MID'],['Fermín López',7,'MID'],['Pedri',8,'MID'],
  ['Rodrigo',16,'MID'],['Dani Olmo',20,'MID'],['Frenkie de Jong',21,'MID'],['Marc Bernal',22,'MID'],
  ['Gabriel Jesus',9,'FWD'],['Lamine Yamal',10,'FWD'],['Raphinha',11,'FWD'],
  ['Karim Adeyemi',14,'FWD'],['Anthony Gordon',17,'FWD'],['Roony Bardghji',19,'FWD'],
  ['Jesse Bisiwu',27,'DEV'],['Hamza Abdelkarim',29,'DEV'],
] as [string, number, string][];

const POS_LABELS: Record<string, string> = { GK:'Goalkeeper', DEF:'Defender', MID:'Midfielder', FWD:'Forward', DEV:'Development' };

function Squad() {
  const [filter, setFilter] = useState('all');
  const FILTERS = ['all','GK','DEF','MID','FWD','DEV'];
  const FILTER_LABELS: Record<string, string> = { all:'All', GK:'Goalkeepers', DEF:'Defenders', MID:'Midfielders', FWD:'Forwards', DEV:'Development' };

  return (
    <section id="squad">
      <div className="wrap">
        <h2>The squad</h2>
        <p className="lede">Barcelona&apos;s first-team squad for 2026/27, with the shirt numbers confirmed by the club.</p>
        <div className="chips" role="group" aria-label="Filter by position">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="chip"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="squad-grid">
          {SQUAD.map(([name, num, pos]) => (
            <div
              key={num}
              className="pl-card"
              data-p={pos}
              hidden={filter !== 'all' && filter !== pos}
            >
              <div className="pl-num">{num}</div>
              <div>
                <span className="pl-name">{name}</span>
                <span className="pl-pos">{POS_LABELS[pos]}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="coach">Head coach: Hansi Flick. Squad as of September 2026; check the club site for late changes.</p>
      </div>
    </section>
  );
}

// ── Barça Corner ───────────────────────────────────────────────────────────
function BarcaCorner() {
  return (
    <section id="barca" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="corner">
          <div className="corner-l">
            <h3>Barça corner</h3>
            <p>The real question: can Barça dominate Europe again?</p>
            <a className="btn gold-btn" href="#feed">Watch analysis</a>
          </div>
          <div className="corner-list">
            {[
              { title: 'Is this young winger already world class?', tag: 'HOT TAKE', tagCls: '', views: '4.2M views', img: IMG.barca[0] },
              { title: 'Why Barça struggle against a low block', tag: 'TACTICAL', tagCls: 'bl', views: '1.8M views', img: IMG.barca[1] },
              { title: 'Is the manager the right man?', tag: 'OPINION', tagCls: 'g', views: '1.1M views', img: IMG.barca[2] },
            ].map((v) => (
              <div key={v.title} className="li">
                <div className="th"><img src={v.img} alt="" aria-hidden="true" /></div>
                <div>
                  <b><span className={`tg ${v.tagCls}`}>{v.tag}</span>{v.title}</b>
                  <small>{v.views}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Football Feed ──────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/i);
  return match ? match[1] : null;
}

function cleanTikTokTitle(raw: string | null | undefined): { title: string; hashtags: string[] } {
  const text = (raw ?? '').trim();
  const hashtags = Array.from(new Set((text.match(/#\w+/g) ?? []).map((tag) => tag.replace(/^#/, '')).filter(Boolean))).slice(0, 2);
  const title = text
    .replace(/#\w+/g, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || 'Watch on TikTok',
    hashtags,
  };
}

function formatViews(value?: number): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(value);
}

function getPostedLabel(url: string): string {
  const id = extractVideoId(url);
  if (!id) return 'Posted recently';

  try {
    const postedMs = Number((BigInt(id) >> 32n) * 1000n);
    const diffMs = Date.now() - postedMs;
    const hours = diffMs / (1000 * 60 * 60);

    if (hours < 1) {
      const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `Posted ${minutes}m ago`;
    }
    if (hours < 24) {
      return `Posted ${Math.max(1, Math.round(hours))}h ago`;
    }
    if (hours < 48) {
      return 'Yesterday';
    }

    const d = new Date(postedMs);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return 'Posted recently';
  }
}

function Feed() {
  const [filter, setFilter] = useState('all');
  const [metaByUrl, setMetaByUrl] = useState<Record<string, { title: string; hashtags: string[]; thumbnail: string | null }>>({});
  const [failedImages, setFailedImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      const next: Record<string, { title: string; hashtags: string[]; thumbnail: string | null }> = {};

      await Promise.all(
        feedItems.map(async (item) => {
          const key = item.url;
          const explicitTitle = item.title ?? undefined;

          try {
            const r = await fetch(`/api/tiktok?url=${encodeURIComponent(item.url)}`);
            if (!r.ok) throw new Error(String(r.status));
            const data = await r.json();
            const normalized = cleanTikTokTitle(data?.title ?? null);
            next[key] = {
              title: explicitTitle || normalized.title || 'Watch on TikTok',
              hashtags: explicitTitle ? [] : normalized.hashtags,
              thumbnail: typeof data?.thumbnail === 'string' && data.thumbnail.trim() ? data.thumbnail : null,
            };
          } catch {
            const fallbackTitle = explicitTitle || 'Watch on TikTok';
            next[key] = {
              title: fallbackTitle,
              hashtags: explicitTitle ? [] : cleanTikTokTitle(item.title ?? null).hashtags,
              thumbnail: null,
            };
          }
        })
      );

      if (!cancelled) {
        setMetaByUrl(next);
        setLoading(false);
      }
    };

    loadMeta();
    const id = setInterval(loadMeta, 30 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const FCATS = ['all', 'barca', 'epl', 'ucl', 'transfers', 'tactics', 'opinion'];
  const FLABELS: Record<string, string> = {
    all: 'All',
    barca: 'Barça',
    epl: 'Premier League',
    ucl: 'Champions League',
    transfers: 'Transfers',
    tactics: 'Tactics',
    opinion: 'Opinion',
  };

  const sortedFeed = [...feedItems].sort((a, b) => {
    const aId = BigInt(extractVideoId(a.url) ?? '0');
    const bId = BigInt(extractVideoId(b.url) ?? '0');
    return bId > aId ? 1 : bId < aId ? -1 : 0;
  });

  const visibleFeed = sortedFeed.filter((item) => filter === 'all' || item.category === filter);

  return (
    <section id="feed" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <div>
            <h2>The football feed</h2>
            <p className="lede">Short videos. Big conversations. Every tile opens the original on TikTok.</p>
          </div>
          <a className="btn alt sm" href={TIKTOK} target="_blank" rel="noopener noreferrer">Visit TikTok for more</a>
        </div>
        <div className="chips" role="group" aria-label="Filter videos">
          {FCATS.map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {FLABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="feed" aria-live="polite" aria-label="Loading football feed">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="tile tile-skeleton" aria-hidden="true">
                <div className="skeleton-block" style={{ width: 38, height: 38, borderRadius: '50%', position: 'absolute', top: 14, right: 14 }} />
                <div className="tile-content">
                  <span className="skeleton-line skeleton-line-sm" style={{ width: 76, marginBottom: 10 }} />
                  <div className="skeleton-line skeleton-line-md" style={{ marginBottom: 8 }} />
                  <div className="skeleton-line skeleton-line-md" style={{ width: '78%', marginBottom: 8 }} />
                  <div className="skeleton-line skeleton-line-sm" style={{ width: 92, marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="feed">
            {visibleFeed.map((item) => {
              const meta = metaByUrl[item.url] ?? {
                title: cleanTikTokTitle(item.title ?? null).title,
                hashtags: cleanTikTokTitle(item.title ?? null).hashtags,
                thumbnail: null,
              };
              const explicitTitle = item.title ?? undefined;
              const title = explicitTitle || meta.title;
              const imageCandidates = [item.photo?.src, item.cover, meta.thumbnail].filter((src): src is string => Boolean(src));
              const failed = failedImages[item.url] ?? [];
              const imageSrc = imageCandidates.find((src) => !failed.includes(src)) ?? null;
              const views = formatViews(item.views);
              const posted = getPostedLabel(item.url);
              const showHashtags = !explicitTitle && meta.hashtags.length > 0;

              return (
                <a
                  key={item.url}
                  className={`tile ${item.category}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch on TikTok: ${title}`}
                  title={title}
                >
                  {imageSrc && (
                    <img
                      className="tile-thumb"
                      src={imageSrc}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      style={{ objectPosition: item.photo?.position ?? item.thumbPosition ?? 'center top' }}
                      onError={() => setFailedImages((prev) => ({ ...prev, [item.url]: [...(prev[item.url] ?? []), imageSrc] }))}
                    />
                  )}

                  {item.photo?.credit && (
                    <span className="tile-credit">{item.photo.credit}</span>
                  )}

                  <div className="tile-play" aria-hidden="true" />
                  <div className="tile-content">
                    <em>{FLABELS[item.category] ?? item.category}</em>
                    <h3>{title}</h3>
                    {showHashtags && (
                      <div className="tile-tags" aria-label="Related hashtags">
                        {meta.hashtags.map((tag) => <span key={`${item.url}-${tag}`}>#{tag}</span>)}
                      </div>
                    )}
                    <small className="tile-meta">
                      {views && (
                        <>
                          <svg viewBox="0 0 20 20" aria-hidden="true" className="tile-view-icon"><path d="M10 3.2c3.9 0 7.2 3.2 8.9 6.8-1.7 3.6-5 6.8-8.9 6.8S2.8 13.6 1.1 10C2.8 6.4 6.1 3.2 10 3.2zm0 2.1c-2.4 0-4.4 2-4.4 4.7s2 4.7 4.4 4.7 4.4-2 4.4-4.7-2-4.7-4.4-4.7zm0 2.2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z"/></svg>
                          <span>{views}</span>
                        </>
                      )}
                      {views && <span> · </span>}
                      <span>{posted}</span>
                    </small>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Debate ─────────────────────────────────────────────────────────────────
function Debate() {
  const [voted, setVoted] = useState<'y'|'n'|null>(null);
  const base = { y: 58, n: 42 };

  const handleVote = (k: 'y'|'n') => {
    if (voted) return;
    setVoted(k);
  };

  const pcts = voted ? (() => {
    const t = base.y + base.n + 1;
    const yv = base.y + (voted==='y' ? 1 : 0);
    const py = Math.round(yv/t*100);
    return { y: py, n: 100-py };
  })() : { y: 0, n: 0 };

  return (
    <section className="debate-sec" id="debate">
      <div className="wrap">
        <div className="debate-box">
          <h2>Who got it right?</h2>
          <p style={{ fontSize:'1.35rem', marginTop:'14px' }}>
            Was the manager right to take off his best passer with twenty minutes left?
          </p>
          {(['y','n'] as const).map((k) => (
            <button
              key={k}
              className={`opt${voted===k?' win':''}`}
              disabled={!!voted}
              onClick={() => handleVote(k)}
            >
              <i className="fill" style={{ width: voted ? `${pcts[k]}%` : '0%' }}/>
              <span>
                {k==='y' ? 'Yes, brave call' : 'No, big mistake'}
                <em style={{ fontStyle:'normal' }}>{voted ? ` ${pcts[k]}%` : ''}</em>
              </span>
            </button>
          ))}
          <div className={`debate-after${voted ? ' show' : ''}`} aria-live="polite">
            Sample votes. His take is in the video:{' '}
            <a href={TIKTOK} target="_blank" rel="noopener noreferrer">watch the full argument</a>.
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Predictions ────────────────────────────────────────────────────────────
function Predictions() {
  const [ringActive, setRingActive] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setRingActive(true); }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch(MATCHES_URL);
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (mounted) setMatches(d.matches ?? []);
      } catch {
        if (mounted) setMatches([]);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const record = getRecord(matches);
  const accuracy = record.accuracy == null ? '—' : `${record.accuracy}%`;
  const CIRCUM = 94.2;
  const dashArr = ringActive && record.accuracy != null ? `${Math.round((record.accuracy / 100) * CIRCUM)} ${CIRCUM}` : `0 ${CIRCUM}`;

  return (
    <section id="predictions">
      <div className="wrap">
        <div className="pred">
          <div ref={ref}>
            <div className="stats-card">
              <div>
                <h3>My predictions</h3>
                <p>Tracking the hits and misses.</p>
              </div>
              <div className="num">
                <small>2026/27 season</small>
                <b>{record.total ? record.total : '—'}</b>
                <small>Matches</small>
              </div>
              <div className="num">
                <small>&nbsp;</small>
                <b>{record.total ? record.hits : '—'}</b>
                <small>Correct</small>
              </div>
              <div className="num">
                <small>&nbsp;</small>
                <b>{accuracy}</b>
                <small>Accuracy</small>
              </div>
              <svg className="ring" viewBox="0 0 36 36" role="img" aria-label={accuracy === '—' ? 'No accuracy data yet' : `${accuracy} accuracy`}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" strokeWidth="3"/>
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="var(--garnet)" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={dashArr}
                  transform="rotate(-90 18 18)"
                  style={{ transition: ringActive ? 'stroke-dasharray 1s ease' : 'none' }}
                />
              </svg>
            </div>
            <table className="pred-table">
              <thead>
                <tr><th>Call</th><th>Result</th></tr>
              </thead>
              <tbody>
                <tr><td>Barça finish above Madrid</td><td className="pend">Pending</td></tr>
                <tr><td>Arsenal top four</td><td className="hit">Hit</td></tr>
                <tr><td>Inter reach the UCL final</td><td className="miss">Miss</td></tr>
                <tr><td>Summer signing scores 10+</td><td className="pend">Pending</td></tr>
              </tbody>
            </table>
          </div>
          <div className="quote-card">
            <div className="qmark" aria-hidden="true">&ldquo;</div>
            <div>
              <q>Football isn&apos;t just a game, it&apos;s a story. And I love telling it.</q>
              <cite>— Jumah</cite>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <>
      <footer>
        <div className="wrap">
          <div className="k">DON&apos;T JUST WATCH THE GAME.</div>
          <h2>Understand it.</h2>
          <p>Follow for football analysis, opinions and more.</p>
          <div className="foot-soc">
            {[
              [TIKTOK, 'TikTok', <IconTikTok/>],
              ['#', 'YouTube', <IconYouTube/>],
              ['#', 'Instagram', <IconInstagram/>],
              ['#', 'X', <IconX/>],
            ].map(([href, label, icon]) => (
              <a key={label as string} href={href as string} target="_blank" rel="noopener noreferrer" aria-label={label as string}>
                {icon as React.ReactNode}
              </a>
            ))}
          </div>
        </div>
      </footer>
      <div className="wrap">
        <div className="foot-note">
          <strong>Concept pitch.</strong> Scores, views, votes, video titles and stats are sample content.
          The squad list and numbers reflect Barcelona&apos;s 2026/27 first team as announced by the club.
          Portraits, crests and match photography would be original or licensed before launch.
        </div>
      </div>
    </>
  );
}

// ── Back to Top ────────────────────────────────────────────────────────────
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <button
      className={`btt${show ? ' show' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <IconArrowUp />
    </button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [matches, setMatches] = useState<Match[]>(SAMPLE_MATCHES);

  useEffect(() => {
    let cancelled = false;
    const fetchMatches = async () => {
      try {
        const r = await fetch(MATCHES_URL);
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (!cancelled) setMatches(d.matches ?? SAMPLE_MATCHES);
      } catch {
        if (!cancelled) setMatches(SAMPLE_MATCHES);
      }
    };

    fetchMatches();
    const id = setInterval(fetchMatches, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <>
      <Nav />
      <Hero />
      <Matchday />
      <LeagueTables />
      <Analysis />
      <TacticalBoard />
      <Squad />
      <BarcaCorner />
      <Feed />
      <Debate />
      <Predictions />
      <Footer />
      <BackToTop />
    </>
  );
}
