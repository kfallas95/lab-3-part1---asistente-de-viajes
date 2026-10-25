// ConfirmDialog: UN solo aviso con TODOS los motivos de la operación (INV-15).
// Devuelve una promesa: true si el cliente confirma, false si cancela.
// Usa <dialog> nativo; Esc o clic fuera cuentan como Cancelar (no se guarda nada).
import { h } from '../dom.js';

/**
 * @param {{title:string, reasons?:string[], message?:string, confirmLabel?:string, cancelLabel?:string|null, danger?:boolean}} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog({
  title,
  reasons = [],
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}) {
  return new Promise((resolve) => {
    const dialog = h(
      'dialog',
      { class: 'dialog', 'aria-labelledby': 'dialog-title' },
      h('h2', { id: 'dialog-title', class: 'dialog__title' }, title),
      message && h('p', {}, message),
      reasons.length > 0 && h('ul', { class: 'dialog__reasons' }, reasons.map((r) => h('li', {}, r))),
      h(
        'div',
        { class: 'dialog__actions' },
        cancelLabel && h('button', { class: 'btn btn--secondary', type: 'button', onClick: () => close(false) }, cancelLabel),
        h(
          'button',
          { class: ['btn', danger && 'btn--danger'], type: 'button', onClick: () => close(true), autofocus: true },
          confirmLabel,
        ),
      ),
    );

    let settled = false;
    function close(result) {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      resolve(result);
    }

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close(false);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close(false); // clic en el fondo
    });

    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

/** Aviso informativo con un solo botón (p. ej. listado de actividades excluidas). */
export function infoDialog({ title, message = '', items = [], buttonLabel = 'Entendido' }) {
  return confirmDialog({ title, message, reasons: items, confirmLabel: buttonLabel, cancelLabel: null }).then(() => undefined);
}
