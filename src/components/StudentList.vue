<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import StudentTable from './StudentTable.vue';
import { exportarPDF, exportarExcel } from '../composables/useExport.js';

const props = defineProps({
  alumnos: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['edit-student', 'refresh-list']);

const carreraSeleccionada = ref('');
const busqueda = ref('');
const descargandoPDFTotal = ref(false);

const descargarPDFCompleto = async () => {
  descargandoPDFTotal.value = true;
  try {
    await exportarPDF(props.alumnos, 'Lista completa de alumnos — Todas las carreras', 'alumnos_completo');
  } finally {
    descargandoPDFTotal.value = false;
  }
};

watch(busqueda, (newVal) => {
  if (newVal) {
    carreraSeleccionada.value = '';
  }
});

const seleccionarCarrera = (carrera) => {
  if (carreraSeleccionada.value === carrera) {
    carreraSeleccionada.value = '';
  } else {
    carreraSeleccionada.value = carrera;
  }
};

const alumnosAgrupados = computed(() => {
  const grupos = {};
  const termino = busqueda.value.toLowerCase().trim();

  props.alumnos.forEach(alumno => {
    if (termino) {
      const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`.toLowerCase();
      const numControl = alumno.numeroControl ? alumno.numeroControl.toLowerCase() : '';
      if (!nombreCompleto.includes(termino) && !numControl.includes(termino)) {
        return;
      }
    }

    const carrera = alumno.carrera || 'Sin carrera asignada';
    if (!grupos[carrera]) {
      grupos[carrera] = [];
    }
    grupos[carrera].push(alumno);
  });
  return grupos;
});

const eliminarAlumnoPorId = async (id) => {
  try {
    await axios.delete(`http://localhost:8081/alumnos/eliminar-alumnos/${id}`);
    emit('refresh-list');
  } catch (errr) {
    console.error('Error al eliminar el alumno:', errr);
    Swal.fire({
      icon: 'error',
      title: 'Error al eliminar el alumno',
      text: 'No se pudo eliminar el alumno.',
    });
  }
}

const eliminarAlumno = async (id) => {
  Swal.fire({
    title: '¿Estás seguro de eliminar el alumno?',
    text: "No podrás revertir esto!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminarlo!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await eliminarAlumnoPorId(id);
      Swal.fire(
        'Eliminado!',
        'El alumno ha sido eliminado.',
        'success'
      )
    }
  })
}

const editarAlumnos = (alumno) => {
  emit('edit-student', alumno);
}
</script>

<template>
  <div>
    <div class="col-md-12 text-center mb-3" v-if="props.alumnos && props.alumnos.length > 0">
      <div class="d-flex flex-wrap justify-content-center align-items-center gap-2 mb-1">
        <button 
          @click="seleccionarCarrera('TODAS')"
          type="button"
          class="btn px-3 py-2 shadow-sm rounded-pill border-0" 
          :class="carreraSeleccionada === 'TODAS' ? 'bg-white text-primary border border-primary fw-bold' : 'bg-primary text-white'"
          style="font-size: 0.95rem; font-weight: 500; letter-spacing: 0.3px; transition: all 0.2s ease;">
          <i class="bi bi-people-fill me-2"></i>Total de Estudiantes: {{ props.alumnos.length }}
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm rounded-pill shadow-sm px-3"
          title="Descargar lista completa en PDF"
          :disabled="descargandoPDFTotal"
          @click="descargarPDFCompleto"
        >
          <span v-if="descargandoPDFTotal" class="spinner-border spinner-border-sm me-1" role="status"></span>
          <i v-else class="bi bi-file-earmark-pdf-fill me-1"></i>
          {{ descargandoPDFTotal ? 'Generando...' : 'PDF Completo' }}
        </button>
        <button
          type="button"
          class="btn btn-success btn-sm rounded-pill shadow-sm px-3"
          title="Descargar lista completa en Excel"
          @click="exportarExcel(props.alumnos, 'Todos los Alumnos', 'alumnos_completo')"
        >
          <i class="bi bi-file-earmark-excel-fill me-1"></i>Excel Completo
        </button>
      </div>
    </div>

    <div class="col-md-8 col-lg-6 mx-auto mb-4">
      <div class="input-group shadow-sm" style="border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; transition: border-color 0.3s ease;">
        <span class="input-group-text bg-white border-0 text-primary py-2 px-3"><i class="bi bi-search"></i></span>
        <input type="text" class="form-control border-0 ps-1 mx-shadow-none" placeholder="Buscar alumno por nombre, apellidos o número de control..." v-model="busqueda">
      </div>
    </div>

    <div class="col-md-12 mb-2" v-if="Object.keys(alumnosAgrupados).length > 0 && busqueda === ''">
      <div class="d-flex flex-wrap gap-2 justify-content-center mb-4">
        <button 
          v-for="(lista, carrera) in alumnosAgrupados" 
          :key="'btn-' + carrera"
          class="btn"
          :class="carreraSeleccionada === carrera ? 'btn-primary shadow' : 'btn-outline-primary'"
          @click="seleccionarCarrera(carrera)"
        >
          {{ carrera }} 
          <span class="badge ms-1" :class="carreraSeleccionada === carrera ? 'bg-white text-primary' : 'bg-primary'">{{ lista.length }}</span>
        </button>
      </div>
    </div>

    <div class="col-md-12">
      <!-- USO DEL NUEVO SUBCONPONENTE STUDENT TABLE -->
      <StudentTable 
        v-for="(lista, carrera) in alumnosAgrupados" 
        :key="carrera" 
        v-show="carreraSeleccionada === carrera || carreraSeleccionada === 'TODAS' || busqueda !== ''"
        :carrera="carrera"
        :alumnos="lista"
        @edit-student="editarAlumnos"
        @delete-student="eliminarAlumno"
      />

      <div v-if="props.alumnos.length > 0 && Object.keys(alumnosAgrupados).length === 0" class="alert alert-info text-center mt-3 shadow-sm rounded-3">
        <i class="bi bi-info-circle me-2"></i>No se encontraron alumnos registrados o que coincidan con la búsqueda.
      </div>
      <div v-else-if="props.alumnos.length > 0 && carreraSeleccionada === '' && busqueda === ''" class="alert alert-secondary text-center mt-3 shadow-sm rounded-3" style="background-color: #f8fafc; border-color: #e2e8f0; color: #475569;">
        <i class="bi bi-hand-index-thumb me-2 text-primary"></i>Selecciona una carrera en los botones de arriba para ver a sus alumnos.
      </div>
      <div v-else-if="props.alumnos.length === 0" class="alert alert-info text-center mt-3 shadow-sm rounded-3">
        <i class="bi bi-info-circle me-2"></i>Aún no hay alumnos registrados.
      </div>
    </div>
  </div>
</template>

