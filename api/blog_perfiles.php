<?php
/* =========================================
   NAUTIGO — BLOG: PERFILES  (GET)
   GET ?buscar=texto  → lista de perfiles
   GET ?id=ID         → un perfil
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

$pdo = db();

$uno = (int) ($_GET['id'] ?? 0);

$sql = 'SELECT u.id, u.nombre, u.rol, u.foto, u.banner,
              (SELECT COUNT(*) FROM blog_publicaciones p WHERE p.usuario_id = u.id) AS publicaciones
        FROM usuarios u
        WHERE u.estado <> :rechazado';

$params = [':rechazado' => 'rechazado'];

if ($uno > 0) {
    $sql .= ' AND u.id = :id';
    $params[':id'] = $uno;
    $sql .= ' LIMIT 1';
} else {
    $buscar = trim((string) ($_GET['buscar'] ?? ''));
    if ($buscar !== '') {
        $sql .= ' AND u.nombre LIKE :q';
        $params[':q'] = '%' . $buscar . '%';
    }
    $sql .= ' ORDER BY publicaciones DESC, u.nombre ASC LIMIT 40';
}

$st = $pdo->prepare($sql);
$st->execute($params);
$filas = $st->fetchAll();

$perfiles = array_map(function ($f) {
    return [
        'id'            => (int) $f['id'],
        'nombre'        => $f['nombre'],
        'rol'           => $f['rol'],
        'foto'          => $f['foto'],
        'banner'        => $f['banner'],
        'publicaciones' => (int) $f['publicaciones'],
    ];
}, $filas);

if ($uno > 0) {
    responder(['ok' => true, 'perfil' => $perfiles[0] ?? null]);
}

responder(['ok' => true, 'perfiles' => $perfiles]);
