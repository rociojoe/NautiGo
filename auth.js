/* =========================================
   NAUTIGO — AUTENTICACIÓN Y USUARIOS
   El estado vive en el servidor (sesión PHP + MySQL).
   Esta capa solo habla con api/*.php.
   ========================================= */

var SESION = null;   // reflejo en memoria de lo que devuelve api/sesion.php
var CSRF   = null;

/* -----------------------------------------
   TRANSPORTE
   ----------------------------------------- */
function api(url, datos) {
    var opciones = { credentials: 'same-origin', headers: {} };

    if (datos) {
        var cuerpo = new URLSearchParams(datos);
        if (CSRF) cuerpo.append('csrf', CSRF);
        opciones.method = 'POST';
        opciones.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
        opciones.body = cuerpo.toString();
    }

    return fetch(url, opciones)
        .then(function (r) {
            return r.json()
                .catch(function () {
                    return { ok: false, error: 'El servidor no respondió correctamente.' };
                })
                .then(function (j) {
                    /* Los 4xx ya traen {ok:false, error}; si no, manda el estado HTTP. */
                    if (j.ok === undefined) j.ok = r.ok;
                    return j;
                });
        })
        .catch(function () {
            return { ok: false, error: 'No se pudo contactar al servidor. ¿Está corriendo PHP?' };
        });
}

/* -----------------------------------------
   SESIÓN
   ----------------------------------------- */
function leerSesion()    { return SESION; }
function usuarioActual() { return SESION; }
function estaLogueado()  { return SESION !== null; }

function cargarSesion() {
    return api('api/sesion.php').then(function (j) {
        SESION = j.usuario || null;
        CSRF = j.csrf || null;
        actualizarUIUsuario();
        return SESION;
    });
}

/* -----------------------------------------
   LOGIN / REGISTRO / SALIDA
   ----------------------------------------- */
function login(email, password) {
    return api('api/login.php', { email: email, password: password })
        .then(function (j) {
            if (!j.ok) return j;
            return cargarSesion().then(function () {
                return { ok: true, usuario: SESION };
            });
        });
}

function registrarUsuario(datos) {
    var cuerpo = {
        rol:      datos.rol,
        nombre:   datos.nombre,
        email:    datos.email,
        telefono: datos.telefono,
        password: datos.password
    };

    if (datos.rol === 'lanchero') {
        cuerpo.lanchaNombre   = datos.nombreLancha;
        cuerpo.lanchaAforo    = datos.capacidad;
        cuerpo.lanchaGalones  = datos.galones;
        cuerpo.lanchaMotor    = datos.motorHP;
        cuerpo.lanchaGasolina = datos.costoGasolinaHora;
    }

    return api('api/registro.php', cuerpo);
}

function cerrarSesion() {
    return api('api/logout.php', {}).then(function () {
        SESION = null;
        CSRF = null;
        actualizarUIUsuario();
    });
}

/* -----------------------------------------
   LANCHEROS (para el admin)
   ----------------------------------------- */
function obtenerLancheros() {
    return api('api/lancheros.php').then(function (j) {
        return j.ok ? j.lancheros : [];
    });
}

function aprobarLanchero(usuarioId) {
    return api('api/aprobar.php', { id: usuarioId });
}

function rechazarLanchero(usuarioId, motivo) {
    return api('api/rechazar.php', { id: usuarioId, motivo: motivo });
}

/* -----------------------------------------
   HOTELES (catálogo demo de datos.js + los del
   admin, que viven en MySQL)
   ----------------------------------------- */
var HOTELES_SERVIDOR = [];

function cargarHotelesServidor() {
    return api('api/hoteles.php').then(function (j) {
        if (j.ok) HOTELES_SERVIDOR = j.hoteles;
        return HOTELES_SERVIDOR;
    });
}

function buscarHotel(id) {
    return hoteles.find(function (h) { return h.id === id; })
        || HOTELES_SERVIDOR.find(function (h) { return h.id === id; })
        || null;
}

/* Todos los hoteles = base + servidor */
function obtenerTodosLosHoteles() {
    return hoteles.concat(HOTELES_SERVIDOR);
}

document.addEventListener('DOMContentLoaded', function () {
    cargarHotelesServidor();
});

/* -----------------------------------------
   UI DEL HEADER
   ----------------------------------------- */
var _menuDocumentado = false;

function actualizarUIUsuario() {
    var cont = document.getElementById('header-usuario');
    if (!cont) return;

    /* El blog y otras secciones repintan su UI cuando la sesión cambia. */
    document.dispatchEvent(new CustomEvent('sesion-cambiada'));

    if (!SESION) {
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
        return;
    }

    var esLanchero = SESION.rol === 'lanchero';
    var pendiente  = esLanchero && SESION.estado === 'pendiente';
    var inicial = SESION.nombre.charAt(0).toUpperCase();
    var avatar = SESION.foto
        ? '<span class="usuario-avatar"><img class="blog-avatar-img" src="' + esc(SESION.foto) + '" alt=""></span>'
        : '<span class="usuario-avatar">' + inicial + '</span>';
    var panelLabel = SESION.rol === 'admin' ? 'Panel Admin' :
                     esLanchero ? (pendiente ? 'Mi solicitud' : 'Panel Lanchero') :
                     'Mi perfil';

    cont.innerHTML =
        '<div class="usuario-menu">' +
            '<button id="usuario-toggle" class="usuario-toggle">' +
                avatar +
                '<span class="usuario-nombre">' + esc(SESION.nombre.split(' ')[0]) + '</span>' +
                (SESION.rol === 'cliente' ? '<span class="usuario-puntos">' + SESION.puntos + ' pts</span>' : '') +
                ' ▾' +
            '</button>' +
            '<div class="usuario-dropdown oculto" id="usuario-dropdown">' +
                '<div class="usuario-dropdown-header">' +
                    '<strong>' + esc(SESION.nombre) + '</strong>' +
                    '<small>' + esc(SESION.email) + '</small>' +
                    (SESION.rol === 'cliente' ? '<small class="puntos-info">' + SESION.puntos + ' puntos acumulados</small>' : '') +
                    (pendiente ? '<small class="puntos-info">Solicitud pendiente de aprobación</small>' : '') +
                '</div>' +
                '<button id="usuario-panel" class="usuario-dropdown-btn">' + panelLabel + '</button>' +
                '<button id="usuario-logout" class="usuario-dropdown-btn logout">Cerrar sesión</button>' +
            '</div>' +
        '</div>';

    document.getElementById('usuario-toggle').addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('usuario-dropdown').classList.toggle('oculto');
    });

    /* Un solo listener global, no uno nuevo en cada render del menú. */
    if (!_menuDocumentado) {
        _menuDocumentado = true;
        document.addEventListener('click', function () {
            var dd = document.getElementById('usuario-dropdown');
            if (dd) dd.classList.add('oculto');
        });
    }

    document.getElementById('usuario-panel').addEventListener('click', function () {
        if (SESION.rol === 'admin') abrirPanelAdmin();
        else if (esLanchero) abrirPanelLanchero();
        else abrirPerfil(SESION.id);
    });

    document.getElementById('usuario-logout').addEventListener('click', function () {
        cerrarSesion().then(mostrarInicio);
    });
}

/* Todo texto que viene del servidor o del teclado se escapa antes de innerHTML. */
function esc(txt) {
    var div = document.createElement('div');
    div.textContent = (txt === null || txt === undefined) ? '' : String(txt);
    return div.innerHTML;
}

/* Al abrir la página, el servidor dice quién tiene la sesión. */
document.addEventListener('DOMContentLoaded', cargarSesion);
