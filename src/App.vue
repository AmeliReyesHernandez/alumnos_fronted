<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

import Login from './components/Login.vue';
import StudentForm from './components/StudentForm.vue';
import StudentList from './components/StudentList.vue';

const estaLogueado = ref(false);
const alumnos = ref([]);
const alumnoToEdit = ref(null);

const cargarAlumnos = async () => {
  try {
    const response = await axios.get(`http://localhost:8081/alumnos/traer-alumnos`)
    alumnos.value = response.data;
  } catch (error) {
    console.error('Error al cargar alumnos', error);
  }
}

const cerrarSesion = () => {
  estaLogueado.value = false;
};

onMounted(() => {
  cargarAlumnos();
});

const handleEditStudent = (alumno) => {
  alumnoToEdit.value = { ...alumno }; // Pasamos una copia
};

const handleClearEdit = () => {
  alumnoToEdit.value = null;
};
</script>

<template>
  <Login v-if="!estaLogueado" @login-success="estaLogueado = true" />

  <div class="container" v-else>
    <div class="d-flex justify-content-end mb-1 mt-3">
        <button @click="cerrarSesion" class="btn btn-danger btn-sm rounded-pill shadow-sm px-3"><i class="bi bi-box-arrow-right me-1"></i> Cerrar Sesión</button>
    </div>
    <div class="row">
      <div class="col-md-12 mt-2">
         <StudentForm 
            :alumnos="alumnos" 
            :alumnoAEditar="alumnoToEdit"
            @refresh-list="cargarAlumnos"
            @clear-edit="handleClearEdit"
         />
      </div>

      <StudentList 
        :alumnos="alumnos"
        @refresh-list="cargarAlumnos"
        @edit-student="handleEditStudent"
      />
    </div>
  </div>
</template>

