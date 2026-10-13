// Misafirin giriş kartında: salonun küçük planı, kendi masası parlıyor
export default function TableMap({ tables, mine }) {
  if (!tables?.length || !mine) return null
  const list = tables.includes(mine) ? tables : [...tables, mine]
  const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(list.length))))
  const rows = Math.ceil(list.length / cols)
  const cell = 100
  const w = cols * cell
  const h = rows * cell + 56
  return (
    <figure className="tmap">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Salon planı, sizin masanız ${mine}`}>
        <rect x={w * 0.18} y="8" width={w * 0.64} height="26" rx="13" className="tmap__stage" />
        <text x={w / 2} y="25" className="tmap__stagetext">SAHNE · DANS PİSTİ</text>
        {list.map((name, i) => {
          const cx = (i % cols) * cell + cell / 2
          const cy = Math.floor(i / cols) * cell + cell / 2 + 50
          const me = name === mine
          return (
            <g key={name} className={me ? 'tmap__t is-me' : 'tmap__t'}>
              {me && <circle cx={cx} cy={cy} r="40" className="tmap__pulse" />}
              {Array.from({ length: 10 }, (_, k) => {
                const a = (k / 10) * Math.PI * 2
                return <circle key={k} cx={cx + Math.cos(a) * 33} cy={cy + Math.sin(a) * 33} r="5" className="tmap__chair" />
              })}
              <circle cx={cx} cy={cy} r="24" className="tmap__table" />
              <text x={cx} y={cy + 6} className="tmap__num">{name}</text>
            </g>
          )
        })}
      </svg>
      <figcaption>Masanız salonda parlayan masa: <b>Masa {mine}</b></figcaption>
    </figure>
  )
}
