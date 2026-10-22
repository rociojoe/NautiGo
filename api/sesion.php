<?php
/* =========================================
   NAUTIGO — ¿QUIÉN ESTÁ LOGUEADO?  (GET)
   Lee de la sesión del servidor, no del navegador.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

$u = usuario_actual();

if (!$u) {
    responder(['ok' => true, 'usuario' => null]);
}

/* El lanchero necesita saber si ya lo aprobaron para pintar su panel. */
$lancha = null;
if ($u['rol'] === 'lanchero') {
    $l = db()->prepare('SELECT * FROM lanchas WHERE usuario_id = :uid');
    $l->execute([':uid' => $u['id']]);
    $fila = $l->fetch();
    if ($fila) {
        $lancha = [
            'id'          => (int) $fila['id'],
            'nombre'      => $fila['nombre'],
            'galones'     => (float) $fila['galones'],
            'aforo'       => (int) $fila['aforo'],
            'motorHP'     => $fila['motor_hp'] !== null ? (int) $fila['motor_hp'] : null,
            'costoGasolinaHora' => $fila['costo_gasolina_hora'] !== null ? (float) $fila['costo_gasolina_hora'] : null,
            'horarioInicio' => substr($fila['horario_inicio'], 0, 5),
            'horarioFin'    => substr($fila['horario_fin'], 0, 5),
            'activa'      => (bool) $fila['activa'],
        ];
    }
}

/* La foto y el banner se leen frescos para que un cambio
   se vea sin necesidad de volver a iniciar sesión. */
$media = ['foto' => null, 'banner' => null];
$f = db()->prepare('SELECT foto, banner FROM usuarios WHERE id = :id');
$f->execute([':id' => $u['id']]);
if ($fila = $f->fetch(PDO::FETCH_ASSOC)) {
    $media = ['foto' => $fila['foto'], 'banner' => $fila['banner']];
}

responder([
    'ok'      => true,
    'usuario' => $u + $media + ['lancha' => $lancha],
    'csrf'    => csrf_token(),
]);
