<script setup>
import { ref, computed, watch } from 'vue';
import { exportarPDF, exportarExcel } from '../composables/useExport.js';

const descargandoPDF   = ref(false);
const descargandoExcel = ref(false);

const descargarPDF = async () => {
  descargandoPDF.value = true;
  try {
    await exportarPDF(
      props.alumnos,
      'Lista de alumnos — ' + props.carrera,
      'alumnos_' + props.carrera.replace(/\s+/g, '_').toLowerCase()
    );
  } finally {
    descargandoPDF.value = false;
  }
};

const descargarExcel = async () => {
  descargandoExcel.value = true;
  try {
    await exportarExcel(
      props.alumnos,
      props.carrera.substring(0, 31),
      'alumnos_' + props.carrera.replace(/\s+/g, '_').toLowerCase()
    );
  } finally {
    descargandoExcel.value = false;
  }
};

const props = defineProps({
  carrera: {
    type: String,
    required: true
  },
  alumnos: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['edit-student', 'delete-student']);

const itemsPorPagina = 15;
const paginaActual = ref(1);

// Si la longitud de la lista cambia drásticamente (ej. por una búsqueda nueva), reiniciamos a pagina 1
watch(() => props.alumnos.length, () => {
    paginaActual.value = 1;
});

const totalPaginas = computed(() => {
  return Math.ceil(props.alumnos.length / itemsPorPagina);
});

const alumnosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  return props.alumnos.slice(inicio, fin);
});

const cambiarPagina = (nuevaPagina) => {
  paginaActual.value = nuevaPagina;
};
</script>

<template>
  <div class="card shadow mb-4">
    <div class="card-body">
      <h5 class="card-title-lista mb-3" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #021937; padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <span><i class="bi bi-mortarboard-fill me-2" style="color: #3b82f6;"></i>{{ props.carrera }}</span>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge bg-primary rounded-pill">{{ props.alumnos.length }} alumno{{ props.alumnos.length !== 1 ? 's' : '' }}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            style="font-size: 0.75rem; padding: 3px 10px; border-radius: 50px;"
            title="Descargar lista en PDF"
            :disabled="descargandoPDF"
            @click="descargarPDF"
          >
            <span v-if="descargandoPDF" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-else class="bi bi-file-earmark-pdf-fill me-1"></i>
            {{ descargandoPDF ? 'Generando...' : 'PDF' }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-success"
            style="font-size: 0.75rem; padding: 3px 10px; border-radius: 50px;"
            title="Descargar lista en Excel"
            :disabled="descargandoExcel"
            @click="descargarExcel"
          >
            <span v-if="descargandoExcel" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-else class="bi bi-file-earmark-excel-fill me-1"></i>
            {{ descargandoExcel ? 'Generando...' : 'Excel' }}
          </button>
        </div>
      </h5>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead class="table-header-bg">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Nombre</th>
              <th scope="col">Ap. Paterno</th>
              <th scope="col">Ap. Materno</th>
              <th scope="col">Email</th>
              <th scope="col">Nº Control</th>
              <th scope="col">Carrera</th>
              <th scope="col">Lada</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Imagen</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
          <tr v-for="(alumno, index) in alumnosPaginados" :key="alumno.id">
            <td class="col-id text-center fw-bold">{{ (paginaActual - 1) * itemsPorPagina + index + 1 }}</td>
            <td class="col-nombre">{{ alumno.nombre }}</td>
            <td class="col-apellido">{{ alumno.apellidoPaterno }}</td>
            <td class="col-apellido">{{ alumno.apellidoMaterno }}</td>
            <td class="col-email">{{ alumno.email }}</td>
            <td class="col-numcontrol">{{ alumno.numeroControl }}</td>
            <td class="col-carrera">{{ alumno.carrera }}</td>
            <td class="col-lada">{{ alumno.lada }}</td>
            <td class="col-telefono">{{ alumno.telefono }}</td>
            <td class="col-imagen"><img :src="alumno.imagenURL" alt="Imagen de Alumno" width="35" height="35" style="border-radius: 50%; object-fit: cover; border: 2px solid #3b82f6;"></td>
            <td class="col-acciones">
              <div class="btn-group-acciones">
                <button @click="$emit('edit-student', alumno)" class="btn-accion btn-editar" title="Editar">
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button @click="$emit('delete-student', alumno.id)" class="btn-accion btn-eliminar" title="Eliminar">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div v-if="totalPaginas > 1" class="d-flex justify-content-center mt-4">
        <nav aria-label="Navegación de páginas">
          <ul class="pagination pagination-sm shadow-sm mb-0">
            <li class="page-item" :class="{ disabled: paginaActual === 1 }">
              <button class="page-link" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
            </li>
            <li v-for="pag in totalPaginas" :key="pag" class="page-item" :class="{ active: paginaActual === pag }">
              <button class="page-link" @click="cambiarPagina(pag)">{{ pag }}</button>
            </li>
            <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
              <button class="page-link" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>
