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

/* ---------- SUBMIT LOGIN ---------- */
document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = document.getElementById('login-email').value.trim();
            var password = document.getElementById('login-password').value;
            var error = document.getElementById('login-error');

            var res = login(email, password);
            if (!res.ok) {
                error.textContent = res.error;
                error.classList.remove('oculto');
                return;
            }

            error.classList.add('oculto');
            alert('¡Bienvenido, ' + res.usuario.nombre + '!');
            mostrarInicio();
        });
    }

    var regForm = document.getElementById('form-registro');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var tipo = document.getElementById('reg-rol').value;
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
                datos.motorHP = document.getElementById('reg-lancha-motor').value;
                datos.costoGasolinaHora = document.getElementById('reg-lancha-gasolina').value;
            }

            var res = registrarUsuario(datos);
            var error = document.getElementById('reg-error');

            if (!res.ok) {
                error.textContent = res.error;
                error.classList.remove('oculto');
                return;
            }

            error.classList.add('oculto');

            if (tipo === 'lanchero') {
                alert('¡Registro exitoso! Tu cuenta está pendiente de aprobación por el administrador.');
            } else {
                alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            }
            abrirLogin();
        });
    }
});

/* ---------- PANEL LANCHEO ---------- */
function abrirPanelLanchero() {
    var sesion = leerSesion();
    if (!sesion || sesion.rol !== 'lanchero') return;

    var usuario = buscarUsuarioPorId(sesion.id);
    if (!usuario) return;

    ocultarTodas();
    var panel = document.getElementById('vista-panel-lanchero');
    panel.classList.remove('oculto');

    document.getElementById('pl-nombre').textContent = usuario.nombre;
    document.getElementById('pl-email').textContent = usuario.email;
    document.getElementById('pl-estado').textContent = usuario.estado === 'aprobado' ? '✅ Aprobado' : usuario.estado === 'rechazado' ? '❌ Rechazado' : '⏳ Pendiente';
    document.getElementById('pl-estado').className = 'pl-estado estado-' + usuario.estado;

    if (usuario.lancha) {
        document.getElementById('pl-lancha-nombre').textContent = usuario.lancha.nombre;
        document.getElementById('pl-lancha-capacidad').textContent = usuario.lancha.capacidad + ' personas';
        document.getElementById('pl-lancha-motor').textContent = usuario.lancha.motorHP + ' HP';
        document.getElementById('pl-lancha-gasolina').textContent = 'Q' + usuario.lancha.costoGasolinaHora + '/hora';
        document.getElementById('pl-lancha-activa').textContent = usuario.lancha.activa ? '🟢 Activa' : '🔴 Inactiva (pendiente)';
    }

    // Reservas que le pertenecen
    var todasReservas = leerReservas();
    var misReservas = todasReservas.filter(function (r) {
        return r.lanchaId && usuario.lancha && r.lanchaNombre === usuario.lancha.nombre;
    });

    var cont = document.getElementById('pl-reservas');
    cont.innerHTML = '';
    if (misReservas.length === 0) {
        cont.innerHTML = '<p class="panel-vacio">Aún no tienes reservas asignadas.</p>';
    } else {
        misReservas.forEach(function (r) {
            var div = document.createElement('div');
            div.className = 'panel-reserva-item';
            div.innerHTML =
                '<div>' +
                    '<strong>' + r.codigo + '</strong> — ' + r.destinoNombre +
                    '<br><small>📅 ' + r.fecha + ' · 👥 ' + (r.adultos + r.ninos) + ' personas</small>' +
                '</div>' +
                '<div class="panel-reserva-total">' + Q(r.desglose.total) + '</div>';
            cont.appendChild(div);
        });
    }

    window.scrollTo(0, 0);
}

/* ---------- PANEL ADMIN ---------- */
function abrirPanelAdmin() {
    var sesion = leerSesion();
    if (!sesion || sesion.rol !== 'admin') return;

    ocultarTodas();
    document.getElementById('vista-panel-admin').classList.remove('oculto');
    renderizarAdminLancheros();
    renderizarAdminHoteles();
    renderizarAdminReservas();
    window.scrollTo(0, 0);
}

function renderizarAdminLancheros() {
    var pendientes = obtenerLancherosPendientes();
    var aprobados = obtenerLancherosAprobados();
    var cont = document.getElementById('admin-lancheros');
    cont.innerHTML = '';

    if (pendientes.length > 0) {
        var h = document.createElement('h3');
        h.textContent = '⏳ Pendientes de aprobación (' + pendientes.length + ')';
        cont.appendChild(h);

        pendientes.forEach(function (u) {
            var div = document.createElement('div');
            div.className = 'admin-item admin-pendiente';
            div.innerHTML =
                '<div>' +
                    '<strong>' + u.nombre + '</strong>' +
                    '<br><small>' + u.email + ' · ' + (u.telefono || 'sin teléfono') + '</small>' +
                    '<br><small>🚤 ' + u.lancha.nombre + ' — ' + u.lancha.capacidad + ' personas — ' + u.lancha.motorHP + 'HP</small>' +
                '</div>' +
                '<div class="admin-item-acciones">' +
                    '<button class="btn-aprobar" data-id="' + u.id + '">Aprobar</button>' +
                    '<button class="btn-rechazar" data-id="' + u.id + '">Rechazar</button>' +
                '</div>';
            cont.appendChild(div);
        });
    }

    if (aprobados.length > 0) {
        var h2 = document.createElement('h3');
        h2.textContent = '✅ Aprobados (' + aprobados.length + ')';
        h2.style.marginTop = '24px';
        cont.appendChild(h2);

        aprobados.forEach(function (u) {
            var div = document.createElement('div');
            div.className = 'admin-item admin-aprobado';
            div.innerHTML =
                '<div>' +
                    '<strong>' + u.nombre + '</strong>' +
                    '<br><small>' + u.email + '</small>' +
                    '<br><small>🚤 ' + u.lancha.nombre + '</small>' +
                '</div>' +
                '<div class="admin-item-acciones">' +
                    '<button class="btn-rechazar" data-id="' + u.id + '">Suspender</button>' +
                '</div>';
            cont.appendChild(div);
        });
    }

    if (pendientes.length === 0 && aprobados.length === 0) {
        cont.innerHTML = '<p class="panel-vacio">No hay lancheros registrados.</p>';
    }

    cont.querySelectorAll('.btn-aprobar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (confirm('¿Aprobar a este lanchero?')) {
                aprobarLanchero(btn.getAttribute('data-id'));
                renderizarAdminLancheros();
            }
        });
    });
    cont.querySelectorAll('.btn-rechazar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (confirm('¿Rechazar/suspender a este lanchero?')) {
                rechazarLanchero(btn.getAttribute('data-id'));
                renderizarAdminLancheros();
            }
        });
    });
}

function renderizarAdminHoteles() {
    var cont = document.getElementById('admin-hoteles');
    cont.innerHTML = '';

    var todos = obtenerTodosLosHoteles();

    todos.forEach(function (h) {
        var div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML =
            '<div>' +
                '<strong>' + h.nombre + '</strong>' +
                '<br><small>' + h.categoria + ' · ' + h.ubicacion + '</small>' +
                '<br><small>' + Q(h.precioNoche) + '/noche</small>' +
            '</div>' +
            '<div class="admin-item-acciones">' +
                '<button class="btn-rechazar" data-hotel-id="' + h.id + '">Eliminar</button>' +
            '</div>';
        cont.appendChild(div);
    });

    if (todos.length === 0) {
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
                '<strong>' + r.codigo + '</strong> — ' + r.destinoNombre +
                '<br><small>👤 ' + r.cliente.nombre + ' · ' + r.cliente.email + '</small>' +
                '<br><small>📅 ' + r.fecha + ' · 🚤 ' + r.lancheroNombre + '</small>' +
            '</div>' +
            '<div>' +
                '<div class="panel-reserva-total">' + Q(r.desglose.total) + '</div>' +
                '<div class="panel-reserva-estado">' + r.estado + '</div>' +
            '</div>';
        cont.appendChild(div);
    });
}

/* ---------- FORM HOTEL ADMIN ---------- */
document.addEventListener('DOMContentLoaded', function () {
    var formHotel = document.getElementById('form-hotel-admin');
    if (formHotel) {
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
    }
});

/* ---------- INICIALIZAR UI AL CARGAR ---------- */
document.addEventListener('DOMContentLoaded', function () {
    actualizarUIUsuario();
});
document.addEventListener('DOMContentLoaded', function () {
    var irReg = document.getElementById('ir-registro');
    var irLog = document.getElementById('ir-login');
    if (irReg) irReg.addEventListener('click', function (e) { e.preventDefault(); abrirRegistro(); });
    if (irLog) irLog.addEventListener('click', function (e) { e.preventDefault(); abrirLogin(); });
});