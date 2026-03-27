// utils/whatsapp-helper.js - VERSIÓN CORREGIDA PARA WHATSAPP BUSINESS
// CORREGIDO: Usa api.whatsapp.com/send/ que es compatible con WhatsApp Business

console.log('📱 whatsapp-helper.js - VERSIÓN WHATSAPP BUSINESS');

// ============================================
// FUNCIÓN PARA OBTENER CONFIGURACIÓN DEL NEGOCIO
// ============================================
async function getConfigNegocio() {
    try {
        const config = await window.cargarConfiguracionNegocio();
        return {
            nombre: config?.nombre || 'Mi Negocio',
            telefono: config?.telefono || '00000000',
            ntfyTopic: config?.ntfy_topic || 'lag-barberia'
        };
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return {
            nombre: 'Mi Negocio',
            telefono: '00000000',
            ntfyTopic: 'lag-barberia'
        };
    }
}

// ============================================
// FUNCIÓN PARA LIMPIAR CARACTERES NO ISO-8859-1
// ============================================
function limpiarISO88591(texto) {
    if (!texto) return '';
    return texto
        .replace(/[^\x00-\x7F]/g, '')  // Eliminar caracteres no ASCII
        .replace(/[^a-zA-Z0-9\s\-_\.]/g, '') // Eliminar emojis y símbolos raros
        .replace(/\n/g, ' ')  // Reemplazar saltos de línea por espacios
        .replace(/\r/g, '')
        .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
        .trim();
}

// ============================================
// DETECTOR DE DISPOSITIVO MÓVIL
// ============================================
window.esMobile = function() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// ============================================
// 🔥 FUNCIÓN UNIVERSAL WHATSAPP (CORREGIDA PARA BUSINESS)
// ============================================
window.enviarWhatsApp = function(telefono, mensaje) {
    try {
        console.log('📤 enviarWhatsApp llamado a:', telefono);
        console.log('📤 mensaje:', mensaje ? mensaje.substring(0, 100) + '...' : 'sin mensaje');
        
        // Limpiar teléfono (solo números)
        const telefonoLimpio = telefono.toString().replace(/\D/g, '');
        
        // Asegurar que tenga código de país (53 para Cuba)
        let numeroCompleto = telefonoLimpio;
        if (!numeroCompleto.startsWith('53') && numeroCompleto.length === 8) {
            numeroCompleto = `53${telefonoLimpio}`;
        }
        
        // 🔥 CORREGIDO: Usar api.whatsapp.com/send/ con formato compatible con Business
        // Eliminar caracteres problemáticos del mensaje
        let mensajeLimpio = mensaje || '';
        
        // Eliminar caracteres de reemplazo Unicode (�)
        mensajeLimpio = mensajeLimpio.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
        
        // Eliminar emojis que puedan causar problemas
        mensajeLimpio = mensajeLimpio.replace(/[^\x00-\x7F]/g, '');
        
        // Asegurar que no haya caracteres extraños
        mensajeLimpio = mensajeLimpio.replace(/[^a-zA-Z0-9\s\.,\-\?\!\¡\¿\:\;\n]/g, '');
        
        const mensajeCodificado = encodeURIComponent(mensajeLimpio);
        
        // 🔥 FORMATO CORRECTO PARA WHATSAPP BUSINESS
        const url = `https://api.whatsapp.com/send?phone=${numeroCompleto}&text=${mensajeCodificado}`;
        
        console.log('🔗 URL de WhatsApp (Business compatible):', url);
        
        // Intentar abrir en una nueva pestaña/ventana
        const ventana = window.open(url, '_blank');
        
        // Verificar si se pudo abrir
        if (!ventana || ventana.closed || typeof ventana.closed === 'undefined') {
            console.warn('⚠️ No se pudo abrir ventana, usando método alternativo');
            
            // Método alternativo: crear un enlace temporal
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en enviarWhatsApp:', error);
        
        // Fallback: mostrar el número en una alerta
        const telefonoLimpio = telefono.toString().replace(/\D/g, '');
        let numeroCompleto = telefonoLimpio;
        if (!numeroCompleto.startsWith('53') && numeroCompleto.length === 8) {
            numeroCompleto = `53${telefonoLimpio}`;
        }
        
        alert(`📱 Contacto WhatsApp: +${numeroCompleto}\n\nMensaje: ${mensaje?.substring(0, 100)}...`);
        return false;
    }
};

// ============================================
// 🔥 FUNCIÓN PARA ENVIAR NOTIFICACIÓN PUSH
// ============================================
window.enviarNotificacionPush = async function(titulo, mensaje, etiquetas = 'bell', prioridad = 'default') {
    try {
        const config = await getConfigNegocio();
        const topic = config.ntfyTopic;
        
        console.log(`📢 Enviando push a ntfy.sh/${topic}:`, titulo);
        
        // Limpiar título y mensaje
        const tituloLimpio = limpiarISO88591(titulo).substring(0, 100);
        const mensajeLimpio = limpiarISO88591(mensaje).substring(0, 500);
        
        // Usar valores por defecto si quedaron vacíos
        const tituloFinal = tituloLimpio || 'Notificacion';
        const mensajeFinal = mensajeLimpio || 'Nueva notificacion';
        
        const response = await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: mensajeFinal,
            headers: {
                'Title': tituloFinal,
                'Priority': prioridad,
                'Tags': etiquetas
            }
        });
        
        if (response.ok) {
            console.log('✅ Push enviado correctamente');
            return true;
        } else {
            console.error('❌ Error en push:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error enviando push:', error);
        return false;
    }
};

// ============================================
// 🔥 NOTIFICACIÓN DE CANCELACIÓN DE TURNO (CORREGIDA)
// ============================================
window.notificarCancelacion = async function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('📤 Procesando notificación de CANCELACIÓN');

        const config = await getConfigNegocio();
        
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        const canceladoPor = booking.cancelado_por || 'admin';
        
        // Mensaje para el dueño (si canceló el cliente)
        const mensajeDuenno = 
`❌ CANCELACION - ${config.nombre}

Cliente: ${booking.cliente_nombre}
WhatsApp: ${booking.cliente_whatsapp}
Servicio: ${booking.servicio}
Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Profesional: ${profesional}

El cliente cancelo su turno.`;

        // Mensaje para el cliente (si canceló el admin)
        const mensajeCliente = 
`❌ CANCELACION DE TURNO - ${config.nombre}

Hola ${booking.cliente_nombre}, lamentamos informarte que tu turno ha sido cancelado.

Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Servicio: ${booking.servicio}
Profesional: ${profesional}

Motivo: Cancelacion por administracion

Queres reprogramar? Podes hacerlo desde la app`;

        // Enviar según quién canceló
        if (canceladoPor === 'cliente') {
            // El cliente canceló: avisar al admin
            console.log('📱 Enviando WhatsApp al admin por cancelación de cliente');
            window.enviarWhatsApp(config.telefono, mensajeDuenno);
        } else {
            // El admin canceló: avisar al cliente
            console.log('📱 Enviando WhatsApp al cliente por cancelación de admin');
            window.enviarWhatsApp(booking.cliente_whatsapp, mensajeCliente);
        }

        // Notificación push (siempre)
        const mensajePush = `Cliente: ${booking.cliente_nombre} Servicio: ${booking.servicio} Fecha: ${fechaConDia} ${canceladoPor === 'cliente' ? 'Cancelado por cliente' : 'Cancelado por admin'}`;

        await window.enviarNotificacionPush(
            `Cancelacion - ${config.nombre}`,
            mensajePush,
            'x',
            'default'
        );
        
        console.log('✅ Notificaciones de cancelación enviadas');
        return true;
    } catch (error) {
        console.error('Error en notificarCancelacion:', error);
        return false;
    }
};

// ============================================
// 🔥 NOTIFICACIÓN DE NUEVA RESERVA
// ============================================
window.notificarNuevaReserva = async function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('📤 Procesando notificación de NUEVA RESERVA');

        const config = await getConfigNegocio();
        
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        const mensajeWhatsApp = 
`🎉 NUEVA RESERVA - ${config.nombre}

Cliente: ${booking.cliente_nombre}
WhatsApp: ${booking.cliente_whatsapp}
Servicio: ${booking.servicio} (${booking.duracion} min)
Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Profesional: ${profesional}

Reserva confirmada automaticamente.`;

        window.enviarWhatsApp(config.telefono, mensajeWhatsApp);
        
        const mensajePush = `Cliente: ${booking.cliente_nombre} Servicio: ${booking.servicio} Fecha: ${fechaConDia} Hora: ${horaFormateada}`;

        await window.enviarNotificacionPush(
            `Nueva reserva - ${config.nombre}`,
            mensajePush,
            'calendar',
            'default'
        );
        
        console.log('✅ Notificaciones de nueva reserva enviadas');
        return true;
    } catch (error) {
        console.error('Error en notificarNuevaReserva:', error);
        return false;
    }
};

console.log('✅ whatsapp-helper.js - VERSION WHATSAPP BUSINESS CARGADA');