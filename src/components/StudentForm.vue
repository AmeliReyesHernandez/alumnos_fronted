<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const props = defineProps({
  alumnos: {
    type: Array,
    required: true
  },
  alumnoAEditar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['refresh-list', 'clear-edit']);

const carreras = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería en Mecatrónica',
  'Ingeniería Industrial',
  'Ingeniería Civil',
  'Ingeniería en Gestión Empresarial',
  'Licenciatura en Administración',
  'Licenciatura en Arquitectura'
];

const ladasMexico = [
  { codigo: '+52', pais: 'México', bandera: '🇲🇽' },
  { codigo: '+1', pais: 'Estados Unidos / Canadá', bandera: '🇺🇸' },
  { codigo: '+34', pais: 'España', bandera: '🇪🇸' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
  { codigo: '+39', pais: 'Italia', bandera: '🇮🇹' },
  { codigo: '+33', pais: 'Francia', bandera: '🇫🇷' },
  { codigo: '+49', pais: 'Alemania', bandera: '🇩🇪' }
];

const nuevoAlumno = ref({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  numeroControl: '26',
  carrera: '',
  lada: '+52',
  telefono: '',
  imagenURL: ''
});

const editado = ref(false);

watch(() => props.alumnoAEditar, (newVal) => {
  if (newVal) {
    Object.assign(nuevoAlumno.value, newVal);
    editado.value = true;
  }
}, { deep: true });

const validarTelefono = (telefono) => {
  const soloNumeros = telefono.replace(/\D/g, '');
  return soloNumeros.length === 10;
};

const validarNumeroControl = (numeroControl) => {
  const soloNumeros = numeroControl.replace(/\D/g, '');
  return soloNumeros.length === 8 && soloNumeros.startsWith('26');
};

const tieneLetrasTelefono = (telefono) => {
  return /[a-záéíóúñ]/i.test(telefono);
};

const formatearNumeroControl = (valor) => {
  let limpio = valor.replace(/[a-záéíóúñ]/gi, '').replace(/[^0-9]/g, '');
  if (limpio.length > 0 && !limpio.startsWith('26')) {
    limpio = '26' + limpio.substring(2);
  } else if (limpio.length === 0) {
    limpio = '26';
  }
  return limpio.substring(0, 8);
};

const agregarAlumno = async () => {
  try {
    if (!nuevoAlumno.value.nombre.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre es requerido' });
      return;
    }
    if (!nuevoAlumno.value.apellidoPaterno.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El apellido paterno es requerido' });
      return;
    }
    if (!nuevoAlumno.value.apellidoMaterno.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'El apellido materno es requerido' });
      return;
    }
    if (!validarNumeroControl(nuevoAlumno.value.numeroControl)) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Número de Control',
        text: 'El número de control debe tener exactamente 8 dígitos y comenzar con 26'
      });
      return;
    }
    if (!validarTelefono(nuevoAlumno.value.telefono)) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Teléfono',
        text: 'El teléfono debe tener exactamente 10 dígitos'
      });
      return;
    }

    const alumnoExistente = props.alumnos.find(a => a.numeroControl === nuevoAlumno.value.numeroControl);
    if (alumnoExistente && (!editado.value || alumnoExistente.id !== nuevoAlumno.value.id)) {
      Swal.fire({
        icon: 'error',
        title: 'Número de Control Duplicado',
        text: `Ya existe un alumno con el número de control ${nuevoAlumno.value.numeroControl}`
      });
      return;
    }

    if (!nuevoAlumno.value.imagenURL) {
      nuevoAlumno.value.imagenURL = 'https://i.pinimg.com/1200x/da/36/3b/da363b913ed65af5aa1c496011ec4164.jpg';
    }

    if (editado.value) {
      await axios.put(`http://localhost:8081/alumnos/editar-alumnos/${nuevoAlumno.value.id}`, nuevoAlumno.value);
      Swal.fire({
        icon: 'success',
        title: 'Alumno actualizado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
      editado.value = false;
    } else {
      await axios.post(`http://localhost:8081/alumnos/insertar-alumnos`, nuevoAlumno.value);
      Swal.fire({
        icon: 'success',
        title: 'Alumno agregado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    }

    emit('refresh-list');
    limpiarFormulario();
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar el alumno',
      text: error.response?.data?.message || 'Intenta nuevamente'
    });
  }
};

const limpiarFormulario = () => {
  nuevoAlumno.value = {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    numeroControl: '26',
    carrera: '',
    lada: '+52',
    telefono: '',
    imagenURL: ''
  };
  editado.value = false;
  emit('clear-edit');
};
</script>

<template>
  <div class="card shadow p-4 mb-4">
    <h2 class="text-center">Formulario de Alumnos</h2>
    <form @submit.prevent="agregarAlumno">
      <div class="row">
        <div class="col-md-6 mb-3">
          <label for="nombre" class="form-label">Nombre</label>
          <input 
            type="text" 
            class="form-control" 
            id="nombre" 
            v-model="nuevoAlumno.nombre" 
            @input="nuevoAlumno.nombre = nuevoAlumno.nombre.replace(/[0-9]/g, '')"
            maxlength="20"
            required>
        </div>
        <div class="col-md-6 mb-3">
          <label for="apellidoPaterno" class="form-label">Apellido Paterno</label>
          <input 
            type="text" 
            class="form-control" 
            id="apellidoPaterno" 
            v-model="nuevoAlumno.apellidoPaterno" 
            @input="nuevoAlumno.apellidoPaterno = nuevoAlumno.apellidoPaterno.replace(/[0-9]/g, '')"
            maxlength="20"
            required>
        </div>
        <div class="col-md-6 mb-3">
          <label for="apellidoMaterno" class="form-label">Apellido Materno</label>
          <input 
            type="text" 
            class="form-control" 
            id="apellidoMaterno" 
            v-model="nuevoAlumno.apellidoMaterno" 
            @input="nuevoAlumno.apellidoMaterno = nuevoAlumno.apellidoMaterno.replace(/[0-9]/g, '')"
            maxlength="20"
            required>
        </div>
        <div class="col-md-6 mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" v-model="nuevoAlumno.email">
        </div>
        <div class="col-md-6 mb-3">
          <label for="numeroControl" class="form-label">Número de Control</label>
          <input 
            type="text" 
            class="form-control" 
            id="numeroControl" 
            v-model="nuevoAlumno.numeroControl"
            @input="nuevoAlumno.numeroControl = formatearNumeroControl(nuevoAlumno.numeroControl)"
            placeholder="26XXXXXX"
            maxlength="8">
          <small v-if="nuevoAlumno.numeroControl.length > 0 && !nuevoAlumno.numeroControl.startsWith('26')" class="text-danger">
            Debe comenzar con 26
          </small>
          <small v-else-if="nuevoAlumno.numeroControl.length > 0 && !validarNumeroControl(nuevoAlumno.numeroControl)" class="text-danger">
            Debe tener exactamente 8 dígitos comenzando con 26
          </small>
        </div>
        <div class="col-md-6 mb-3">
          <label for="carrera" class="form-label">Carrera</label>
          <select class="form-control select-bg-layer" id="carrera" v-model="nuevoAlumno.carrera" required>
            <option value="">-- Selecciona una carrera --</option>
            <option v-for="carrera in carreras" :key="carrera" :value="carrera">
              {{ carrera }}
            </option>
          </select>
        </div>
        <div class="col-md-6 mb-3">
          <label for="telefono" class="form-label">Teléfono</label>
          <div class="input-group">
            <select class="form-select lada-select" id="lada" v-model="nuevoAlumno.lada">
              <option v-for="lada in ladasMexico" :key="lada.codigo" :value="lada.codigo">
                {{ lada.bandera }} {{ lada.codigo }}
              </option>
            </select>
            <input 
              type="text" 
              class="form-control input-group-control" 
              id="telefono" 
              v-model="nuevoAlumno.telefono" 
              @input="nuevoAlumno.telefono = nuevoAlumno.telefono.replace(/[a-záéíóúñ]/gi, '')"
              placeholder="10 dígitos"
              maxlength="10"
              required>
          </div>
          <small v-if="nuevoAlumno.telefono.length > 0 && tieneLetrasTelefono(nuevoAlumno.telefono)" class="text-danger">
            Este campo solo acepta números
          </small>
          <small v-else-if="nuevoAlumno.telefono.length > 0 && !validarTelefono(nuevoAlumno.telefono)" class="text-danger">
            Debe tener exactamente 10 dígitos
          </small>
        </div>
        <div class="col-md-12 mb-3">
          <label for="imagenURL" class="form-label">Imagen URL</label>
          <input type="text" class="form-control" id="imagenURL" v-model="nuevoAlumno.imagenURL">
        </div>
      </div>

      <button type="submit" class="btn btn-primary">
        {{ editado ? 'Actualizar Alumno' : 'Agregar Alumno' }}
      </button>
      <button type="button" @click="limpiarFormulario" class="btn btn-secondary ms-2">
        Limpiar
      </button>
    </form>
  </div>
</template>


