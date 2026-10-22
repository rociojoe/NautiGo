<?php
/* =========================================
   NAUTIGO — ELIMINAR RESERVA  (POST)
   Solo se borran reservas ya canceladas.
   admin    → cualquiera
   cliente o invitado → la suya (sesión o correo)
   POST: codigo, email (invitados), csrf
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
$email  = mb_strtolower(campo('email'));

$s = db()->prepare('SELECT * FROM reservas WHERE codigo = :c');
$s->execute([':c' => $codigo]);
$r = $s->fetch();

if (!$r) {
    responder(['ok' => false, 'error' => 'Esa reserva no existe.'], 404);
}
if ($r['estado'] !== 'cancelada') {
    responder(['ok' => false, 'error' => 'Solo se pueden eliminar reservas canceladas.'], 409);
}

$esGestor = false;
$esDuenio = false;

if ($yo) {
    if ($yo['rol'] === 'admin') {
        $esGestor = true;
    } elseif ($yo['rol'] === 'lanchero') {
        /* el lanchero no borra reservas ajenas aunque las vea en su panel */
    } else {
        $esDuenio = ((int) $r['cliente_id'] === (int) $yo['id'])
                 || (mb_strtolower((string) $r['cliente_email']) === mb_strtolower($yo['email']));
    }
} elseif ($email !== '') {
    $esDuenio = (mb_strtolower((string) $r['cliente_email']) === $email);
}

if (!$esGestor && !$esDuenio) {
    responder(['ok' => false, 'error' => 'No puedes eliminar esta reserva.'], 403);
}

db()->prepare('DELETE FROM reservas WHERE id = :id')->execute([':id' => $r['id']]);

responder(['ok' => true]);
