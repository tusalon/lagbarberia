// utils/membresia.js - Programa de cliente fiel por citas completadas

console.log('🎟️ membresia.js cargado');

(function() {
    function getNegocioIdMembresia() {
        if (typeof window.getNegocioIdFromConfig === 'function') return window.getNegocioIdFromConfig();
        if (localStorage.getItem('negocioId')) return localStorage.getItem('negocioId');
        if (window.NEGOCIO_ID_POR_DEFECTO) return window.NEGOCIO_ID_POR_DEFECTO;
        if (typeof window.getNegocioId === 'function') return window.getNegocioId();
        return null;
    }

    function normalizarTelefono(telefono) {
        const limpio = String(telefono || '').replace(/\D/g, '');
        if (!limpio) return '';
        const local = getTelefonoLocal(telefono);
        return local ? `53${local}` : limpio;
    }

    function getTelefonoLocal(telefono) {
        const limpio = String(telefono || '').replace(/\D/g, '');
        if (!limpio) return '';
        return limpio.length > 8 ? limpio.slice(-8) : limpio;
    }

    function variantesTelefono(telefono) {
        const limpio = String(telefono || '').replace(/\D/g, '');
        const local = getTelefonoLocal(telefono);
        const normalizado = normalizarTelefono(telefono);
        return Array.from(new Set([
            normalizado,
            local,
            limpio,
            local ? `5353${local}` : ''
        ].filter(Boolean)));
    }

    function getConfigMembresia(config = {}) {
        return {
            activa: config.membresia_activa === true,
            citasRequeridas: Math.max(1, Number(config.membresia_citas_requeridas || 5)),
            descuentoPorcentaje: Math.max(0, Math.min(100, Number(config.membresia_descuento_porcentaje || 0))),
            contarDesde: config.membresia_contar_desde || null
        };
    }

    function getReservaDateTime(reserva) {
        if (!reserva?.fecha) return null;
        const partesHora = String(reserva.hora_inicio || '00:00').split(':');
        const hora = `${(partesHora[0] || '00').padStart(2, '0')}:${(partesHora[1] || '00').padStart(2, '0')}`;
        const fecha = new Date(`${reserva.fecha}T${hora}:00`);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    function getFechaCorteMasReciente(...fechas) {
        return fechas
            .filter(Boolean)
            .map(fecha => new Date(fecha))
            .filter(fecha => !Number.isNaN(fecha.getTime()))
            .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    }

    async function calcularPrecioServicios(servicioNombre) {
        try {
            if (!window.salonServicios) return 0;
            const servicios = await window.salonServicios.getAll(true);
            const nombres = String(servicioNombre || '').split(' + ').map(nombre => nombre.trim()).filter(Boolean);

            return nombres.reduce((total, nombre) => {
                const servicio = (servicios || []).find(item => item.nombre === nombre);
                return total + (parseFloat(servicio?.precio) || 0);
            }, 0);
        } catch (error) {
            console.error('Error calculando precio de membresía:', error);
            return 0;
        }
    }

    async function getHistorialClienteMembresia(whatsapp) {
        try {
            const negocioId = getNegocioIdMembresia();
            const variantes = variantesTelefono(whatsapp);
            if (!negocioId || !variantes.length || !window.SUPABASE_URL) return [];

            const orFilter = variantes.map(numero => `cliente_whatsapp.eq.${numero}`).join(',');
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/reservas?negocio_id=eq.${negocioId}&or=(${orFilter})&select=id,fecha,hora_inicio,estado,cliente_whatsapp,membresia_descuento_aplicado&order=fecha.asc,hora_inicio.asc`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    cache: 'no-store'
                }
            );

            if (!response.ok) {
                console.error('Error cargando historial de membresía:', await response.text());
                return [];
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error en getHistorialClienteMembresia:', error);
            return [];
        }
    }

    async function getResetClienteMembresia(whatsapp) {
        try {
            const negocioId = getNegocioIdMembresia();
            const variantes = variantesTelefono(whatsapp);
            if (!negocioId || !variantes.length || !window.SUPABASE_URL) return null;

            const orFilter = variantes.map(numero => `whatsapp.eq.${numero}`).join(',');
            const response = await fetch(
                `${window.SUPABASE_URL}/rest/v1/clientes_autorizados?negocio_id=eq.${negocioId}&or=(${orFilter})&select=membresia_reset_at&limit=1`,
                {
                    headers: {
                        'apikey': window.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    cache: 'no-store'
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            return Array.isArray(data) ? data[0]?.membresia_reset_at || null : null;
        } catch (error) {
            console.error('Error cargando reset de membresía:', error);
            return null;
        }
    }

    async function evaluarMembresia(bookingData, configGlobal = null) {
        const config = configGlobal || (window.salonConfig ? await window.salonConfig.get() : {});
        const membresia = getConfigMembresia(config);
        const precioOriginal = Number(bookingData.precio_original || bookingData.precio || await calcularPrecioServicios(bookingData.servicio) || 0);
        const base = {
            califica: false,
            citasCompletadas: 0,
            citasRequeridas: membresia.citasRequeridas,
            descuentoPorcentaje: membresia.descuentoPorcentaje,
            precioOriginal,
            descuentoMonto: 0,
            precioFinal: precioOriginal
        };

        if (!membresia.activa || membresia.descuentoPorcentaje <= 0) return base;

        const [historialCompleto, resetCliente] = await Promise.all([
            getHistorialClienteMembresia(bookingData.cliente_whatsapp),
            getResetClienteMembresia(bookingData.cliente_whatsapp)
        ]);
        const fechaCorte = getFechaCorteMasReciente(membresia.contarDesde, resetCliente);
        const historial = fechaCorte
            ? historialCompleto.filter(reserva => {
                const fechaReserva = getReservaDateTime(reserva);
                return fechaReserva && fechaReserva >= fechaCorte;
            })
            : historialCompleto;
        const ultimoDescuentoIndex = historial.reduce((ultimo, reserva, index) => {
            return reserva.membresia_descuento_aplicado && reserva.estado !== 'Cancelado' ? index : ultimo;
        }, -1);
        const historialCiclo = historial.slice(ultimoDescuentoIndex + 1);
        const tieneDescuentoPendiente = historial.some(reserva =>
            reserva.membresia_descuento_aplicado &&
            (reserva.estado === 'Reservado' || reserva.estado === 'Pendiente')
        );
        const citasCompletadas = historialCiclo.filter(reserva => reserva.estado === 'Completado').length;
        const califica = !tieneDescuentoPendiente && citasCompletadas >= membresia.citasRequeridas;

        if (!califica || precioOriginal <= 0) {
            return { ...base, califica, citasCompletadas };
        }

        const descuentoMonto = Math.round(precioOriginal * (membresia.descuentoPorcentaje / 100));
        return {
            califica: true,
            citasCompletadas,
            citasRequeridas: membresia.citasRequeridas,
            descuentoPorcentaje: membresia.descuentoPorcentaje,
            precioOriginal,
            descuentoMonto,
            precioFinal: Math.max(0, precioOriginal - descuentoMonto)
        };
    }

    async function aplicarMembresiaReserva(bookingData, configGlobal = null) {
        const evaluacion = await evaluarMembresia(bookingData, configGlobal);
        return {
            ...bookingData,
            membresia_descuento_aplicado: evaluacion.califica,
            membresia_citas_requeridas: evaluacion.citasRequeridas,
            membresia_citas_completadas: evaluacion.citasCompletadas,
            membresia_descuento_porcentaje: evaluacion.califica ? evaluacion.descuentoPorcentaje : 0,
            precio_original: evaluacion.precioOriginal,
            descuento_monto: evaluacion.califica ? evaluacion.descuentoMonto : 0,
            precio_final: evaluacion.califica ? evaluacion.precioFinal : evaluacion.precioOriginal
        };
    }

    function generarTextoMembresia(booking) {
        if (!booking?.membresia_descuento_aplicado) return '';
        const precioOriginal = Number(booking.precio_original || 0);
        const precioFinal = Number(booking.precio_final || 0);
        const descuentoPorcentaje = Number(booking.membresia_descuento_porcentaje || 0);
        const descuentoMonto = Number(booking.descuento_monto || Math.max(0, precioOriginal - precioFinal));

        return `\n🎟️ *Cliente fiel:* este turno saldrá en *${precioFinal} CUP* con un descuento de *${descuentoPorcentaje}%* (${descuentoMonto} CUP) por tus citas completadas.`;
    }

    window.getConfigMembresia = getConfigMembresia;
    window.evaluarMembresia = evaluarMembresia;
    window.aplicarMembresiaReserva = aplicarMembresiaReserva;
    window.generarTextoMembresia = generarTextoMembresia;
})();
