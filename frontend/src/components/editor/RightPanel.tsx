import { useState, useEffect } from 'react'
import PanelChat from '../chat/PanelChat'
import PanelPropiedades from './PanelPropiedades'
import PanelRNE from './PanelRNE'
import { usePlanoStore } from '../../store/usePlanoStore'

type Tab = 'ia' | 'props' | 'rne' | 'biblioteca'

export default function RightPanel() {
    const [activeTab, setActiveTab] = useState<Tab>('ia')
    const { idsSeleccionados } = usePlanoStore()

    // Cambiar a la pestaña de propiedades automáticamente si se selecciona algo
    useEffect(() => {
        if (idsSeleccionados.length > 0) {
            setActiveTab('props')
        }
    }, [idsSeleccionados])

    return (
        <div className="w-[300px] bg-gray-900 border-l border-gray-800 flex flex-col h-full flex-shrink-0 z-10 shadow-xl">
            {/* Header Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-950">
                <TabButton label="IA" active={activeTab === 'ia'} onClick={() => setActiveTab('ia')} />
                <TabButton label="Props" active={activeTab === 'props'} onClick={() => setActiveTab('props')} />
                <TabButton label="RNE" active={activeTab === 'rne'} onClick={() => setActiveTab('rne')} />
                <TabButton label="Biblioteca" active={activeTab === 'biblioteca'} onClick={() => setActiveTab('biblioteca')} />
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-hidden relative bg-gray-900">
                {activeTab === 'ia' && <PanelChat />}
                {activeTab === 'props' && <PanelPropiedades />}
                {activeTab === 'rne' && <PanelRNE />}
                {activeTab === 'biblioteca' && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-sm">Biblioteca (Próximamente)</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-center border-b-[3px] transition-colors ${
                active 
                ? 'border-blue-500 text-blue-400 bg-gray-900' 
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
        >
            {label}
        </button>
    )
}
