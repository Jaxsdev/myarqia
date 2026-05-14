import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { usePlanoStore } from '../../store/usePlanoStore'
import * as THREE from 'three'
import { obtenerVerticesMuro } from '../../lib/muros'
import type { Muro, Puerta, Ventana } from '../../types'

function Door3D({ x, y, rotation, ancho, altura = 2.1 }: { x: number, y: number, rotation: number, ancho: number, altura?: number }) {
    const color = '#f97316' // Naranja CAD
    return (
        <group position={[x, 0, y]} rotation={[0, -rotation, 0]}>
            <mesh position={[0, altura / 2, 0]}>
                <boxGeometry args={[ancho, altura, 0.05]} />
                <meshStandardMaterial color={color} transparent opacity={0.1} />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(ancho, altura, 0.05)]} />
                    <lineBasicMaterial color={color} />
                </lineSegments>
            </mesh>
            {/* Hoja de la puerta abierta (pivota sobre el marco) */}
            <group position={[-ancho / 2, altura / 2, 0]} rotation={[0, -Math.PI / 3, 0]}>
                <mesh position={[ancho / 2, 0, 0]}>
                    <boxGeometry args={[ancho, altura, 0.02]} />
                    <meshStandardMaterial color={color} transparent opacity={0.1} />
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(ancho, altura, 0.02)]} />
                        <lineBasicMaterial color={color} />
                    </lineSegments>
                </mesh>
            </group>
        </group>
    )
}

function Window3D({ x, y, rotation, ancho, alto, alfeizar }: { x: number, y: number, rotation: number, ancho: number, alto: number, alfeizar: number }) {
    const color = '#fbbf24' // Amarillo CAD
    return (
        <group position={[x, 0, y]} rotation={[0, -rotation, 0]}>
            <mesh position={[0, alfeizar + alto / 2, 0]}>
                <boxGeometry args={[ancho, alto, 0.1]} />
                <meshStandardMaterial color={color} transparent opacity={0.1} />
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(ancho, alto, 0.1)]} />
                    <lineBasicMaterial color={color} />
                </lineSegments>
            </mesh>
            {/* Vidrio central */}
            <mesh position={[0, alfeizar + alto / 2, 0]}>
                <boxGeometry args={[ancho - 0.04, alto - 0.04, 0.01]} />
                <meshStandardMaterial color="#A5F3FC" transparent opacity={0.2} />
            </mesh>
        </group>
    )
}

function Muro3D({ muro, todosLosMuros, puertas, ventanas }: { muro: Muro, todosLosMuros: Muro[], puertas: Puerta[], ventanas: Ventana[] }) {
    const { x1, y1, x2, y2, altura = 2.4 } = muro

    const segments = useMemo(() => {
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.01) return []

        const { p1, p2, p3, p4 } = obtenerVerticesMuro(muro, todosLosMuros)

        // Usamos (x, -y) para que el eje Y de 2D se convierta en Z positivo en 3D
        // sin invertir las caras del muro (manteniendo la solidez)
        const getPointsAt = (t: number) => {
            return [
                { x: p4.x + (p3.x - p4.x) * t, y: -(p4.y + (p3.y - p4.y) * t) },
                { x: p1.x + (p2.x - p1.x) * t, y: -(p1.y + (p2.y - p1.y) * t) }
            ]
        }

        const project = (px: number, py: number) => {
            const t = ((px - x1) * dx + (py - y1) * dy) / (len * len)
            return Math.max(0, Math.min(1, t))
        }

        const items = [
            ...puertas.map(p => ({ t: project(p.x, p.y), ancho: p.ancho / len, hMin: 0, hMax: 2.1 })),
            ...ventanas.map(v => ({ t: project(v.x, v.y), ancho: v.ancho / len, hMin: v.alfeizar, hMax: v.alfeizar + v.alto }))
        ].sort((a, b) => a.t - b.t)

        const segs: { points: THREE.Vector2[], hMin: number, hMax: number }[] = []
        let lastT = 0

        items.forEach(item => {
            const startT = Math.max(0, item.t - item.ancho / 2)
            const endT = Math.min(1, item.t + item.ancho / 2)

            if (startT > lastT) {
                const ptsA = getPointsAt(lastT)
                const ptsB = getPointsAt(startT)
                segs.push({
                    points: [new THREE.Vector2(ptsA[0].x, ptsA[0].y), new THREE.Vector2(ptsB[0].x, ptsB[0].y), new THREE.Vector2(ptsB[1].x, ptsB[1].y), new THREE.Vector2(ptsA[1].x, ptsA[1].y)],
                    hMin: 0, hMax: altura
                })
            }
            if (item.hMax < altura) {
                const ptsA = getPointsAt(startT)
                const ptsB = getPointsAt(endT)
                segs.push({
                    points: [new THREE.Vector2(ptsA[0].x, ptsA[0].y), new THREE.Vector2(ptsB[0].x, ptsB[0].y), new THREE.Vector2(ptsB[1].x, ptsB[1].y), new THREE.Vector2(ptsA[1].x, ptsA[1].y)],
                    hMin: item.hMax, hMax: altura
                })
            }
            if (item.hMin > 0) {
                const ptsA = getPointsAt(startT)
                const ptsB = getPointsAt(endT)
                segs.push({
                    points: [new THREE.Vector2(ptsA[0].x, ptsA[0].y), new THREE.Vector2(ptsB[0].x, ptsB[0].y), new THREE.Vector2(ptsB[1].x, ptsB[1].y), new THREE.Vector2(ptsA[1].x, ptsA[1].y)],
                    hMin: 0, hMax: item.hMin
                })
            }
            lastT = endT
        })

        if (lastT < 1) {
            const ptsA = getPointsAt(lastT)
            const ptsB = getPointsAt(1)
            segs.push({
                points: [new THREE.Vector2(ptsA[0].x, ptsA[0].y), new THREE.Vector2(ptsB[0].x, ptsB[0].y), new THREE.Vector2(ptsB[1].x, ptsB[1].y), new THREE.Vector2(ptsA[1].x, ptsA[1].y)],
                hMin: 0, hMax: altura
            })
        }

        return segs
    }, [x1, y1, x2, y2, todosLosMuros, puertas, ventanas, altura])

    return (
        <group>
            {segments.map((seg, i) => (
                <mesh
                    key={`${muro.id}-seg-${i}`}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, seg.hMin, 0]}
                    castShadow receiveShadow
                >
                    <extrudeGeometry args={[
                        new THREE.Shape(seg.points),
                        { depth: seg.hMax - seg.hMin, bevelEnabled: false }
                    ]} />
                    <meshStandardMaterial 
                        color="#F8FAFC" 
                        transparent 
                        opacity={0.05} 
                        side={THREE.DoubleSide} 
                        roughness={0.7} 
                        metalness={0.1} 
                    />
                    <lineSegments>
                        <edgesGeometry args={[
                            new THREE.ExtrudeGeometry(
                                new THREE.Shape(seg.points),
                                { depth: seg.hMax - seg.hMin, bevelEnabled: false }
                            )
                        ]} />
                        <lineBasicMaterial color="#f1f5f9" linewidth={1} />
                    </lineSegments>
                </mesh>
            ))}
        </group>
    )
}

function Piso() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#1E293B" />
        </mesh>
    )
}

export default function Canvas3D() {
    const { muros, puertas, ventanas } = usePlanoStore()

    return (
        <div className="w-full h-full bg-[#030712]">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [20, 20, 20], fov: 45 }}>
                <OrbitControls makeDefault />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.9} />
                    <directionalLight position={[15, 30, 15]} intensity={1.2} castShadow />

                    <group>
                        {muros.map((m) => (
                            <Muro3D
                                key={m.id}
                                muro={m}
                                todosLosMuros={muros}
                                puertas={puertas.filter(p => p.muro_id === m.id)}
                                ventanas={ventanas.filter(v => v.muro_id === m.id)}
                            />
                        ))}
                        {puertas.map(p => (
                            <Door3D key={p.id} x={p.x} y={p.y} rotation={p.rotacion} ancho={p.ancho} />
                        ))}
                        {ventanas.map(v => (
                            <Window3D key={v.id} x={v.x} y={v.y} rotation={v.rotacion} ancho={v.ancho} alto={v.alto} alfeizar={v.alfeizar} />
                        ))}
                        <Piso />
                    </group>

                    <Grid infiniteGrid fadeDistance={300} fadeStrength={5} cellSize={1} sectionSize={5} sectionColor="#374151" cellColor="#111827" />
                    <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={200} blur={2.5} far={10} />
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    )
}
