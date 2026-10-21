<?php
/* =========================================
   NAUTIGO — INICIO DE SESIÓN
   POST: email, password
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$email    = mb_strtolower(campo('email'));
$password = (string) ($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    responder(['ok' => false, 'error' => 'Escribe tu correo y tu contraseña.'], 422);
}

$u = db()->prepare('SELECT * FROM usuarios WHERE email = :email');
$u->execute([':email' => $email]);
$usuario = $u->fetch();

/* Mensaje igual en ambos casos para no revelar qué correos existen. */
if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
    responder(['ok' => false, 'error' => 'Correo o contraseña incorrectos.'], 401);
}

if ($usuario['rol'] === 'lanchero' && $usuario['estado'] === 'rechazado') {
    responder([
        'ok'    => false,
        'error' => 'Tu solicitud fue rechazada.'
                  . ($usuario['motivo_rechazo'] ? ' Motivo: ' . $usuario['motivo_rechazo'] : ''),
    ], 403);
}

/* Si el admin cambió la contraseña a un hash más fuerte, se rehasha aquí. */
if (password_needs_rehash($usuario['password_hash'], PASSWORD_DEFAULT)) {
    $r = db()->prepare('UPDATE usuarios SET password_hash = :hash WHERE id = :id');
    $r->execute([':hash' => password_hash($password, PASSWORD_DEFAULT), ':id' => $usuario['id']]);
}

iniciar_sesion_para($usuario);

responder([
    'ok'      => true,
    'usuario' => [
        'id'          => (int) $usuario['id'],
        'rol'         => $usuario['rol'],
        'nombre'      => $usuario['nombre'],
        'email'       => $usuario['email'],
        'estado'      => $usuario['estado'],
        'puntos'      => (int) $usuario['puntos'],
        'tieneLancha' => $usuario['rol'] === 'lanchero',
    ],
]);
