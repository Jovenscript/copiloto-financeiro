import { Capacitor } from '@capacitor/core';

const nativo = () => Capacitor.isNativePlatform();

// Salva um arquivo e abre o menu de compartilhar do Android (salvar no
// Drive, mandar no WhatsApp, etc). No navegador, cai no download normal.
// `dados`: string (texto) ou base64 (com base64=true, ex: PDF).
export async function salvarECompartilhar({ nome, mime, dados, base64 = false }) {
  if (nativo()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const gravado = await Filesystem.writeFile({
      path: nome,
      data: dados,
      directory: Directory.Cache,
      ...(base64 ? {} : { encoding: Encoding.UTF8 }),
    });
    await Share.share({ title: nome, files: [gravado.uri] });
    return true;
  }
  // Navegador: download clássico
  const blob = base64
    ? new Blob([Uint8Array.from(atob(dados), (c) => c.charCodeAt(0))], { type: mime })
    : new Blob([dados], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
