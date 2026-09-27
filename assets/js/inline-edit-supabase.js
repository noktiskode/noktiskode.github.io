/**
 * Edición en línea para BMM (versión Supabase).
 * Requiere que /assets/js/supabase-auth.js ya se haya cargado antes.
 * Reemplaza al viejo inline-edit.js (el que usaba la API de GitHub).
 */
(function () {
  function startEdit(anchorEl, slug, field) {
    const originalText = anchorEl.textContent.trim();
    const href = anchorEl.getAttribute('href');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'inline-edit-input';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Guardar';
    saveBtn.className = 'inline-edit-save';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'inline-edit-cancel';

    const wrap = document.createElement('span');
    wrap.className = 'inline-edit-wrap';
    wrap.appendChild(input);
    wrap.appendChild(saveBtn);
    wrap.appendChild(cancelBtn);

    anchorEl.replaceWith(wrap);
    input.focus();
    input.select();

    function restore(text) {
      anchorEl.textContent = text;
      if (href) anchorEl.setAttribute('href', href);
      wrap.replaceWith(anchorEl);
    }

    cancelBtn.addEventListener('click', () => restore(originalText));

    saveBtn.addEventListener('click', async () => {
      const newValue = input.value.trim();
      if (!newValue || newValue === originalText) {
        restore(originalText);
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando…';

      const { error } = await window.supabaseClient
        .from('posts')
        .update({ [field]: newValue })
        .eq('slug', slug);

      if (error) {
        alert('Error al guardar: ' + error.message);
        restore(originalText);
      } else {
        restore(newValue); // ya está guardado, en vivo, sin esperar ningún build
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const session = await window.supabaseReady;
    if (!session) return; // sin sesión, no se activa nada

    document.querySelectorAll('[data-edit-link]').forEach(function (btn) {
      btn.style.display = 'inline-block';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const slug = btn.getAttribute('data-slug');
        const field = btn.getAttribute('data-inline-field') || 'title';
        const card = btn.closest('.cb-post');
        const titleLink = card && card.querySelector('h2 a');
        if (!slug || !titleLink) return;
        startEdit(titleLink, slug, field);
      });
    });
  });
})();
