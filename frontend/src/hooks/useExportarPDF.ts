import { useProyectoStore } from '../store/useProyectoStore'
import { usePlanoStore } from '../store/usePlanoStore'

export function useExportarPDF() {
    const { proyectoActual } = useProyectoStore()
    const { 
        muros, puertas, ventanas, escaleras, 
        columnas, cotas, textos, areas, ambientes 
    } = usePlanoStore()

    const exportar = async () => {
        const { jsPDF } = await import('jspdf')

        const nombreProyecto = proyectoActual?.nombre || 'Proyecto sin título'
        const fecha = new Date().toLocaleDateString('es-PE')

        // Tamaño A3 horizontal
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
        const W = doc.internal.pageSize.getWidth()
        const H = doc.internal.pageSize.getHeight()

        // ── Capturar todos los canvas del DOM y componerlos ──────
        const areaH = H - 45
        const capas = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[]
        if (capas.length > 0) {
            const composite = document.createElement('canvas')
            // Aumentar resolución para PDF (x2)
            composite.width = capas[0].width
            composite.height = capas[0].height
            const ctx2d = composite.getContext('2d')!

            // Fondo blanco para el PDF
            ctx2d.fillStyle = '#ffffff'
            ctx2d.fillRect(0, 0, composite.width, composite.height)

            // Dibujar cada capa
            capas.forEach((c) => ctx2d.drawImage(c, 0, 0))

            const imgData = composite.toDataURL('image/png', 1.0)
            doc.addImage(imgData, 'PNG', 10, 10, W - 20, areaH - 10)
        }

        // ── Cajetín profesional ────────────────────────────────
        const cY = H - 38  // Y donde empieza el cajetín
        const cW = W - 20

        // Borde exterior
        doc.setDrawColor(30, 30, 30)
        doc.setLineWidth(0.6)
        doc.rect(10, cY, cW, 30)

        // Divisiones verticales
        doc.setLineWidth(0.2)
        doc.line(70, cY, 70, H - 8)     // Sección Logo/Nombre
        doc.line(W - 90, cY, W - 90, H - 8) // Sección Info Técnica

        // Logo / Nombre del sistema
        doc.setFontSize(16)
        doc.setTextColor(47, 129, 247)
        doc.setFont('helvetica', 'bold')
        doc.text('MyARQIA', 16, cY + 10)

        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'normal')
        doc.text('Diseño Arquitectónico Inteligente', 16, cY + 16)
        doc.text('Validado según RNE', 16, cY + 21)

        // Nombre del proyecto y Ubicación
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text(nombreProyecto.toUpperCase(), 75, cY + 10)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('PROPIETARIO:', 75, cY + 18); doc.setFont('helvetica', 'bold')
        doc.text('CLIENTE MYARQIA', 105, cY + 18); doc.setFont('helvetica', 'normal')
        
        doc.text('DIBUJO:', 75, cY + 24); doc.setFont('helvetica', 'bold')
        doc.text('AGENTE IA ARQIA', 105, cY + 24); doc.setFont('helvetica', 'normal')

        // Info técnica (Resumen de áreas y elementos)
        const col3 = W - 85
        doc.setFontSize(7)
        doc.setTextColor(50, 50, 50)
        
        const areaTechada = areas.reduce((sum, a) => sum + (a.area || 0), 0)

        const drawInfoRow = (label: string, value: string, y: number) => {
            doc.setFont('helvetica', 'normal')
            doc.text(label, col3, y)
            doc.setFont('helvetica', 'bold')
            doc.text(value, W - 15, y, { align: 'right' })
        }

        drawInfoRow('ÁREA TOTAL:', `${areaTechada.toFixed(2)} m2`, cY + 6)
        drawInfoRow('ESCALA:', '1 : 100', cY + 12)
        drawInfoRow('FECHA:', fecha, cY + 18)
        drawInfoRow('LÁMINA:', 'A-01', cY + 24)

        // Leyenda inferior
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text(
            'Generado automáticamente por MyARQIA. Este documento es una representación técnica preliminar.',
            W / 2, H - 4,
            { align: 'center' }
        )

        // Guardar
        doc.save(`${nombreProyecto.replace(/\s+/g, '_')}_plano_arquitectonico.pdf`)
    }

    return { exportar }
}