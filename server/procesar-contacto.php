<?php
// Configuración
$para = 'contacto@decomotivo.com.ar'; // Cambia por tu email empresarial
$asunto = 'Nuevo mensaje desde DecoMotivo - Sitio Web';

// Headers para CORS (permitir que React se conecte)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.decomotivo.com.ar'); // Más seguro que *
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Para depuración, descomentar si hay problemas
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// Verificar que el formulario fue enviado
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recoger y limpiar los datos del formulario
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $telefono = isset($_POST['telefono']) ? trim($_POST['telefono']) : 'No proporcionado';
    $tipo = isset($_POST['tipo']) ? trim($_POST['tipo']) : '';
    $mensaje = isset($_POST['mensaje']) ? trim($_POST['mensaje']) : '';
    
    // Array para recoger errores
    $errores = [];
    
    // Validaciones del servidor
    
    // Validar nombre
    if (empty($nombre)) {
        $errores[] = 'El nombre es obligatorio';
    } elseif (strlen($nombre) < 2) {
        $errores[] = 'El nombre debe tener al menos 2 caracteres';
    } elseif (strlen($nombre) > 100) {
        $errores[] = 'El nombre no puede tener más de 100 caracteres';
    } elseif (!preg_match('/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/', $nombre)) {
        $errores[] = 'El nombre solo puede contener letras y espacios';
    }
    
    // Validar email
    if (empty($email)) {
        $errores[] = 'El correo electrónico es obligatorio';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'Por favor, proporciona un correo electrónico válido';
    } elseif (strlen($email) > 255) {
        $errores[] = 'El correo electrónico es demasiado largo';
    }
    
    // Validar teléfono (si se proporciona)
    if (!empty($telefono) && $telefono !== 'No proporcionado') {
        if (strlen($telefono) > 25) {
            $errores[] = 'El número de teléfono es demasiado largo';
        }
        // Permitir formatos argentinos: +54 9 381 123-4567 o 381 123-4567
        if (!preg_match('/^(\+54\s?9\s?)?[\d\s\-]{7,20}$/', $telefono)) {
            $errores[] = 'Por favor, ingresa un número de teléfono válido';
        }
    }
    
    // Validar tipo de consulta
    $tipos_permitidos = ['pedido', 'informacion', 'presupuesto', 'otro'];
    if (empty($tipo)) {
        $errores[] = 'Por favor, selecciona un tipo de consulta';
    } elseif (!in_array($tipo, $tipos_permitidos)) {
        $errores[] = 'Tipo de consulta no válido';
    }
    
    // Validar mensaje
    if (empty($mensaje)) {
        $errores[] = 'El mensaje es obligatorio';
    } elseif (strlen($mensaje) < 10) {
        $errores[] = 'El mensaje debe tener al menos 10 caracteres';
    } elseif (strlen($mensaje) > 2000) {
        $errores[] = 'El mensaje no puede tener más de 2000 caracteres';
    }
    
    // Validaciones anti-spam mejoradas
    if (substr_count(strtolower($mensaje), 'http') > 2) {
        $errores[] = 'El mensaje contiene demasiados enlaces';
    }
    
    // Detectar patrones de spam
    $spam_patterns = ['viagra', 'casino', 'lottery', 'winner', 'congratulations'];
    foreach ($spam_patterns as $pattern) {
        if (stripos($mensaje, $pattern) !== false) {
            $errores[] = 'El mensaje contiene contenido no permitido';
            break;
        }
    }
    
    // Rate limiting básico (opcional - requiere almacenamiento)
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $rate_limit_file = sys_get_temp_dir() . '/contact_rate_' . md5($ip);
    if (file_exists($rate_limit_file)) {
        $last_submission = filemtime($rate_limit_file);
        if (time() - $last_submission < 60) { // 1 minuto entre envíos
            $errores[] = 'Debes esperar antes de enviar otro mensaje';
        }
    }
    
    // Si no hay errores, proceder a enviar
    if (empty($errores)) {
        // Actualizar rate limiting
        touch($rate_limit_file);
        
        // Limpiar datos para prevenir inyección
        $nombre = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
        $email = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $telefono = htmlspecialchars($telefono, ENT_QUOTES, 'UTF-8');
        $tipo = htmlspecialchars($tipo, ENT_QUOTES, 'UTF-8');
        $mensaje = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
        
        // Convertir tipo a texto legible
        $tipos_texto = [
            'pedido' => 'Pedido personalizado',
            'informacion' => 'Información de productos',
            'presupuesto' => 'Solicitud de presupuesto',
            'otro' => 'Otro'
        ];
        $tipo_texto = $tipos_texto[$tipo] ?? $tipo;
        
        // Construir el cuerpo del mensaje con formato HTML
        $contenido_html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background-color: #c70000; color: white; padding: 20px; text-align: center; }
                .header h2 { margin: 0; font-size: 24px; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .field { margin-bottom: 20px; }
                .label { font-weight: bold; color: #333; font-size: 14px; }
                .value { margin-top: 8px; padding: 12px; background-color: white; border-left: 4px solid #c70000; border-radius: 4px; }
                .mensaje-field .value { min-height: 80px; }
                .footer { background-color: #333; color: white; text-align: center; padding: 15px; font-size: 12px; }
                .logo { max-width: 100px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>🎨 Nuevo mensaje desde DecoMotivo</h2>
                    <p style='margin: 5px 0 0 0; opacity: 0.9;'>Formulario de contacto del sitio web</p>
                </div>
                <div class='content'>
                    <div class='field'>
                        <div class='label'>👤 Nombre:</div>
                        <div class='value'>$nombre</div>
                    </div>
                    <div class='field'>
                        <div class='label'>📧 Email:</div>
                        <div class='value'><a href='mailto:$email'>$email</a></div>
                    </div>
                    <div class='field'>
                        <div class='label'>📱 Teléfono:</div>
                        <div class='value'>$telefono</div>
                    </div>
                    <div class='field'>
                        <div class='label'>📝 Tipo de consulta:</div>
                        <div class='value'>$tipo_texto</div>
                    </div>
                    <div class='field mensaje-field'>
                        <div class='label'>💬 Mensaje:</div>
                        <div class='value'>$mensaje</div>
                    </div>
                </div>
                <div class='footer'>
                    <p><strong>DecoMotivo</strong> - Decorando Tu Vida</p>
                    <p>📅 Recibido el: " . date('d/m/Y H:i:s') . " | 🌐 IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'No disponible') . "</p>
                    <p style='margin-top: 10px; opacity: 0.8;'>Responde a este email para contactar directamente con el cliente</p>
                </div>
            </div>
        </body>
        </html>";
        
        // Versión texto plano mejorada
        $contenido_texto = "🎨 NUEVO MENSAJE DESDE DECOMOTIVO\n";
        $contenido_texto .= "=" . str_repeat("=", 40) . "\n\n";
        $contenido_texto .= "👤 NOMBRE: $nombre\n";
        $contenido_texto .= "📧 EMAIL: $email\n";
        $contenido_texto .= "📱 TELÉFONO: $telefono\n";
        $contenido_texto .= "📝 TIPO: $tipo_texto\n\n";
        $contenido_texto .= "💬 MENSAJE:\n";
        $contenido_texto .= str_repeat("-", 40) . "\n";
        $contenido_texto .= "$mensaje\n";
        $contenido_texto .= str_repeat("-", 40) . "\n\n";
        $contenido_texto .= "ℹ️  INFORMACIÓN ADICIONAL:\n";
        $contenido_texto .= "📅 Fecha: " . date('d/m/Y H:i:s') . "\n";
        $contenido_texto .= "🌐 IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'No disponible') . "\n";
        $contenido_texto .= "🖥️  User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'No disponible') . "\n\n";
        $contenido_texto .= "DecoMotivo - Decorando Tu Vida\n";
        $contenido_texto .= "contacto@decomotivo.com.ar\n";
        
        // Cabeceras del correo mejoradas
        $boundary = md5(time());
        $cabeceras = "MIME-Version: 1.0\r\n";
        $cabeceras .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $cabeceras .= "From: DecoMotivo <noreply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
        $cabeceras .= "Reply-To: $nombre <$email>\r\n"; // Mejorado para responder fácil
        $cabeceras .= "Return-Path: noreply@" . $_SERVER['HTTP_HOST'] . "\r\n";
        $cabeceras .= "X-Mailer: DecoMotivo Contact Form v2.0\r\n";
        $cabeceras .= "X-Priority: 1\r\n";
        $cabeceras .= "X-MSMail-Priority: High\r\n";
        
        // Cuerpo del mensaje multipart
        $cuerpo_mensaje = "--$boundary\r\n";
        $cuerpo_mensaje .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $cuerpo_mensaje .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $cuerpo_mensaje .= $contenido_texto . "\r\n";
        $cuerpo_mensaje .= "--$boundary\r\n";
        $cuerpo_mensaje .= "Content-Type: text/html; charset=UTF-8\r\n";
        $cuerpo_mensaje .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $cuerpo_mensaje .= $contenido_html . "\r\n";
        $cuerpo_mensaje .= "--$boundary--";
        
        try {
            // Intentar enviar el correo
            $enviado = mail($para, $asunto, $cuerpo_mensaje, $cabeceras);
            
            if ($enviado) {
                // Log del envío exitoso (opcional)
                error_log("Contacto enviado exitosamente desde: $email");
                
                // Respuesta exitosa para React
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Mensaje enviado correctamente'
                ], JSON_UNESCAPED_UNICODE);
            } else {
                // Log del error
                error_log("Error al enviar email desde formulario de contacto");
                
                // Error en el envío
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            // Log del error
            error_log("Excepción en formulario de contacto: " . $e->getMessage());
            
            // Error de excepción
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error del servidor. Por favor, inténtalo más tarde.'
            ], JSON_UNESCAPED_UNICODE);
        }
    } else {
        // Hay errores de validación
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Por favor, corrige los siguientes errores:',
            'errors' => $errores
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    // Método no permitido
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ], JSON_UNESCAPED_UNICODE);
}
?>