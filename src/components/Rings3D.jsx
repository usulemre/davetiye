import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// Kapaktaki gerçek 3D sahne: iç içe geçmiş iki altın alyans, tektaş pırlanta,
// etrafta süzülen cam küreler ve cam kalpler. Parmakla yana çekince alyanslar döner.
export default function Rings3D({ gold = '#c9a46c', play = true }) {
  const host = useRef(null)
  const playing = useRef(play)
  playing.current = play

  useEffect(() => {
    const el = host.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      return undefined
    }
    const small = window.innerWidth < 600
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.6 : 1.8))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60)
    camera.position.set(0, 0, 8)
    const key = new THREE.DirectionalLight(0xfff1dc, 1.6)
    key.position.set(3, 4, 5)
    scene.add(key, new THREE.AmbientLight(0xffffff, 0.35))

    // Alyanslar
    const rings = new THREE.Group()
    const yellow = new THREE.MeshPhysicalMaterial({ color: gold, metalness: 1, roughness: 0.16, clearcoat: 0.5, clearcoatRoughness: 0.12 })
    const rose = yellow.clone()
    rose.color = new THREE.Color(gold).lerp(new THREE.Color('#f2b7a6'), 0.4)
    const a = new THREE.Mesh(bandGeometry(1, 0.075, 0.16), yellow)
    a.position.x = -0.46
    const b = new THREE.Group()
    b.add(new THREE.Mesh(bandGeometry(0.9, 0.065, 0.13), rose))
    b.add(makeDiamond(0.9))
    b.position.x = 0.46
    b.rotation.x = Math.PI / 2
    a.rotation.x = 0.0
    rings.add(a, b)
    rings.rotation.set(0.5, -0.5, 0.2)
    const ringHolder = new THREE.Group()
    ringHolder.add(rings)
    scene.add(ringHolder)

    // Cam küreler ve kalpler
    // Arka plan saydam olduğu için kırılma yerine parlak, gökkuşağı yansımalı cam
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.1, roughness: 0.02, transparent: true, opacity: 0.38, depthWrite: false,
      iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 800],
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.4, specularIntensity: 1, side: THREE.DoubleSide,
    })
    const pearl = new THREE.MeshPhysicalMaterial({ color: 0xfff8f2, roughness: 0.25, metalness: 0, sheen: 1, sheenColor: new THREE.Color('#f3d9e4'), iridescence: 0.6, clearcoat: 1 })
    const heartGeo = heartGeometry()
    const floaters = []
    const spots = small
      ? [[-1.55, 1.55, -0.6, 0.34, 's'], [1.6, 1.25, 0.2, 0.26, 'h'], [-1.4, -1.45, 0.5, 0.24, 'h'], [1.45, -1.35, -0.8, 0.4, 's'], [0.2, 2.0, -2, 0.18, 'p'], [-0.5, -1.9, -1.5, 0.15, 'p']]
      : [[-2.6, 1.3, -0.6, 0.42, 's'], [2.5, 1.1, 0.2, 0.3, 'h'], [-2.1, -1.3, 0.6, 0.28, 'h'], [2.3, -1.25, -0.8, 0.5, 's'], [0.4, 1.9, -2, 0.2, 'p'], [-3.4, 0.1, -2.4, 0.22, 'p'], [3.6, 0.2, -2.6, 0.26, 's']]
    for (const [x, y, z, s, kind] of spots) {
      const mesh = kind === 'h'
        ? new THREE.Mesh(heartGeo, glass)
        : new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), kind === 'p' ? pearl : glass)
      mesh.scale.setScalar(s)
      mesh.position.set(x, y, z)
      mesh.userData = { x, y, z, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.4 }
      scene.add(mesh)
      floaters.push(mesh)
    }

    // Boyut ve görünürlük
    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // dar ekranda kamera biraz geri çekilir
      camera.position.z = w / h < 0.9 ? 9.4 : 8
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)

    // Parmakla çevirme (dikey kaydırma serbest kalır)
    let spin = 0
    let drag = null
    const onDown = (e) => { drag = { x: e.clientX, t: performance.now() } }
    const onMove = (e) => {
      if (drag) {
        const dx = e.clientX - drag.x
        drag.x = e.clientX
        spin = dx * 0.012
        rings.rotation.y += dx * 0.012
      }
      if (e.pointerType === 'mouse') {
        const r = el.getBoundingClientRect()
        pointer.x = (e.clientX - r.left) / r.width - 0.5
        pointer.y = (e.clientY - r.top) / r.height - 0.5
      }
    }
    const onUp = () => { drag = null }
    const pointer = { x: 0, y: 0 }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let appear = 0
    let frame = 0
    const clock = new THREE.Clock()
    const loop = () => {
      frame = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!visible || document.hidden) return
      const t = clock.elapsedTime
      if (playing.current) appear = Math.min(1, appear + dt / 1.8)
      const e = 1 - Math.pow(1 - appear, 3)

      if (!drag) {
        spin *= 0.94
        rings.rotation.y += spin + (still ? 0 : dt * 0.35)
      }
      rings.rotation.x = 0.5 + Math.sin(t * 0.6) * 0.12
      // sayfa kaydıkça alyanslar yukarı kalkar ve döner
      const sy = Math.min(window.scrollY / window.innerHeight, 1.2)
      ringHolder.position.y = Math.sin(t * 0.9) * 0.08 + sy * 1.6
      ringHolder.rotation.z = sy * 0.6
      ringHolder.scale.setScalar(0.4 + e * 0.6)
      ringHolder.rotation.x = (1 - e) * -1.2

      for (const m of floaters) {
        const d = m.userData
        m.position.set(
          d.x + Math.sin(t * d.sp + d.ph) * 0.12,
          d.y + Math.cos(t * d.sp * 0.8 + d.ph) * 0.18 + sy * (1.2 + d.z * -0.3),
          d.z,
        )
        m.rotation.y = t * d.sp * 0.6 + d.ph
        m.rotation.z = Math.sin(t * 0.5 + d.ph) * 0.25
        m.visible = e > 0.05
      }

      camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.05
      camera.position.y += (-pointer.y * 0.5 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      scene.traverse((o) => {
        o.geometry?.dispose()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.innerHTML = ''
    }
  }, [gold])

  return <div ref={host} className="rings3d" aria-hidden="true" />
}

// Kenarları yuvarlatılmış alyans kesiti, Y ekseni etrafında döndürülür
function bandGeometry(radius, thick, width) {
  const pts = []
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    // yarı kare yarı oval kesit (rahat kalıp alyans)
    const x = Math.sign(c) * Math.pow(Math.abs(c), 0.55) * thick
    const y = Math.sign(s) * Math.pow(Math.abs(s), 0.4) * width / 2
    pts.push(new THREE.Vector2(radius + x, y))
  }
  const geo = new THREE.LatheGeometry(pts, 160)
  geo.rotateX(Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

// Tektaş pırlanta ve altın tırnaklar
function makeDiamond(radius) {
  const g = new THREE.Group()
  const stone = new THREE.MeshPhysicalMaterial({
    color: 0xf4f8ff, metalness: 0.2, roughness: 0, iridescence: 0.7, iridescenceIOR: 2,
    clearcoat: 1, envMapIntensity: 3.5, flatShading: true,
  })
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.07, 8), stone)
  crown.position.y = 0.035
  const pavilion = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 8), stone)
  pavilion.rotation.x = Math.PI
  pavilion.position.y = -0.1
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xf4efe6, metalness: 1, roughness: 0.15 })
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.12, 16), metal)
  cup.position.y = -0.17
  g.add(crown, pavilion, cup)
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * Math.PI * 2 + Math.PI / 4
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.2, 8), metal)
    prong.position.set(Math.cos(ang) * 0.15, -0.04, Math.sin(ang) * 0.15)
    prong.rotation.z = Math.cos(ang) * -0.25
    prong.rotation.x = Math.sin(ang) * 0.25
    g.add(prong)
  }
  // alyansın dış yüzeyine, dışa bakacak şekilde
  g.rotation.z = -Math.PI / 2
  g.position.set(radius + 0.29, 0, 0)
  return g
}

function heartGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.9)
  s.bezierCurveTo(-0.2, -0.65, -1, -0.25, -1, 0.3)
  s.bezierCurveTo(-1, 0.75, -0.6, 1, -0.35, 1)
  s.bezierCurveTo(-0.15, 1, 0, 0.85, 0, 0.65)
  s.bezierCurveTo(0, 0.85, 0.15, 1, 0.35, 1)
  s.bezierCurveTo(0.6, 1, 1, 0.75, 1, 0.3)
  s.bezierCurveTo(1, -0.25, 0.2, -0.65, 0, -0.9)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.2, bevelSegments: 8, curveSegments: 24 })
  geo.center()
  return geo
}
