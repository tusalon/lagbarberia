// components/admin/SolicitudesPanel.js

function SolicitudesPanel({ onActualizar }) {
    const [solicitudes, setSolicitudes] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);
    const [procesando, setProcesando] = React.useState(null);

    React.useEffect(() => {
        cargarSolicitudes();
        
        // Recargar cada 30 segundos
        const intervalo = setInterval(cargarSolicitudes, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarSolicitudes = async () => {
        setCargando(true);
        try {
            const lista = await window.getSolicitudesPendientes();
            setSolicitudes(lista || []);
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleAprobar = async (solicitud) => {
        if (!confirm(`¿Aprobar el registro de ${solicitud.nombre}?`)) return;
        
        setProcesando(solicitud.id);
        try {
            const ok = await window.aprobarSolicitudCliente(
                solicitud.id,
                solicitud.nombre,
                solicitud.whatsapp
            );
            
            if (ok) {
                alert(`✅ Cliente ${solicitud.nombre} registrado correctamente`);
                await cargarSolicitudes();
                if (onActualizar) onActualizar();
            } else {
                alert('❌ Error al aprobar la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        } finally {
            setProcesando(null);
        }
    };

    const handleRechazar = async (solicitud) => {
        if (!confirm(`¿Rechazar el registro de ${solicitud.nombre}?`)) return;
        
        setProcesando(solicitud.id);
        try {
            const ok = await window.rechazarSolicitudCliente(solicitud.id);
            if (ok) {
                alert(`❌ Solicitud de ${solicitud.nombre} rechazada`);
                await cargarSolicitudes();
            } else {
                alert('Error al rechazar la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        } finally {
            setProcesando(null);
        }
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '';
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando solicitudes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Solicitudes de Registro
                    {solicitudes.length > 0 && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                            {solicitudes.length} pendiente{solicitudes.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </h2>
                <button 
                    onClick={cargarSolicitudes}
                    className="text-pink-600 hover:text-pink-800"
                    title="Actualizar"
                >
                    <i className="icon-refresh-cw"></i>
                </button>
            </div>

            {solicitudes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-gray-500">No hay solicitudes pendientes</p>
                    <p className="text-sm text-gray-400 mt-1">Los nuevos clientes aparecerán aquí</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {solicitudes.map(solicitud => (
                        <div key={solicitud.id} className="border border-pink-200 rounded-lg p-4 bg-pink-50/30">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {solicitud.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {solicitud.nombre}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                📱 {solicitud.whatsapp}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                        <span className="flex items-center gap-1">
                                            <span>📅</span>
                                            Solicitado: {formatearFecha(solicitud.fecha_solicitud)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAprobar(solicitud)}
                                        disabled={procesando === solicitud.id}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {procesando === solicitud.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <span>✅</span>
                                        )}
                                        Aprobar
                                    </button>
                                    
                                    <button
                                        onClick={() => handleRechazar(solicitud)}
                                        disabled={procesando === solicitud.id}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {procesando === solicitud.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <span>❌</span>
                                        )}
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Info adicional */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
                <div className="flex items-center gap-2">
                    <span>💡</span>
                    <span>
                        Cuando apruebes una solicitud, el cliente recibirá una notificación por WhatsApp 
                        y podrá comenzar a reservar turnos.
                    </span>
                </div>
            </div>
        </div>
    );
}