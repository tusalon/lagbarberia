// utils/whatsapp-helper.js - VERSIÓN GENÉRICA COMPLETA
// CORREGIDA: Push notification, WhatsApp en móvil/PC, cancelaciones

console.log('📱 whatsapp-helper.js - VERSIÓN CORREGIDA');

// ============================================
// FUNCIÓN PARA OBTENER CONFIGURACIÓN DEL NEGOCIO
// ============================================
async function getConfigNegocio() {
    try {
        const config = await window.cargarConfiguracionNegocio();
        return {
            nombre: config?.nombre || 'Mi Negocio',
            telefono: config?.telefono || '00000000',
            ntfyTopic: config?.ntfy_topic || 'notificaciones'
        };
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return {
            nombre: 'Mi Negocio',
            telefono: '00000000',
            ntfyTopic: 'notificaciones'
        };
    }
}

// ============================================
// DETECTOR DE DISPOSITIVO MÓVIL
// ============================================
window.esMobile = function() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

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
// FUNCIÓN UNIVERSAL WHATSAPP (CORREGIDA)
// ============================================
window.enviarWhatsApp = function(telefono, mensaje) {
    try {
        console.log('📤 enviarWhatsApp llamado a:', telefono);
        console.log('📤 mensaje:', mensaje ? mensaje.substring(0, 100) + '...' : 'sin mensaje');
        
        // Limpiar teléfono
        const telefonoLimpio = telefono.toString().replace(/\D/g, '');
        let numeroCompleto = telefonoLimpio;
        if (!numeroCompleto.startsWith('53')) {
            numeroCompleto = `53${telefonoLimpio}`;
        }
        
        const mensajeCodificado = encodeURIComponent(mensaje);
        
        // Detectar si es móvil o PC
        const isMobile = window.esMobile();
        
        let url;
        if (isMobile) {
            // En móvil: usar esquema de la app
            url = `whatsapp://send?phone=${numeroCompleto}&text=${mensajeCodificado}`;
            console.log('📱 Móvil detectado, usando app:', url);
        } else {
            // En PC: usar WhatsApp Web
            url = `https://web.whatsapp.com/send?phone=${numeroCompleto}&text=${mensajeCodificado}`;
            console.log('💻 PC detectado, usando WhatsApp Web:', url);
        }
        
        window.open(url, '_blank');
        return true;
        
    } catch (error) {
        console.error('❌ Error en enviarWhatsApp:', error);
        
        // Fallback: usar API
        const telefonoLimpio = telefono.toString().replace(/\D/g, '');
        let numeroCompleto = telefonoLimpio;
        if (!numeroCompleto.startsWith('53')) {
            numeroCompleto = `53${telefonoLimpio}`;
        }
        const mensajeCodificado = encodeURIComponent(mensaje);
        window.open(`https://api.whatsapp.com/send?phone=${numeroCompleto}&text=${mensajeCodificado}`, '_blank');
        return false;
    }
};

// ============================================
// FUNCIÓN PARA ENVIAR NOTIFICACIÓN PUSH (CORREGIDA)
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
        
        console.log('📢 Título limpio:', tituloFinal);
        console.log('📢 Mensaje limpio:', mensajeFinal.substring(0, 100));
        
        const response = await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: mensajeFinal,
            headers: {
                'Title': tituloFinal,
                'Priority': prioridad,
                'Tags': etiquetas
            }
        });
        
        console.log('📢 Response status:', response.status);
        
        if (response.ok) {
            console.log('✅ Push enviado correctamente');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Error en push:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error enviando push:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE NUEVA SOLICITUD (PARA ADMIN)
// ============================================
window.notificarNuevaSolicitud = async function(nombre, whatsapp, negocioNombre) {
    try {
        const config = await getConfigNegocio();
        const telefonoAdmin = config.telefono;
        
        const fechaFormateada = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const mensajeWhatsApp = 
`🆕 NUEVA SOLICITUD DE REGISTRO

Nombre: ${nombre}
WhatsApp: +${whatsapp}
Negocio: ${negocioNombre || config.nombre}
Fecha: ${fechaFormateada}

Ingresa al panel para aprobar o rechazar
${window.location.origin}/acrika-nails/admin.html`;

        window.enviarWhatsApp(telefonoAdmin, mensajeWhatsApp);
        
        const mensajePush = `Cliente: ${nombre} WhatsApp: +${whatsapp} Negocio: ${negocioNombre || config.nombre}`;
        await window.enviarNotificacionPush(
            `Nueva solicitud - ${nombre}`,
            mensajePush,
            '👤',
            'high'
        );
        
        return true;
    } catch (error) {
        console.error('Error en notificarNuevaSolicitud:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE APROBACIÓN DE SOLICITUD (PARA CLIENTE)
// ============================================
window.notificarAprobacionCliente = async function(nombre, whatsapp, negocioNombre) {
    try {
        const mensajeCliente = 
`✅ FELICITACIONES! Tu solicitud fue APROBADA.

Ya podes reservar turnos en ${negocioNombre}.

Ingresa con tu numero: ${whatsapp}

Te esperamos!`;

        window.enviarWhatsApp(whatsapp, mensajeCliente);
        console.log('✅ WhatsApp de aprobación enviado al cliente');
        return true;
    } catch (error) {
        console.error('Error en notificarAprobacionCliente:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE CANCELACIÓN DE TURNO (CORREGIDA)
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
            console.log('📱 Admin notificado de cancelación por cliente');
        } else {
            // El admin canceló: avisar al cliente
            console.log('📱 Enviando WhatsApp al cliente por cancelación de admin');
            window.enviarWhatsApp(booking.cliente_whatsapp, mensajeCliente);
            console.log('📱 Cliente notificado de cancelación por admin');
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
// NOTIFICACIÓN DE NUEVA RESERVA (CORREGIDA)
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

// ============================================
// NOTIFICACIÓN DE RESERVA PENDIENTE (CON ANTICIPO)
// ============================================
window.notificarReservaPendiente = async function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('📤 Procesando notificación de RESERVA PENDIENTE');

        const configNegocio = await window.cargarConfiguracionNegocio();
        const config = await getConfigNegocio();
        
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        // Calcular monto del anticipo
        let montoAnticipo = 0;
        if (configNegocio?.tipo_anticipo === 'fijo') {
            montoAnticipo = configNegocio.valor_anticipo || 0;
        } else if (configNegocio?.tipo_anticipo === 'porcentaje') {
            let precioServicio = 0;
            if (window.salonServicios) {
                const servicios = await window.salonServicios.getAll(true);
                const servicio = servicios.find(s => s.nombre === booking.servicio);
                if (servicio) {
                    precioServicio = servicio.precio;
                }
            }
            const porcentaje = (configNegocio.valor_anticipo || 0) / 100;
            montoAnticipo = Math.round(precioServicio * porcentaje);
        }
        
        const mensajeWhatsApp = 
`💅 RESERVA PENDIENTE DE PAGO - ${config.nombre}

Cliente: ${booking.cliente_nombre}
WhatsApp: ${booking.cliente_whatsapp}
Servicio: ${booking.servicio} (${booking.duracion} min)
Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Profesional: ${profesional}
Monto anticipo: $${montoAnticipo}

Ingresa al panel para confirmar el pago:
${window.location.origin}/acrika-nails/admin.html`;

        window.enviarWhatsApp(config.telefono, mensajeWhatsApp);
        
        const mensajePush = `Cliente: ${booking.cliente_nombre} Servicio: ${booking.servicio} Monto: $${montoAnticipo}`;

        await window.enviarNotificacionPush(
            `Pago pendiente - ${config.nombre}`,
            mensajePush,
            'moneybag',
            'high'
        );
        
        console.log('✅ Notificación de reserva pendiente enviada');
        return true;
        
    } catch (error) {
        console.error('Error en notificarReservaPendiente:', error);
        return false;
    }
};

// ============================================
// CONFIRMACIÓN DE PAGO (CUANDO ADMIN CONFIRMA)
// ============================================
window.enviarConfirmacionPago = async function(booking, configNegocio) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('🎉 Enviando confirmación de pago al cliente...');

        if (!configNegocio) {
            configNegocio = await window.cargarConfiguracionNegocio();
        }

        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;

        const nombreNegocio = configNegocio?.nombre || 'Mi Salon';

        const mensajeConfirmacion = 
`💅 ${nombreNegocio} - Turno Confirmado 🎉

Hola ${booking.cliente_nombre}, tu turno ha sido CONFIRMADO!

Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Servicio: ${booking.servicio}
Profesional: ${booking.profesional_nombre || booking.trabajador_nombre}

Pago recibido correctamente

Te esperamos ❤️
Cualquier cambio, podes cancelarlo desde la app con hasta 1 hora de anticipacion.`;

        window.enviarWhatsApp(booking.cliente_whatsapp, mensajeConfirmacion);
        
        console.log('✅ Mensaje de confirmación de pago enviado');
        return true;

    } catch (error) {
        console.error('Error en enviarConfirmacionPago:', error);
        return false;
    }
};

console.log('✅ whatsapp-helper.js - VERSION COMPLETA CORREGIDA CARGADA');