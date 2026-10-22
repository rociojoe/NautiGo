<?php
/* =========================================
   NAUTIGO — ELIMINAR HOTEL DEL ADMIN  (POST, admin)
   POST: id (numérico de la tabla hoteles), csrf
   Los hoteles de demo de datos.js no se pueden
   borrar desde aquí: no viven en la base de datos.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();
$yo = exigir_rol('admin');

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}
exigir_csrf();

$id = (int) campo('id');
if ($id < 1) {
    responder(['ok' => false, 'error' => 'Hotel no válido.'], 422);
}

$s = db()->prepare('DELETE FROM hoteles WHERE id = :id');
$s->execute([':id' => $id]);

if ($s->rowCount() === 0) {
    responder(['ok' => false, 'error' => 'Ese hotel no existe.'], 404);
}

responder(['ok' => true]);
