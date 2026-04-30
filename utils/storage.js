// utils/storage.js - Funciones para manejar imágenes en Supabase Storage

console.log('📦 storage.js cargado');

const STORAGE_BUCKET = 'servicios-imagenes';

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - El archivo de imagen a subir
 * @param {number} servicioId - ID del servicio para nombrar la imagen
 * @returns {Promise<string|null>} - URL pública de la imagen o null si error
 */
window.subirImagenServicio = async function(file, servicioId) {
    try {
        if (!file) {
            console.error('No se proporcionó archivo');
            return null;
        }

        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten archivos de imagen');
            return null;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no puede superar los 2MB');
            return null;
        }

        const extension = file.name.split('.').pop();
        const fileName = `servicio-${servicioId}-${Date.now()}.${extension}`;
        
        console.log('📤 Subiendo imagen:', fileName);

        const response = await fetch(
            `${window.SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`,
            {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                },
                body: file
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('Error al subir imagen:', error);
            return null;
        }

        const publicUrl = `${window.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
        console.log('✅ Imagen subida:', publicUrl);
        
        return publicUrl;
    } catch (error) {
        console.error('Error en subirImagenServicio:', error);
        return null;
    }
};

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} imagenUrl - URL completa de la imagen
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
window.eliminarImagenServicio = async function(imagenUrl) {
    try {
        if (!imagenUrl) return true;

        const urlParts = imagenUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        console.log('🗑️ Eliminando imagen:', fileName);

        const response = await fetch(
            `${window.SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                }
            }
        );

        if (!response.ok) {
            console.error('Error al eliminar imagen:', await response.text());
            return false;
        }

        console.log('✅ Imagen eliminada');
        return true;
    } catch (error) {
        console.error('Error en eliminarImagenServicio:', error);
        return false;
    }
};

console.log('✅ storage.js funciones disponibles');
