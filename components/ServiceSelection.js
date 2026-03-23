// components/ServiceSelection.js - Versión masculina

function ServiceSelection({ onSelect, selectedService }) {
    const [services, setServices] = React.useState([]);
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        cargarServicios();
        
        const handleActualizacion = () => cargarServicios();
        window.addEventListener('serviciosActualizados', handleActualizacion);
        
        return () => {
            window.removeEventListener('serviciosActualizados', handleActualizacion);
        };
    }, []);

    const cargarServicios = async () => {
        setCargando(true);
        try {
            console.log('📋 Cargando servicios...');
            if (window.salonServicios) {
                const serviciosActivos = await window.salonServicios.getAll(true);
                console.log('✅ Servicios obtenidos:', serviciosActivos);
                setServices(serviciosActivos || []);
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
            setServices([]);
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                    <span className="text-2xl">✂️</span>
                    1. Elegí tu servicio
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-amber-500 rounded-full mx-auto"></div>
                    <p className="text-amber-500 mt-4">Cargando servicios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                <span className="text-2xl">✂️</span>
                1. Elegí tu servicio
                {selectedService && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full ml-2">
                        ✓ Seleccionado
                    </span>
                )}
            </h2>
            
            {services.length === 0 ? (
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200">
                    <p className="text-amber-600">No hay servicios disponibles</p>
                    <p className="text-xs text-amber-500 mt-2">El administrador debe cargar servicios primero</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {services.map(service => (
                        <button
                            key={service.id}
                            onClick={() => onSelect(service)}
                            className={`
                                p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-[1.02]
                                ${selectedService?.id === service.id 
                                    ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-300 shadow-md' 
                                    : 'border-amber-200 bg-white/80 backdrop-blur-sm hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-sm'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">
                                            {service.nombre.toLowerCase().includes('corte') ? '✂️' : 
                                             service.nombre.toLowerCase().includes('barba') ? '🧔' :
                                             service.nombre.toLowerCase().includes('afeitado') ? '🪒' :
                                             service.nombre.toLowerCase().includes('ceja') ? '👁️' : '⚡'}
                                        </span>
                                        <span className="font-medium text-amber-800 text-lg block">
                                            {service.nombre}
                                        </span>
                                    </div>
                                    {service.descripcion && (
                                        <p className="text-sm text-amber-600/70 mt-1 ml-8">{service.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-4">
                                    <span className="text-amber-600 font-bold text-lg">
                                        ${service.precio}
                                    </span>
                                    <span className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                        <span className="mr-1">⏱️</span>
                                        {service.duracion} min
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}