// utils/auth-clients.js - VERSIÓN CON SOLICITUD DE REGISTRO (ADAPTADA A TU BD)

console.log('🚀 auth-clients.js CARGADO - MODO SOLICITUD DE REGISTRO');

// Helper para obtener negocio_id
function getNegocioId() {
    if (typeof window.getNegocioIdFromConfig !== 'undefined') {
        return window.getNegocioIdFromConfig();
    }
    return localStorage.getItem('negocioId');
}

// ============================================
// FUNCIÓN: CREAR SOLICITUD DE REGISTRO
// ============================================

window.crearSolicitudRegistro = async function(nombre, whatsapp) {
    try {
        const negocioId = getNegocioId();
        console.log('📝 Creando solicitud de registro:', { nombre, whatsapp, negocio: negocioId });
        
        // 1. Verificar si ya es cliente autorizado
        const clienteExistente = await window.verificarAccesoCliente(whatsapp);
        if (clienteExistente) {
            console.log('✅ Cliente ya existe, acceso directo');
            return { success: true, yaRegistrado: true, cliente: clienteExistente };
        }
        
        // 2. Verificar si ya hay una solicitud pendiente
        const solicitudExistente = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?negocio_id=eq.${negocioId}&whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (solicitudExistente.ok) {
            const data = await solicitudExistente.json();
            if (data && data.length > 0) {
                console.log('⚠️ Ya hay una solicitud pendiente para este número');
                return { success: false, yaSolicitado: true, mensaje: 'Ya enviaste una solicitud. Esperá la confirmación.' };
            }
        }
        
        // 3. Crear nueva solicitud
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes`,
            {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    negocio_id: negocioId,
                    nombre: nombre,
                    whatsapp: whatsapp,
                    estado: 'pendiente',
                    fecha_solicitud: new Date().toISOString(),
                    dispositivo_info: navigator.userAgent || 'web'
                })
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error al crear solicitud:', errorText);
            return { success: false, error: errorText };
        }
        
        const nuevaSolicitud = await response.json();
        console.log('✅ Solicitud creada:', nuevaSolicitud);
        
        // 4. Enviar notificación al admin
        await window.notificarNuevaSolicitudCliente({ nombre, whatsapp });
        
        return { success: true, solicitud: nuevaSolicitud };
        
    } catch (error) {
        console.error('❌ Error en crearSolicitudRegistro:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// VERIFICAR CLIENTE AUTORIZADO
// ============================================

window.verificarAccesoCliente = async function(whatsapp) {
    try {
        const negocioId = getNegocioId();
        console.log('🔍 Verificando acceso para:', whatsapp, 'negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?negocio_id=eq.${negocioId}&whatsapp=eq.${whatsapp}&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
        
    } catch (error) {
        console.error('Error en verificarAccesoCliente:', error);
        return null;
    }
};

// ============================================
// VERIFICAR SOLICITUD PENDIENTE
// ============================================

window.verificarSolicitudPendiente = async function(whatsapp) {
    try {
        const negocioId = getNegocioId();
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?negocio_id=eq.${negocioId}&whatsapp=eq.${whatsapp}&estado=eq.pendiente&select=*`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (!response.ok) return null;
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
        
    } catch (error) {
        console.error('Error verificando solicitud:', error);
        return null;
    }
};

// ============================================
// CREAR CLIENTE (solo admin al aprobar)
// ============================================

window.crearCliente = async function(nombre, whatsapp) {
    try {
        const negocioId = getNegocioId();
        console.log('➕ Creando nuevo cliente autorizado:', { nombre, whatsapp, negocio: negocioId });
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados`,
            {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    negocio_id: negocioId,
                    nombre: nombre,
                    whatsapp: whatsapp,
                    fecha_aprobacion: new Date().toISOString(),
                    fecha_registro: new Date().toISOString()
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Error al crear cliente:', error);
            return null;
        }
        
        const nuevoCliente = await response.json();
        console.log('✅ Cliente autorizado creado:', nuevoCliente);
        return Array.isArray(nuevoCliente) ? nuevoCliente[0] : nuevoCliente;
        
    } catch (error) {
        console.error('❌ Error en crearCliente:', error);
        return null;
    }
};

// ============================================
// OBTENER SOLICITUDES PENDIENTES (para admin)
// ============================================

window.getSolicitudesPendientes = async function() {
    try {
        const negocioId = getNegocioId();
        console.log('📋 Obteniendo solicitudes pendientes para negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?negocio_id=eq.${negocioId}&estado=eq.pendiente&order=fecha_solicitud.asc`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (!response.ok) return [];
        const data = await response.json();
        console.log('✅ Solicitudes pendientes:', data.length);
        return data;
        
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        return [];
    }
};

// ============================================
// APROBAR SOLICITUD
// ============================================

window.aprobarSolicitudCliente = async function(solicitudId, nombre, whatsapp) {
    try {
        const negocioId = getNegocioId();
        console.log('✅ Aprobando solicitud:', solicitudId);
        
        // 1. Crear el cliente autorizado
        const nuevoCliente = await window.crearCliente(nombre, whatsapp);
        
        if (!nuevoCliente) {
            console.error('Error al crear cliente');
            return false;
        }
        
        // 2. Actualizar estado de la solicitud
        const updateResponse = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?negocio_id=eq.${negocioId}&id=eq.${solicitudId}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: 'aprobada'
                })
            }
        );
        
        if (!updateResponse.ok) {
            console.error('Error al actualizar solicitud');
            return false;
        }
        
        // 3. Enviar notificación al cliente
        await window.notificarClienteAprobado(nombre, whatsapp);
        
        console.log('✅ Solicitud aprobada y cliente creado');
        return true;
        
    } catch (error) {
        console.error('Error aprobando solicitud:', error);
        return false;
    }
};

// ============================================
// RECHAZAR SOLICITUD
// ============================================

window.rechazarSolicitudCliente = async function(solicitudId) {
    try {
        const negocioId = getNegocioId();
        console.log('❌ Rechazando solicitud:', solicitudId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/cliente_solicitudes?negocio_id=eq.${negocioId}&id=eq.${solicitudId}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: 'rechazada'
                })
            }
        );
        
        return response.ok;
        
    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        return false;
    }
};

// ============================================
// OBTENER CLIENTES REGISTRADOS (para admin)
// ============================================

window.getClientesRegistrados = async function() {
    try {
        const negocioId = getNegocioId();
        console.log('📋 Obteniendo clientes registrados para negocio:', negocioId);
        
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?negocio_id=eq.${negocioId}&order=fecha_registro.desc`,
            {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        );
        
        if (!response.ok) return [];
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        return [];
    }
};

// ============================================
// ELIMINAR CLIENTE
// ============================================

window.eliminarCliente = async function(whatsapp) {
    try {
        const negocioId = getNegocioId();
        const response = await fetch(
            `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?negocio_id=eq.${negocioId}&whatsapp=eq.${whatsapp}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        );
        return response.ok;
        
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        return false;
    }
};

console.log('✅ auth-clients.js inicializado - MODO SOLICITUD DE REGISTRO ACTIVADO');