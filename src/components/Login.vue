<script setup>
import { ref } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const emit = defineEmits(['login-success']);

const modoRegistro = ref(false);
const mostrarPassword = ref(false);

const loginAuth = ref({
  usuario: '',
  password: ''
});

const validarPassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return minLength && hasUpper && hasNum && hasSpecial;
};

// Guarda usuario en localStorage para que el Panel Admin lo pueda ver
const guardarUsuarioLocal = (usuario, password) => {
  try {
    const existentes = JSON.parse(localStorage.getItem('usuarios_sistema') || '[]');
    const yaExiste = existentes.some(u => u.usuario === usuario);
    if (!yaExiste) {
      existentes.push({
        usuario,
        password,
        fechaRegistro: new Date().toLocaleDateString('es-MX')
      });
      localStorage.setItem('usuarios_sistema', JSON.stringify(existentes));
    }
  } catch { /* ignorar errores de localStorage */ }
};

const iniciarSesion = async () => {
  if (modoRegistro.value) {
    if (!validarPassword(loginAuth.value.password)) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña débil',
        text: 'La contraseña debe tener al menos 8 caracteres, e incluir como mínimo una letra mayúscula, un número y un carácter especial.',
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }
    // Modo Registro
    try {
      const response = await axios.post(`http://localhost:8081/usuarios/registro`, loginAuth.value);
      guardarUsuarioLocal(loginAuth.value.usuario, loginAuth.value.password);
      Swal.fire({
        icon: 'success',
        title: 'Usuario Creado',
        text: 'El usuario se registró exitosamente. Ya puedes iniciar sesión.',
        confirmButtonColor: '#1e3a8a'
      });
      modoRegistro.value = false;
      loginAuth.value.password = '';
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Registro',
        text: error.response?.data?.message || 'Error al intentar registrar el usuario',
        confirmButtonColor: '#1e3a8a'
      });
    }
  } else {
    // Modo Login
    try {
      const response = await axios.post(`http://localhost:8081/usuarios/login`, loginAuth.value);
      if (response.status === 200) {
        emit('login-success', loginAuth.value.usuario);
      }
    } catch (error) {
      // Modo de prueba fallback por si el backend aún no se ha desplegado con la actualización
      if (loginAuth.value.usuario === 'admin' && loginAuth.value.password === 'admin123') {
         guardarUsuarioLocal(loginAuth.value.usuario, loginAuth.value.password);
         emit('login-success', loginAuth.value.usuario);
         return;
      }
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: error.response?.data?.message || 'Usuario o contraseña incorrectos',
        confirmButtonColor: '#1e3a8a'
      });
    }
  }
};

const cambiarModo = () => {
  modoRegistro.value = !modoRegistro.value;
  loginAuth.value.password = '';
};
</script>

<template>
  <div class="login-container">
    <div class="login-card shadow-lg">
      <div class="text-center mb-4">
        <div class="login-icon-bg">
          <i class="bi py-3" :class="modoRegistro ? 'bi-person-plus-fill' : 'bi-shield-lock-fill'"></i>
        </div>
        <h2 class="mt-3 text-primary fw-bold" style="color: #1e3a8a !important;">{{ modoRegistro ? 'Crear Usuario' : 'Bienvenido' }}</h2>
        <p class="text-muted" style="font-size: 0.9rem;">{{ modoRegistro ? 'Registra tus nuevas credenciales' : 'Ingresa tus credenciales para acceder al sistema' }}</p>
      </div>
      <form @submit.prevent="iniciarSesion">
        <div class="mb-3 text-start">
          <label for="usuario" class="form-label fw-bold" style="color: #1e3a8a;">Usuario</label>
          <div class="input-group shadow-sm" style="border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; transition: all 0.3s ease;">
            <span class="input-group-text bg-white border-0 text-primary py-2 px-3"><i class="bi bi-person-fill"></i></span>
            <input type="text" class="form-control border-0 ps-0" id="usuario" v-model="loginAuth.usuario" :placeholder="modoRegistro ? 'Elige un usuario nuevo' : 'Ej. admin'" required style="box-shadow: none;">
          </div>
        </div>
        <div class="mb-4 text-start">
          <label for="password" class="form-label fw-bold" style="color: #1e3a8a;">Contraseña</label>
          <div class="input-group shadow-sm" style="border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; transition: all 0.3s ease;">
            <span class="input-group-text bg-white border-0 text-primary py-2 px-3"><i class="bi bi-lock-fill"></i></span>
            <input :type="mostrarPassword ? 'text' : 'password'" class="form-control border-0 ps-0" id="password" v-model="loginAuth.password" placeholder="********" required style="box-shadow: none;">
            <button class="btn bg-white border-0 text-muted px-3" type="button" @click="mostrarPassword = !mostrarPassword" style="box-shadow: none;">
              <i class="bi" :class="mostrarPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); letter-spacing: 0.5px;">{{ modoRegistro ? 'Registrarse' : 'Entrar al Sistema' }}</button>
        <div class="text-center mt-3">
          <p class="text-muted mb-0" style="font-size: 0.9rem;">
            {{ modoRegistro ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?' }} 
            <a href="#" @click.prevent="cambiarModo" class="text-primary fw-bold text-decoration-none">
              {{ modoRegistro ? 'Inicia sesión aquí' : 'Crear nuevo usuario' }}
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

