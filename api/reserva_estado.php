<?php
/* =========================================
   NAUTIGO — CAMBIAR ESTADO DE RESERVA  (POST)
   admin    → cualquier reserva, cualquier estado
   lanchero → solo reservas de su lancha
   cliente o invitado → solo cancelar la suya
   POST: codigo, estado, email (invitados), csrf
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

$codigo = campo('codigo');
$estado = campo('estado');
$email  = mb_strtolower(campo('email'));   // vía de permiso para invitados

if (!in_array($estado, ['pendiente', 'confirmada', 'cancelada', 'completada'], true)) {
    responder(['ok' => false, 'error' => 'Estado no válido.'], 422);
}

$s = db()->prepare('SELECT * FROM reservas WHERE codigo = :c');
$s->execute([':c' => $codigo]);
$r = $s->fetch();

if (!$r) {
    responder(['ok' => false, 'error' => 'Esa reserva no existe.'], 404);
}

/* ---------- ¿PODEMOS TOCAR ESTA RESERVA? ---------- */
$esGestor = false;   // admin o el lanchero dueño de la lancha
$esDuenio = false;   // cliente con sesión o invitado con el correo

if ($yo) {
    if ($yo['rol'] === 'admin') {
        $esGestor = true;
    } elseif ($yo['rol'] === 'lanchero' && $yo['estado'] === 'aprobado') {
        $l = db()->prepare('SELECT nombre FROM lanchas WHERE usuario_id = :uid');
        $l->execute([':uid' => $yo['id']]);
        $nombre = $l->fetchColumn();
        $esGestor = ($nombre !== false && $nombre === $r['lancha_nombre']);
    } else {
        $esDuenio = ((int) $r['cliente_id'] === (int) $yo['id'])
                 || (mb_strtolower((string) $r['cliente_email']) === mb_strtolower($yo['email']));
    }
} elseif ($email !== '') {
    $esDuenio = (mb_strtolower((string) $r['cliente_email']) === $email);
}

if (!$esGestor && !$esDuenio) {
    responder(['ok' => false, 'error' => 'No puedes modificar esta reserva.'], 403);
}
if (!$esGestor && $estado !== 'cancelada') {
    responder(['ok' => false, 'error' => 'Solo puedes cancelar tus reservas.'], 403);
}

db()->prepare('UPDATE reservas SET estado = :e WHERE id = :id')
    ->execute([':e' => $estado, ':id' => $r['id']]);

responder(['ok' => true, 'estado' => $estado]);
