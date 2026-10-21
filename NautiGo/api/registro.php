<?php
/* =========================================
   NAUTIGO — REGISTRO DE USUARIOS
   POST: rol, nombre, email, telefono, password
         si rol=lanchero además: lanchaNombre, lanchaGalones,
         lanchaAforo, lanchaMotor, lanchaGasolina,
         lanchaHoraInicio, lanchaHoraFin
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

$rol      = campo('rol');
$nombre   = campo('nombre');
$email    = campo('email');
$telefono = campo('telefono');
$password = (string) ($_POST['password'] ?? '');

/* Un admin no se autoregistra: lo crea otro admin. */
if (!in_array($rol, ['cliente', 'lanchero'], true)) {
    responder(['ok' => false, 'error' => 'Tipo de cuenta no válido.'], 422);
}
if (mb_strlen($nombre) < 3) {
    responder(['ok' => false, 'error' => 'Nombre muy corto.'], 422);
}
if (!email_valido($email)) {
    responder(['ok' => false, 'error' => 'Correo inválido.'], 422);
}
if (strlen($password) < 6) {
    responder(['ok' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres.'], 422);
}

$lancha = null;
if ($rol === 'lanchero') {
    $lancha = [
        'nombre'  => campo('lanchaNombre'),
        'galones' => (float) campo('lanchaGalones'),
        'aforo'   => (int) campo('lanchaAforo'),
        'motor'   => campo('lanchaMotor') !== '' ? (int) campo('lanchaMotor') : null,
        'gasolina'=> campo('lanchaGasolina') !== '' ? (float) campo('lanchaGasolina') : null,
        'hinicio' => campo('lanchaHoraInicio') ?: '06:00',
        'hfin'    => campo('lanchaHoraFin') ?: '18:00',
    ];
    if (mb_strlen($lancha['nombre']) < 2) {
        responder(['ok' => false, 'error' => 'Tu lancha necesita nombre.'], 422);
    }
    if ($lancha['aforo'] < 1) {
        responder(['ok' => false, 'error' => 'Indica el máximo de personas de la lancha.'], 422);
    }
}

$pdo = db();

/* El estado depende del rol: el lanchero queda pendiente del admin. */
$estado = $rol === 'lanchero' ? 'pendiente' : 'activo';

try {
    $pdo->beginTransaction();

    $ins = $pdo->prepare(
        'INSERT INTO usuarios (rol, nombre, email, telefono, password_hash, estado)
         VALUES (:rol, :nombre, :email, :telefono, :hash, :estado)'
    );
    $ins->execute([
        ':rol'     => $rol,
        ':nombre'  => $nombre,
        ':email'   => mb_strtolower($email),
        ':telefono'=> $telefono !== '' ? $telefono : null,
        ':hash'    => password_hash($password, PASSWORD_DEFAULT),
        ':estado'  => $estado,
    ]);
    $nuevoId = (int) $pdo->lastInsertId();

    if ($lancha) {
        $isl = $pdo->prepare(
            'INSERT INTO lanchas (usuario_id, nombre, galones, aforo, motor_hp,
                                  costo_gasolina_hora, horario_inicio, horario_fin, activa)
             VALUES (:uid, :nombre, :galones, :aforo, :motor, :gasolina, :hinicio, :hfin, 0)'
        );
        $isl->execute([
            ':uid'     => $nuevoId,
            ':nombre'  => $lancha['nombre'],
            ':galones' => $lancha['galones'],
            ':aforo'   => $lancha['aforo'],
            ':motor'   => $lancha['motor'],
            ':gasolina'=> $lancha['gasolina'],
            ':hinicio' => $lancha['hinicio'] . ':00',
            ':hfin'    => $lancha['hfin'] . ':00',
        ]);
    }

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    /* 23000 = violación de la clave única del email */
    if ($e->getCode() === '23000') {
        responder(['ok' => false, 'error' => 'Este correo ya está registrado.'], 409);
    }
    throw $e;
}

responder([
    'ok' => true,
    'mensaje' => $rol === 'lanchero'
        ? 'Tu cuenta quedó pendiente de aprobación por el administrador.'
        : 'Cuenta creada. Ya puedes iniciar sesión.',
    'usuario' => [
        'id'     => $nuevoId,
        'rol'    => $rol,
        'nombre' => $nombre,
        'email'  => mb_strtolower($email),
        'estado' => $estado,
    ],
], 201);
