// Sayfanın arkasında süzülen inci ve cam küreler; cam kartların arkasından bulanık görünür
const ORBS = [
  { top: '14%', left: '-12%', size: 190, tone: 'gold', dur: 18 },
  { top: '24%', left: '78%', size: 130, tone: 'lilac', dur: 22 },
  { top: '38%', left: '-8%', size: 110, tone: 'rose', dur: 20 },
  { top: '49%', left: '72%', size: 200, tone: 'blue', dur: 26 },
  { top: '62%', left: '4%', size: 150, tone: 'lilac', dur: 21 },
  { top: '74%', left: '80%', size: 120, tone: 'gold', dur: 19 },
  { top: '86%', left: '-6%', size: 170, tone: 'rose', dur: 24 },
]

export default function Orbs() {
  return (
    <div className="orbs" aria-hidden="true">
      {ORBS.map((o, i) => (
        <i key={i} className={`orb orb--${o.tone}`}
          style={{ top: o.top, left: o.left, width: o.size, height: o.size, animationDuration: `${o.dur}s`, animationDelay: `${-i * 3}s` }} />
      ))}
    </div>
  )
}
