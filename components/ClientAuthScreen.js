// components/ClientAuthScreen.js - VERSIÓN REGISTRO AUTOMÁTICO

function ClientAuthScreen({ onAccessGranted, onGoBack }) {
    const [config, setConfig] = React.useState(null);
    const [cargando, setCargando] = React.useState(true);
    const [imagenCargada, setImagenCargada] = React.useState(false);
    const [nombre, setNombre] = React.useState('');
    const [whatsapp, setWhatsapp] = React.useState('');
    const [error, setError] = React.useState('');
    const [clienteAutorizado, setClienteAutorizado] = React.useState(null);
    const [verificando, setVerificando] = React.useState(false);
    const [esProfesional, setEsProfesional] = React.useState(false);
    const [profesionalInfo, setProfesionalInfo] = React.useState(null);
    const [esAdmin, setEsAdmin] = React.useState(false);

    // Cargar configuración del negocio y la imagen
    React.useEffect(() => {
        const cargarDatos = async () => {
            const configData = await window.cargarConfiguracionNegocio();
            setConfig(configData);
            setCargando(false);
        };
        cargarDatos();

        // Precargar la imagen de fondo
        const img = new Image();
        img.src = 'images/LAG.barberia.jpg';
        img.onload = () => setImagenCargada(true);
        img.onerror = () => setImagenCargada(true);
    }, []);

   // ============================================
// FUNCIÓN PARA VERIFICAR NÚMERO (CORREGIDA DEFINITIVA)
// ============================================
const verificarNumero = async (numero) => {
    if (numero.length < 8) {
        setClienteAutorizado(null);
        setEsProfesional(false);
        setProfesionalInfo(null);
        setEsAdmin(false);
        setError('');
        return;
    }
    
    setVerificando(true);
    
    const numeroLimpio = numero.replace(/\D/g, '');
    const numeroCompleto = `53${numeroLimpio}`;
    
    try {
        // 🔥 VERIFICAR SI ES ADMIN (DUEÑO) - VERSIÓN CORREGIDA DEFINITIVA
        if (numeroLimpio === config?.telefono?.replace(/\D/g, '')) {
            console.log('👑 Número de administración detectado para Negocio de Prueba');
            
            // 🔥 OBTENER EL NEGOCIO_ID CORRECTO
            const negocioId = window.NEGOCIO_ID_POR_DEFECTO || 
                              (typeof window.getNegocioId === 'function' ? 
                               window.getNegocioId() : 
                               '1dc5adc6-ed9e-4931-833f-4f71645c9ef3');
            
            // 🔥 LIMPIAR CUALQUIER ID ANTERIOR
            localStorage.removeItem('negocioId');
            localStorage.removeItem('negocioNombre');
            
            // 🔥 GUARDAR EL ID CORRECTO
            localStorage.setItem('negocioId', negocioId);
            localStorage.setItem('negocioNombre', config?.nombre || 'Negocio de Prueba');
            
            console.log('✅ negocioId guardado en localStorage:', negocioId);
            console.log('✅ negocioNombre guardado:', config?.nombre);
            
            // Verificar si ya tiene sesión activa
            const loginTime = localStorage.getItem('adminLoginTime');
            const tieneSesion = loginTime && (Date.now() - parseInt(loginTime)) < 8 * 60 * 60 * 1000;
            
            if (tieneSesion) {
                console.log('➡️ Redirigiendo a admin.html');
                window.location.href = 'admin.html';
            } else {
                console.log('➡️ Redirigiendo a admin-login.html');
                window.location.href = 'admin-login.html';
            }
            return;
        }
        
        // Verificar si es PROFESIONAL
        if (window.verificarProfesionalPorTelefono) {
            const profesional = await window.verificarProfesionalPorTelefono(numeroLimpio);
            if (profesional) {
                setEsProfesional(true);
                setProfesionalInfo(profesional);
                setEsAdmin(false);
                setClienteAutorizado(null);
                setVerificando(false);
                return;
            }
        }
        
        // Verificar si es CLIENTE AUTORIZADO
        const existe = await window.verificarAccesoCliente(numeroCompleto);
        
        if (existe) {
            setClienteAutorizado(existe);
            setEsProfesional(false);
            setEsAdmin(false);
            setError('');
        } else {
            setClienteAutorizado(null);
            setError('');
        }
    } catch (err) {
        console.error('Error verificando:', err);
    } finally {
        setVerificando(false);
    }
};
  // ============================================
// FUNCIÓN CORREGIDA - SOLICITUD DE REGISTRO
// ============================================
const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim() || !whatsapp.trim()) {
        setError('Completá todos los campos');
        return;
    }
    
    if (esAdmin || esProfesional) {
        return;
    }
    
    setVerificando(true);
    
    const numeroLimpio = whatsapp.replace(/\D/g, '');
    const numeroCompleto = `53${numeroLimpio}`;
    
    try {
        // 1. Verificar si ya es cliente autorizado
        const autorizado = await window.verificarAccesoCliente(numeroCompleto);
        
        if (autorizado) {
            console.log('✅ Cliente encontrado, acceso directo:', autorizado);
            onAccessGranted(autorizado.nombre, numeroCompleto);
            return;
        }
        
        // 2. Verificar si hay solicitud pendiente
        const solicitudPendiente = await window.verificarSolicitudPendiente(numeroCompleto);
        
        if (solicitudPendiente) {
            setError('⚠️ Ya enviaste una solicitud de registro. Esperá la confirmación del administrador.');
            setVerificando(false);
            return;
        }
        
        // 3. Crear nueva solicitud
        const resultado = await window.crearSolicitudRegistro(nombre, numeroCompleto);
        
        if (resultado.success && resultado.yaRegistrado) {
            // Ya estaba registrado (caso borde)
            onAccessGranted(resultado.cliente.nombre, numeroCompleto);
        } else if (resultado.success) {
            // Solicitud creada exitosamente
            setError('📋 ¡Solicitud enviada! Te avisaremos por WhatsApp cuando tu registro sea aprobado.');
            // Limpiar formulario
            setNombre('');
            setWhatsapp('');
            // Limpiar mensaje después de 5 segundos
            setTimeout(() => {
                setError('');
            }, 5000);
        } else if (resultado.yaSolicitado) {
            setError(resultado.mensaje || 'Ya hay una solicitud pendiente para este número.');
        } else {
            setError(resultado.error || 'Error al enviar la solicitud. Intentá más tarde.');
        }
        
    } catch (err) {
        console.error('Error en submit:', err);
        setError('Error en el sistema. Intentá más tarde.');
    } finally {
        setVerificando(false);
    }
};

    // 🔥 FUNCIÓN CORREGIDA - USA EL ID DE CONFIG-NEGOCIO.JS
    const handleAccesoDirecto = () => {
        if (clienteAutorizado) {
            const numeroLimpio = whatsapp.replace(/\D/g, '');
            const numeroCompleto = `53${numeroLimpio}`;
            
            // 🔥 OBTENER EL ID DESDE CONFIG-NEGOCIO.JS
            const negocioId = window.NEGOCIO_ID_POR_DEFECTO || 
                              (typeof window.getNegocioId === 'function' ? 
                               window.getNegocioId() : 
                               '1dc5adc6-ed9e-4931-833f-4f71645c9ef3');
            
            localStorage.setItem('negocioId', negocioId);
            
            // También guardar nombre para el header
            if (config) {
                localStorage.setItem('negocioNombre', config.nombre);
            }
            
            console.log('✅ negocioId guardado en localStorage:', negocioId);
            
            onAccessGranted(clienteAutorizado.nombre, numeroCompleto);
        }
    };

    if (cargando || !imagenCargada) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 to-stone-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    const colorPrimario = config?.color_primario || '#8b5a2b';
    const colorSecundario = config?.color_secundario || '#d6a354';
    const nombreNegocio = config?.nombre || 'LAG Barberia';
    const telefonoDuenno = config?.telefono || '55002272';
    const logoUrl = config?.logo_url;
    const sticker = config?.especialidad?.toLowerCase().includes('uñas') ? '✂️' : 
                    config?.especialidad?.toLowerCase().includes('pelo') ? '💇' : 
                    config?.especialidad?.toLowerCase().includes('barber') ? '💈' : '🪒';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Imagen de fondo */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="images/LAG.barberia.jpg" 
                    alt="Fondo de barbería" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Botón volver */}
            {onGoBack && (
                <button
                    onClick={onGoBack}
                    className="absolute top-4 left-4 z-20 w-10 h-10 bg-zinc-950/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-zinc-900 transition-colors border border-amber-400"
                    title="Volver"
                >
                    <i className="icon-arrow-left text-white text-xl"></i>
                </button>
            )}

            <div className="relative z-10 max-w-md w-full mx-auto">
                <div className="bg-black/15 backdrop-blur-[1px] p-8 rounded-2xl shadow-2xl border border-amber-400/25">
                    {/* Logo o sticker */}
                    <div className="text-center mb-6">
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt={nombreNegocio} 
                                className="w-20 h-20 object-contain mx-auto rounded-xl ring-4 ring-amber-400/35"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl mx-auto flex items-center justify-center bg-zinc-950 ring-4 ring-amber-400/35">
                                <span className="text-3xl">{sticker}</span>
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-white mt-4">{nombreNegocio}</h1>
                        <p className="text-amber-300 mt-1">💈 Cortes, barba y estilo 💈</p>
                    </div>

                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2 bg-zinc-950/30 p-3 rounded-lg">
                        <span>🪒</span>
                        Ingresá con tu número
                        <span>🪒</span>
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo de nombre */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">
                                Tu nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border border-amber-400/30 bg-black/20 text-white placeholder-zinc-300/60 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition ${
                                    esAdmin || esProfesional ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                                placeholder="Ej: María Pérez"
                                disabled={esAdmin || esProfesional}
                            />
                        </div>

                        {/* Campo de WhatsApp */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">
                                Tu WhatsApp
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-amber-400/30 bg-black/20 text-amber-300 text-sm">
                                    +53
                                </span>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setWhatsapp(value);
                                        verificarNumero(value);
                                    }}
                                    className="w-full px-4 py-3 rounded-r-lg border border-amber-400/30 bg-black/20 text-white placeholder-zinc-300/60 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                                    placeholder="51234567"
                                    required
                                />
                            </div>
                            <p className="text-xs text-amber-100/65 mt-1">
                                Ingresá tu número de WhatsApp (8 dígitos después del +53)
                            </p>
                        </div>

                        {/* Indicador de verificación */}
                        {verificando && (
                            <div className="text-amber-300 text-sm bg-zinc-950/20 p-2 rounded-lg flex items-center gap-2 border border-amber-400/30">
                                <div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                                Verificando...
                            </div>
                        )}

                        {/* Mensajes según el rol detectado */}
                        {esAdmin && !verificando && (
                            <div className="bg-zinc-950/30 border border-amber-400/25 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        A
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-xl">
                                            ¡Bienvenido Administración!
                                        </p>
                                        <p className="text-amber-100/80 text-sm">
                                            Hacé clic en el botón de abajo para acceder al panel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {esProfesional && profesionalInfo && !verificando && (
                            <div className="bg-zinc-950/30 border border-amber-400/25 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        P
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-xl">
                                            ¡Hola {profesionalInfo.nombre}!
                                        </p>
                                        <p className="text-amber-100/80 text-sm">
                                            Hacé clic en el botón de abajo para acceder a tu panel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {clienteAutorizado && !verificando && !esAdmin && !esProfesional && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        C
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-green-400 font-bold text-xl">
                                            ¡Hola {clienteAutorizado.nombre}!
                                        </p>
                                        <p className="text-green-400/80 text-sm">
                                            Ya tenés acceso para reservar turnos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mensajes de error */}
                        {error && !esAdmin && !esProfesional && (
                            <div className="text-sm p-3 rounded-lg flex items-start gap-2 bg-red-500/20 text-red-300 border border-red-500/30">
                                <i className="icon-triangle-alert mt-0.5"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="space-y-3 pt-2">
                            {esAdmin && !verificando && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('adminAuth', 'true');
                                        localStorage.setItem('adminUser', 'Administración');
                                        localStorage.setItem('adminLoginTime', Date.now());
                                        window.location.href = 'admin.html';
                                    }}
                                    className="w-full bg-white text-zinc-900 py-4 rounded-xl font-bold hover:bg-amber-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-amber-400"
                                >
                                    <span className="text-xl">⚡</span>
                                    Ingresar como Administración
                                </button>
                            )}

                            {esProfesional && profesionalInfo && !verificando && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('profesionalAuth', JSON.stringify({
                                            id: profesionalInfo.id,
                                            nombre: profesionalInfo.nombre,
                                            telefono: profesionalInfo.telefono,
                                            nivel: profesionalInfo.nivel || 1
                                        }));
                                        window.location.href = 'admin.html';
                                    }}
                                    className="w-full bg-white text-zinc-900 py-4 rounded-xl font-bold hover:bg-amber-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-amber-400"
                                >
                                    <span className="text-xl">✂️</span>
                                    Ingresar como Profesional
                                </button>
                            )}

                            {clienteAutorizado && !verificando && !esAdmin && !esProfesional && (
                                <button
                                    type="button"
                                    onClick={handleAccesoDirecto}
                                    className="w-full bg-white text-zinc-900 py-4 rounded-xl font-bold hover:bg-amber-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-amber-400"
                                >
                                    <span className="text-xl">📱</span>
                                    Ingresar como Cliente
                                </button>
                            )}

                            {!clienteAutorizado && !esAdmin && !esProfesional && !verificando && (
                                <button
                                    type="submit"
                                    disabled={verificando}
                                    className="w-full bg-zinc-950 text-white py-4 rounded-xl font-bold hover:bg-zinc-900 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg border-2 border-amber-400"
                                >
                                    <span className="text-xl">✂️</span>
                                    {verificando ? 'Verificando...' : 'Registrarme y Reservar'}
                                    <span className="text-xl">✨</span>
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Stickers decorativos flotantes */}
                    <div className="absolute -bottom-6 -right-6 text-7xl opacity-20 rotate-12 select-none">💇</div>
                    <div className="absolute -top-6 -left-6 text-7xl opacity-20 -rotate-12 select-none">✂️</div>
                    <div className="absolute top-1/2 -translate-y-1/2 -right-8 text-5xl opacity-10 select-none">💈</div>
                </div>
            </div>
        </div>
    );
}



