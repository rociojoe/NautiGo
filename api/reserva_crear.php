<?php
/* =========================================
   NAUTIGO — CREAR RESERVA  (POST, público)
   POST: destinoSlug, tourId, fecha, adultos, ninos,
         lanchaNombre, lancheroNombre, hotelNombre, noches,
         clienteNombre, clienteEmail, clienteTelefono, notas,
         total, desglose (JSON), csrf
   El código NGO-... lo genera el servidor y los puntos
   se suman aquí cuando quien reserva tiene sesión de cliente.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
$yo = usuario_actual();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}
if ($yo) {
    exigir_csrf();
}

$destinoSlug     = campo('destinoSlug');
$tourId          = mb_substr(campo('tourId'), 0, 60);
$fecha           = campo('fecha');
$fechaRegreso    = campo('fechaRegreso');
$adultos         = (int) campo('adultos');
$ninos           = (int) campo('ninos');
$bebes           = (int) campo('bebes');
$clienteNombre   = mb_substr(campo('clienteNombre'), 0, 120);
$clienteEmail    = mb_strtolower(mb_substr(campo('clienteEmail'), 0, 190));
$clienteTelefono = mb_substr(campo('clienteTelefono'), 0, 30);
$lanchaNombre    = mb_substr(campo('lanchaNombre'), 0, 120);
$lancheroNombre  = mb_substr(campo('lancheroNombre'), 0, 120);
$lancheroTelefono= mb_substr(campo('lancheroTelefono'), 0, 30);
$hotelNombre     = mb_substr(campo('hotelNombre'), 0, 120);
$noches          = (int) campo('noches');
$notas           = mb_substr(campo('notas'), 0, 1000);
$total           = round((float) campo('total'), 2);
$desglose        = mb_substr(campo('desglose'), 0, 2000);

if ($destinoSlug === '' || mb_strlen($destinoSlug) > 60) {
    responder(['ok' => false, 'error' => 'Falta el destino de la reserva.'], 422);
}
$ts = strtotime($fecha);
if (!$ts || $ts < strtotime('today')) {
    responder(['ok' => false, 'error' => 'La fecha del tour no es válida.'], 422);
}
$tsRegreso = null;
if ($fechaRegreso !== '') {
    $tsRegreso = strtotime($fechaRegreso);
    if (!$tsRegreso || $tsRegreso < $ts) {
        responder(['ok' => false, 'error' => 'La fecha de regreso no puede ser antes de la de ida.'], 422);
    }
}
if ($adultos < 1 || $adultos > 30 || $ninos < 0 || $ninos > 30 || $bebes < 0 || $bebes > 30) {
    responder(['ok' => false, 'error' => 'Revisa la cantidad de personas.'], 422);
}
if ($clienteNombre === '' || !email_valido($clienteEmail)) {
    responder(['ok' => false, 'error' => 'Faltan tu nombre y un correo válido.'], 422);
}
if ($total < 0 || $total > 999999) {
    responder(['ok' => false, 'error' => 'El total de la reserva no es válido.'], 422);
}

/* ---------- DESCUENTO FRECUENTE ----------
   Cada 4 viajes completados, el siguiente sale con 20%.
   El servidor decide (el total que manda el navegador
   siempre llega sin el descuento aplicado). */
$descuentoAplicado = false;
$viajesCompletados = 0;
if ($yo && $yo['rol'] === 'cliente') {
    $c = db()->prepare('SELECT COUNT(*) FROM reservas
                        WHERE estado = "completada"
                          AND (cliente_id = :uid OR LOWER(cliente_email) = LOWER(:email))');
    $c->execute([':uid' => $yo['id'], ':email' => $yo['email']]);
    $viajesCompletados = (int) $c->fetchColumn();
    if ($viajesCompletados > 0 && ($viajesCompletados % 4) === 0) {
        $total = round($total * 0.8, 2);
        $descuentoAplicado = true;
    }
}

/* ---------- INSERCIÓN (con reintentos si el código choca) ---------- */
$pdo = db();

$sql = 'INSERT INTO reservas
        (codigo, cliente_id, destino_slug, tour_id, fecha, fecha_regreso, adultos, ninos, bebes,
         total, cliente_nombre, cliente_email, cliente_telefono,
         notas, lancha_nombre, lanchero_nombre, lanchero_telefono, hotel_nombre, noches, desglose)
        VALUES
        (:codigo, :cliente_id, :destino_slug, :tour_id, :fecha, :fecha_regreso, :adultos, :ninos, :bebes,
         :total, :cliente_nombre, :cliente_email, :cliente_telefono,
         :notas, :lancha_nombre, :lanchero_nombre, :lanchero_telefono, :hotel_nombre, :noches, :desglose)';

$anio = date('Y');
$base = (int) $pdo->query("SELECT COUNT(*) FROM reservas WHERE codigo LIKE 'NGO-$anio-%'")
                  ->fetchColumn();

$codigo = null;
for ($i = 0; $i < 10; $i++) {
    $intento = sprintf('NGO-%s-%04d', $anio, $base + 1 + $i);
    try {
        $pdo->prepare($sql)->execute([
            ':codigo'           => $intento,
            ':cliente_id'       => ($yo && $yo['rol'] === 'cliente') ? $yo['id'] : null,
            ':destino_slug'     => $destinoSlug,
            ':tour_id'          => $tourId !== '' ? $tourId : null,
            ':fecha'            => date('Y-m-d', $ts),
            ':fecha_regreso'    => $tsRegreso ? date('Y-m-d', $tsRegreso) : null,
            ':adultos'          => $adultos,
            ':ninos'            => $ninos,
            ':bebes'            => $bebes,
            ':total'            => $total,
            ':cliente_nombre'   => $clienteNombre,
            ':cliente_email'    => $clienteEmail,
            ':cliente_telefono' => $clienteTelefono !== '' ? $clienteTelefono : null,
            ':notas'            => $notas !== '' ? $notas : null,
            ':lancha_nombre'    => $lanchaNombre !== '' ? $lanchaNombre : null,
            ':lanchero_nombre'  => $lancheroNombre !== '' ? $lancheroNombre : null,
            ':lanchero_telefono'=> $lancheroTelefono !== '' ? $lancheroTelefono : null,
            ':hotel_nombre'     => $hotelNombre !== '' ? $hotelNombre : null,
            ':noches'           => max(0, min(30, $noches)),
            ':desglose'         => $desglose !== '' ? $desglose : null,
        ]);
        $codigo = $intento;
        break;
    } catch (PDOException $e) {
        if ($e->getCode() !== '23000') {
            throw $e;   /* código duplicado: se prueba el siguiente número */
        }
    }
}
if ($codigo === null) {
    responder(['ok' => false, 'error' => 'No se pudo generar el código de reserva, intenta de nuevo.'], 500);
}

/* ---------- PUNTOS ---------- */
$puntosGanados = 0;
$puntos = null;
if ($yo && $yo['rol'] === 'cliente') {
    $puntosGanados = (int) (floor($total / 100) * 10);
    if ($puntosGanados > 0) {
        $pdo->prepare('UPDATE usuarios SET puntos = puntos + :p WHERE id = :id')
            ->execute([':p' => $puntosGanados, ':id' => $yo['id']]);
    }
    $s = $pdo->prepare('SELECT puntos FROM usuarios WHERE id = :id');
    $s->execute([':id' => $yo['id']]);
    $puntos = (int) $s->fetchColumn();
}

responder([
    'ok'                => true,
    'codigo'            => $codigo,
    'totalFinal'        => $total,
    'descuentoAplicado' => $descuentoAplicado,
    'viajesCompletados' => $viajesCompletados,
    'puntosGanados'     => $puntosGanados,
    'puntos'            => $puntos,
]);
