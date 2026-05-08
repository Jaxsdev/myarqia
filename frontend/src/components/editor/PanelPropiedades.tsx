import { useState, useEffect } from 'react'
import { usePlanoStore } from '../../store/usePlanoStore'

export default function PanelPropiedades() {
    const { muros, puertas, ventanas, idSeleccionado,
        eliminarSeleccionado, actualizarMuro,
        actualizarPuerta, actualizarVentana } = usePlanoStore()

    const muro = muros.find((m) => m.id === idSeleccionado)
    const puerta = puertas.find((p) => p.id === idSeleccionado)
    const ventana = ventanas.find((v) => v.id === idSeleccionado)

    if (!idSeleccionado || (!muro && !puerta && !ventana)) {
        return (
            <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-800">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Propiedades</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-gray-700 text-xs text-center leading-relaxed">
                        Selecciona un elemento del plano para editar sus propiedades
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800">
                <span className="text-gray-500 text-xs uppercase tracking-wide">Propiedades</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {muro && <PropsMuro muro={muro} />}
                {puerta && <PropsPuerta puerta={puerta} />}
                {ventana && <PropsVentana ventana={ventana} />}
            </div>

            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={eliminarSeleccionado}
                    className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 text-xs py-2 rounded-lg transition-colors">
                    Eliminar elemento
                </button>
            </div>
        </div>
    )
}

// ── Props Muro ──────────────────────────────────────────────
function PropsMuro({ muro }: { muro: any }) {
    const { actualizarMuro } = usePlanoStore()
    const dx = muro.x2 - muro.x1
    const dy = muro.y2 - muro.y1
    const lon = Math.sqrt(dx * dx + dy * dy)

    return (
        <>
            <Chip label="Tipo" valor="Muro" color="text-white" />
            <Chip label="Layer" valor={muro.layer} color="text-cyan-400" mono />

            {/* ─ Geometría ─ */}
            <p className="text-gray-600 text-xs uppercase tracking-wide mt-2 px-1">Geometría</p>
            <CampoNum
                label="Espesor (cm)"
                valor={muro.espesor * 100}
                min={10} max={60}
                onChange={(v) => actualizarMuro(muro.id, { espesor: v / 100 })}
            />
            <CampoNum
                label="Altura libre (m)"
                valor={muro.altura ?? 2.80}
                min={1.8} max={6.0}
                step={0.05}
                onChange={(v) => actualizarMuro(muro.id, { altura: v })}
            />
            <CampoNum
                label="Altura base (m)"
                valor={muro.alturaBase ?? 0}
                min={0} max={3.0}
                step={0.05}
                onChange={(v) => actualizarMuro(muro.id, { alturaBase: v })}
            />

            {/* ─ Material ─ */}
            <p className="text-gray-600 text-xs uppercase tracking-wide mt-2 px-1">Construcción</p>
            <CampoSelect
                label="Material"
                valor={muro.material ?? 'concreto'}
                opciones={[
                    { valor: 'concreto',  etiqueta: 'Concreto armado' },
                    { valor: 'ladrillo',  etiqueta: 'Ladrillo / Albañilería' },
                    { valor: 'tabique',   etiqueta: 'Tabique / Bloque' },
                    { valor: 'drywall',   etiqueta: 'Drywall' },
                ]}
                onChange={(v) => actualizarMuro(muro.id, { material: v as any })}
            />

            {/* ─ Información ─ */}
            <p className="text-gray-600 text-xs uppercase tracking-wide mt-2 px-1">Información</p>
            <Chip label="Longitud" valor={`${lon.toFixed(2)} m`} color="text-gray-300" mono />
            <Chip label="Área muro" valor={`${(lon * (muro.altura ?? 2.80)).toFixed(2)} m²`} color="text-gray-400" mono />
            <Chip label="Inicio" valor={`(${muro.x1.toFixed(2)}, ${muro.y1.toFixed(2)})`} color="text-gray-400" mono />
            <Chip label="Fin" valor={`(${muro.x2.toFixed(2)}, ${muro.y2.toFixed(2)})`} color="text-gray-400" mono />
        </>
    )
}

// ── Props Puerta ────────────────────────────────────────────
function PropsPuerta({ puerta }: { puerta: any }) {
    const { actualizarPuerta } = usePlanoStore()

    return (
        <>
            <Chip label="Tipo" valor="Puerta" color="text-yellow-400" />
            <Chip label="Layer" valor={puerta.layer} color="text-cyan-400" mono />
            <CampoNum
                label="Ancho (cm)"
                valor={puerta.ancho * 100}
                min={70} max={200}
                onChange={(v) => actualizarPuerta(puerta.id, { ancho: v / 100 })}
            />
            <CampoNum
                label="Apertura (°)"
                valor={Math.round(puerta.angulo_apertura * (180 / Math.PI))}
                min={-180} max={180}
                onChange={(v) => actualizarPuerta(puerta.id, {
                    angulo_apertura: v * (Math.PI / 180)
                })}
            />
            <Chip label="Posición" valor={`(${puerta.x.toFixed(2)}, ${puerta.y.toFixed(2)})`} color="text-gray-400" mono />
        </>
    )
}

// ── Props Ventana ───────────────────────────────────────────
function PropsVentana({ ventana }: { ventana: any }) {
    const { actualizarVentana } = usePlanoStore()

    return (
        <>
            <Chip label="Tipo" valor="Ventana" color="text-cyan-400" />
            <Chip label="Layer" valor={ventana.layer} color="text-cyan-400" mono />
            <CampoNum
                label="Ancho (cm)"
                valor={ventana.ancho * 100}
                min={40} max={300}
                onChange={(v) => actualizarVentana(ventana.id, { ancho: v / 100 })}
            />
            <Chip label="Posición" valor={`(${ventana.x.toFixed(2)}, ${ventana.y.toFixed(2)})`} color="text-gray-400" mono />
        </>
    )
}

// ── Componentes de UI ───────────────────────────────────────
function Chip({ label, valor, color, mono = false }: {
    label: string; valor: string; color: string; mono?: boolean
}) {
    return (
        <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-500 text-xs mb-0.5">{label}</p>
            <p className={`text-sm ${color} ${mono ? 'font-mono' : ''}`}>{valor}</p>
        </div>
    )
}

function CampoNum({ label, valor, min, max, step = 1, onChange }: {
    label: string; valor: number; min: number; max: number; step?: number
    onChange: (v: number) => void
}) {
    const decimales = step < 1 ? 2 : 0
    const [local, setLocal] = useState(valor.toFixed(decimales))

    useEffect(() => { setLocal(valor.toFixed(decimales)) }, [valor])

    return (
        <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <input
                type="number"
                value={local}
                min={min} max={max} step={step}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={() => {
                    const n = parseFloat(local)
                    if (!isNaN(n) && n >= min && n <= max) onChange(n)
                    else setLocal(valor.toFixed(decimales))
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                className="w-full bg-gray-700 text-white text-sm font-mono px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
        </div>
    )
}

function CampoSelect({ label, valor, opciones, onChange }: {
    label: string
    valor: string
    opciones: { valor: string; etiqueta: string }[]
    onChange: (v: string) => void
}) {
    return (
        <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <select
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
                {opciones.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
            </select>
        </div>
    )
}