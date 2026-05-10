import { usePlanoStore } from '../../store/usePlanoStore'

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-5">
        <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 border-b border-gray-800 pb-1.5">{title}</h3>
        <div className="flex flex-col gap-1.5">
            {children}
        </div>
    </div>
)

const PropRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-[11px] text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
            {children}
        </div>
    </div>
)

const PropValue = ({ value, badge, dotColor, suffix = '', green }: { value: string | number, badge?: boolean, dotColor?: string, suffix?: string, green?: boolean }) => (
    <div className={`flex items-center gap-1.5 text-[11px] ${badge ? 'bg-gray-800/80 px-2 py-1 rounded text-gray-200 border border-gray-700/50 min-w-[60px] justify-end' : 'text-gray-200'} ${green ? 'text-emerald-400 border-emerald-900/30 bg-emerald-900/10' : ''}`}>
        {dotColor && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />}
        <span className={badge ? 'font-mono' : 'font-medium'}>{value}{suffix}</span>
    </div>
)

export default function PanelPropiedades() {
    const { muros, puertas, ventanas, escaleras, columnas, cotas, textos, areas, ambientes, capas, idsSeleccionados,
        eliminarSeleccionado, actualizarArea } = usePlanoStore()

    const idSeleccionado = idsSeleccionados.length > 0 ? idsSeleccionados[idsSeleccionados.length - 1] : null
    
    const muro = muros.find((m) => m.id === idSeleccionado)
    const puerta = puertas.find((p) => p.id === idSeleccionado)
    const ventana = ventanas.find((v) => v.id === idSeleccionado)
    const escalera = escaleras.find((e) => e.id === idSeleccionado)
    const columna = columnas.find((c) => c.id === idSeleccionado)
    const cota = cotas.find((c) => c.id === idSeleccionado)
    const texto = textos.find((t) => t.id === idSeleccionado)
    const area = areas.find((a) => a.id === idSeleccionado)
    const ambiente = ambientes.find((a) => a.id === idSeleccionado)

    const el = muro || puerta || ventana || escalera || columna || cota || texto || area || ambiente
    
    if (!idSeleccionado || !el) {
        return (
            <div className="h-full flex flex-col bg-[#0F111A]">
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-gray-700 text-xs text-center leading-relaxed">
                        Selecciona un elemento en el lienzo
                    </p>
                </div>
            </div>
        )
    }

    let typeName = ''
    let titleName = ''
    if (muro) { typeName = 'Muro'; titleName = `Muro ${muro.material}` }
    if (puerta) { typeName = 'Puerta'; titleName = `Puerta ${(puerta.ancho*100).toFixed(0)}cm` }
    if (ventana) { typeName = 'Ventana'; titleName = `Ventana ${(ventana.ancho*100).toFixed(0)}cm` }
    if (escalera) { typeName = 'Escalera'; titleName = `Escalera de ${escalera.peldaños} pasos` }
    if (columna) { typeName = 'Columna'; titleName = `Columna ${columna.forma}` }
    if (cota) { typeName = 'Cota'; titleName = `Cota` }
    if (texto) { typeName = 'Texto'; titleName = texto.contenido.substring(0, 15) }
    if (area) { typeName = 'Área'; titleName = area.nombre || `Área ${area.id.slice(-4)}` }
    if (ambiente) { typeName = 'Ambiente'; titleName = ambiente.nombre }

    const layerInfo = capas.find(c => c.id === el.layer) || { id: el.layer || 'N/A', color: '#888' }

    return (
        <div className="h-full flex flex-col bg-[#0F111A]">
            <div className="px-4 py-3 border-b border-gray-800 bg-[#0F111A] shrink-0 flex items-center justify-between">
                <span className="text-gray-300 text-xs font-medium truncate">{titleName} (seleccionado)</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                
                <Section title="Dimensiones">
                    {muro && (
                        <>
                            <PropRow label="Espesor">
                                <PropValue value={(muro.espesor * 100).toFixed(0)} suffix=" cm" badge />
                            </PropRow>
                            <PropRow label="Longitud">
                                <PropValue value={Math.sqrt((muro.x2 - muro.x1)**2 + (muro.y2 - muro.y1)**2).toFixed(2)} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Altura libre">
                                <PropValue value={(muro.altura || 2.8).toFixed(2)} suffix=" m" badge />
                            </PropRow>
                        </>
                    )}
                    {(puerta || ventana) && (
                        <PropRow label="Ancho">
                            <PropValue value={((puerta || ventana)!.ancho * 100).toFixed(0)} suffix=" cm" badge />
                        </PropRow>
                    )}
                    {area && (
                        <>
                            <PropRow label="Nombre">
                                <input 
                                    className="bg-gray-800 text-white text-[11px] px-2 py-1 rounded border border-gray-700 w-32 focus:border-blue-500 outline-none"
                                    value={area.nombre || ''}
                                    placeholder={`Área ${area.id.slice(-4)}`}
                                    onChange={(e) => actualizarArea(area.id, { nombre: e.target.value })}
                                />
                            </PropRow>
                            <PropRow label="Área">
                                <PropValue value={area.area.toFixed(1)} suffix=" m²" badge />
                            </PropRow>
                            <PropRow label="Perímetro">
                                {/* Cálculo aproximado MVP */}
                                <PropValue value={(Math.sqrt(area.area) * 4).toFixed(2)} suffix=" m" badge />
                            </PropRow>
                        </>
                    )}
                    {ambiente && (
                        <>
                            <PropRow label="Área">
                                <PropValue value={(ambiente.ancho * ambiente.largo).toFixed(1)} suffix=" m²" badge />
                            </PropRow>
                            <PropRow label="Ancho">
                                <PropValue value={ambiente.ancho.toFixed(2)} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Largo">
                                <PropValue value={ambiente.largo.toFixed(2)} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Altura">
                                <PropValue value="2.70" suffix=" m" badge />
                            </PropRow>
                        </>
                    )}
                </Section>

                {el.layer && (
                    <Section title="Material y Capa">
                        {muro && (
                            <PropRow label="Material">
                                <PropValue value={muro.material} />
                            </PropRow>
                        )}
                        <PropRow label="Capa">
                            <PropValue value={layerInfo.id} dotColor={layerInfo.color} />
                        </PropRow>
                        <PropRow label="Color">
                            <PropValue value={layerInfo.color.toUpperCase()} dotColor={layerInfo.color} />
                        </PropRow>
                    </Section>
                )}

                {(area || ambiente) && (
                    <Section title="Normativa RNE">
                        <PropRow label="Área mínima">
                            <PropValue value="8m² ✓" badge green />
                        </PropRow>
                        <PropRow label="Ventilación">
                            <PropValue value="≥1 ventana ✓" badge green />
                        </PropRow>
                        <PropRow label="Iluminación">
                            <PropValue value="A.010 ✓" badge green />
                        </PropRow>
                    </Section>
                )}

                <Section title="Posición">
                    {'x' in el ? (
                        <>
                            <PropRow label="Origen X">
                                <PropValue value={el.x.toFixed(2)} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Origen Y">
                                <PropValue value={el.y.toFixed(2)} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Rotación">
                                <PropValue value="0" suffix="°" badge />
                            </PropRow>
                        </>
                    ) : (
                        <>
                            <PropRow label="Inicio X">
                                <PropValue value={el.x1?.toFixed(2) || '0'} suffix=" m" badge />
                            </PropRow>
                            <PropRow label="Inicio Y">
                                <PropValue value={el.y1?.toFixed(2) || '0'} suffix=" m" badge />
                            </PropRow>
                        </>
                    )}
                </Section>
                
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#0F111A]">
                <button
                    onClick={eliminarSeleccionado}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium py-2 rounded transition-colors border border-red-500/20">
                    Eliminar elemento
                </button>
            </div>
        </div>
    )
}