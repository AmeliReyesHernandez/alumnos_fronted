<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const emit = defineEmits(['cerrar']);

const usuarios = ref([]);
const cargando = ref(true);
const fuenteDatos = ref(''); // 'backend' | 'local'
const busqueda = ref('');

onMounted(async () => {
  // 1. Intentar cargar del backend
  try {
    const res = await axios.get('http://localhost:8081/usuarios/listar');
    if (res.data && res.data.length > 0) {
      usuarios.value = res.data;
      fuenteDatos.value = 'backend';

      // Sincronizar con localStorage también
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
  } catch { /* backend no disponible, usar localStorage */ }

  // 2. Fallback: cargar de localStorage
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
  <div class="admin-overlay" @click.self="emit('cerrar')">
    <div class="admin-panel">

      <!-- Header -->
      <div class="admin-header">
        <div class="admin-header-left">
          <div class="admin-icon-wrap">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <h2 class="admin-title">Panel de Administrador</h2>
            <p class="admin-subtitle">Usuarios registrados en el sistema</p>
          </div>
        </div>
        <button class="admin-close-btn" @click="emit('cerrar')" title="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Stats + fuente -->
      <div class="admin-stats" v-if="!cargando">
        <div class="stat-chip">
          <i class="bi bi-people-fill me-2"></i>
          Total de usuarios: <strong class="ms-1">{{ usuarios.length }}</strong>
        </div>
        <span v-if="fuenteDatos === 'local'" class="source-badge local">
          <i class="bi bi-hdd-fill me-1"></i>Datos locales
        </span>
        <span v-else-if="fuenteDatos === 'backend'" class="source-badge backend">
          <i class="bi bi-cloud-fill me-1"></i>Servidor
        </span>
      </div>

      <!-- Buscador -->
      <div class="admin-search" v-if="!cargando && usuarios.length > 0">
        <i class="bi bi-search search-icon"></i>
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar usuario..."
          class="search-input"
        />
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="admin-center">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Cargando usuarios...</p>
      </div>

      <!-- Sin usuarios -->
      <div v-else-if="usuarios.length === 0" class="admin-center">
        <div class="empty-icon">
          <i class="bi bi-person-x"></i>
        </div>
        <p class="mt-3 mb-1" style="color:#94a3b8; font-weight:600;">No hay usuarios registrados</p>
        <p style="color:#475569; font-size:0.82rem;">Los usuarios aparecerán aquí cuando se registren en el sistema.</p>
      </div>

      <!-- Sin resultados de búsqueda -->
      <div v-else-if="usuariosFiltrados.length === 0" class="admin-center">
        <i class="bi bi-search fs-1" style="color:#334155;"></i>
        <p class="mt-3" style="color:#64748b;">No se encontraron usuarios con "{{ busqueda }}"</p>
      </div>

      <!-- Tabla de usuarios -->
      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th><i class="bi bi-person-fill me-1"></i>Usuario</th>
              <th><i class="bi bi-lock-fill me-1"></i>Contraseña</th>
              <th><i class="bi bi-calendar-fill me-1"></i>Registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, index) in usuariosFiltrados"
              :key="user.id || user.usuario || index"
              class="admin-row"
            >
              <!-- Número -->
              <td class="cell-num">{{ index + 1 }}</td>

              <!-- Usuario -->
              <td class="cell-user">
                <div class="user-badge">
                  <div class="user-avatar">
                    {{ user.usuario ? user.usuario[0].toUpperCase() : '?' }}
                  </div>
                  <div>
                    <div class="user-name">{{ user.usuario }}</div>
                    <div class="user-role" v-if="user.usuario === 'admin'">
                      <i class="bi bi-shield-fill me-1"></i>Administrador
                    </div>
                    <div class="user-role normal" v-else>
                      <i class="bi bi-person me-1"></i>Usuario
                    </div>
                  </div>
                </div>
              </td>

              <!-- Contraseña -->
              <td class="cell-pass">
                <div class="pass-row">
                  <span class="pass-value" :style="mostrarPassword[index] ? '' : 'filter: blur(4px); user-select:none;'">
                    {{ user.password || '—' }}
                  </span>
                  <button
                    class="btn-eye"
                    @click="togglePassword(index)"
                    :title="mostrarPassword[index] ? 'Ocultar' : 'Mostrar'"
                  >
                    <i class="bi" :class="mostrarPassword[index] ? 'bi-eye-slash-fill' : 'bi-eye-fill'"></i>
                  </button>
                </div>
              </td>

              <!-- Fecha registro -->
              <td class="cell-date">{{ user.fechaRegistro || '—' }}</td>

              <!-- Estado -->
              <td>
                <span class="status-chip active">
                  <i class="bi bi-circle-fill me-1" style="font-size:0.45rem; vertical-align:middle;"></i>Activo
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="admin-footer">
        <i class="bi bi-info-circle me-1"></i>
        Las contraseñas están ocultas por defecto. Haz clic en
        <i class="bi bi-eye-fill mx-1"></i> para verlas.
        Solo visible para administradores.
      </div>

    </div>
  </div>
</template>

<style scoped>
.admin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 15, 40, 0.82);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.admin-panel {
  background: linear-gradient(145deg, #0f172a, #1e293b);
  border: 1px solid rgba(99, 130, 246, 0.25);
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,130,246,0.1);
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ── Header ── */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1rem;
  border-bottom: 1px solid rgba(99, 130, 246, 0.2);
  background: linear-gradient(135deg, rgba(30,58,138,0.4), rgba(59,130,246,0.15));
  flex-shrink: 0;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: white;
  box-shadow: 0 4px 15px rgba(59,130,246,0.4);
  flex-shrink: 0;
}

.admin-title {
  color: #e2e8f0;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.admin-subtitle {
  color: #64748b;
  font-size: 0.82rem;
  margin: 0;
  margin-top: 2px;
}

.admin-close-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.admin-close-btn:hover {
  background: rgba(239,68,68,0.2);
  border-color: rgba(239,68,68,0.4);
  color: #fca5a5;
}

/* ── Stats bar ── */
.admin-stats {
  padding: 0.8rem 1.75rem;
  border-bottom: 1px solid rgba(99,130,246,0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 50px;
  padding: 0.3rem 1rem;
  color: #93c5fd;
  font-size: 0.875rem;
}

.source-badge {
  font-size: 0.75rem;
  border-radius: 50px;
  padding: 0.25rem 0.7rem;
  font-weight: 600;
}

.source-badge.local {
  background: rgba(234,179,8,0.12);
  border: 1px solid rgba(234,179,8,0.3);
  color: #fde047;
}

.source-badge.backend {
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  color: #86efac;
}

/* ── Buscador ── */
.admin-search {
  padding: 0.75rem 1.75rem;
  border-bottom: 1px solid rgba(99,130,246,0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.search-icon {
  color: #475569;
  font-size: 0.9rem;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 0.875rem;
  width: 100%;
}

.search-input::placeholder {
  color: #334155;
}

/* ── Loading / Empty ── */
.admin-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #64748b;
  text-align: center;
  flex: 1;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(30,58,138,0.3);
  border: 1px solid rgba(59,130,246,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #3b82f6;
}

/* ── Tabla ── */
.admin-table-wrap {
  overflow-y: auto;
  flex: 1;
  padding: 1rem 1.5rem 0.5rem;
}

.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 5px;
}

.admin-table thead th {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  padding: 0.4rem 0.75rem;
  border: none;
}

.admin-row td {
  background: rgba(255,255,255,0.03);
  padding: 0.75rem 0.75rem;
  border: none;
  transition: background 0.15s;
}

.admin-row:hover td {
  background: rgba(59,130,246,0.07);
}

.admin-row td:first-child { border-radius: 10px 0 0 10px; }
.admin-row td:last-child  { border-radius: 0 10px 10px 0; }

/* número */
.cell-num {
  color: #334155;
  font-size: 0.82rem;
  text-align: center;
  width: 36px;
}

/* usuario */
.cell-user { }

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-name {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.88rem;
}

.user-role {
  font-size: 0.72rem;
  color: #f59e0b;
  margin-top: 1px;
}

.user-role.normal {
  color: #64748b;
}

/* contraseña */
.cell-pass { max-width: 220px; }

.pass-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pass-value {
  font-family: 'Courier New', monospace;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(99,130,246,0.2);
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  color: #7dd3fc;
  font-size: 0.78rem;
  word-break: break-all;
  white-space: normal;
  flex: 1;
  transition: filter 0.2s ease;
}

.btn-eye {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px;
  color: #64748b;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-eye:hover {
  background: rgba(59,130,246,0.2);
  color: #93c5fd;
  border-color: rgba(59,130,246,0.4);
}

/* fecha */
.cell-date {
  color: #475569;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* estado */
.status-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 50px;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-chip.active {
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  color: #86efac;
}

/* ── Footer ── */
.admin-footer {
  padding: 0.75rem 1.75rem;
  border-top: 1px solid rgba(99,130,246,0.15);
  color: #475569;
  font-size: 0.78rem;
  text-align: center;
  flex-shrink: 0;
}
</style>
