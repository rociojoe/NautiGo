<?php
/* =========================================
   NAUTIGO — FOTO Y BANNER DEL PERFIL  (POST)
   POST: tipo (foto|banner), imagen (data URL), csrf
   El navegador las reduce antes de subirlas.
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$yo = exigir_rol();
exigir_csrf();

$tipo   = campo('tipo');
$imagen = campo('imagen');

if ($tipo !== 'foto' && $tipo !== 'banner') {
    responder(['ok' => false, 'error' => 'Qué imagen quieres cambiar: foto o banner.'], 422);
}

/* Foto hasta ~800 KB y banner hasta ~2.5 MB de data URL. */
$limite = $tipo === 'foto' ? 800000 : 2500000;
if (!preg_match('#^data:image/(png|jpe?g|webp);base64,#', $imagen) || strlen($imagen) > $limite) {
    responder(['ok' => false, 'error' => 'La imagen no es válida o pesa demasiado.'], 422);
}

$columna = $tipo === 'foto' ? 'foto' : 'banner';

$st = db()->prepare("UPDATE usuarios SET $columna = :img WHERE id = :id");
$st->execute([':img' => $imagen, ':id' => $yo['id']]);

responder(['ok' => true, $tipo => $imagen]);
