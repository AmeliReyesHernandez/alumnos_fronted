import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Convierte una URL de imagen a base64 usando canvas.
 * Devuelve null si hay error (CORS u otro).
 */
const urlToBase64 = (url, format = 'image/jpeg') =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const isPng = format === 'image/png';
        const maxSize = isPng ? 2000 : 80; 
        const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
        canvas.width  = img.naturalWidth  * ratio;
        canvas.height = img.naturalHeight * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          data: canvas.toDataURL(format, isPng ? 1.0 : 0.75),
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    // Forzar recarga sin caché
    img.src = url.includes('?') ? url + '&_nc=' + Date.now() : url + '?_nc=' + Date.now();
  });

/**
 * Exporta alumnos a PDF con imágenes embebidas (si CORS lo permite).
 */
export async function exportarPDF(alumnos, titulo, nombreArchivo = 'alumnos') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // === Cargar imágenes de la hoja membretada ===
  const headerObj = await urlToBase64('/encabezado.png', 'image/png');
  const footerObj = await urlToBase64('/pie.png', 'image/png');

  const imgWidth = 267;
  const marginX = 15;
  const marginTop = 5; 
  const marginBottom = 5;

  let headerHeight = 25; 
  if (headerObj && headerObj.width) {
    headerHeight = (headerObj.height / headerObj.width) * imgWidth;
  }
  
  let footerHeight = 22; 
  if (footerObj && footerObj.width) {
    footerHeight = (footerObj.height / footerObj.width) * imgWidth;
  }

  const drawBackground = () => {
    if (headerObj && headerObj.data) {
      doc.addImage(headerObj.data, 'PNG', marginX, marginTop, imgWidth, headerHeight);
    }
    if (footerObj && footerObj.data) {
      doc.addImage(footerObj.data, 'PNG', marginX, 210 - marginBottom - footerHeight, imgWidth, footerHeight);
    }
  };

  // === Pre-cargar todas las fotos ===
  const imagenesObjs = await Promise.all(alumnos.map(a => urlToBase64(a.imagenURL)));

  const IMG_COL_IDX = 7; 
  const ROW_H = 11; 
  
  // Tabla inicia justo debajo de la imagen
  const startYTable = marginTop + headerHeight + 5; 

  autoTable(doc, {
    startY: startYTable, 
    head: [['#', 'Nombre', 'Ap. Paterno', 'Ap. Materno', 'Email', 'Nº Control', 'Carrera', 'Foto', 'Teléfono']],
    body: alumnos.map((a, i) => [
      i + 1,
      a.nombre || '',
      a.apellidoPaterno || '',
      a.apellidoMaterno || '',
      a.email || '',
      a.numeroControl || '',
      a.carrera || '',
      '',   
      `${a.lada || ''} ${a.telefono || ''}`.trim(),
    ]),
    styles: { 
      fontSize: 7.5, 
      cellPadding: 1.5, 
      overflow: 'linebreak', 
      minCellHeight: ROW_H,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: [50, 50, 50],
      valign: 'middle'
    },
    headStyles: {
      fillColor: [0, 102, 204], // Azul profesional y bonito
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: { fillColor: [245, 249, 255] }, // Azul muy tenue y limpio
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      5: { halign: 'center', cellWidth: 20 },
      6: { cellWidth: 48 },
      7: { halign: 'center', cellWidth: 14 },
      8: { halign: 'center', cellWidth: 24 },
    },
    // Ajuste de margen inferior para no tocar el footer
    margin: { top: startYTable, bottom: marginBottom + footerHeight + 2, left: marginX, right: marginX },
    didDrawPage: function (data) {
      // 1. Dibujar logos de encabezado y pie en la página actual
      drawBackground();

      // 2. Textos del título
      doc.setTextColor(0, 102, 204); // Azul bonito
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(titulo, marginX, marginTop + headerHeight + 2);
      
      const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${fecha} | Total: ${alumnos.length} alumnos`, 297 - marginX, marginTop + headerHeight + 2, { align: 'right' });

      // 3. Número de página
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, 297 - marginX, 210 - marginBottom - 2, { align: 'right' });
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === IMG_COL_IDX) {
        const imgObj = imagenesObjs[data.row.index];
        if (imgObj && imgObj.data) {
          const padding = 1;
          const size = Math.min(data.cell.width, data.cell.height) - padding * 2;
          const x = data.cell.x + (data.cell.width - size) / 2;
          const y = data.cell.y + (data.cell.height - size) / 2;
          try {
            doc.addImage(imgObj.data, 'JPEG', x, y, size, size);
          } catch { /* ignorar si falla */ }
        }
      }
    },
  });

  doc.save(`${nombreArchivo}.pdf`);
}

/**
 * Convierte una URL de imagen a ArrayBuffer usando canvas (CORS-safe).
 * Devuelve null si hay error.
 */
const urlToArrayBuffer = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.getContext('2d').drawImage(img, 0, 0, 60, 60);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(null);
          blob.arrayBuffer().then(resolve).catch(() => resolve(null));
        }, 'image/png');
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url.includes('?') ? url + '&_nc=' + Date.now() : url + '?_nc=' + Date.now();
  });

/**
 * Exporta alumnos a Excel (.xlsx) con imágenes reales embebidas usando ExcelJS.
 */
export async function exportarExcel(alumnos, nombreHoja = 'Alumnos', nombreArchivo = 'alumnos') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Escolar';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(nombreHoja.substring(0, 31));

  // ── Encabezados ──
  const headers = ['#', 'Nombre', 'Ap. Paterno', 'Ap. Materno', 'Email', 'Nº Control', 'Carrera', 'Lada', 'Teléfono', 'Foto'];
  sheet.addRow(headers);

  // Estilo encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF3B82F6' } },
    };
  });

  // Anchos de columna
  const colWidths = [5, 16, 18, 18, 30, 14, 45, 8, 14, 12];
  colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  // ── Pre-cargar imágenes en paralelo ──
  const buffers = await Promise.all(alumnos.map(a => urlToArrayBuffer(a.imagenURL)));

  const ROW_HEIGHT = 60; // puntos (~80 px)
  const IMG_SIZE   = 45; // px dentro de la celda

  for (let i = 0; i < alumnos.length; i++) {
    const a   = alumnos[i];
    const row = sheet.addRow([
      i + 1,
      a.nombre || '',
      a.apellidoPaterno || '',
      a.apellidoMaterno || '',
      a.email || '',
      a.numeroControl || '',
      a.carrera || '',
      a.lada || '',
      a.telefono || '',
      '',   // celda J reservada para la imagen
    ]);

    row.height = ROW_HEIGHT;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      }
    });

    // Centrar columnas numéricas
    ['A', 'F', 'H'].forEach(col => {
      sheet.getCell(`${col}${row.number}`).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // ── Embeber imagen en columna J ──
    const buf = buffers[i];
    if (buf) {
      const imageId = workbook.addImage({ buffer: buf, extension: 'png' });
      sheet.addImage(imageId, {
        tl: { col: 9.25, row: row.number - 1 + 0.15 },   // col 9 = columna J, offset para centrar
        ext: { width: IMG_SIZE, height: IMG_SIZE },
        editAs: 'oneCell',
      });
    }
  }

  // ── Generar y descargar ──
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombreArchivo}.xlsx`);
}
