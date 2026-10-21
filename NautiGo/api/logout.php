<?php
/* =========================================
   NAUTIGO — CERRAR SESIÓN  (POST)
   ========================================= */

require __DIR__ . '/../config.php';

sesion_iniciar();

if (!es_post()) {
    responder(['ok' => false, 'error' => 'Usa POST.'], 405);
}

cerrar_sesion_php();

responder(['ok' => true]);
