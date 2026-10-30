// Keep startup/context failures visible even if the main module cannot initialize.
function reportRenderError(error) {
  console.error('Tur 3D:', error);
  let panel = document.getElementById('render-status');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'render-status';
    document.body.appendChild(panel);
  }
  panel.setAttribute('role', 'alert');
  panel.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'Turul 3D nu poate fi afișat momentan.';
  const detail = document.createElement('p');
  detail.textContent = /WebGL|context/i.test(String(error?.message || error))
    ? 'Browserul nu a putut porni sau a întrerupt randarea WebGL. Verifică accelerarea grafică a browserului și reîncarcă pagina.'
    : 'A apărut o eroare la încărcare. Reîncarcă pagina; dacă persistă, trimite-ne mesajul de mai jos.';
  const code = document.createElement('small');
  code.textContent = String(error?.message || error || 'Eroare necunoscută');
  const retry = document.createElement('button');
  retry.textContent = 'Reîncarcă turul';
  retry.onclick = () => location.reload();
  panel.append(title, detail, code, retry);
}
window.reportRenderError = reportRenderError;
window.addEventListener('error', event => reportRenderError(event.error || event.message));
window.addEventListener('unhandledrejection', event => reportRenderError(event.reason));
document.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  reportRenderError(new Error('Contextul WebGL a fost întrerupt.'));
}, true);
import('./main.js?v=r09-render-2').catch(reportRenderError);
