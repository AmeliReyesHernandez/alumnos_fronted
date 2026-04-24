<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

import Login from './components/Login.vue';
import StudentForm from './components/StudentForm.vue';
import StudentList from './components/StudentList.vue';
import AdminPanel from './components/AdminPanel.vue';

const estaLogueado = ref(false);
const usuarioLogueado = ref('');
const alumnos = ref([]);
const alumnoToEdit = ref(null);
const mostrarAdminPanel = ref(false);

const esAdmin = computed(() => usuarioLogueado.value === 'admin');

const handleLoginSuccess = (usuario) => {
  estaLogueado.value = true;
  usuarioLogueado.value = usuario;
};

const cargarAlumnos = async () => {
  try {
    const response = await axios.get(`http://localhost:8081/alumnos/traer-alumnos`);
    alumnos.value = response.data;
  } catch (error) {
    console.error('Error al cargar alumnos', error);
  }
};

const cerrarSesion = () => {
  estaLogueado.value = false;
  usuarioLogueado.value = '';
  mostrarAdminPanel.value = false;
};

onMounted(() => {
  cargarAlumnos();
});

const handleEditStudent = (alumno) => {
  alumnoToEdit.value = { ...alumno };
};

const handleClearEdit = () => {
  alumnoToEdit.value = null;
};
</script>

<template>
  <Login v-if="!estaLogueado" @login-success="handleLoginSuccess" />

  <div class="container" v-else>
    <!-- Barra superior -->
    <div class="d-flex justify-content-between align-items-center mb-1 mt-3 flex-wrap gap-2">
      <!-- Info usuario -->
      <div class="d-flex align-items-center gap-2">
        <div style="
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(59,130,246,0.35);
        ">
          {{ usuarioLogueado ? usuarioLogueado[0].toUpperCase() : '?' }}
        </div>
        <span style="font-size: 0.88rem; color: #475569; font-weight: 500;">
          {{ usuarioLogueado }}
          <span v-if="esAdmin" class="badge bg-primary ms-1" style="font-size: 0.68rem; border-radius: 50px; padding: 2px 8px;">
            <i class="bi bi-shield-fill me-1"></i>Admin
          </span>
        </span>
      </div>

      <!-- Botones -->
      <div class="d-flex gap-2">
        <button
          v-if="esAdmin"
          @click="mostrarAdminPanel = true"
          class="btn btn-sm rounded-pill shadow-sm px-3"
          style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; border: none; font-size: 0.85rem;"
        >
          <i class="bi bi-shield-lock-fill me-1"></i> Panel Admin
        </button>
        <button
          @click="cerrarSesion"
          class="btn btn-danger btn-sm rounded-pill shadow-sm px-3"
        >
          <i class="bi bi-box-arrow-right me-1"></i> Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Contenido principal -->
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

    <!-- Panel Admin (modal) -->
    <AdminPanel
      v-if="mostrarAdminPanel"
      @cerrar="mostrarAdminPanel = false"
    />
  </div>
</template>
