<?php
/* =========================================
   NAUTIGO — HOTELES DEL ADMIN  (GET y POST)
   GET  → lista completa (público: el buscador y
          el formulario de reserva la usan)
   POST → crear hotel (solo admin)
   POST: nombre, categoria, precioNoche, estrellas,
         ubicacion, descripcion, csrf
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    $s = db()->query('SELECT id, nombre, categoria, precio_noche, estrellas, ubicacion, descripcion
                      FROM hoteles ORDER BY id DESC');
    $hoteles = [];
    foreach ($s as $h) {
        $hoteles[] = [
            'id'          => 'hotel-db-' . (int) $h['id'],
            'dbId'        => (int) $h['id'],
            'nombre'      => $h['nombre'],
            'categoria'   => $h['categoria'],
            'precioNoche' => (float) $h['precio_noche'],
            'estrellas'   => (int) $h['estrellas'],
            'ubicacion'   => $h['ubicacion'],
            'descripcion' => $h['descripcion'],
        ];
    }
    responder(['ok' => true, 'hoteles' => $hoteles]);
}

$yo = exigir_rol('admin');
exigir_csrf();

$nombre      = mb_substr(campo('nombre'), 0, 120);
$categoria   = campo('categoria');
$precioNoche = (float) campo('precioNoche');
$estrellas   = (int) campo('estrellas');
$ubicacion   = mb_substr(campo('ubicacion'), 0, 150);
$descripcion = mb_substr(campo('descripcion'), 0, 1000);

if (mb_strlen($nombre) < 3) {
    responder(['ok' => false, 'error' => 'El nombre del hotel es muy corto.'], 422);
}
if (!in_array($categoria, ['economico', 'medio', 'boutique'], true)) {
    responder(['ok' => false, 'error' => 'Categoría no válida.'], 422);
}
if ($precioNoche < 50 || $precioNoche > 99999) {
    responder(['ok' => false, 'error' => 'El precio por noche debe estar entre Q50 y Q99,999.'], 422);
}
$estrellas = max(1, min(5, $estrellas));

db()->prepare('INSERT INTO hoteles (nombre, categoria, precio_noche, estrellas, ubicacion, descripcion)
               VALUES (:n, :c, :p, :e, :u, :d)')
    ->execute([
        ':n' => $nombre, ':c' => $categoria, ':p' => $precioNoche,
        ':e' => $estrellas, ':u' => $ubicacion !== '' ? $ubicacion : null,
        ':d' => $descripcion !== '' ? $descripcion : null,
    ]);

responder(['ok' => true, 'id' => (int) db()->lastInsertId()]);
