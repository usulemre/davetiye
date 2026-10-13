import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const GOLD = 0xc9a46c
const SPACING = 3.6
const CHAIR_R = 1.42

// Gerçek 3D salon: örtülü yuvarlak masalar, altın Chiavari sandalyeler, çiçekler ve mumlar.
// tables: [{ name, seats: [{ color, initial } | null] }]
export default function Hall3D({ tables, selected, onSelect }) {
  const box = useRef(null)
  const api = useRef(null)

  // Sahne, ışıklar, kamera ve kontroller bir kez kurulur
  useEffect(() => {
    const el = box.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)

    const labels = new CSS2DRenderer()
    labels.domElement.className = 'hall__labels'
    el.appendChild(labels.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf7efea)
    // Altın sandalyelerin parlaması için yumuşak ortam yansıması
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.55
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)

    scene.add(new THREE.HemisphereLight(0xfff8f2, 0xe8d6cc, 1.1))
    const sun = new THREE.DirectionalLight(0xfff1e0, 2.2)
    sun.position.set(6, 12, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = sun.shadow.camera.bottom = -16
    sun.shadow.camera.right = sun.shadow.camera.top = 16
    sun.shadow.radius = 4
    sun.shadow.bias = -0.0005
    scene.add(sun)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(40, 64),
      new THREE.MeshStandardMaterial({ color: 0xf7eee8, roughness: 0.95 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.maxPolarAngle = 1.25
    controls.minDistance = 4
    controls.maxDistance = 30
    controls.enablePan = false

    const hall = new THREE.Group()
    scene.add(hall)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h)
      labels.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Masaya dokununca seç (sürükleme ise seçme)
    const ray = new THREE.Raycaster()
    let down = null
    const onDown = (e) => { down = [e.clientX, e.clientY] }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const r = renderer.domElement.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
      const hit = ray.intersectObjects(hall.children, true).find((h) => findTable(h.object))
      api.current?.onSelect(hit ? findTable(hit.object) : null)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    let t0 = performance.now()
    renderer.setAnimationLoop((now) => {
      const dt = (now - t0) / 1000
      t0 = now
      controls.update()
      hall.traverse((o) => {
        if (o.userData.flame) o.scale.y = 1 + Math.sin(now / 120 + o.userData.flame) * 0.15
        if (o.userData.ring) o.rotation.z += dt * 0.6
      })
      renderer.render(scene, camera)
      labels.render(scene, camera)
    })

    api.current = { scene, hall, camera, controls, onSelect, framed: false }
    return () => {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      controls.dispose()
      disposeGroup(hall)
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.innerHTML = ''
      api.current = null
    }
  }, [])

  useEffect(() => { if (api.current) api.current.onSelect = onSelect }, [onSelect])

  // Masalar değişince salonu yeniden diz
  useEffect(() => {
    const a = api.current
    if (!a) return
    disposeGroup(a.hall)
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(tables.length))))
    const rows = Math.ceil(tables.length / cols)
    tables.forEach((t, i) => {
      const x = ((i % cols) - (cols - 1) / 2) * SPACING
      const z = (Math.floor(i / cols) - (rows - 1) / 2) * SPACING + 1
      const g = makeTable(t, t.name === selected)
      g.position.set(x, 0, z)
      a.hall.add(g)
    })
    const depth = (rows - 1) * SPACING
    const stage = makeStage(Math.max(cols * SPACING, 6))
    stage.position.set(0, 0, -depth / 2 - 2.6)
    a.hall.add(stage)

    // İlk açılışta tüm salonu kadraja al
    if (!a.framed) {
      // Salonu ekrana sığdır: içeriği saran çemberin görüş açısına sığacağı uzaklık
      const halfW = (cols * SPACING) / 2 + 0.6
      const halfD = (rows * SPACING + 3.6) / 2
      const radius = Math.hypot(halfW, halfD * 0.8)
      const vFov = THREE.MathUtils.degToRad(a.camera.fov)
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * a.camera.aspect)
      const dist = (radius / Math.sin(Math.min(vFov, hFov) / 2)) * 0.72
      const elev = THREE.MathUtils.degToRad(52)
      const cz = 0.5
      a.camera.position.set(0, Math.sin(elev) * dist, cz + Math.cos(elev) * dist)
      a.controls.target.set(0, 0, cz)
      a.framed = true
    }
  }, [JSON.stringify(tables), selected])

  return <div className="hall" ref={box} />
}

function findTable(o) {
  for (let x = o; x; x = x.parent) if (x.userData.table) return x.userData.table
  return null
}

function disposeGroup(group) {
  for (const child of [...group.children]) {
    child.traverse((o) => {
      o.geometry?.dispose()
      if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      if (o.isCSS2DObject) o.element.remove()
    })
    group.remove(child)
  }
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts })
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m }

function makeTable(t, isSel) {
  const g = new THREE.Group()
  g.userData.table = t.name

  // Yere kadar inen örtü, üst tabla ve altın şerit
  const cloth = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.04, 0.76, 64, 1, true), mat(0xfffbf8, { roughness: 0.85, side: THREE.DoubleSide })))
  cloth.position.y = 0.38
  const top = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.93, 0.93, 0.03, 64), mat(0xffffff, { roughness: 0.8 })))
  top.position.y = 0.77
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.935, 0.012, 8, 80), mat(GOLD, { metalness: 0.8, roughness: 0.3 }))
  band.rotation.x = Math.PI / 2
  band.position.y = 0.74
  g.add(cloth, top, band)

  // Ortada vazo, çiçekler ve mumlar
  const vase = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.22, 24), mat(GOLD, { metalness: 0.7, roughness: 0.3 })))
  vase.position.y = 0.9
  g.add(vase)
  const petals = [0xf3c6c0, 0xe8a9a3, 0xfff1ee, 0xf6d8c9]
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2
    const r = k === 0 ? 0 : 0.09 + (k % 2) * 0.04
    const f = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.065 + (k % 3) * 0.012, 16, 12), mat(petals[k % petals.length], { roughness: 0.7 })))
    f.position.set(Math.cos(a) * r, 1.06 + (k % 3) * 0.035, Math.sin(a) * r)
    g.add(f)
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat(0xa3b29a))
    leaf.scale.set(1.8, 0.4, 0.8)
    leaf.position.set(Math.cos(a) * 0.17, 1.0, Math.sin(a) * 0.17)
    leaf.rotation.y = -a
    g.add(leaf)
  }
  for (const [cx, cz] of [[0.32, 0.12], [-0.3, -0.16], [0.05, -0.34]]) {
    const candle = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 16), mat(0xfffaf0)))
    candle.position.set(cx, 0.86, cz)
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc46b }))
    flame.scale.set(0.8, 1.8, 0.8)
    flame.position.set(cx, 0.97, cz)
    flame.userData.flame = cx * 10
    g.add(candle, flame)
  }

  // Sandalyeler ve dolu yerlerde tabak, kadeh
  const n = Math.max(10, t.seats.length)
  t.seats.slice(0, n).concat(Array(Math.max(0, n - t.seats.length)).fill(null)).forEach((s, i) => {
    const a = (i / n) * Math.PI * 2
    const chair = makeChair(s?.color, i >= 10)
    chair.position.set(Math.sin(a) * CHAIR_R, 0, Math.cos(a) * CHAIR_R)
    chair.rotation.y = a
    g.add(chair)
    if (s) {
      const person = makePerson(s.color, i + t.name.length * 3, i >= 10)
      person.position.copy(chair.position)
      person.rotation.y = a
      g.add(person)
      const plate = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.015, 32), mat(0xffffff, { roughness: 0.3 })))
      plate.position.set(Math.sin(a) * 0.68, 0.79, Math.cos(a) * 0.68)
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.12, 16), mat(0xdfeaf0, { transparent: true, opacity: 0.55, roughness: 0.05 }))
      const ga = a + 0.22
      glass.position.set(Math.sin(ga) * 0.62, 0.85, Math.cos(ga) * 0.62)
      g.add(plate, glass)
      if (s.initial) {
        const tag = document.createElement('span')
        tag.className = 'hall__init'
        tag.textContent = s.initial
        tag.style.background = s.color
        const obj = new CSS2DObject(tag)
        obj.position.set(Math.sin(a) * 1.62, 1.5, Math.cos(a) * 1.62)
        g.add(obj)
      }
    }
  })

  // Seçili masanın etrafında altın halka
  if (isSel) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.78, 1.86, 64, 1, 0, Math.PI * 1.7), new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    ring.userData.ring = true
    g.add(ring)
  }

  const label = document.createElement('div')
  label.className = `hall__tag ${isSel ? 'is-sel' : ''} ${t.people > 10 ? 'is-over' : ''}`
  label.innerHTML = `<small>Masa</small><b></b><em></em>`
  label.querySelector('b').textContent = t.name
  label.querySelector('em').textContent = `${t.people}/10`
  const tag = new CSS2DObject(label)
  tag.position.set(0, 1.75, 0)
  g.add(tag)
  return g
}

// Altın Chiavari düğün sandalyesi; minder rengi oturan aileyi gösterir
function makeChair(color, over) {
  const g = new THREE.Group()
  const gold = mat(GOLD, { metalness: 0.75, roughness: 0.32 })
  const seat = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), gold))
  seat.position.y = 0.45
  const cushion = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.36), mat(color || 0xfffaf6, { roughness: 0.9 })))
  cushion.position.y = 0.495
  if (over) cushion.material.emissive = new THREE.Color(0x802010)
  g.add(seat, cushion)
  for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) {
    const leg = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.45, 8), gold))
    leg.position.set(x, 0.225, z)
    g.add(leg)
  }
  // Arkalık: iki dikme ve yatay çubuklar (masadan uzak tarafta)
  for (const x of [-0.18, 0.18]) {
    const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), gold))
    post.position.set(x, 0.72, 0.18)
    g.add(post)
  }
  for (const y of [0.62, 0.74, 0.86, 0.96]) {
    const bar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8), gold))
    bar.rotation.z = Math.PI / 2
    bar.position.set(0, y, 0.18)
    g.add(bar)
  }
  return g
}

// Sandalyede oturan misafir: kıyafet rengi ailenin rengi, ten ve saç her yerde biraz farklı
const SKINS = [0xf1c9a5, 0xe0ac85, 0xc68e64, 0xf5d5bc, 0xd9a07a]
const HAIRS = [0x2b1d16, 0x4a3022, 0x7a5236, 0x1c1714, 0xa77b4f, 0x5c5552]
const LEGS = [0x2f2a36, 0x3b3a48, 0x4a3b3a]
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12)
const limb = (geo, m, from, to) => {
  const mesh = new THREE.Mesh(geo, m)
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize())
  mesh.castShadow = true
  return mesh
}

function makePerson(color, seed, over) {
  const g = new THREE.Group()
  const woman = seed % 2 === 0
  const skin = mat(SKINS[seed % SKINS.length], { roughness: 0.7 })
  const hair = mat(HAIRS[(seed * 7) % HAIRS.length], { roughness: 0.8 })
  const cloth = mat(color || 0xd8c8c0, { roughness: 0.75 })
  if (over) cloth.emissive = new THREE.Color(0x802010)
  const legs = woman ? cloth : mat(LEGS[seed % LEGS.length], { roughness: 0.8 })

  // Bacaklar: oturuk uyluk ve yere inen baldır (masa -z yönünde)
  for (const x of [-0.08, 0.08]) {
    g.add(limb(cap(0.062, 0.26), legs, [x, 0.56, 0.06], [x, 0.56, -0.26]))
    g.add(limb(cap(0.05, 0.42), legs, [x, 0.53, -0.28], [x, 0.04, -0.3]))
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.16), mat(0x1e1a1a, { roughness: 0.5 }))
    shoe.position.set(x, 0.025, -0.34)
    g.add(shoe)
  }
  // Kadınlarda uzun etek
  if (woman) {
    const skirt = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 20), cloth))
    skirt.position.set(0, 0.36, -0.22)
    g.add(skirt)
  }

  // Gövde, omuzlar ve kollar masaya uzanır
  const torso = shadowed(new THREE.Mesh(cap(0.13, 0.26), cloth))
  torso.scale.set(woman ? 1.05 : 1.2, 1, 0.75)
  torso.position.set(0, 0.84, 0.05)
  torso.rotation.x = -0.08
  g.add(torso)
  for (const x of [-1, 1]) {
    const sh = [x * 0.17, 0.98, 0.05]
    const el = [x * 0.2, 0.76, -0.12]
    const hand = [x * 0.12, 0.8, -0.4]
    g.add(limb(cap(0.045, 0.18), cloth, sh, el))
    g.add(limb(cap(0.04, 0.22), cloth, el, hand))
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), skin)
    palm.position.set(...hand)
    g.add(palm)
  }
  if (!woman) {
    // Damatlık havası: beyaz gömlek yakası ve kravat
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.02), mat(0xffffff))
    shirt.position.set(0, 0.98, -0.055)
    shirt.rotation.x = -0.08
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.022), mat(0x3a2f3a))
    tie.position.set(0, 0.96, -0.062)
    tie.rotation.x = -0.08
    g.add(shirt, tie)
  }

  // Boyun, baş ve saç
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), skin)
  neck.position.set(0, 1.1, 0.04)
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), skin))
  head.scale.set(0.95, 1.08, 1)
  head.position.set(0, 1.23, 0.03)
  g.add(neck, head)
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hair)
  top.position.set(0, 1.245, 0.045)
  top.rotation.x = 0.35
  g.add(top)
  if (woman) {
    const long = shadowed(new THREE.Mesh(cap(0.095, 0.16), hair))
    long.scale.set(1.1, 1, 0.6)
    long.position.set(0, 1.12, 0.1)
    g.add(long)
  }
  return g
}

function makeStage(width) {
  const g = new THREE.Group()
  const stage = shadowed(new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 1.6), mat(0xeed9cf, { roughness: 0.7 })))
  stage.position.y = 0.1
  const edge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.03, 0.03), mat(GOLD, { metalness: 0.8, roughness: 0.3 }))
  edge.position.set(0, 0.2, 0.8)
  // Çiçek kemeri
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 12, 48, Math.PI), mat(0xf3c6c0, { roughness: 0.8 }))
  arch.position.set(0, 0.2, -0.3)
  arch.castShadow = true
  const floorDance = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.6, 1.6), mat(0xfaf3ee, { roughness: 0.25, metalness: 0.1 }))
  floorDance.rotation.x = -Math.PI / 2
  floorDance.position.set(0, 0.005, 1.6)
  floorDance.receiveShadow = true
  const tag = document.createElement('div')
  tag.className = 'hall__stage'
  tag.textContent = 'Sahne · Dans pisti'
  const obj = new CSS2DObject(tag)
  obj.position.set(0, 1.8, -0.3)
  g.add(stage, edge, arch, floorDance, obj)
  return g
}
