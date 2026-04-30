// components/Confirmation.js - VERSIÓN SIMPLIFICADA (SIN ENVÍO AUTOMÁTICO)

function Confirmation({ booking, onReset }) {
    const [telefonoDuenno, setTelefonoDuenno] = React.useState('55002272');
    const [nombreNegocio, setNombreNegocio] = React.useState('Negocio de Prueba');

    React.useEffect(() => {
        // Cargar datos del negocio
        const cargarDatos = async () => {
            try {
                const tel = await window.getTelefonoDuenno();
                const nombre = await window.getNombreNegocio();
                setTelefonoDuenno(tel);
                setNombreNegocio(nombre);
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        };
        cargarDatos();
    }, []);

    // ⚡ ELIMINADO: useEffect con setTimeout que causaba problemas en iOS
    // Ahora el WhatsApp se envía en BookingForm.js inmediatamente

    if (!booking) {
        console.error('❌ booking no definido');
        return null;
    }

    const fechaConDia = window.formatFechaCompleta ? 
        window.formatFechaCompleta(booking.fecha) : 
        booking.fecha;

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in bg-gradient-to-b from-stone-50 to-amber-50">
            <div className="w-20 h-20 bg-stone-500 rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ring-amber-300">
                <span className="text-4xl text-white">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">✨ ¡Turno Reservado! ✨</h2>
            <p className="text-stone-700 mb-6 max-w-xs mx-auto">Tu cita ha sido agendada correctamente</p>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-amber-300 w-full max-w-sm mb-6">
                <div className="space-y-4 text-left">
                    <div>
                        <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">Cliente</div>
                        <div className="font-medium text-stone-800 text-lg">{booking.cliente_nombre}</div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">WhatsApp</div>
                        <div className="font-medium text-stone-800">{booking.cliente_whatsapp}</div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">Servicio</div>
                        <div className="font-medium text-stone-800">{booking.servicio}</div>
                        <div className="text-sm text-amber-600">{booking.duracion} min</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">Fecha</div>
                            <div className="font-medium text-stone-800 text-sm">{fechaConDia}</div>
                        </div>
                        <div>
                            <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">Hora</div>
                            <div className="font-medium text-stone-800">{window.formatTo12Hour ? window.formatTo12Hour(booking.hora_inicio) : booking.hora_inicio}</div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">Profesional</div>
                        <div className="font-medium text-stone-800">{booking.profesional_nombre || booking.trabajador_nombre || 'No asignada'}</div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 max-w-sm w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-500 rounded-full flex items-center justify-center text-white text-xl">
                        📱
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-zinc-900">Administración notificada</p>
                        <p className="text-xs text-stone-700">✅ Notificaciones enviadas</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                    onClick={onReset}
                    className="w-full bg-stone-500 text-white py-4 rounded-xl font-bold hover:bg-zinc-950 transition-colors flex items-center justify-center gap-2 text-lg shadow-md"
                >
                    <span>✨</span>
                    Reservar otro turno
                    <span>✂️</span>
                </button>
                
                <div className="text-sm text-stone-700 bg-white/80 backdrop-blur-sm p-4 rounded-lg flex items-center justify-center gap-2 border border-amber-300">
                   <span className="text-amber-600 text-xl">📱</span>
                   <span>Contacto: +{telefonoDuenno}</span>
                </div>
            </div>
        </div>
    );
}
