import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const W = 3
const H = 2
const FLAP = H * 0.62

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3))
const easeInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const span = (t, a, b) => (t - a) / (b - a)

// Gerçek 3D zarf: dokununca mühür ikiye ayrılır, kapak açılır,
// davetiye kartı zarftan çıkıp ekrana doğru uçar.
export default function Envelope3D({ opening, colors, card, initials, onReady, onFail }) {
  const host = useRef(null)
  const openAt = useRef(null)
  const openingRef = useRef(opening)
  openingRef.current = opening

  useEffect(() => {
    const el = host.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      onFail?.()
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.4)
    sun.position.set(-2.5, 4, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -3; sun.shadow.camera.right = 3
    sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3
    sun.shadow.radius = 6
    sun.shadow.bias = -0.0008
    scene.add(sun, new THREE.AmbientLight(0xffffff, 0.45))

    const gold = new THREE.Color(colors.champagne)
    const paperCol = new THREE.Color(colors.champagneHi).lerp(new THREE.Color(colors.champagne), 0.28)
    const paperTex = noiseTexture()
    const paper = (c, side = THREE.FrontSide) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, map: paperTex, side })

    // Zarf (arka yüz, iç cep, ön cep, kapak)
    const env = new THREE.Group()
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.02), paper(paperCol.clone().multiplyScalar(0.92)))
    back.receiveShadow = true
    back.castShadow = true
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, H * 0.98), new THREE.MeshStandardMaterial({ map: linerTexture(colors), roughness: 0.7 }))
    inside.position.z = 0.012
    env.add(back, inside)

    // Davetiye kartı
    const cardTex = cardTexture(card, colors)
    const monoTex = monogramTexture(initials, colors)
    const cardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.9, H * 0.86, 0.012),
      [paper(0xffffff), paper(0xffffff), paper(0xffffff), paper(0xffffff),
        new THREE.MeshBasicMaterial({ map: cardTex, toneMapped: false }),
        new THREE.MeshBasicMaterial({ map: monoTex, toneMapped: false })],
    )
    cardMesh.castShadow = true
    cardMesh.receiveShadow = true
    cardMesh.position.z = 0.03
    env.add(cardMesh)

    // Ön cep: altta ve yanlarda katlanan kâğıt
    const pocketShape = new THREE.Shape()
    pocketShape.moveTo(-W / 2, -H / 2)
    pocketShape.lineTo(W / 2, -H / 2)
    pocketShape.lineTo(W / 2, H / 2)
    pocketShape.lineTo(0, -H * 0.04)
    pocketShape.lineTo(-W / 2, H / 2)
    pocketShape.closePath()
    const pocket = new THREE.Mesh(new THREE.ExtrudeGeometry(pocketShape, { depth: 0.012, bevelEnabled: false }), paper(paperCol))
    pocket.position.z = 0.045
    pocket.castShadow = true
    pocket.receiveShadow = true
    env.add(pocket)
    // cepteki altın kenar çizgisi
    const edge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, H / 2, 0), new THREE.Vector3(0, -H * 0.04, 0), new THREE.Vector3(W / 2, H / 2, 0)]),
      new THREE.LineBasicMaterial({ color: gold }),
    )
    edge.position.z = 0.058
    env.add(edge)
    // alt kapakçığın hafif katlama izleri
    const folds = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-W / 2, -H / 2, 0), new THREE.Vector3(-W * 0.08, -H * 0.02, 0),
        new THREE.Vector3(W / 2, -H / 2, 0), new THREE.Vector3(W * 0.08, -H * 0.02, 0),
      ]),
      new THREE.LineBasicMaterial({ color: gold, transparent: true, opacity: 0.35 }),
    )
    folds.position.z = 0.058
    env.add(folds)

    // Kapak: dış yüzü kâğıt, iç yüzü desenli astar
    const flapShape = new THREE.Shape()
    flapShape.moveTo(-W / 2, 0)
    flapShape.lineTo(W / 2, 0)
    flapShape.quadraticCurveTo(W * 0.12, -FLAP * 0.8, 0, -FLAP)
    flapShape.quadraticCurveTo(-W * 0.12, -FLAP * 0.8, -W / 2, 0)
    const flapGeo = new THREE.ShapeGeometry(flapShape, 24)
    const flap = new THREE.Group()
    const flapFront = new THREE.Mesh(flapGeo, paper(paperCol.clone().multiplyScalar(1.02)))
    const linerMat = new THREE.MeshStandardMaterial({ map: linerTexture(colors), roughness: 0.7, side: THREE.BackSide })
    const flapBack = new THREE.Mesh(flapGeo, linerMat)
    flapFront.castShadow = true
    flapFront.receiveShadow = true
    const flapEdge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(flapShape.getPoints(30).map((p) => new THREE.Vector3(p.x * 0.985, p.y * 0.985 - 0.006, 0.002))),
      new THREE.LineBasicMaterial({ color: gold }),
    )
    flap.add(flapFront, flapBack, flapEdge)
    flap.position.set(0, H / 2, 0.062)
    env.add(flap)

    // Balmumu mühür (iki yarım)
    const sealTex = sealTexture(initials, colors)
    const wax = new THREE.MeshPhysicalMaterial({ color: gold.clone().multiplyScalar(0.82), roughness: 0.35, metalness: 0.35, clearcoat: 0.6 })
    const waxTop = new THREE.MeshPhysicalMaterial({ map: sealTex, roughness: 0.35, metalness: 0.4, clearcoat: 0.6, bumpMap: sealTex, bumpScale: 3 })
    const halves = [0, Math.PI].map((start) => {
      const g = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.07, 48, 1, false, start, Math.PI), [wax, waxTop, wax])
      g.rotation.x = Math.PI / 2
      g.castShadow = true
      return g
    })
    const seal = new THREE.Group()
    halves.forEach((h) => seal.add(h))
    seal.position.set(0, H / 2 - FLAP + 0.12, 0.11)
    env.add(seal)

    // Arkadaki yumuşak gölge
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, H * 1.6), new THREE.MeshBasicMaterial({ map: blurTexture(), transparent: true, depthWrite: false, opacity: 0.55 }))
    shadow.position.set(0.25, -0.35, -0.5)
    env.add(shadow)

    scene.add(env)

    // Mühür kırılınca saçılan altın kıvılcımlar ve havadaki toz
    const sparks = makePoints(160, gold, 0.06)
    sparks.visible = false
    scene.add(sparks)
    const sparkVel = Array.from({ length: 160 }, () => new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4 - 1, Math.random() * 3))
    const dust = makePoints(window.innerWidth < 600 ? 90 : 160, gold, 0.045)
    const dp = dust.geometry.attributes.position
    for (let i = 0; i < dp.count; i++) dp.setXYZ(i, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, -Math.random() * 4)
    scene.add(dust)

    let baseZ = 7
    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      const vf = THREE.MathUtils.degToRad(camera.fov)
      const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect)
      // zarf ekranın genişliğinde rahat sığsın, yükseklikte de taşmasın
      baseZ = Math.max((W * 0.62) / Math.tan(hf / 2), (H * 1.55) / Math.tan(vf / 2))
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const pointer = { x: 0, y: 0 }
    const onMove = (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5
      pointer.y = e.clientY / window.innerHeight - 0.5
    }
    const onOrient = (e) => {
      if (e.gamma == null) return
      pointer.x = Math.max(-0.5, Math.min(0.5, e.gamma / 50))
      pointer.y = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('deviceorientation', onOrient, { passive: true })

    let frame = 0
    let ready = false
    const clock = new THREE.Clock()
    const sealStart = halves.map((h) => h.position.clone())
    const loop = () => {
      frame = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime
      if (openingRef.current && openAt.current == null) {
        openAt.current = t
        sparks.visible = true
        sparks.position.copy(seal.position).applyMatrix4(env.matrixWorld)
      }
      const o = openAt.current == null ? -1 : t - openAt.current

      // Giriş: aşağıdan dönerek gelir, sonra hafifçe süzülür
      const enter = ease(t / 1.5)
      const open = o < 0 ? 0 : 1
      const settle = 1 - ease(span(o, 0, 0.8)) * open
      env.position.y = (1 - enter) * -4 + Math.sin(t * 1.3) * 0.06 * settle
      env.rotation.z = (1 - enter) * 0.5 + Math.sin(t * 0.7) * 0.02 * settle
      env.rotation.y = (-0.28 + pointer.x * 0.5 + Math.sin(t * 0.6) * 0.18) * settle
      env.rotation.x = (-0.3 + pointer.y * 0.25) * settle
      env.scale.setScalar(0.6 + enter * 0.4)

      // Mühür ikiye ayrılıp düşer
      const s = ease(span(o, 0, 0.9)) * open
      halves.forEach((h, i) => {
        const dir = i === 0 ? 1 : -1
        h.position.set(sealStart[i].x + dir * -s * 1.1, sealStart[i].y - s * s * 2.2, sealStart[i].z + s * 0.6)
        h.rotation.set(Math.PI / 2 + s * 1.5, s * dir * 2, s * dir * -1.2)
      })
      seal.visible = s < 0.99
      if (o < 0) {
        // dokunma çağrısı: mühür nabız gibi atar
        const pulse = 1 + Math.max(0, Math.sin(t * 3.2)) * 0.06
        seal.scale.setScalar(pulse)
      }

      // Kapak açılır (arkaya devrilir)
      const f = easeInOut(span(o, 0.35, 1.35)) * open
      flap.rotation.x = -Math.PI * 1.03 * f
      flap.position.z = 0.062 - f * 0.075

      // Kart zarftan çıkar, sonra ekrana doğru uçar
      const up = easeInOut(span(o, 1.3, 2.3)) * open
      const fly = easeInOut(span(o, 2.25, 3.4)) * open
      cardMesh.position.y = up * H * 0.78
      cardMesh.position.z = 0.03 + fly * 1.3
      cardMesh.rotation.x = fly * 0.12
      cardMesh.rotation.y = Math.sin(fly * Math.PI) * 0.35
      env.position.y -= fly * 1.1
      env.rotation.x += up * -0.08 + fly * 0.12
      env.rotation.y *= 1 - fly
      // zarf geride kalır, kamera karta yaklaşır
      camera.position.set(0, fly * 0.55, baseZ * (1 - fly * 0.55))
      camera.lookAt(0, fly * 0.4, 0)
      shadow.material.opacity = 0.55 * (1 - fly)

      // Kıvılcımlar
      if (sparks.visible) {
        const sp = sparks.geometry.attributes.position
        for (let i = 0; i < sp.count; i++) {
          const v = sparkVel[i]
          v.y -= 6 * dt
          sp.setXYZ(i, sp.getX(i) + v.x * dt, sp.getY(i) + v.y * dt, sp.getZ(i) + v.z * dt)
        }
        sp.needsUpdate = true
        sparks.material.opacity = Math.max(0, 1 - o / 1.4)
        if (o > 1.5) sparks.visible = false
      }
      dust.rotation.z = t * 0.02
      dust.material.opacity = 0.55 + Math.sin(t * 1.5) * 0.25

      renderer.render(scene, camera)
      if (!ready) { ready = true; onReady?.() }
    }
    loop()

    // Yazı tipleri yüklenince kart yazısını yeniden çiz
    document.fonts?.ready.then(() => { drawCard(cardTex.image, card, colors); cardTex.needsUpdate = true; drawSeal(sealTex.image, initials, colors); sealTex.needsUpdate = true; drawMono(monoTex.image, initials, colors); monoTex.needsUpdate = true })

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onOrient)
      scene.traverse((obj) => {
        obj.geometry?.dispose()
        if (obj.material) [].concat(obj.material).forEach((m) => { m.map?.dispose(); m.dispose() })
      })
      scene.environment?.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.innerHTML = ''
    }
  }, [])

  return <div ref={host} className="env3d" aria-hidden="true" />
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// Hafif kâğıt dokusu
function noiseTexture() {
  const c = canvas(256, 256)
  const x = c.getContext('2d')
  x.fillStyle = '#fff'
  x.fillRect(0, 0, 256, 256)
  const img = x.getImageData(0, 0, 256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 236 + Math.random() * 19
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
  }
  x.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Zarf içi: ince altın baklava desenli astar
function linerTexture(colors) {
  const c = canvas(512, 512)
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 512, 512)
  g.addColorStop(0, colors.champagneHi)
  g.addColorStop(1, colors.champagne)
  x.fillStyle = g
  x.fillRect(0, 0, 512, 512)
  x.strokeStyle = '#fff'
  x.globalAlpha = 0.45
  x.lineWidth = 2
  for (let i = -512; i < 1024; i += 32) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 512, 512); x.stroke()
    x.beginPath(); x.moveTo(i + 512, 0); x.lineTo(i, 512); x.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function drawCard(c, card, colors) {
  const x = c.getContext('2d')
  const { width: w, height: h } = c
  x.fillStyle = '#fffdfa'
  x.fillRect(0, 0, w, h)
  x.strokeStyle = colors.champagne
  x.lineWidth = 3
  x.strokeRect(28, 28, w - 56, h - 56)
  x.lineWidth = 1.5
  x.strokeRect(42, 42, w - 84, h - 84)
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillStyle = colors.champagne
  x.font = '600 26px Manrope, sans-serif'
  x.fillText(card.kicker.toLocaleUpperCase('tr').split('').join(' '), w / 2, h * 0.2)
  x.fillStyle = colors.ink
  x.font = 'italic 400 76px "Cormorant Garamond", serif'
  x.fillText(card.groom, w / 2, h * 0.38)
  x.fillStyle = colors.champagne
  x.font = 'italic 400 46px "Cormorant Garamond", serif'
  x.fillText('&', w / 2, h * 0.505)
  x.fillStyle = colors.ink
  x.font = 'italic 400 76px "Cormorant Garamond", serif'
  x.fillText(card.bride, w / 2, h * 0.63)
  x.fillStyle = colors.ink
  x.globalAlpha = 0.85
  x.font = '600 34px "Cormorant Garamond", serif'
  x.fillText(card.date, w / 2, h * 0.8)
  x.globalAlpha = 1
}

function cardTexture(card, colors) {
  const c = canvas(1350, 860)
  drawCard(c, card, colors)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// Kartın arka yüzü: altın monogram
function monogramTexture(initials, colors) {
  const c = canvas(1024, 660)
  drawMono(c, initials, colors)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function drawMono(c, initials, colors) {
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 1024, 660)
  g.addColorStop(0, colors.champagneHi)
  g.addColorStop(1, '#fffaf3')
  x.fillStyle = g
  x.fillRect(0, 0, 1024, 660)
  x.strokeStyle = colors.champagne
  x.lineWidth = 3
  x.beginPath(); x.arc(512, 330, 150, 0, Math.PI * 2); x.stroke()
  x.lineWidth = 1.5
  x.beginPath(); x.arc(512, 330, 136, 0, Math.PI * 2); x.stroke()
  x.fillStyle = colors.champagne
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = 'italic 300 150px "Cormorant Garamond", serif'
  x.fillText(`${initials[0]}${initials[1]}`, 512, 340)
}

function drawSeal(c, initials, colors) {
  const x = c.getContext('2d')
  const g = x.createRadialGradient(100, 90, 10, 128, 128, 128)
  g.addColorStop(0, colors.champagneHi)
  g.addColorStop(0.6, colors.champagne)
  g.addColorStop(1, '#6b5233')
  x.fillStyle = g
  x.fillRect(0, 0, 256, 256)
  x.strokeStyle = 'rgba(60,40,15,.45)'
  x.setLineDash([6, 6])
  x.lineWidth = 3
  x.beginPath(); x.arc(128, 128, 96, 0, Math.PI * 2); x.stroke()
  x.setLineDash([])
  x.fillStyle = '#4a3518'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = 'italic 500 84px "Cormorant Garamond", serif'
  x.fillText(`${initials[0]}${initials[1]}`, 128, 132)
}

function sealTexture(initials, colors) {
  const c = canvas(256, 256)
  drawSeal(c, initials, colors)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  // silindir kapağında yazı yan dönmesin
  t.center.set(0.5, 0.5)
  t.rotation = Math.PI / 2
  return t
}

function blurTexture() {
  const c = canvas(128, 128)
  const x = c.getContext('2d')
  const g = x.createRadialGradient(64, 64, 10, 64, 64, 64)
  g.addColorStop(0, 'rgba(60,40,30,.5)')
  g.addColorStop(1, 'rgba(60,40,30,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function makePoints(count, color, size) {
  const c = canvas(64, 64)
  const x = c.getContext('2d')
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,240,210,.9)')
  g.addColorStop(1, 'rgba(255,220,170,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size, map: new THREE.CanvasTexture(c), color: color.clone().lerp(new THREE.Color('#fff2d6'), 0.2),
    transparent: true, depthWrite: false,
  }))
}
