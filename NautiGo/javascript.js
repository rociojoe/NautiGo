/* ===== PARALLAX LIGERO ===== */
(function () {
    var root = document.documentElement;
    var header = document.querySelector('.header');
    var ticking = false;

    function onScroll() {
        var y = window.scrollY || window.pageYOffset;

        // Actualiza la variable CSS que usan los transforms
        root.style.setProperty('--scroll-y', y + 'px');

        // Header encoge
        if (y > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    onScroll(); // estado inicial
})();

/* ===== INTERSECTION OBSERVER para las tarjetas de lugares ===== */
(function () {
    var cards = document.querySelectorAll('.lugar-card');
    if (!('IntersectionObserver' in window)) {
        // Fallback: si el navegador no lo soporta, mostrar todas
        cards.forEach(function (c) { c.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function (c) { observer.observe(c); });
})();

function mostrarInicio(e) {
    e.preventDefault();
    vistaInicio.classList.remove('oculto');
    vistaDestinos.classList.add('oculto');
    linkInicio.classList.add('active');
    linkDestino.classList.remove('active');
    window.scrollTo(0, 0);
    // Reinicia la animación
    vistaInicio.style.animation = 'none';
    vistaInicio.offsetHeight;
    vistaInicio.style.animation = '';
}

function mostrarDestinos(e) {
    e.preventDefault();
    vistaDestinos.classList.remove('oculto');
    vistaInicio.classList.add('oculto');
    linkDestino.classList.add('active');
    linkInicio.classList.remove('active');
    window.scrollTo(0, 0);
    vistaDestinos.style.animation = 'none';
    vistaDestinos.offsetHeight;
    vistaDestinos.style.animation = '';
}
/* Conectar tarjetas destacadas del inicio con vista detalle */
var mapaTarjetas = {
    'card-playa':         'playa-blanca',
    'card-siete-altares': 'siete-altares',
    'card-rio-dulce':     'rio-dulce',
    'card-punta-palma':   'punta-palma'
};

Object.keys(mapaTarjetas).forEach(function (cardId) {
    var card = document.getElementById(cardId);
    if (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            abrirDetalle(mapaTarjetas[cardId]);
        });
    }
});
/* =========================================
   RESERVAS — formulario, guardar, confirmación
   ========================================= */
var vistaFormulario    = document.getElementById('vista-formulario');
var vistaConfirmacion  = document.getElementById('vista-confirmacion');
var vistaMisReservas   = document.getElementById('vista-mis-reservas');

var reservaEnProceso = null; // guarda los datos actuales mientras se llena el form
var ultimaReservaCreada = null;
var RESERVAS_KEY = 'nautigo_reservas';

/* Ocultar todas las vistas */
function ocultarTodasLasVistas() {
    vistaInicio.classList.add('oculto');
    vistaDestinos.classList.add('oculto');
    vistaDetalle.classList.add('oculto');
    vistaFormulario.classList.add('oculto');
    vistaConfirmacion.classList.add('oculto');
    vistaMisReservas.classList.add('oculto');
}

/* ---------- LEER / GUARDAR RESERVAS ---------- */
function leerReservas() {
    try {
        var data = localStorage.getItem(RESERVAS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function guardarReservas(lista) {
    localStorage.setItem(RESERVAS_KEY, JSON.stringify(lista));
}

function agregarReserva(reserva) {
    var lista = leerReservas();
    lista.unshift(reserva); // al inicio
    guardarReservas(lista);
}

function actualizarEstadoReserva(codigo, nuevoEstado) {
    var lista = leerReservas();
    var idx = lista.findIndex(function (r) { return r.codigo === codigo; });
    if (idx >= 0) {
        lista[idx].estado = nuevoEstado;
        guardarReservas(lista);
    }
    return idx >= 0;
}

function eliminarReserva(codigo) {
    var lista = leerReservas();
    lista = lista.filter(function (r) { return r.codigo !== codigo; });
    guardarReservas(lista);
}

/* ---------- GENERAR CÓDIGO ÚNICO ---------- */
function generarCodigo() {
    var year = new Date().getFullYear();
    var lista = leerReservas();
    var num = lista.length + 1;
    var codigo;
    do {
        codigo = 'NGO-' + year + '-' + String(num).padStart(4, '0');
        num++;
    } while (lista.some(function (r) { return r.codigo === codigo; }));
    return codigo;
}

/* ---------- ABRIR FORMULARIO ---------- */
function abrirFormulario() {
    if (!detalleActualId) return;

    var tour = tourDeDestino(detalleActualId);
    if (!tour) return;

    /* Leer valores actuales del panel de detalle */
    var fecha = document.getElementById('detalle-fecha').value;
    var adultos = parseInt(document.getElementById('detalle-adultos').value, 10) || 1;
    var ninos = parseInt(document.getElementById('detalle-ninos').value, 10) || 0;
    var lanchaId = document.getElementById('detalle-lancha').value;
    var conHotel = document.getElementById('detalle-con-hotel').checked;
    var hotelId = conHotel ? document.getElementById('detalle-hotel').value : null;
    var noches = conHotel ? (parseInt(document.getElementById('detalle-noches').value, 10) || 1) : 0;

    /* Calcular de nuevo para tener el total exacto */
    var resultado = calcularPrecioReserva({
        tourId: tour.id,
        lanchaId: lanchaId,
        fecha: fecha,
        adultos: adultos,
        ninos: ninos,
        hotelId: hotelId,
        noches: noches
    });

    var destino = destinos.find(function (d) { return d.id === detalleActualId; });
    var lanchero = lancheroDeLancha(lanchaId);

    reservaEnProceso = {
        destinoId: detalleActualId,
        destinoNombre: destino.nombre,
        tourId: tour.id,
        tourNombre: tour.nombre,
        lanchaId: lanchaId,
        lanchaNombre: resultado.lancha.nombre,
        lancheroNombre: lanchero.nombre,
        fecha: fecha,
        adultos: adultos,
        ninos: ninos,
        hotelId: hotelId,
        hotelNombre: resultado.hotel ? resultado.hotel.nombre : null,
        noches: noches,
        desglose: resultado.desglose,
        temporada: resultado.temporada
    };

    /* Render resumen lateral */
    var html = '';
    html += '<div class="resumen-item"><span>Destino</span><strong>' + destino.nombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Tour</span><strong>' + tour.nombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Fecha</span><strong>' + fecha + '</strong></div>';
    html += '<div class="resumen-item"><span>Lancha</span><strong>' + resultado.lancha.nombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Lanchero</span><strong>' + lanchero.nombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Personas</span><strong>' + adultos + ' adulto(s), ' + ninos + ' niño(s)</strong></div>';
    if (hotelId) {
        html += '<div class="resumen-item"><span>Hotel</span><strong>' + resultado.hotel.nombre + ' (' + noches + ' noche' + (noches > 1 ? 's' : '') + ')</strong></div>';
    }
    html += '<div class="resumen-item total"><span>Total</span><span>' + Q(reservaEnProceso.desglose.total) + '</span></div>';

    document.getElementById('form-resumen-contenido').innerHTML = html;

    /* Limpiar form */
    document.getElementById('form-reserva').reset();
    document.getElementById('form-error').classList.add('oculto');

    /* Mostrar formulario */
    ocultarTodasLasVistas();
    vistaFormulario.classList.remove('oculto');
    window.scrollTo(0, 0);
}

/* Conectar botón del panel de detalle con el formulario */
document.getElementById('detalle-btn-reservar').addEventListener('click', function () {
    abrirFormulario();
});

/* ---------- ENVIAR FORMULARIO ---------- */
document.getElementById('form-reserva').addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre   = document.getElementById('form-nombre').value.trim();
    var email    = document.getElementById('form-email').value.trim();
    var telefono = document.getElementById('form-telefono').value.trim();
    var notas    = document.getElementById('form-notas').value.trim();

    var error = document.getElementById('form-error');

    /* Validación básica */
    if (!nombre || nombre.length < 3) {
        error.textContent = 'Por favor escribe tu nombre completo.';
        error.classList.remove('oculto');
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error.textContent = 'Por favor escribe un correo válido.';
        error.classList.remove('oculto');
        return;
    }
    if (!telefono || telefono.length < 7) {
        error.textContent = 'Por favor escribe un teléfono válido.';
        error.classList.remove('oculto');
        return;
    }

    /* Crear reserva final */
    var codigo = generarCodigo();
    var reserva = {
        codigo: codigo,
        creadaEn: new Date().toISOString(),
        estado: 'pendiente',
        cliente: { nombre: nombre, email: email, telefono: telefono },
        notas: notas,
        destinoId: reservaEnProceso.destinoId,
        destinoNombre: reservaEnProceso.destinoNombre,
        tourId: reservaEnProceso.tourId,
        tourNombre: reservaEnProceso.tourNombre,
        lanchaId: reservaEnProceso.lanchaId,
        lanchaNombre: reservaEnProceso.lanchaNombre,
        lancheroNombre: reservaEnProceso.lancheroNombre,
        fecha: reservaEnProceso.fecha,
        adultos: reservaEnProceso.adultos,
        ninos: reservaEnProceso.ninos,
        hotelId: reservaEnProceso.hotelId,
        hotelNombre: reservaEnProceso.hotelNombre,
        noches: reservaEnProceso.noches,
        desglose: reservaEnProceso.desglose,
        temporada: reservaEnProceso.temporada
    };

    agregarReserva(reserva);
    ultimaReservaCreada = reserva;

    /* Mostrar confirmación */
    mostrarConfirmacion(reserva);
});

/* ---------- MOSTRAR CONFIRMACIÓN ---------- */
function mostrarConfirmacion(reserva) {
    document.getElementById('confirmacion-codigo').textContent = reserva.codigo;

    var html = '';
    html += '<div class="resumen-item"><span>Destino</span><strong>' + reserva.destinoNombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Fecha</span><strong>' + reserva.fecha + '</strong></div>';
    html += '<div class="resumen-item"><span>Lancha</span><strong>' + reserva.lanchaNombre + ' — ' + reserva.lancheroNombre + '</strong></div>';
    html += '<div class="resumen-item"><span>Personas</span><strong>' + reserva.adultos + ' adulto(s), ' + reserva.ninos + ' niño(s)</strong></div>';
    if (reserva.hotelNombre) {
        html += '<div class="resumen-item"><span>Hotel</span><strong>' + reserva.hotelNombre + ' (' + reserva.noches + ' noche' + (reserva.noches > 1 ? 's' : '') + ')</strong></div>';
    }
    html += '<div class="resumen-item total"><span>Total</span><span>' + Q(reserva.desglose.total) + '</span></div>';

    document.getElementById('confirmacion-detalle').innerHTML = html;

    ocultarTodasLasVistas();
    vistaConfirmacion.classList.remove('oculto');
    window.scrollTo(0, 0);
}

/* ---------- MIS RESERVAS ---------- */
function abrirMisReservas() {
    var lista = leerReservas();
    var cont = document.getElementById('mis-reservas-lista');
    var vacio = document.getElementById('mis-reservas-vacio');

    cont.innerHTML = '';

    if (lista.length === 0) {
        cont.classList.add('oculto');
        vacio.classList.remove('oculto');
    } else {
        cont.classList.remove('oculto');
        vacio.classList.add('oculto');

        lista.forEach(function (r, i) {
            var card = document.createElement('div');
            card.className = 'reserva-card estado-' + r.estado;
            card.style.animationDelay = (i * 0.06) + 's';

            var estadoTexto = {
                pendiente: '⏳ Pendiente',
                confirmada: '✅ Confirmada',
                cancelada: '❌ Cancelada',
                completada: '🏁 Completada'
            }[r.estado] || r.estado;

            var acciones = '';
            if (r.estado === 'pendiente') {
                acciones = '<button class="cancelar" data-codigo="' + r.codigo + '">Cancelar reserva</button>';
            } else if (r.estado === 'cancelada') {
                acciones = '<button data-codigo="' + r.codigo + '" data-accion="eliminar">Eliminar del historial</button>';
            }

            card.innerHTML =
                '<div>' +
                    '<div class="reserva-codigo">' + r.codigo + '</div>' +
                    '<div class="reserva-nombre">' + r.destinoNombre + '</div>' +
                    '<div class="reserva-fecha-lugar">📅 ' + r.fecha + ' · 👥 ' + r.adultos + ' adulto(s), ' + r.ninos + ' niño(s)</div>' +
                '</div>' +
                '<div>' +
                    '<div class="reserva-total">' + Q(r.desglose.total) + '</div>' +
                    '<div class="reserva-estado">' + estadoTexto + '</div>' +
                '</div>' +
                (acciones ? '<div class="reserva-acciones">' + acciones + '</div>' : '');

            cont.appendChild(card);
        });

        /* Conectar botones de acción */
        cont.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var codigo = btn.getAttribute('data-codigo');
                var accion = btn.getAttribute('data-accion');

                if (accion === 'eliminar') {
                    if (confirm('¿Eliminar esta reserva del historial?')) {
                        eliminarReserva(codigo);
                        abrirMisReservas();
                    }
                } else {
                    if (confirm('¿Seguro que quieres cancelar la reserva ' + codigo + '?')) {
                        actualizarEstadoReserva(codigo, 'cancelada');
                        abrirMisReservas();
                    }
                }
            });
        });
    }

    ocultarTodasLasVistas();
    vistaMisReservas.classList.remove('oculto');
    window.scrollTo(0, 0);
}

/* ---------- BOTONES DE NAVEGACIÓN ---------- */
document.getElementById('form-btn-volver').addEventListener('click', function () {
    ocultarTodasLasVistas();
    vistaDetalle.classList.remove('oculto');
    window.scrollTo(0, 0);
});

document.getElementById('btn-ver-mis-reservas').addEventListener('click', abrirMisReservas);

document.getElementById('btn-volver-inicio').addEventListener('click', function () {
    ocultarTodasLasVistas();
    vistaInicio.classList.remove('oculto');
    linkInicio.classList.add('active');
    linkDestino.classList.remove('active');
    window.scrollTo(0, 0);
});

document.getElementById('mis-reservas-volver').addEventListener('click', function () {
    ocultarTodasLasVistas();
    vistaInicio.classList.remove('oculto');
    linkInicio.classList.add('active');
    linkDestino.classList.remove('active');
    window.scrollTo(0, 0);
});
function ocultarTodas() {
    vistaInicio.classList.add('oculto');
    vistaDestinos.classList.add('oculto');
    vistaDetalle.classList.add('oculto');
    vistaFormulario.classList.add('oculto');
    vistaConfirmacion.classList.add('oculto');
    vistaMisReservas.classList.add('oculto');
    document.getElementById('vista-login').classList.add('oculto');
    document.getElementById('vista-registro').classList.add('oculto');
    document.getElementById('vista-panel-lanchero').classList.add('oculto');
    document.getElementById('vista-panel-admin').classList.add('oculto');
}