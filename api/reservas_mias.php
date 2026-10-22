<?php
/* =========================================
   NAUTIGO — MIS RESERVAS  (GET, con sesión)
   cliente  → las que hizo (por id o por correo)
   lanchero → las de su lancha, si está aprobado
   admin    → todas
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
$yo = exigir_rol();

$where  = '1=0';
$params = [];

if ($yo['rol'] === 'admin') {
    $where = '1=1';
} elseif ($yo['rol'] === 'lanchero') {
    if ($yo['estado'] !== 'aprobado') {
        responder(['ok' => true, 'reservas' => []]);
    }
    $l = db()->prepare('SELECT nombre FROM lanchas WHERE usuario_id = :uid');
    $l->execute([':uid' => $yo['id']]);
    $nombre = $l->fetchColumn();
    if ($nombre === false) {
        responder(['ok' => true, 'reservas' => []]);
    }
    $where = 'lancha_nombre = :lancha';
    $params[':lancha'] = $nombre;
} else {
    $where = '(cliente_id = :uid OR LOWER(cliente_email) = LOWER(:email))';
    $params[':uid']   = $yo['id'];
    $params[':email'] = $yo['email'];
}

$s = db()->prepare("SELECT * FROM reservas WHERE $where ORDER BY id DESC LIMIT 300");
$s->execute($params);

$reservas = [];
foreach ($s as $r) {
    $reservas[] = [
        'codigo'          => $r['codigo'],
        'creadoEn'        => $r['creado_en'],
        'estado'          => $r['estado'],
        'clienteNombre'   => $r['cliente_nombre'],
        'clienteEmail'    => $r['cliente_email'],
        'clienteTelefono' => $r['cliente_telefono'],
        'destinoSlug'     => $r['destino_slug'],
        'tourId'          => $r['tour_id'],
        'lanchaNombre'    => $r['lancha_nombre'],
        'lancheroNombre'  => $r['lanchero_nombre'],
        'lancheroTelefono'=> $r['lanchero_telefono'],
        'hotelNombre'     => $r['hotel_nombre'],
        'fecha'           => $r['fecha'],
        'fechaRegreso'    => $r['fecha_regreso'],
        'adultos'         => (int) $r['adultos'],
        'ninos'           => (int) $r['ninos'],
        'bebes'           => (int) $r['bebes'],
        'noches'          => (int) $r['noches'],
        'total'           => (float) $r['total'],
        'notas'           => $r['notas'],
        'desglose'        => $r['desglose'],
    ];
}

responder(['ok' => true, 'reservas' => $reservas]);
