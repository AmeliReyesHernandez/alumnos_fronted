<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const apiBaseUrl = 'http://localhost:8080/alumnos';

const alumnos = ref([]);

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

const validarTelefono = (telefono) => {
  const soloNumeros = telefono.replace(/\D/g, '');
  return soloNumeros.length === 10;
};

const validarNumeroControl = (numeroControl) => {
  const soloNumeros = numeroControl.replace(/\D/g, '');
  return soloNumeros.length === 8 && soloNumeros.startsWith('26');
};

const validarQueEmpieceConDiez = (numeroControl) => {
  return numeroControl.startsWith('26') || numeroControl === '';
};

const validarNombre = (nombre) => {
  return /^[a-záéíóúñ\s]*$/i.test(nombre);
};

const validarApellido = (apellido) => {
  return /^[a-záéíóúñ\s]*$/i.test(apellido);
};

const tieneLetrasNumeroControl = (numeroControl) => {
  return /[a-záéíóúñ]/i.test(numeroControl);
};

const tieneLetrasTelefono = (telefono) => {
  return /[a-záéíóúñ]/i.test(telefono);
};

const formatearNumeroControl = (valor) => {
  // Eliminar letras
  let limpio = valor.replace(/[a-záéíóúñ]/gi, '').replace(/[^0-9]/g, '');
  // Asegurar que comienza con 26
  if (limpio.length > 0 && !limpio.startsWith('26')) {
    limpio = '26' + limpio.substring(2);
  } else if (limpio.length === 0) {
    limpio = '26';
  }
  return limpio.substring(0, 8);
};

const obtenerBandera = (codigo) => {
  const lada = ladasMexico.find(l => l.codigo === codigo);
  return lada ? lada.bandera : '';
};

const cargarAlumnos = async () => {
  const response = await axios.get(`http://localhost:8080/alumnos/traer-alumnos`)
  alumnos.value = response.data;
  console.log(alumnos.value);
}

const agregarAlumno = async () => {
  try {
    if (!nuevoAlumno.value.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre es requerido'
      });
      return;
    }

    if (!nuevoAlumno.value.apellidoPaterno.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El apellido paterno es requerido'
      });
      return;
    }

    if (!nuevoAlumno.value.apellidoMaterno.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El apellido materno es requerido'
      });
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

    // Validar que el número de control no esté repedito (al agregar o al editar)
    const alumnoExistente = alumnos.value.find(a => a.numeroControl === nuevoAlumno.value.numeroControl);
    if (alumnoExistente && (!editado.value || alumnoExistente.id !== nuevoAlumno.value.id)) {
      Swal.fire({
        icon: 'error',
        title: 'Número de Control Duplicado',
        text: `Ya existe un alumno con el número de control ${nuevoAlumno.value.numeroControl}`
      });
      return;
    }

    // Si no hay URL de imagen, usa la por defecto
    if (!nuevoAlumno.value.imagenURL) {
      nuevoAlumno.value.imagenURL = 'https://i.pinimg.com/1200x/da/36/3b/da363b913ed65af5aa1c496011ec4164.jpg';
    }

    if (editado.value) {
      await axios.put(`http://localhost:8080/alumnos/editar-alumnos/${nuevoAlumno.value.id}`, nuevoAlumno.value);
      Swal.fire({
        icon: 'success',
        title: 'Alumno actualizado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
      editado.value = false;
    } else {
      await axios.post(`http://localhost:8080/alumnos/insertar-alumnos`, nuevoAlumno.value);
      Swal.fire({
        icon: 'success',
        title: 'Alumno agregado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    }

    await cargarAlumnos();
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
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar el alumno',
      text: error.response?.data?.message || 'Intenta nuevamente'
    });
  }
}

const editarAlumnos = (alumno) => {
  Object.assign(nuevoAlumno.value, alumno);
  editado.value = true
}

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

const eliminarAlumnoPorId = async (id) => {
  try {
    await axios.delete(`http://localhost:8080/alumnos/eliminar-alumnos/${id}`);
    console.log('Alumno eliminado con id:', id);
    await cargarAlumnos();
  } catch (errr) {
    console.error('Error al eliminar el alumno:', errr);
    Swal.fire({
      icon: 'error',
      title: 'Error al eliminar el alumno',
      text: 'No se pudo eliminar el alumno.',
    });
  }
}

const estaLogueado = ref(false);
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
      const response = await axios.post(`http://localhost:8080/usuarios/registro`, loginAuth.value);
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
      const response = await axios.post(`http://localhost:8080/usuarios/login`, loginAuth.value);
      if (response.status === 200) {
        estaLogueado.value = true;
      }
    } catch (error) {
      // Modo de prueba fallback por si el backend aún no se ha desplegado con la actualización
      if (loginAuth.value.usuario === 'admin' && loginAuth.value.password === 'admin123') {
         estaLogueado.value = true;
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

const cerrarSesion = () => {
  estaLogueado.value = false;
  loginAuth.value.usuario = '';
  loginAuth.value.password = '';
};

const carreraSeleccionada = ref('');
const busqueda = ref('');

watch(busqueda, (newVal) => {
  if (newVal) {
    carreraSeleccionada.value = ''; // Al buscar, deselecciona la carrera para mostrar resultados de todas
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

  alumnos.value.forEach(alumno => {
    // Si hay texto en el buscador, filtrar por coincidencia en nombre o N.º de control
    if (termino) {
      const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`.toLowerCase();
      const numControl = alumno.numeroControl ? alumno.numeroControl.toLowerCase() : '';
      if (!nombreCompleto.includes(termino) && !numControl.includes(termino)) {
        return; // Excluye al alumno si no coincide
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

const itemsPorPagina = 15;
const paginaActual = ref({});

const cambiarPagina = (carrera, nuevaPagina) => {
  paginaActual.value[carrera] = nuevaPagina;
};

const totalPaginasPorCarrera = (carrera) => {
  const lista = alumnosAgrupados.value[carrera] || [];
  return Math.ceil(lista.length / itemsPorPagina);
};

const alumnosPaginados = computed(() => {
  const paginados = {};
  for (const carrera in alumnosAgrupados.value) {
    const lista = alumnosAgrupados.value[carrera];
    const pagina = paginaActual.value[carrera] || 1;
    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    paginados[carrera] = lista.slice(inicio, fin);
  }
  return paginados;
});

onMounted(cargarAlumnos);
</script>

<template>
  <!-- PANTALLA DE LOGIN -->
  <div class="login-container" v-if="!estaLogueado">
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

  <!-- SISTEMA PRINCIPAL -->
  <div class="container" v-else>
    <div class="d-flex justify-content-end mb-1 mt-3">
        <button @click="cerrarSesion" class="btn btn-danger btn-sm rounded-pill shadow-sm px-3"><i class="bi bi-box-arrow-right me-1"></i> Cerrar Sesión</button>
    </div>
    <div class="row">
      <div class="col-md-12 mt-2">
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
                <select class="form-control" id="carrera" v-model="nuevoAlumno.carrera" required>
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
                    class="form-control" 
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
      </div>

      <div class="col-md-12 text-center mb-3" v-if="alumnos.length > 0">
        <button 
          @click="seleccionarCarrera('TODAS')"
          type="button"
          class="btn px-3 py-2 shadow-sm rounded-pill border-0" 
          :class="carreraSeleccionada === 'TODAS' ? 'bg-white text-primary border border-primary fw-bold' : 'bg-primary text-white'"
          style="font-size: 0.95rem; font-weight: 500; letter-spacing: 0.3px; transition: all 0.2s ease;">
          <i class="bi bi-people-fill me-2"></i>Total de Estudiantes: {{ alumnos.length }}
        </button>
      </div>

      <div class="col-md-8 col-lg-6 mx-auto mb-4">
        <div class="input-group shadow-sm" style="border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; transition: border-color 0.3s ease;">
          <span class="input-group-text bg-white border-0 text-primary py-2 px-3"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control border-0 ps-1" placeholder="Buscar alumno por nombre, apellidos o número de control..." v-model="busqueda" style="box-shadow: none;">
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
        <div class="card shadow mb-4" v-for="(lista, carrera) in alumnosAgrupados" :key="carrera" v-show="carreraSeleccionada === carrera || carreraSeleccionada === 'TODAS' || busqueda !== ''">
          <div class="card-body">
            <h5 class="card-title-lista mb-3" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #021937; padding-bottom: 10px;">
              <span><i class="bi bi-mortarboard-fill me-2" style="color: #3b82f6;"></i>{{ carrera }}</span>
              <span class="badge bg-primary rounded-pill">{{ lista.length }} alumno{{ lista.length !== 1 ? 's' : '' }}</span>
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
                <tr v-for="(alumno, index) in alumnosPaginados[carrera]" :key="alumno.id">
                  <td class="col-id text-center fw-bold">{{ ((paginaActual[carrera] || 1) - 1) * itemsPorPagina + index + 1 }}</td>
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
                      <button @click="editarAlumnos(alumno)" class="btn-accion btn-editar" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button @click="eliminarAlumno(alumno.id)" class="btn-accion btn-eliminar" title="Eliminar">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>

            <div v-if="totalPaginasPorCarrera(carrera) > 1" class="d-flex justify-content-center mt-4">
              <nav aria-label="Navegación de páginas">
                <ul class="pagination pagination-sm shadow-sm mb-0">
                  <li class="page-item" :class="{ disabled: (paginaActual[carrera] || 1) === 1 }">
                    <button class="page-link" @click="cambiarPagina(carrera, (paginaActual[carrera] || 1) - 1)">Anterior</button>
                  </li>
                  <li v-for="pag in totalPaginasPorCarrera(carrera)" :key="pag" class="page-item" :class="{ active: (paginaActual[carrera] || 1) === pag }">
                    <button class="page-link" @click="cambiarPagina(carrera, pag)">{{ pag }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: (paginaActual[carrera] || 1) === totalPaginasPorCarrera(carrera) }">
                    <button class="page-link" @click="cambiarPagina(carrera, (paginaActual[carrera] || 1) + 1)">Siguiente</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <div v-if="Object.keys(alumnosAgrupados).length === 0" class="alert alert-info text-center mt-3 shadow-sm rounded-3">
          <i class="bi bi-info-circle me-2"></i>No se encontraron alumnos registrados o que coincidan con la búsqueda.
        </div>
        <div v-else-if="carreraSeleccionada === '' && busqueda === ''" class="alert alert-secondary text-center mt-3 shadow-sm rounded-3" style="background-color: #f8fafc; border-color: #e2e8f0; color: #475569;">
          <i class="bi bi-hand-index-thumb me-2 text-primary"></i>Selecciona una carrera en los botones de arriba para ver a sus alumnos.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Pantalla de login */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.login-icon-bg {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2.2rem;
  color: #3b82f6;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
}

.login-card .input-group:focus-within {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}
.login-card .form-control:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Resto de estilos */
.container {
  padding: 30px 0;
}

h2 {
  color: #1e3a8a;
  font-weight: 700;
  margin-bottom: 25px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.card-body {
  padding: 25px;
}

.card-title {
  color: #1e3a8a;
  font-weight: 600;
  font-size: 1.4rem;
  margin-bottom: 20px;
}

.card-title-lista {
  color: #1e3a8a;
  font-weight: 500;
  font-size: 1.1rem;
  margin-bottom: -12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #021937;
}

/* Formulario */
.form-label {
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-control {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-control::placeholder {
  color: #b0b9c6;
}

/* Select personalizado */
select.form-control {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231e3a8a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  appearance: none;
  padding-right: 35px;
}

/* Botones */
.btn {
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 20px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #374151 100%);
  color: white;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #4b5563 0%, #1f2937 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #f87171 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

/* Botones de acciones mejorados */
.btn-group-acciones {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.btn-accion {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-editar {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-editar:hover {
  background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-eliminar {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-eliminar:hover {
  background: linear-gradient(135deg, #f87171 0%, #b91c1c 100%);
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Tabla */
.table {
  margin-bottom: 0;
  margin-top: 0;
  font-size: 0.85rem;
}

.table-responsive {
  border-radius: 8px;
  overflow: auto;
  margin-top: 5px;
}

.table-header-bg {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  white-space: nowrap;
}

.table-header-bg th {
  color: #373343;
  font-weight: 500;
  padding: 10px 6px;
  border: none;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.table tbody tr {
  transition: background-color 0.2s ease, border-color 0.2s ease;
  border-bottom: 1px solid #e2e8f0;
}

.table tbody tr:hover {
  background-color: #f0f9ff;
  border-bottom-color: #3b82f6;
}

.table td {
  padding: 10px 6px;
  vertical-align: middle;
  color: #1f2937;
  font-size: 0.8rem;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table td:first-child {
  max-width: 40px;
  text-align: center;
}

.table img {
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  max-width: 35px;
}

/* Columnas específicas de la tabla */
.col-id {
  max-width: 40px !important;
  width: 40px;
}

.col-nombre, .col-apellido {
  max-width: 70px !important;
}

.col-email {
  max-width: 120px !important;
}

.col-numcontrol {
  max-width: 65px !important;
  text-align: center;
  font-weight: 600;
}

.col-carrera {
  max-width: 100px !important;
}

.col-lada {
  max-width: 55px !important;
  text-align: center;
}

.col-telefono {
  max-width: 70px !important;
  text-align: center;
  font-weight: 500;
}

.col-imagen {
  max-width: 50px !important;
  text-align: center;
}

.col-acciones {
  max-width: 80px !important;
  text-align: center;
  white-space: normal;
}

.table img:hover {
  border-color: #3b82f6;
  transform: scale(1.1);
}

/* Input Group con Lada */
.input-group {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.lada-select {
  border-radius: 8px 0 0 8px !important;
  border: 2px solid #e2e8f0 !important;
  border-right: 1px solid #e2e8f0 !important;
  cursor: pointer;

  flex: 0 0 110px !important;
  width: 110px !important;      

  padding: 6px 10px;
  height: 36px;

  font-weight: 400;
  font-size: 0.85rem;
}

.input-group .form-control {
  border-radius: 0 8px 8px 0;
  border-left: none;
  flex: 1;
  border: 2px solid #e2e8f0;
  padding: 6px 10px;
  height: 36px;
}

.input-group .form-control::placeholder {
  color: #b0b9c6;
}

.input-group .form-control:focus {
  border-color: #3b82f6;
  border-right: none;
  box-shadow: none;
  z-index: 2;
}

.lada-select:focus {
  border-color: #3b82f6 !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Estilos para validación */
.text-danger {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 5px;
  display: block;
}

/* Espacios */
.mb-3 {
  margin-bottom: 1.2rem;
}

.ms-2 {
  margin-left: 0.8rem;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .card {
    margin-bottom: 20px;
  }

  .table {
    font-size: 0.75rem;
  }

  .table-header-bg th {
    font-size: 0.65rem;
    padding: 8px 4px;
  }

  .table td {
    padding: 8px 4px;
    font-size: 0.7rem;
  }

  .col-nombre, .col-apellido {
    max-width: 50px !important;
  }

  .col-email {
    max-width: 70px !important;
  }

  .col-carrera {
    max-width: 60px !important;
  }

  .btn-accion {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .btn {
    padding: 8px 15px;
    font-size: 0.85rem;
  }
}
</style>
