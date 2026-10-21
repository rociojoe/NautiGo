/* =========================================
   NAUTIGO — INTERFAZ DE AUTENTICACIÓN
   ========================================= */

/* ---------- ABRIR LOGIN ---------- */
function abrirLogin() {
    ocultarTodas();
    document.getElementById('vista-login').classList.remove('oculto');
    window.scrollTo(0, 0);
}

/* ---------- ABRIR REGISTRO ---------- */
function abrirRegistro() {
    ocultarTodas();
    document.getElementById('vista-registro').classList.remove('oculto');
    cambiarTipoRegistro('cliente');
    window.scrollTo(0, 0);
}

/* ---------- CAMBIAR TIPO DE REGISTRO ---------- */
function cambiarTipoRegistro(tipo) {
    document.getElementById('reg-rol').value = tipo;
    document.querySelectorAll('.reg-tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-rol') === tipo);
    });
    document.getElementById('reg-campos-lanchero').classList.toggle('oculto', tipo !== 'lanchero');
}

/* ---------- LOGIN ---------- */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.reg-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            cambiarTipoRegistro(tab.getAttribute('data-rol'));
        });
    });

    var loginForm = document.getElementById('form-login');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;
        var error = document.getElementById('login-error');
        var boton = loginForm.querySelector('button[type="submit"]');

        boton.disabled = true;
        login(email, password).then(function (res) {
            boton.disabled = false;

            if (!res.ok) {
                error.textContent = res.error;
                error.classList.remove('oculto');
                return;
            }

            error.classList.add('oculto');
            loginForm.reset();
            mostrarInicio();
        });
    });
});

/* ---------- REGISTRO ---------- */
document.addEventListener('DOMContentLoaded', function () {
    var regForm = document.getElementById('form-registro');
    if (!regForm) return;

    regForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var tipo = document.getElementById('reg-rol').value;
        var error = document.getElementById('reg-error');
        var boton = regForm.querySelector('button[type="submit"]');

        var datos = {
            rol: tipo,
            nombre: document.getElementById('reg-nombre').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            password: document.getElementById('reg-password').value
        };

        if (tipo === 'lanchero') {
            datos.nombreLancha = document.getElementById('reg-lancha-nombre').value.trim();
            datos.capacidad = document.getElementById('reg-lancha-capacidad').value;
            datos.galones = document.getElementById('reg-lancha-galones').value;
            datos.motorHP = document.getElementById('reg-lancha-motor').value;
            datos.costoGasolinaHora = document.getElementById('reg-lancha-gasolina').value;
        }

        boton.disabled = true;
        registrarUsuario(datos).then(function (res) {
            boton.disabled = false;

            if (!res.ok) {
                error.textContent = res.error;
                error.classList.remove('oculto');
                return;
            }

            error.classList.add('oculto');
            regForm.reset();
            cambiarTipoRegistro('cliente');
            alert(res.mensaje);
            abrirLogin();
        });
    });
});

/* ---------- PANEL LANCHERO ---------- */
function abrirPanelLanchero() {
    if (!SESION || SESION.rol !== 'lanchero') return;

    ocultarTodas();
    document.getElementById('vista-panel-lanchero').classList.remove('oculto');

    var u = SESION;
    var l = u.lancha;

    document.getElementById('pl-nombre').textContent = u.nombre;
    document.getElementById('pl-email').textContent = u.email;

    var estado = document.getElementById('pl-estado');
    estado.textContent = u.estado === 'aprobado' ? 'Aprobado'
                       : u.estado === 'rechazado' ? 'Rechazado' : 'Pendiente';
    estado.className = 'pl-estado estado-' + u.estado;

    if (l) {
        document.getElementById('pl-lancha-nombre').textContent = l.nombre;
        document.getElementById('pl-lancha-capacidad').textContent = l.aforo + ' personas';
        document.getElementById('pl-lancha-galones').textContent = l.galones + ' galones';
        document.getElementById('pl-lancha-motor').textContent = l.motorHP + ' HP';
        document.getElementById('pl-lancha-gasolina').textContent = Q(l.costoGasolinaHora) + '/hora';
        var activa = document.getElementById('pl-lancha-activa');
        activa.textContent = l.activa ? 'Activa' : 'Inactiva';
        activa.className = 'pl-estado estado-' + (l.activa ? 'activa' : 'inactiva');
    }

    var cont = document.getElementById('pl-reservas');
    cont.innerHTML = '';

    if (u.estado !== 'aprobado') {
        var aviso = document.createElement('p');
        aviso.className = 'panel-vacio';
        aviso.textContent = u.estado === 'rechazado'
            ? 'Tu solicitud fue rechazada. Pregunta al administrador qué falta para aprobarla.'
            : 'Cuando el administrador apruebe tu cuenta verás aquí las reservas de tu lancha.';
        cont.appendChild(aviso);
        window.scrollTo(0, 0);
        return;
    }

    /* Las reservas aún viven en localStorage (Paso 3); el único vínculo
       posible hoy es el nombre de la lancha, no su id. */
    var misReservas = l ? leerReservas().filter(function (r) {
        return r.lanchaNombre === l.nombre;
    }) : [];

    if (misReservas.length === 0) {
        cont.innerHTML = '<p class="panel-vacio">Aún no tienes reservas asignadas.</p>';
    } else {
        misReservas.forEach(function (r) {
            var div = document.createElement('div');
            div.className = 'panel-reserva-item';
            div.innerHTML =
                '<div>' +
                    '<strong>' + esc(r.codigo) + '</strong> — ' + esc(r.destinoNombre) +
                    '<br><small>' + esc(r.fecha) + ' · ' + (r.adultos + r.ninos) + ' personas</small>' +
                '</div>' +
                '<div class="panel-reserva-total">' + Q(r.desglose.total) + '</div>';
            cont.appendChild(div);
        });
    }

    window.scrollTo(0, 0);
}

/* ---------- PANEL ADMIN ---------- */
function abrirPanelAdmin() {
    if (!SESION || SESION.rol !== 'admin') return;

    ocultarTodas();
    document.getElementById('vista-panel-admin').classList.remove('oculto');
    renderizarAdminLancheros();
    renderizarAdminHoteles();
    renderizarAdminReservas();
    window.scrollTo(0, 0);
}

function renderizarAdminLancheros() {
    var cont = document.getElementById('admin-lancheros');
    cont.innerHTML = '<p class="panel-vacio">Cargando…</p>';

    obtenerLancheros().then(function (todos) {
        cont.innerHTML = '';

        if (!todos.length) {
            cont.innerHTML = '<p class="panel-vacio">No hay lancheros registrados.</p>';
            return;
        }

        function grupo(titulo, clase, lista, pendientes) {
            if (!lista.length) return;

            var h = document.createElement('h3');
            h.className = 'admin-grupo';
            h.innerHTML = esc(titulo) + ' <span>' + lista.length + '</span>';
            cont.appendChild(h);

            lista.forEach(function (u) {
                var l = u.lancha;
                var div = document.createElement('div');
                div.className = 'admin-item ' + clase;
                div.innerHTML =
                    '<div>' +
                        '<strong>' + esc(u.nombre) + '</strong>' +
                        '<br><small>' + esc(u.email) + ' · ' + esc(u.telefono || 'sin teléfono') + '</small>' +
                        (l ? '<br><small>Lancha ' + esc(l.nombre) + ' · ' + l.aforo + ' personas · ' +
                             l.galones + ' galones · ' + (l.motorHP || 0) + ' HP</small>' : '') +
                        (u.motivo ? '<br><small>Motivo: ' + esc(u.motivo) + '</small>' : '') +
                    '</div>' +
                    (pendientes
                        ? '<div class="admin-item-acciones">' +
                            '<button class="btn-aprobar" data-id="' + u.id + '">Aprobar</button>' +
                            '<button class="btn-rechazar" data-id="' + u.id + '">Rechazar</button>' +
                          '</div>'
                        : '<div class="admin-item-acciones">' +
                            '<button class="btn-rechazar" data-id="' + u.id + '">Suspender</button>' +
                          '</div>');
                cont.appendChild(div);
            });
        }

        grupo('Pendientes de aprobación', 'admin-pendiente',
              todos.filter(function (u) { return u.estado === 'pendiente'; }), true);
        grupo('Aprobados', 'admin-aprobado',
              todos.filter(function (u) { return u.estado === 'aprobado'; }), false);
        grupo('Rechazados o suspendidos', 'admin-rechazado',
              todos.filter(function (u) { return u.estado === 'rechazado'; }), false);

        cont.querySelectorAll('.btn-aprobar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (!confirm('¿Aprobar a este lanchero y activar su lancha?')) return;
                btn.disabled = true;
                aprobarLanchero(btn.getAttribute('data-id')).then(function (res) {
                    btn.disabled = false;
                    if (!res.ok) alert(res.error);
                    renderizarAdminLancheros();
                });
            });
        });

        cont.querySelectorAll('.btn-rechazar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var motivo = prompt('Motivo del rechazo o la suspensión:');
                if (motivo === null) return;
                btn.disabled = true;
                rechazarLanchero(btn.getAttribute('data-id'), motivo.trim()).then(function (res) {
                    btn.disabled = false;
                    if (!res.ok) alert(res.error);
                    renderizarAdminLancheros();
                });
            });
        });
    });
}

function renderizarAdminHoteles() {
    var cont = document.getElementById('admin-hoteles');
    cont.innerHTML = '';

    var propios = {};
    leerHotelesAdmin().forEach(function (h) { propios[h.id] = true; });

    obtenerTodosLosHoteles().forEach(function (h) {
        var div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML =
            '<div>' +
                '<strong>' + esc(h.nombre) + '</strong>' +
                '<br><small>' + esc(h.categoria) + ' · ' + esc(h.ubicacion) + '</small>' +
                '<br><small>' + Q(h.precioNoche) + '/noche</small>' +
            '</div>' +
            (propios[h.id]
                ? '<div class="admin-item-acciones">' +
                    '<button class="btn-rechazar" data-hotel-id="' + h.id + '">Eliminar</button>' +
                  '</div>'
                : '');
        cont.appendChild(div);
    });

    if (!cont.hasChildNodes()) {
        cont.innerHTML = '<p class="panel-vacio">No hay hoteles registrados.</p>';
    }

    cont.querySelectorAll('[data-hotel-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-hotel-id');
            if (confirm('¿Eliminar este hotel?')) {
                eliminarHotelAdmin(id);
                renderizarAdminHoteles();
            }
        });
    });
}

function renderizarAdminReservas() {
    var lista = leerReservas();
    var cont = document.getElementById('admin-reservas');
    cont.innerHTML = '';

    if (lista.length === 0) {
        cont.innerHTML = '<p class="panel-vacio">No hay reservas todavía.</p>';
        return;
    }

    lista.forEach(function (r) {
        var div = document.createElement('div');
        div.className = 'panel-reserva-item';
        div.innerHTML =
            '<div>' +
                '<strong>' + esc(r.codigo) + '</strong> — ' + esc(r.destinoNombre) +
                '<br><small>' + esc(r.cliente.nombre) + ' · ' + esc(r.cliente.email) + '</small>' +
                '<br><small>' + esc(r.fecha) + ' · Lancha ' + esc(r.lancheroNombre) + '</small>' +
            '</div>' +
            '<div>' +
                '<div class="panel-reserva-total">' + Q(r.desglose.total) + '</div>' +
                '<div class="panel-reserva-estado">' + esc(r.estado) + '</div>' +
            '</div>';
        cont.appendChild(div);
    });
}

/* ---------- FORM HOTEL ADMIN ---------- */
document.addEventListener('DOMContentLoaded', function () {
    var formHotel = document.getElementById('form-hotel-admin');
    if (!formHotel) return;

    formHotel.addEventListener('submit', function (e) {
        e.preventDefault();
        var hotel = {
            nombre: document.getElementById('hotel-nombre').value.trim(),
            categoria: document.getElementById('hotel-categoria').value,
            precioNoche: parseFloat(document.getElementById('hotel-precio').value),
            estrellas: parseInt(document.getElementById('hotel-estrellas').value, 10) || 3,
            ubicacion: document.getElementById('hotel-ubicacion').value.trim(),
            descripcion: document.getElementById('hotel-descripcion').value.trim(),
            imagen: 'img/hotel-default.jpg'
        };

        if (!hotel.nombre || !hotel.precioNoche) {
            alert('Nombre y precio son obligatorios');
            return;
        }

        agregarHotelAdmin(hotel);
        formHotel.reset();
        alert('Hotel agregado con éxito');
        renderizarAdminHoteles();
    });
});

/* ---------- ENLACES CRUZADOS LOGIN / REGISTRO ---------- */
document.addEventListener('DOMContentLoaded', function () {
    var irReg = document.getElementById('ir-registro');
    var irLog = document.getElementById('ir-login');
    if (irReg) irReg.addEventListener('click', function (e) { e.preventDefault(); abrirRegistro(); });
    if (irLog) irLog.addEventListener('click', function (e) { e.preventDefault(); abrirLogin(); });
});
