// components/WelcomeScreen.js - Versión con REDES SOCIALES (CORREGIDA - SIN DESBORDAMIENTO)

function WelcomeScreen({ onStart, onGoBack, cliente, userRol }) {
    const [config, setConfig] = React.useState(null);
    const [cargando, setCargando] = React.useState(true);
    const [imagenCargada, setImagenCargada] = React.useState(false);

    React.useEffect(() => {
        const cargarDatos = async () => {
            const configData = await window.cargarConfiguracionNegocio();
            console.log('📱 WelcomeScreen - Config cargada:', configData);
            setConfig(configData);
            setCargando(false);
        };
        cargarDatos();

        // Precargar la imagen de fondo (LAG Barberia)
        const img = new Image();
        img.src = "/lagbarberia/images/LAG.barberia.png";
        img.onload = () => {
            console.log('✅ Imagen de fondo cargada correctamente');
            setImagenCargada(true);
        };
        img.onerror = () => {
            console.error('❌ Error cargando imagen de fondo, usando fallback');
            setImagenCargada(true);
        };
    }, []);

    if (cargando || !imagenCargada) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amber-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const colorPrimario = config?.color_primario || '#c49b63';
    const sticker = config?.especialidad?.toLowerCase().includes('barberia') ? '✂️' : 
                    config?.especialidad?.toLowerCase().includes('corte') ? '💈' : 
                    config?.especialidad?.toLowerCase().includes('barba') ? '🧔' : '✂️';

    // ============================================
    // FUNCIONES PARA ABRIR REDES SOCIALES
    // ============================================
    
    const abrirWhatsApp = () => {
        if (!config?.telefono) {
            alert('📱 El número de WhatsApp no está configurado');
            return;
        }
        
        const telefonoLimpio = config.telefono.replace(/\D/g, '');
        const mensaje = encodeURIComponent(`Hola! Quiero consultar sobre turnos en ${config?.nombre || 'la barbería'}`);
        
        window.open(`https://wa.me/${telefonoLimpio}?text=${mensaje}`, '_blank');
    };

    const abrirInstagram = () => {
        if (!config?.instagram) {
            alert('📷 El usuario de Instagram no está configurado');
            return;
        }
        
        let usuario = config.instagram.replace('@', '').trim();
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            window.location.href = `instagram://user?username=${usuario}`;
            
            setTimeout(() => {
                window.open(`https://instagram.com/${usuario}`, '_blank');
            }, 1000);
        } else {
            window.open(`https://instagram.com/${usuario}`, '_blank');
        }
    };

    const abrirFacebook = () => {
        if (!config?.facebook) {
            alert('👤 La página de Facebook no está configurada');
            return;
        }
        
        let pagina = config.facebook.trim();
        
        if (!pagina.startsWith('http')) {
            pagina = pagina.replace('@', '');
            pagina = `https://facebook.com/${pagina}`;
        }
        
        window.open(pagina, '_blank');
    };

    const tieneWhatsApp = config?.telefono && config.telefono.length >= 8;
    const tieneInstagram = config?.instagram && config.instagram.trim() !== '';
    const tieneFacebook = config?.facebook && config.facebook.trim() !== '';
    
    const tieneRedes = tieneWhatsApp || tieneInstagram || tieneFacebook;

    return (
        <div 
            className="relative min-h-screen w-full overflow-y-auto"
        >
            {/* Imagen de fondo fija - LAG BARBERIA */}
            <div className="fixed inset-0 z-0">
                <img 
                    src="/lag-barberia/images/LAG.barberia.png"
                    alt="LAG Barberia" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        console.error('❌ Error cargando imagen, usando fallback');
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1585747860714-2ba6b8d6c5c9?q=80&w=2070&auto=format&fit=crop';
                    }}
                />
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            {/* Botón volver - fijo en la parte superior */}
            {onGoBack && (
                <button
                    onClick={onGoBack}
                    className="fixed top-4 left-4 z-20 w-10 h-10 bg-amber-600/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors border border-amber-400"
                    title="Volver"
                >
                    <i className="icon-arrow-left text-white text-xl"></i>
                </button>
            )}

            {/* Contenido scrolleable */}
            <div className="relative z-10 min-h-screen flex items-start justify-center py-16 px-4">
                <div className="w-full max-w-2xl bg-black/40 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-amber-500/50 my-auto">
                    <div className="text-center space-y-6">
                        {/* Logo o sticker */}
                        {config?.logo_url ? (
                            <img 
                                src={config.logo_url} 
                                alt={config.nombre} 
                                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto rounded-2xl shadow-2xl ring-4 ring-amber-500/50"
                            />
                        ) : (
                            <div 
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mx-auto flex items-center justify-center shadow-2xl ring-4 ring-amber-500/50"
                                style={{ backgroundColor: colorPrimario }}
                            >
                                <span className="text-4xl sm:text-5xl">{sticker}</span>
                            </div>
                        )}
                        
                        {/* TÍTULO CORREGIDO - SIN DESBORDAMIENTO */}
                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg">
                                Bienvenido a
                            </h1>
                            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-amber-400 break-words px-2">
                                {config?.nombre || 'LAG Barberia'}
                            </div>
                        </div>
                        
                        {cliente && (
                            <p className="text-white/90 text-base sm:text-lg bg-black/30 inline-block px-4 py-1 rounded-full">
                                ✨ {cliente.nombre} ✨
                            </p>
                        )}
                        
                        <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-lg mx-auto px-2">
                            {config?.mensaje_bienvenida || '¡Bienvenido a LAG Barberia! El mejor lugar para cuidar tu estilo.'}
                        </p>

                        {/* BOTONES DE REDES SOCIALES */}
                        {tieneRedes && (
                            <div className="flex justify-center gap-3 sm:gap-4 pt-4 flex-wrap">
                                {tieneWhatsApp && (
                                    <button
                                        onClick={abrirWhatsApp}
                                        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center hover:scale-110 transition-all transform hover:shadow-xl border-2 border-white/50 group relative"
                                        title="Contactar por WhatsApp"
                                    >
                                        <i className="icon-message-circle text-white text-xl sm:text-2xl"></i>
                                        <span className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                            WhatsApp
                                        </span>
                                    </button>
                                )}
                                
                                {tieneInstagram && (
                                    <button
                                        onClick={abrirInstagram}
                                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center hover:scale-110 transition-all transform hover:shadow-xl border-2 border-white/50 group relative"
                                        title="Instagram"
                                    >
                                        <i className="icon-instagram text-white text-xl sm:text-2xl"></i>
                                        <span className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                            Instagram
                                        </span>
                                    </button>
                                )}
                                
                                {tieneFacebook && (
                                    <button
                                        onClick={abrirFacebook}
                                        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1877F2] rounded-full flex items-center justify-center hover:scale-110 transition-all transform hover:shadow-xl border-2 border-white/50 group relative"
                                        title="Facebook"
                                    >
                                        <i className="icon-facebook text-white text-xl sm:text-2xl"></i>
                                        <span className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                            Facebook
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="pt-4 sm:pt-6">
                            <button 
                                onClick={onStart}
                                className="text-white text-base sm:text-lg font-bold py-3 sm:py-4 px-8 sm:px-10 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center gap-2 mx-auto border-2 border-amber-400 w-full sm:w-auto"
                                style={{ backgroundColor: colorPrimario }}
                            >
                                <span className="text-lg sm:text-xl">✂️</span>
                                <span>Reservar Turno</span>
                                <span className="text-lg sm:text-xl">⚡</span>
                            </button>
                        </div>

                        {/* Horario de atención si está configurado */}
                        {config?.horario_atencion && (
                            <div className="text-xs sm:text-sm text-white/80 bg-black/30 p-3 rounded-lg mt-4">
                                <span className="font-semibold">🕐 Horario:</span> {config.horario_atencion}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stickers flotantes decorativos (fijos) */}
            <div className="fixed bottom-4 left-4 text-3xl sm:text-4xl opacity-30 rotate-12 select-none pointer-events-none">✂️</div>
            <div className="fixed top-20 right-4 text-3xl sm:text-4xl opacity-30 -rotate-12 select-none pointer-events-none">💈</div>
        </div>
    );
}