import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Convierte una URL de imagen a base64 usando canvas.
 * Devuelve null si hay error (CORS u otro).
 */
const urlToBase64 = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Limitar tamaño para no inflar el PDF
        const maxSize = 80;
        const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
        canvas.width  = img.naturalWidth  * ratio;
        canvas.height = img.naturalHeight * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    // Forzar recarga sin caché para evitar bloqueos CORS
    img.src = url.includes('?') ? url + '&_nc=' + Date.now() : url + '?_nc=' + Date.now();
  });

/**
 * Exporta alumnos a PDF con imágenes embebidas (si CORS lo permite).
 */
export async function exportarPDF(alumnos, titulo, nombreArchivo = 'alumnos') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // === Encabezado ===
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Sistema de Gestión Escolar', 14, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(titulo, 14, 17);
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.text(`Generado: ${fecha}`, 283, 17, { align: 'right' });

  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total de alumnos: ${alumnos.length}`, 14, 30);

  // === Pre-cargar todas las imágenes en paralelo ===
  const imagenes = await Promise.all(alumnos.map(a => urlToBase64(a.imagenURL)));

  // === Tabla con didDrawCell para insertar imágenes ===
  const IMG_COL_IDX = 7; // índice de la columna "Imagen"
  const ROW_H = 14;      // altura de fila en puntos

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Nombre', 'Ap. Paterno', 'Ap. Materno', 'Email', 'Nº Control', 'Carrera', 'Foto', 'Teléfono']],
    body: alumnos.map((a, i) => [
      i + 1,
      a.nombre || '',
      a.apellidoPaterno || '',
      a.apellidoMaterno || '',
      a.email || '',
      a.numeroControl || '',
      a.carrera || '',
      '',   // placeholder para la imagen
      `${a.lada || ''} ${a.telefono || ''}`.trim(),
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak', minCellHeight: ROW_H },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      5: { halign: 'center', cellWidth: 22 },
      6: { cellWidth: 50 },
      7: { halign: 'center', cellWidth: 14 },
      8: { halign: 'center', cellWidth: 26 },
    },
    margin: { left: 14, right: 14 },
    didDrawCell(data) {
      // Insertar imagen en la columna correcta, solo en filas del body
      if (data.section === 'body' && data.column.index === IMG_COL_IDX) {
        const b64 = imagenes[data.row.index];
        if (b64) {
          const padding = 1.5;
          const size = Math.min(data.cell.width, data.cell.height) - padding * 2;
          const x = data.cell.x + (data.cell.width - size) / 2;
          const y = data.cell.y + (data.cell.height - size) / 2;
          try {
            doc.addImage(b64, 'JPEG', x, y, size, size);
          } catch { /* ignorar si falla */ }
        }
      }
    },
  });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: 'center' });
  }

  doc.save(`${nombreArchivo}.pdf`);
}

/**
 * Exporta alumnos a Excel (.xlsx) incluyendo la URL de la imagen como columna y como imagen embebida.
 * Nota: SheetJS CE no soporta imágenes embebidas, se incluye la URL directamente.
 */
export function exportarExcel(alumnos, nombreHoja = 'Alumnos', nombreArchivo = 'alumnos') {
  const datos = alumnos.map((a, i) => ({
    '#': i + 1,
    'Nombre': a.nombre || '',
    'Apellido Paterno': a.apellidoPaterno || '',
    'Apellido Materno': a.apellidoMaterno || '',
    'Email': a.email || '',
    'Nº Control': a.numeroControl || '',
    'Carrera': a.carrera || '',
    'Lada': a.lada || '',
    'Teléfono': a.telefono || '',
    'Imagen URL': a.imagenURL || '',
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);

  // Ancho de columnas
  hoja['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 12 },
    { wch: 45 },
    { wch: 8 },
    { wch: 12 },
    { wch: 60 },
  ];

  // Convertir la columna de URL de imagen en hipervínculos
  const totalFilas = datos.length + 1; // +1 por header
  for (let row = 2; row <= totalFilas; row++) {
    const cellRef = `J${row}`; // columna J = Imagen URL
    if (hoja[cellRef] && hoja[cellRef].v) {
      hoja[cellRef].l = { Target: hoja[cellRef].v, tooltip: 'Ver imagen' };
    }
  }

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.substring(0, 31));
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}
