/* =========================================
   NAUTIGO — AUTENTICACIÓN Y USUARIOS
   ========================================= */

var USUARIOS_KEY = 'nautigo_usuarios';
var SESION_KEY   = 'nautigo_sesion';

/* Admin predefinido (se crea si no existe) */
var ADMIN_PREDEFINIDO = {
    id: 'admin-001',
    rol: 'admin',
    nombre: 'Administrador',
    email: 'admin@nautigo.com',
    password: 'admin123',   // ⚠️ En producción: hash
    creadoEn: new Date().toISOString()
};

/* -----------------------------------------
   INICIALIZACIÓN
   ----------------------------------------- */
function inicializarUsuarios() {
    var lista = leerUsuarios();
    // Si no existe el admin, lo creamos
    if (!lista.some(function (u) { return u.rol === 'admin'; })) {
        lista.push(ADMIN_PREDEFINIDO);
        guardarUsuarios(lista);
    }
}

/* -----------------------------------------
   CRUD BÁSICO
   ----------------------------------------- */
function leerUsuarios() {
    try {
        var d = localStorage.getItem(USUARIOS_KEY);
        return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
}

function guardarUsuarios(lista) {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
}

function buscarUsuarioPorEmail(email) {
    return leerUsuarios().find(function (u) {
        return u.email.toLowerCase() === email.toLowerCase();
    });
}

function buscarUsuarioPorId(id) {
    return leerUsuarios().find(function (u) { return u.id === id; });
}

/* -----------------------------------------
   SESIÓN
   ----------------------------------------- */
function leerSesion() {
    try {
        var d = localStorage.getItem(SESION_KEY);
        return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
}

function guardarSesion(usuario) {
    // Guardamos solo datos seguros (sin password)
    var sesion = {
        id: usuario.id,
        rol: usuario.rol,
        nombre: usuario.nombre,
        email: usuario.email,
        puntos: usuario.puntos || 0,
        iniciadaEn: new Date().toISOString()
    };
    localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

function cerrarSesion() {
    localStorage.removeItem(SESION_KEY);
    actualizarUIUsuario();
}

function usuarioActual() {
    return leerSesion();
}

function estaLogueado() {
    return leerSesion() !== null;
}

/* -----------------------------------------
   REGISTRO
   ----------------------------------------- */
function registrarUsuario(datos) {
    /*
      datos = {
        rol: 'cliente' | 'lanchero',
        nombre, email, telefono, password,
        // si es lanchero:
        nombreLancha, capacidad, motorHP, costoGasolinaHora
      }
    */
    var lista = leerUsuarios();

    // Validar email único
    if (lista.some(function (u) { return u.email.toLowerCase() === datos.email.toLowerCase(); })) {
        return { ok: false, error: 'Este correo ya está registrado.' };
    }

    // Validaciones básicas
    if (!datos.nombre || datos.nombre.length < 3) return { ok: false, error: 'Nombre muy corto.' };
    if (!datos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) return { ok: false, error: 'Correo inválido.' };
    if (!datos.password || datos.password.length < 6) return { ok: false, error: 'Contraseña debe tener al menos 6 caracteres.' };

    var nuevo = {
        id: 'usr-' + Date.now(),
        rol: datos.rol,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono || '',
        password: datos.password,       // ⚠️ En producción: hash con bcrypt
        puntos: 0,
        creadoEn: new Date().toISOString()
    };

    // Si es lanchero, datos de lancha + estado pendiente
    if (datos.rol === 'lanchero') {
        nuevo.estado = 'pendiente';   // pendiente / aprobado / rechazado
        nuevo.lancha = {
            nombre: datos.nombreLancha || 'Sin nombre',
            capacidad: parseInt(datos.capacidad, 10) || 8,
            motorHP: parseInt(datos.motorHP, 10) || 40,
            costoGasolinaHora: parseFloat(datos.costoGasolinaHora) || 80,
            horarioInicio: datos.horarioInicio || '06:00',
            horarioFin: datos.horarioFin || '18:00',
            activa: false   // hasta que admin apruebe
        };
    }

    lista.push(nuevo);
    guardarUsuarios(lista);

    return { ok: true, usuario: nuevo };
}

/* -----------------------------------------
   LOGIN
   ----------------------------------------- */
function login(email, password) {
    var u = buscarUsuarioPorEmail(email);
    if (!u) return { ok: false, error: 'Correo no registrado.' };
    if (u.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };

    // Si es lanchero rechazado, no puede entrar
    if (u.rol === 'lanchero' && u.estado === 'rechazado') {
        return { ok: false, error: 'Tu solicitud fue rechazada. Contacta al administrador.' };
    }

    guardarSesion(u);
    actualizarUIUsuario();
    return { ok: true, usuario: u };
}

/* -----------------------------------------
   PUNTOS Y DESCUENTOS
   ----------------------------------------- */
function calcularPuntosGanados(totalReserva) {
    // 10 puntos por cada Q100 gastados
    return Math.floor(totalReserva / 100) * 10;
}

function agregarPuntosAUsuario(usuarioId, puntos) {
    var lista = leerUsuarios();
    var idx = lista.findIndex(function (u) { return u.id === usuarioId; });
    if (idx >= 0) {
        lista[idx].puntos = (lista[idx].puntos || 0) + puntos;
        guardarUsuarios(lista);

        // Actualizar sesión si es el mismo usuario
        var sesion = leerSesion();
        if (sesion && sesion.id === usuarioId) {
            sesion.puntos = lista[idx].puntos;
            localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
        }
    }
}

function calcularDescuentoPorPuntos(puntos) {
    // 100 puntos = Q10 de descuento
    return Math.floor(puntos / 100) * 10;
}

function canjearPuntos(usuarioId, puntosACanjear) {
    var lista = leerUsuarios();
    var idx = lista.findIndex(function (u) { return u.id === usuarioId; });
    if (idx < 0 || lista[idx].puntos < puntosACanjear) return false;

    lista[idx].puntos -= puntosACanjear;
    guardarUsuarios(lista);

    var sesion = leerSesion();
    if (sesion && sesion.id === usuarioId) {
        sesion.puntos = lista[idx].puntos;
        localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
    }
    return true;
}

/* -----------------------------------------
   LANCHEROS (para admin)
   ----------------------------------------- */
function obtenerLancherosPendientes() {
    return leerUsuarios().filter(function (u) {
        return u.rol === 'lanchero' && u.estado === 'pendiente';
    });
}

function obtenerLancherosAprobados() {
    return leerUsuarios().filter(function (u) {
        return u.rol === 'lanchero' && u.estado === 'aprobado';
    });
}

function aprobarLanchero(usuarioId) {
    var lista = leerUsuarios();
    var idx = lista.findIndex(function (u) { return u.id === usuarioId; });
    if (idx >= 0) {
        lista[idx].estado = 'aprobado';
        if (lista[idx].lancha) lista[idx].lancha.activa = true;
        guardarUsuarios(lista);
        return true;
    }
    return false;
}

function rechazarLanchero(usuarioId) {
    var lista = leerUsuarios();
    var idx = lista.findIndex(function (u) { return u.id === usuarioId; });
    if (idx >= 0) {
        lista[idx].estado = 'rechazado';
        guardarUsuarios(lista);
        return true;
    }
    return false;
}

/* -----------------------------------------
   HOTELES (admin)
   ----------------------------------------- */
var HOTELES_KEY = 'nautigo_hoteles_admin';

function leerHotelesAdmin() {
    try {
        var d = localStorage.getItem(HOTELES_KEY);
        return d ? JSON.parse(d) : [];
    } catch (e) { return []; }
}

function guardarHotelesAdmin(lista) {
    localStorage.setItem(HOTELES_KEY, JSON.stringify(lista));
}

function agregarHotelAdmin(hotel) {
    var lista = leerHotelesAdmin();
    hotel.id = 'hotel-' + Date.now();
    lista.push(hotel);
    guardarHotelesAdmin(lista);
    return hotel;
}

function eliminarHotelAdmin(hotelId) {
    var lista = leerHotelesAdmin();
    lista = lista.filter(function (h) { return h.id !== hotelId; });
    guardarHotelesAdmin(lista);
}

/* Todos los hoteles = base + admin */
function obtenerTodosLosHoteles() {
    return hoteles.concat(leerHotelesAdmin());
}

/* -----------------------------------------
   ACTUALIZAR UI DEL HEADER
   ----------------------------------------- */
function actualizarUIUsuario() {
    var cont = document.getElementById('header-usuario');
    if (!cont) return;

    var sesion = leerSesion();

    if (!sesion) {
        cont.innerHTML =
            '<a href="#" id="link-login" class="btn-login">Iniciar Sesión</a>' +
            '<a href="#" id="link-registro" class="btn-registro">Registrarse</a>';
        document.getElementById('link-login').addEventListener('click', function (e) {
            e.preventDefault();
            abrirLogin();
        });
        document.getElementById('link-registro').addEventListener('click', function (e) {
            e.preventDefault();
            abrirRegistro();
        });
    } else {
        var inicial = sesion.nombre.charAt(0).toUpperCase();
        var panelLabel = sesion.rol === 'admin' ? 'Panel Admin' :
                         sesion.rol === 'lanchero' ? 'Panel Lanchero' :
                         'Mis reservas';
        cont.innerHTML =
            '<div class="usuario-menu">' +
                '<button id="usuario-toggle" class="usuario-toggle">' +
                    '<span class="usuario-avatar">' + inicial + '</span>' +
                    '<span class="usuario-nombre">' + sesion.nombre.split(' ')[0] + '</span>' +
                    (sesion.rol === 'cliente' ? '<span class="usuario-puntos">' + sesion.puntos + ' pts</span>' : '') +
                    ' ▾' +
                '</button>' +
                '<div class="usuario-dropdown oculto" id="usuario-dropdown">' +
                    '<div class="usuario-dropdown-header">' +
                        '<strong>' + sesion.nombre + '</strong>' +
                        '<small>' + sesion.email + '</small>' +
                        (sesion.rol === 'cliente' ? '<small class="puntos-info">' + sesion.puntos + ' puntos acumulados</small>' : '') +
                    '</div>' +
                    '<button id="usuario-panel" class="usuario-dropdown-btn">' + panelLabel + '</button>' +
                    '<button id="usuario-logout" class="usuario-dropdown-btn logout">Cerrar sesión</button>' +
                '</div>' +
            '</div>';

        document.getElementById('usuario-toggle').addEventListener('click', function (e) {
            e.stopPropagation();
            document.getElementById('usuario-dropdown').classList.toggle('oculto');
        });

        document.addEventListener('click', function () {
            var dd = document.getElementById('usuario-dropdown');
            if (dd) dd.classList.add('oculto');
        });

        document.getElementById('usuario-panel').addEventListener('click', function () {
            if (sesion.rol === 'admin') abrirPanelAdmin();
            else if (sesion.rol === 'lanchero') abrirPanelLanchero();
            else abrirMisReservas();
        });

        document.getElementById('usuario-logout').addEventListener('click', function () {
            cerrarSesion();
            mostrarInicio();
        });
    }
}

/* Inicializar al cargar */
inicializarUsuarios();