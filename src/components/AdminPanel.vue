<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const props = defineProps({
  usuarioLogueado: { type: String, default: '' }
});

const emit = defineEmits(['cerrar']);

const usuarios = ref([]);
const cargando = ref(true);
const fuenteDatos = ref(''); // 'backend' | 'local'
const busqueda = ref('');

onMounted(async () => {
  if (props.usuarioLogueado !== 'admin') {
    emit('cerrar');
    return;
  }

  try {
    const res = await axios.get('https://alumnos-backend-bw34.onrender.com/usuarios/listar');
    if (res.data && res.data.length > 0) {
      usuarios.value = res.data;
      fuenteDatos.value = 'backend';
      
      const local = JSON.parse(localStorage.getItem('usuarios_sistema') || '[]');
      res.data.forEach(u => {
        if (!local.some(l => l.usuario === u.usuario)) {
          local.push({
            usuario: u.usuario,
            password: u.password || '••••••••',
            fechaRegistro: '—'
          });
        }
      });
      localStorage.setItem('usuarios_sistema', JSON.stringify(local));
      cargando.value = false;
      return;
    }
  } catch { }

  try {
    const local = JSON.parse(localStorage.getItem('usuarios_sistema') || '[]');
    usuarios.value = local;
    fuenteDatos.value = 'local';
  } catch {
    usuarios.value = [];
    fuenteDatos.value = 'local';
  }
  cargando.value = false;
});

const usuariosFiltrados = computed(() => {
  const term = busqueda.value.toLowerCase().trim();
  if (!term) return usuarios.value;
  return usuarios.value.filter(u =>
    u.usuario?.toLowerCase().includes(term)
  );
});

const mostrarPassword = ref({});
const togglePassword = (idx) => {
  mostrarPassword.value[idx] = !mostrarPassword.value[idx];
};
</script>

<template>
  <div class="admin-overlay" @click.self="emit('cerrar')" v-if="usuarioLogueado === 'admin'">
    <div class="admin-modal">
      <!-- Header -->
      <div class="admin-header">
        <div class="header-content">
          <div class="icon-box">
            <i class="bi bi-shield-lock"></i>
          </div>
          <div class="header-text">
            <h2>Gestión de Usuarios</h2>
            <p>Panel administrativo de acceso al sistema</p>
          </div>
        </div>
        <button class="btn-close-modal" @click="emit('cerrar')">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="admin-toolbar">
        <div class="search-container">
          <i class="bi bi-search"></i>
          <input 
            type="text" 
            v-model="busqueda" 
            placeholder="Buscar por nombre de usuario..."
          />
        </div>
        <div class="status-summary" v-if="!cargando">
          <span class="count-badge">
            <i class="bi bi-people me-1"></i> {{ usuarios.length }} Usuarios
          </span>
          <span :class="['source-indicator', fuenteDatos]">
            <i :class="fuenteDatos === 'backend' ? 'bi bi-cloud-check' : 'bi bi-hdd'"></i>
            {{ fuenteDatos === 'backend' ? 'Sincronizado' : 'Modo Local' }}
          </span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="admin-body">
        <!-- Loading -->
        <div v-if="cargando" class="state-container">
          <div class="spinner-border text-primary" role="status"></div>
          <p>Cargando registros...</p>
        </div>

        <!-- No hay usuarios -->
        <div v-else-if="usuarios.length === 0" class="state-container">
          <i class="bi bi-person-x empty-icon"></i>
          <h3>Sin registros</h3>
          <p>No se encontraron usuarios en la base de datos.</p>
        </div>

        <!-- Tabla -->
        <div v-else class="table-responsive custom-table-container">
          <table class="table align-middle mb-0">
            <thead>
              <tr class="table-header-bg">
                <th class="ps-4">#</th>
                <th>Usuario</th>
                <th>Contraseña</th>
                <th>F. Registro</th>
                <th class="text-center pe-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in usuariosFiltrados" :key="user.id || index">
                <td class="ps-4 text-muted small">{{ index + 1 }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-sm me-3">
                      {{ user.usuario ? user.usuario[0].toUpperCase() : '?' }}
                    </div>
                    <div>
                      <div class="fw-bold text-dark">{{ user.usuario }}</div>
                      <div class="small text-muted">{{ user.usuario === 'admin' ? 'Superusuario' : 'Estándar' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="password-wrapper">
                    <span :class="{ 'blurred': !mostrarPassword[index] }">
                      {{ user.password || '••••••••' }}
                    </span>
                    <button class="btn-toggle-view" @click="togglePassword(index)">
                      <i class="bi" :class="mostrarPassword[index] ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </td>
                <td class="text-muted small">
                  {{ user.fechaRegistro || '—' }}
                </td>
                <td class="text-center pe-4">
                  <span class="badge-status">Activo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sin resultados de búsqueda -->
        <div v-if="!cargando && usuarios.length > 0 && usuariosFiltrados.length === 0" class="state-container">
          <i class="bi bi-search empty-icon"></i>
          <p>No hay coincidencias para "{{ busqueda }}"</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="admin-footer">
        <p><i class="bi bi-info-circle me-1"></i> Solo el administrador puede gestionar estas credenciales.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.admin-modal {
  background: white;
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* --- Header --- */
.admin-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-box {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.header-text h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  text-shadow: none;
}

.header-text p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.btn-close-modal {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* --- Toolbar --- */
.admin-toolbar {
  padding: 20px 32px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-container input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-container input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.status-summary {
  display: flex;
  gap: 12px;
}

.count-badge {
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.source-indicator {
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.source-indicator.backend { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.source-indicator.local { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

/* --- Table --- */
.admin-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.custom-table-container {
  min-height: 300px;
}

.table-header-bg {
  background: #f8fafc;
}

.table-header-bg th {
  padding: 15px 10px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
}

.avatar-sm {
  width: 36px;
  height: 36px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
}

.password-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 8px;
  width: fit-content;
  min-width: 140px;
}

.password-wrapper span {
  font-family: monospace;
  font-size: 0.9rem;
  flex: 1;
}

.blurred {
  filter: blur(4px);
  user-select: none;
}

.btn-toggle-view {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0 4px;
}

.badge-status {
  background: #dcfce7;
  color: #166534;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* --- States --- */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.3;
}

/* --- Footer --- */
.admin-footer {
  padding: 15px 32px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  font-size: 0.8rem;
  color: #94a3b8;
}

.admin-footer p {
  margin: 0;
}
</style>
