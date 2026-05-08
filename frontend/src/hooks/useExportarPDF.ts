import { useProyectoStore } from '../store/useProyectoStore'
import { usePlanoStore } from '../store/usePlanoStore'

export function useExportarPDF() {
    const { proyectoActual } = useProyectoStore()
    const { muros, puertas, ventanas } = usePlanoStore()

    const exportar = async () => {
        const { jsPDF } = await import('jspdf')

        const nombreProyecto = proyectoActual?.nombre || 'Proyecto sin título'
        const fecha = new Date().toLocaleDateString('es-PE')

        // Tamaño A3 horizontal
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
        const W = doc.internal.pageSize.getWidth()
        const H = doc.internal.pageSize.getHeight()

        // ── Capturar todos los canvas del DOM y componerlos ──────
        // Konva crea un <canvas> por cada Layer. Los composemos manualmente
        // para capturar exactamente lo que se ve en pantalla (incluye muros).
        const areaH = H - 40
        const capas = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[]
        if (capas.length > 0) {
            const composite = document.createElement('canvas')
            composite.width = capas[0].width
            composite.height = capas[0].height
            const ctx2d = composite.getContext('2d')!

            // Fondo blanco para el PDF (el editor tiene fondo oscuro)
            ctx2d.fillStyle = '#ffffff'
            ctx2d.fillRect(0, 0, composite.width, composite.height)

            // Dibujar cada capa encima de la anterior
            capas.forEach((c) => ctx2d.drawImage(c, 0, 0))

            const imgData = composite.toDataURL('image/png', 1.0)
            doc.addImage(imgData, 'PNG', 10, 10, W - 20, areaH - 10)
        }

        // ── Cajetín profesional ────────────────────────────────
        const cY = H - 38  // Y donde empieza el cajetín

        // Borde del cajetín
        doc.setDrawColor(50, 50, 50)
        doc.setLineWidth(0.5)
        doc.rect(10, cY, W - 20, 28)

        // Línea divisoria vertical
        doc.line(W - 80, cY, W - 80, H - 10)
        doc.line(W - 80, cY + 14, W - 20, cY + 14)

        // Logo / Nombre del sistema
        doc.setFontSize(14)
        doc.setTextColor(47, 129, 247)
        doc.setFont('helvetica', 'bold')
        doc.text('MyARQIA', 16, cY + 9)

        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text('Plataforma de Diseño Arquitectónico con IA', 16, cY + 15)

        // Nombre del proyecto
        doc.setFontSize(11)
        doc.setTextColor(30, 30, 30)
        doc.setFont('helvetica', 'bold')
        doc.text(nombreProyecto, 16, cY + 23)

        // Info técnica (columna derecha)
        doc.setFontSize(8)
        doc.setTextColor(50, 50, 50)
        doc.setFont('helvetica', 'normal')

        const col2 = W - 78
        doc.text('ESCALA:', col2, cY + 6); doc.setFont('helvetica', 'bold')
        doc.text('1 : 100', col2 + 20, cY + 6); doc.setFont('helvetica', 'normal')

        doc.text('FECHA:', col2, cY + 12); doc.setFont('helvetica', 'bold')
        doc.text(fecha, col2 + 20, cY + 12); doc.setFont('helvetica', 'normal')

        doc.text('MUROS:', col2, cY + 18); doc.setFont('helvetica', 'bold')
        doc.text(String(muros.length), col2 + 20, cY + 18); doc.setFont('helvetica', 'normal')

        doc.text('PUERTAS:', col2, cY + 24); doc.setFont('helvetica', 'bold')
        doc.text(`${puertas.length} puertas  ·  ${ventanas.length} ventanas`, col2 + 22, cY + 24)

        // Línea de norma
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text(
            'Plano generado con MyARQIA · Verificar cumplimiento del RNE antes de tramitar permisos de construcción',
            W / 2, H - 12,
            { align: 'center' }
        )

        // Guardar
        doc.save(`${nombreProyecto.replace(/\s+/g, '_')}_plano.pdf`)
    }

    return { exportar }
}