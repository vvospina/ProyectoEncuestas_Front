/**
 * Redimensiona una imagen a un tamaño pequeño (pensado para fotos de
 * perfil, no fotos de galería) y la convierte a un string Base64 listo
 * para guardar en Firestore.
 */
export function comprimirImagenABase64(archivo: File, maxLado = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onload = () => {
      const imagen = new Image();

      imagen.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
        const canvas = document.createElement('canvas');
        canvas.width = imagen.width * escala;
        canvas.height = imagen.height * escala;

        const contexto = canvas.getContext('2d');
        contexto?.drawImage(imagen, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      imagen.src = lector.result as string;
    };

    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
  });
}