// Recuerda en ESTE dispositivo si ya tiene huella/cara activada para la lista
// ("activado"). Si el navegador borra esto,
// el pop-up puede volver a ofrecer; si la llave ya existía, el alta lo detecta.
const CLAVE = "lp-bio";

export function leerBio(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function marcarBio(v: "activado") {
  try {
    localStorage.setItem(CLAVE, v);
  } catch {}
}
