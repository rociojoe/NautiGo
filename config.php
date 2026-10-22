<?php
/* =========================================
   NAUTIGO — CONFIGURACIÓN Y AYUDANTES
   ========================================= */

/* ---------- BASE DE DATOS ---------- */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = require __DIR__ . '/config/credenciales.local.php';
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $c['host'], $c['puerto'], $c['basedatos']),
            $c['usuario'],
            $c['clave'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}

/* ---------- SESIÓN ---------- */
function sesion_iniciar(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name('NAUTIGO_SES');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,   // JS no puede leer la cookie
            'samesite' => 'Lax',
            'secure'   => false,  // localhost; poner true al publicar con HTTPS
        ]);
        session_start();
    }
}

function usuario_actual(): ?array
{
    return $_SESSION['usuario'] ?? null;
}

function iniciar_sesion_para(array $usuario): void
{
    session_regenerate_id(true);   // evita fijación de sesión
    $_SESSION['usuario'] = [
        'id'     => (int) $usuario['id'],
        'rol'    => $usuario['rol'],
        'nombre' => $usuario['nombre'],
        'email'  => $usuario['email'],
        'estado' => $usuario['estado'],
        'puntos' => (int) $usuario['puntos'],
    ];
}

function cerrar_sesion_php(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/* Exige sesión iniciada y, si se indican roles, que el usuario tenga uno de ellos.
   Responde él mismo y termina el script cuando no cumple. */
function exigir_rol(string ...$roles): array
{
    $u = usuario_actual();
    if (!$u) {
        responder(['ok' => false, 'error' => 'No has iniciado sesión.'], 401);
    }
    if ($roles && !in_array($u['rol'], $roles, true)) {
        responder(['ok' => false, 'error' => 'No tienes permiso para esta acción.'], 403);
    }
    return $u;
}

/* ---------- CSRF ---------- */
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function exigir_csrf(): void
{
    $enviado = $_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf'] ?? '', (string) $enviado)) {
        responder(['ok' => false, 'error' => 'La sesión caducó, recarga la página.'], 419);
    }
}

/* ---------- PETICIONES ---------- */
function es_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function campo(string $nombre): string
{
    return trim((string) ($_POST[$nombre] ?? ''));
}

function email_valido(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/* ---------- RESPUESTAS ---------- */
function responder(array $datos, int $codigo = 200): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- FORMATO ---------- */
/* El front mostraba los importes con Q y separadores es-GT. */
function Q(float $n): string
{
    return 'Q' . number_format($n, 0, '', ',');
}
