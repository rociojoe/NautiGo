<?php
/* =========================================
   NAUTIGO — CONTACTO  (POST, público)
   POST: nombre, email, asunto, mensaje
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$nombre  = campo('nombre');
$email   = campo('email');
$asunto  = campo('asunto');
$mensaje = campo('mensaje');

if (mb_strlen($nombre) < 3 || mb_strlen($nombre) > 120) {
    responder(['ok' => false, 'error' => 'Escribe tu nombre completo.'], 422);
}
if (!email_valido($email)) {
    responder(['ok' => false, 'error' => 'Escribe un correo válido.'], 422);
}
if (mb_strlen($asunto) > 150) {
    responder(['ok' => false, 'error' => 'El asunto es demasiado largo.'], 422);
}
if (mb_strlen($mensaje) < 10 || mb_strlen($mensaje) > 3000) {
    responder(['ok' => false, 'error' => 'Cuéntanos un poco más: el mensaje debe tener entre 10 y 3000 caracteres.'], 422);
}

db()->prepare('INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje)
               VALUES (:nombre, :email, NULLIF(:asunto, \'\'), :mensaje)')
    ->execute([
        ':nombre'  => $nombre,
        ':email'   => $email,
        ':asunto'  => $asunto,
        ':mensaje' => $mensaje,
    ]);

responder(['ok' => true, 'mensaje' => 'Recibimos tu mensaje. Te responderemos al correo que nos dejaste.']);
