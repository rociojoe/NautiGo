/* =========================================
   NAUTIGO — BLOG DE EXPERIENCIAS Y CONTACTO
   El contenido vive en MySQL (api/blog_*.php).
   ========================================= */

/* -----------------------------------------
   ICONOS (SVG en línea, nada de emojis)
   ----------------------------------------- */
var SVG_CORAZON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
var SVG_BURBUJA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
var SVG_CAMARA  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
var SVG_ENVIAR  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
var SVG_PIN     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

/* -----------------------------------------
   UTILIDADES
   ----------------------------------------- */
var TONOS_AVATAR = [
    ['#3A8FD4', '#0A2540'],
    ['#F2B880', '#B97B3C'],
    ['#1E5A8A', '#0A2540'],
    ['#9DD1F0', '#3A8FD4'],
    ['#E39A5B', '#8A5A28']
];

function colorDeAvatar(id) {
    return TONOS_AVATAR[Math.abs(id) % TONOS_AVATAR.length];
}

function avatarHTML(autor, clase) {
    if (autor.foto) {
        return '<span class="blog-avatar' + (clase ? ' ' + clase : '') + '" aria-hidden="true">' +
            '<img class="blog-avatar-img" src="' + esc(autor.foto) + '" alt=""></span>';
    }
    var tono = colorDeAvatar(autor.id);
    var inicial = String(autor.nombre || '?').charAt(0).toUpperCase();
    return '<span class="blog-avatar' + (clase ? ' ' + clase : '') + '" style="background:linear-gradient(135deg,' + tono[0] + ',' + tono[1] + ')" aria-hidden="true">' + esc(inicial) + '</span>';
}

function etiquetaRol(rol) {
    return { cliente: 'Viajero', lanchero: 'Lanchero', admin: 'Administrador' }[rol] || rol;
}

function haceCuanto(fecha) {
    var d = new Date(String(fecha).replace(' ', 'T'));
    var seg = Math.floor((Date.now() - d.getTime()) / 1000);
    if (isNaN(seg) || seg < 45) return 'hace un momento';
    var min = Math.floor(seg / 60);
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var dias = Math.floor(h / 24);
    if (dias < 7) return 'hace ' + dias + (dias === 1 ? ' día' : ' días');
    return d.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function nombreDestino(slug) {
    var d = destinos.find(function (x) { return x.id === slug; });
    return d ? d.nombre : slug;
}

var _avisoTemporizador = null;
function mostrarAvisoBlog(texto, esError) {
    var cont = document.getElementById('blog-aviso');
    if (!cont) return;
    cont.innerHTML = '<p class="' + (esError ? 'blog-aviso blog-aviso-error' : 'blog-aviso blog-aviso-ok') + '">' + esc(texto) + '</p>';
    clearTimeout(_avisoTemporizador);
    _avisoTemporizador = setTimeout(function () { cont.innerHTML = ''; }, 4500);
}

/* -----------------------------------------
   BLOG: ABRIR VISTA
   ----------------------------------------- */
function abrirBlog() {
    ocultarTodas();
    document.getElementById('vista-blog').classList.remove('oculto');
    activarLink(linkBlog);
    renderizarCompositor();
    cargarFeed();
    cargarPerfiles('');
    window.scrollTo(0, 0);
}

/* -----------------------------------------
   COMPOSITOR (publicar experiencia)
   ----------------------------------------- */
function renderizarCompositor() {
    var cont = document.getElementById('blog-compositor');
    if (!cont) return;

    if (!estaLogueado()) {
        cont.innerHTML =
            '<div class="blog-compositor blog-compositor-invita">' +
                '<p class="blog-invita-texto">¿Recorriste el Caribe con NautiGo? Inicia sesión para contar tu experiencia, dar me gusta y comentar.</p>' +
                '<div class="blog-invita-acciones">' +
                    '<button type="button" class="btn-cta blog-btn" id="blog-ir-login">Iniciar sesión</button>' +
                    '<button type="button" class="btn-secundario blog-btn" id="blog-ir-registro">Crear cuenta</button>' +
                '</div>' +
            '</div>';
        document.getElementById('blog-ir-login').addEventListener('click', abrirLogin);
        document.getElementById('blog-ir-registro').addEventListener('click', abrirRegistro);
        return;
    }

    var opciones = destinos.map(function (d) {
        return '<option value="' + esc(d.id) + '">' + esc(d.nombre) + '</option>';
    }).join('');

    cont.innerHTML =
        '<div class="blog-compositor">' +
            '<div class="blog-compositor-cab">' +
                avatarHTML(leerSesion()) +
                '<strong>' + esc(leerSesion().nombre) + '</strong>' +
            '</div>' +
            '<textarea id="blog-texto" rows="3" maxlength="4000" placeholder="Cuénta tu experiencia en el Caribe…"></textarea>' +
            '<div class="blog-foto-vista oculto" id="blog-foto-vista">' +
                '<img id="blog-foto-img" alt="Foto de la experiencia">' +
                '<button type="button" id="blog-foto-quitar" aria-label="Quitar foto">×</button>' +
            '</div>' +
            '<div class="blog-compositor-pie">' +
                '<label class="blog-btn-foto" title="Agregar una foto">' + SVG_CAMARA +
                    '<input type="file" id="blog-foto" accept="image/png,image/jpeg,image/webp" hidden>' +
                '</label>' +
                '<select id="blog-destino" aria-label="Destino de la experiencia">' +
                    '<option value="">Sin destino específico</option>' + opciones +
                '</select>' +
                '<button type="button" class="btn-cta blog-btn" id="blog-publicar">' + SVG_ENVIAR + '<span>Publicar</span></button>' +
            '</div>' +
        '</div>';

    document.getElementById('blog-foto').addEventListener('change', function () {
        if (this.files && this.files[0]) leerFotoCompositor(this.files[0]);
        this.value = '';
    });
    document.getElementById('blog-foto-quitar').addEventListener('click', function () {
        estadoBlog.fotoPendiente = null;
        document.getElementById('blog-foto-vista').classList.add('oculto');
    });
    document.getElementById('blog-publicar').addEventListener('click', publicarExperiencia);
}

/* Reduce la foto en el navegador antes de subirla. */
function leerFotoCompositor(archivo) {
    var fr = new FileReader();
    fr.onload = function () {
        var img = new Image();
        img.onload = function () {
            var max = 1400;
            var escala = Math.min(1, max / Math.max(img.width, img.height));
            var lienzo = document.createElement('canvas');
            lienzo.width = Math.max(1, Math.round(img.width * escala));
            lienzo.height = Math.max(1, Math.round(img.height * escala));
            lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
            estadoBlog.fotoPendiente = lienzo.toDataURL('image/jpeg', 0.82);
            document.getElementById('blog-foto-img').src = estadoBlog.fotoPendiente;
            document.getElementById('blog-foto-vista').classList.remove('oculto');
        };
        img.onerror = function () {
            mostrarAvisoBlog('No pudimos leer esa foto. Prueba con una en JPG o PNG.', true);
        };
        img.src = fr.result;
    };
    fr.readAsDataURL(archivo);
}

function publicarExperiencia() {
    var texto = document.getElementById('blog-texto').value.trim();
    if (texto.length < 3) {
        mostrarAvisoBlog('Escribe tu experiencia antes de publicar.', true);
        return;
    }
    var btn = document.getElementById('blog-publicar');
    btn.disabled = true;

    api('api/blog_publicaciones.php', {
        texto: texto,
        destino_slug: document.getElementById('blog-destino').value,
        imagen: estadoBlog.fotoPendiente || ''
    }).then(function (j) {
        btn.disabled = false;
        if (!j.ok) {
            mostrarAvisoBlog(j.error || 'No se pudo publicar.', true);
            return;
        }
        estadoBlog.fotoPendiente = null;
        mostrarAvisoBlog('Tu experiencia ya está en el blog.');
        cargarFeed();
    });
}

/* -----------------------------------------
   FEED
   ----------------------------------------- */
var _feedPeticion = 0;

function cargarFeed(usuarioId, contenedorId) {
    var cont = document.getElementById(contenedorId || 'blog-feed');
    if (!cont) return;
    var miPeticion = ++_feedPeticion;
    cont.innerHTML = '<p class="panel-vacio">Cargando experiencias…</p>';

    api('api/blog_publicaciones.php' + (usuarioId ? '?usuario=' + encodeURIComponent(usuarioId) : ''))
        .then(function (j) {
            if (miPeticion !== _feedPeticion) return;   /* llegó una carga más nueva */
            if (!j.ok) {
                cont.innerHTML = '<p class="panel-vacio">No se pudo cargar el blog. Verifica que XAMPP tenga Apache y MySQL activos.</p>';
                return;
            }
            if (!j.publicaciones.length) {
                cont.innerHTML = '<p class="panel-vacio">' +
                    (usuarioId ? 'Este perfil todavía no tiene publicaciones.' : 'El blog está en silencio todavía. Sé quien cuente la primera experiencia.') +
                    '</p>';
                return;
            }
            cont.innerHTML = '';
            j.publicaciones.forEach(function (p, i) {
                cont.appendChild(crearTarjetaPublicacion(p, i));
            });
        });
}

function crearTarjetaPublicacion(p, indice) {
    var art = document.createElement('article');
    art.className = 'blog-post';
    art.style.animationDelay = Math.min(indice, 9) * 0.07 + 's';

    var chipDestino = p.destinoSlug
        ? '<span class="blog-chip-destino">' + SVG_PIN + esc(nombreDestino(p.destinoSlug)) + '</span>'
        : '';

    var textoHTML = esc(p.texto).replace(/\n/g, '<br>');

    art.innerHTML =
        '<header class="blog-post-cab">' +
            '<button type="button" class="blog-post-autor-zona">' +
                avatarHTML(p.autor) +
                '<span class="blog-post-meta">' +
                    '<span class="blog-post-autor">' + esc(p.autor.nombre) + '</span>' +
                    '<span class="blog-post-sub">' + esc(etiquetaRol(p.autor.rol)) + ' · ' + esc(haceCuanto(p.creado_en)) + '</span>' +
                '</span>' +
            '</button>' +
            chipDestino +
        '</header>' +
        '<p class="blog-post-texto">' + textoHTML + '</p>' +
        (p.imagen ? '<div class="blog-post-foto"><img src="' + esc(p.imagen) + '" alt="Foto de la experiencia de ' + esc(p.autor.nombre) + '" loading="lazy"></div>' : '') +
        '<footer class="blog-post-acciones">' +
            '<button type="button" class="blog-btn-like' + (p.meGusta ? ' activo' : '') + '">' + SVG_CORAZON +
                '<span class="blog-like-num">' + p.likes + '</span>' +
            '</button>' +
            '<button type="button" class="blog-btn-comentar">' + SVG_BURBUJA +
                '<span class="blog-com-num">' + contarComentarios(p.comentarios) + '</span>' +
            '</button>' +
        '</footer>' +
        '<div class="blog-comentarios oculto">' +
            '<div class="blog-comentarios-lista"></div>' +
        '</div>';

    var zonaAutor = art.querySelector('.blog-post-autor-zona');
    zonaAutor.addEventListener('click', function () { abrirPerfil(p.autor.id); });

    var btnLike = art.querySelector('.blog-btn-like');
    btnLike.addEventListener('click', function () { darMeGusta(p.id, btnLike); });

    var cajaComentarios = art.querySelector('.blog-comentarios');
    var listaComentarios = art.querySelector('.blog-comentarios-lista');

    art.querySelector('.blog-btn-comentar').addEventListener('click', function () {
        if (cajaComentarios.classList.contains('oculto') && !cajaComentarios.dataset.listo) {
            llenarComentarios(listaComentarios, cajaComentarios, p);
            cajaComentarios.dataset.listo = '1';
        }
        cajaComentarios.classList.toggle('oculto');
    });

    return art;
}

function contarComentarios(comentarios) {
    var total = comentarios.length;
    comentarios.forEach(function (c) { total += (c.respuestas || []).length; });
    return total;
}

function llenarComentarios(lista, caja, p) {
    p.comentarios.forEach(function (c) {
        lista.appendChild(crearComentario(c, caja, p));
    });
    if (!p.comentarios.length) {
        lista.innerHTML = '<p class="blog-sin-comentarios">Aún no hay comentarios. Anímate a ser el primero.</p>';
    }

    if (estaLogueado()) {
        var form = document.createElement('div');
        form.className = 'blog-comentario-form';
        form.innerHTML =
            avatarHTML(leerSesion(), 'blog-avatar-mini') +
            '<input type="text" maxlength="600" placeholder="Escribe un comentario…">' +
            '<button type="button" class="blog-btn-enviar" aria-label="Enviar comentario">' + SVG_ENVIAR + '</button>';
        caja.appendChild(form);

        var input = form.querySelector('input');
        function enviar() {
            var texto = input.value.trim();
            if (!texto) return;
            input.disabled = true;
            api('api/blog_comentarios.php', { publicacion_id: p.id, texto: texto }).then(function (j) {
                input.disabled = false;
                if (!j.ok) {
                    mostrarAvisoBlog(j.error || 'No se pudo comentar.', true);
                    return;
                }
                var vacio = lista.querySelector('.blog-sin-comentarios');
                if (vacio) vacio.remove();
                lista.appendChild(crearComentario(j.comentario, caja, p));
                input.value = '';
                sumarComentario(caja);
            });
        }
        form.querySelector('.blog-btn-enviar').addEventListener('click', enviar);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviar(); });
    } else {
        var aviso = document.createElement('p');
        aviso.className = 'blog-comenta-aviso';
        aviso.innerHTML = '<a href="#" id="blog-comentar-login">Inicia sesión</a> para comentar.';
        caja.appendChild(aviso);
        aviso.querySelector('a').addEventListener('click', function (e) {
            e.preventDefault();
            abrirLogin();
        });
    }
}

/* Comentario principal con sus respuestas indentadas (estilo Twitter). */
function crearComentario(c, caja, p) {
    var esRespuesta = c.padreId !== null;

    var div = document.createElement('div');
    div.className = 'blog-comentario' + (esRespuesta ? ' blog-respuesta' : '');

    var acciones =
        '<button type="button" class="blog-com-like' + (c.meGusta ? ' activo' : '') + '" title="Me gusta">' +
            SVG_CORAZON + '<span class="blog-com-like-num">' + (c.likes || 0) + '</span>' +
        '</button>';

    div.innerHTML =
        '<div class="blog-comentario-principal">' +
            avatarHTML(c.autor, 'blog-avatar-mini') +
            '<div class="blog-comentario-cuerpo">' +
                '<p><button type="button" class="blog-comentario-autor">' + esc(c.autor.nombre) + '</button>' +
                esc(c.texto) + '</p>' +
                '<div class="blog-comentario-pie">' +
                    '<small>' + esc(etiquetaRol(c.autor.rol)) + ' · ' + esc(haceCuanto(c.creado_en)) + '</small>' +
                    acciones +
                    (esRespuesta ? '' : '<button type="button" class="blog-com-responder">Responder</button>') +
                '</div>' +
            '</div>' +
        '</div>' +
        (esRespuesta ? '' : '<div class="blog-com-respuestas"></div>');

    div.querySelector('.blog-comentario-autor').addEventListener('click', function () {
        abrirPerfil(c.autor.id);
    });

    var btnLike = div.querySelector('.blog-com-like');
    btnLike.addEventListener('click', function () { darMeGustaComentario(c.id, btnLike); });

    var btnResponder = div.querySelector('.blog-com-responder');
    if (btnResponder) {
        btnResponder.addEventListener('click', function () { alternarRespuesta(div, caja, p, c); });
    }

    if (!esRespuesta) {
        var zona = div.querySelector('.blog-com-respuestas');
        (c.respuestas || []).forEach(function (r) {
            zona.appendChild(crearComentario(r, caja, p));
        });
    }

    return div;
}

/* Abre/cierra el formulario para responder a un comentario principal. */
function alternarRespuesta(div, caja, p, c) {
    if (!estaLogueado()) {
        mostrarAvisoBlog('Inicia sesión para responder.', true);
        return;
    }
    var zona = div.querySelector('.blog-com-respuestas');
    var existente = zona.querySelector('.blog-comentario-form');
    if (existente) {
        existente.remove();
        return;
    }

    var form = document.createElement('div');
    form.className = 'blog-comentario-form blog-respuesta-form';
    form.innerHTML =
        avatarHTML(leerSesion(), 'blog-avatar-mini') +
        '<input type="text" maxlength="600" placeholder="Responder a ' + esc(c.autor.nombre) + '…">' +
        '<button type="button" class="blog-btn-enviar" aria-label="Enviar respuesta">' + SVG_ENVIAR + '</button>';
    zona.appendChild(form);

    var input = form.querySelector('input');
    input.focus();
    function enviar() {
        var texto = input.value.trim();
        if (!texto) return;
        input.disabled = true;
        api('api/blog_comentarios.php', { publicacion_id: p.id, padre_id: c.id, texto: texto }).then(function (j) {
            input.disabled = false;
            if (!j.ok) {
                mostrarAvisoBlog(j.error || 'No se pudo responder.', true);
                return;
            }
            form.remove();
            zona.appendChild(crearComentario(j.comentario, caja, p));
            sumarComentario(caja);
        });
    }
    form.querySelector('.blog-btn-enviar').addEventListener('click', enviar);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviar(); });
}

function darMeGustaComentario(comentarioId, btn) {
    if (!estaLogueado()) {
        mostrarAvisoBlog('Inicia sesión para dar me gusta.', true);
        return;
    }
    btn.disabled = true;
    api('api/blog_comentario_like.php', { comentario_id: comentarioId }).then(function (j) {
        btn.disabled = false;
        if (!j.ok) {
            mostrarAvisoBlog(j.error || 'No se pudo registrar el me gusta.', true);
            return;
        }
        btn.classList.toggle('activo', j.meGusta);
        btn.querySelector('.blog-com-like-num').textContent = j.likes;
    });
}

function sumarComentario(caja) {
    var tarjeta = caja.closest('.blog-post');
    var num = tarjeta.querySelector('.blog-com-num');
    if (num) num.textContent = parseInt(num.textContent, 10) + 1;
}

function darMeGusta(publicacionId, btn) {
    if (!estaLogueado()) {
        mostrarAvisoBlog('Inicia sesión para dar me gusta.', true);
        return;
    }
    btn.disabled = true;
    api('api/blog_like.php', { publicacion_id: publicacionId }).then(function (j) {
        btn.disabled = false;
        if (!j.ok) {
            mostrarAvisoBlog(j.error || 'No se pudo registrar el me gusta.', true);
            return;
        }
        btn.classList.toggle('activo', j.meGusta);
        btn.querySelector('.blog-like-num').textContent = j.likes;
    });
}

/* -----------------------------------------
   PERFILES
   ----------------------------------------- */
var _perfilesPeticion = 0;

function cargarPerfiles(buscar) {
    var cont = document.getElementById('blog-perfiles-lista');
    if (!cont) return;
    var miPeticion = ++_perfilesPeticion;
    cont.innerHTML = '<p class="panel-vacio blog-perfiles-cargando">Buscando…</p>';

    api('api/blog_perfiles.php' + (buscar ? '?buscar=' + encodeURIComponent(buscar) : ''))
        .then(function (j) {
            if (miPeticion !== _perfilesPeticion) return;   /* llegó una búsqueda más nueva */
            if (!j.ok) {
                cont.innerHTML = '<p class="panel-vacio">No se pudieron cargar los perfiles.</p>';
                return;
            }
            if (!j.perfiles.length) {
                cont.innerHTML = '<p class="panel-vacio">Ningún perfil coincide con esa búsqueda.</p>';
                return;
            }
            cont.innerHTML = '';
            j.perfiles.forEach(function (pf, i) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'blog-perfil-item';
                b.style.animationDelay = Math.min(i, 10) * 0.05 + 's';
                b.innerHTML =
                    avatarHTML(pf) +
                    '<span class="blog-perfil-datos">' +
                        '<span class="blog-perfil-nombre">' + esc(pf.nombre) + '</span>' +
                        '<span class="blog-perfil-meta">' + esc(etiquetaRol(pf.rol)) + ' · ' +
                            pf.publicaciones + (pf.publicaciones === 1 ? ' publicación' : ' publicaciones') +
                        '</span>' +
                    '</span>';
                b.addEventListener('click', function () { abrirPerfil(pf.id); });
                cont.appendChild(b);
            });
        });
}

function abrirPerfil(id) {
    ocultarTodas();
    document.getElementById('vista-perfil').classList.remove('oculto');
    activarLink(linkBlog);
    window.scrollTo(0, 0);

    var esMio = estaLogueado() && SESION && Number(SESION.id) === Number(id);
    var titulo = document.getElementById('perfil-titulo-pub');
    if (titulo) titulo.textContent = esMio ? 'Mis publicaciones' : 'Sus publicaciones';

    var zonaMia = document.getElementById('perfil-mio-zona');
    if (zonaMia) {
        zonaMia.classList.toggle('oculto', !esMio);
        if (esMio) {
            pintarFrecuenciaPerfil();
            var contR = document.getElementById('perfil-reservas-lista');
            var vacioR = document.getElementById('perfil-reservas-vacio');
            if (contR && vacioR) cargarReservasUsuario(contR, vacioR);
        }
    }

    var cab = document.getElementById('perfil-cabecera');
    cab.innerHTML = '<p class="panel-vacio">Cargando perfil…</p>';

    api('api/blog_perfiles.php?id=' + encodeURIComponent(id)).then(function (j) {
        if (!j.ok || !j.perfil) {
            cab.innerHTML = '<p class="panel-vacio">No encontramos este perfil.</p>';
            return;
        }
        var pf = j.perfil;
        var tono = colorDeAvatar(pf.id);
        var avatar = pf.foto
            ? '<span class="perfil-avatar" aria-hidden="true"><img class="blog-avatar-img" src="' + esc(pf.foto) + '" alt=""></span>'
            : '<span class="perfil-avatar" style="background:linear-gradient(135deg,' + tono[0] + ',' + tono[1] + ')" aria-hidden="true">' +
                esc(String(pf.nombre).charAt(0).toUpperCase()) +
            '</span>';

        cab.innerHTML =
            '<div class="perfil-cab">' +
                '<div class="perfil-banner' + (pf.banner ? '' : ' sin-banner') + '">' +
                    (pf.banner ? '<img src="' + esc(pf.banner) + '" alt="Banner de ' + esc(pf.nombre) + '">' : '') +
                    (esMio ? '<button type="button" class="perfil-cambiar" data-tipo="banner">' + SVG_CAMARA + '<span>Banner</span></button>' : '') +
                '</div>' +
                '<div class="perfil-cuerpo">' +
                    '<span class="perfil-avatar-zona">' + avatar +
                        (esMio ? '<button type="button" class="perfil-cambiar" data-tipo="foto">' + SVG_CAMARA + '<span>Foto</span></button>' : '') +
                    '</span>' +
                    '<div class="perfil-datos">' +
                        '<h2>' + esc(pf.nombre) + '</h2>' +
                        '<span class="rol-chip rol-' + esc(pf.rol) + '">' + esc(etiquetaRol(pf.rol)) + '</span>' +
                        '<p>' + pf.publicaciones + (pf.publicaciones === 1 ? ' publicación' : ' publicaciones') + ' en el blog</p>' +
                    '</div>' +
                '</div>' +
            '</div>';

        cab.querySelectorAll('.perfil-cambiar').forEach(function (btn) {
            btn.addEventListener('click', function () { subirMediaPerfil(btn.dataset.tipo, pf.id); });
        });
    });

    cargarFeed(id, 'perfil-publicaciones');
}

/* Sube la foto de perfil o el banner: reduce en el navegador
   y guarda como data URL (igual que las fotos del blog). */
function subirMediaPerfil(tipo, usuarioId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.addEventListener('change', function () {
        if (!input.files || !input.files[0]) return;
        var fr = new FileReader();
        fr.onload = function () {
            var img = new Image();
            img.onload = function () {
                var maxW = tipo === 'banner' ? 1400 : 400;
                var escala = Math.min(1, maxW / img.width);
                var lienzo = document.createElement('canvas');
                lienzo.width = Math.max(1, Math.round(img.width * escala));
                lienzo.height = Math.max(1, Math.round(img.height * escala));
                lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
                var dataURL = lienzo.toDataURL('image/jpeg', 0.82);
                api('api/perfil_media.php', { tipo: tipo, imagen: dataURL }).then(function (j) {
                    if (!j.ok) {
                        mostrarAvisoBlog(j.error || 'No se pudo guardar la imagen.', true);
                        return;
                    }
                    if (tipo === 'foto' && SESION) {
                        SESION.foto = dataURL;
                        actualizarUIUsuario();
                    }
                    abrirPerfil(usuarioId);
                    mostrarAvisoBlog(tipo === 'foto' ? 'Foto de perfil actualizada.' : 'Banner actualizado.');
                });
            };
            img.onerror = function () {
                mostrarAvisoBlog('No pudimos leer esa imagen. Prueba con una en JPG o PNG.', true);
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(input.files[0]);
    });
    input.click();
}

/* -----------------------------------------
   PERFIL PROPIO: descuento frecuente + reservas
   ----------------------------------------- */
function pintarFrecuenciaPerfil() {
    var cont = document.getElementById('perfil-frecuencia');
    if (!cont) return;
    if (!estaLogueado() || SESION.rol !== 'cliente') {
        cont.innerHTML = '';
        return;
    }
    cont.innerHTML = '<p class="panel-vacio">Cargando…</p>';
    api('api/frecuente.php').then(function (j) {
        if (!j.ok) {
            cont.innerHTML = '';
            return;
        }
        if (j.descuentoDisponible) {
            cont.innerHTML =
                '<div class="frecuencia-panel disponible">' +
                    '<strong>Ya tienes 20% de descuento para tu próximo viaje</strong>' +
                    '<p>Completaste ' + j.viajesCompletados + ' viaje' + (j.viajesCompletados === 1 ? '' : 's') + ' con NautiGo. El descuento se aplica solo al reservar.</p>' +
                '</div>';
            return;
        }
        var avance = (j.viajesCompletados % 4) * 25;
        cont.innerHTML =
            '<div class="frecuencia-panel">' +
                '<strong>Descuento frecuente</strong>' +
                '<p>' + j.viajesCompletados + ' de 4 viajes completados. ' +
                    'Te falta' + (j.faltan === 1 ? '' : 'n') + ' ' + j.faltan + ' para tu próximo 20% de descuento.</p>' +
                '<div class="frecuencia-barra"><span style="width:' + avance + '%"></span></div>' +
            '</div>';
    });
}

/* -----------------------------------------
   CONTACTO
   ----------------------------------------- */
function abrirContacto() {
    ocultarTodas();
    document.getElementById('vista-contacto').classList.remove('oculto');
    activarLink(linkContacto);
    window.scrollTo(0, 0);
}

/* -----------------------------------------
   ARRANQUE
   ----------------------------------------- */
var estadoBlog = { fotoPendiente: null };

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('perfil-volver').addEventListener('click', abrirBlog);

    var irDestinos = document.getElementById('perfil-ir-destinos');
    if (irDestinos) {
        irDestinos.addEventListener('click', function (e) {
            e.preventDefault();
            ocultarTodas();
            vistaDestinos.classList.remove('oculto');
            activarLink(linkDestino);
            window.scrollTo(0, 0);
        });
    }

    var inputBuscar = document.getElementById('blog-buscar-perfil');
    var temporizador = null;
    inputBuscar.addEventListener('input', function () {
        clearTimeout(temporizador);
        var valor = this.value.trim();
        temporizador = setTimeout(function () { cargarPerfiles(valor); }, 250);
    });

    document.getElementById('form-contacto').addEventListener('submit', function (e) {
        e.preventDefault();
        var nombre  = document.getElementById('contacto-nombre').value.trim();
        var email   = document.getElementById('contacto-email').value.trim();
        var asunto  = document.getElementById('contacto-asunto').value.trim();
        var mensaje = document.getElementById('contacto-mensaje').value.trim();
        var error   = document.getElementById('contacto-error');
        var exito   = document.getElementById('contacto-exito');
        error.classList.add('oculto');
        exito.classList.add('oculto');

        if (nombre.length < 3)  { error.textContent = 'Por favor escribe tu nombre completo.'; error.classList.remove('oculto'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = 'Por favor escribe un correo válido.'; error.classList.remove('oculto'); return; }
        if (mensaje.length < 10) { error.textContent = 'Cuéntanos un poco más en tu mensaje.'; error.classList.remove('oculto'); return; }

        var boton = this.querySelector('button[type="submit"]');
        boton.disabled = true;

        api('api/contacto.php', { nombre: nombre, email: email, asunto: asunto, mensaje: mensaje })
            .then(function (j) {
                boton.disabled = false;
                if (!j.ok) {
                    error.textContent = j.error || 'No se pudo enviar el mensaje.';
                    error.classList.remove('oculto');
                    return;
                }
                document.getElementById('form-contacto').reset();
                exito.textContent = j.mensaje;
                exito.classList.remove('oculto');
            });
    });
});

/* Cuando la sesión cambia (entrar o salir), el blog se repinta. */
document.addEventListener('sesion-cambiada', function () {
    if (document.getElementById('vista-blog').classList.contains('oculto')) return;
    renderizarCompositor();
    cargarFeed();
});
