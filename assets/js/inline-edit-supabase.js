/**
 * Edición en línea para BMM (versión Supabase).
 * Requiere que /assets/js/supabase-auth.js ya se haya cargado antes.
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
        restore(newValue);
      }
    });
  }

  // Bloque grande (cuerpo del post): usa textarea, y trae el texto CRUDO
  // (markdown/HTML original) desde Supabase antes de editar — no el HTML
  // ya renderizado, para no perder la sintaxis de imágenes y enlaces.
  async function startEditBlock(targetEl, slug, field) {
    const originalHtml = targetEl.innerHTML;
    targetEl.style.opacity = '0.5';

    const { data, error: fetchError } = await window.supabaseClient
      .from('posts')
      .select(field)
      .eq('slug', slug)
      .single();

    targetEl.style.opacity = '';

    if (fetchError || !data) {
      alert('No se pudo cargar el texto original: ' + (fetchError ? fetchError.message : ''));
      return;
    }
    const rawText = data[field] || '';

    const textarea = document.createElement('textarea');
    textarea.className = 'inline-edit-textarea';
    textarea.value = rawText;
    textarea.rows = Math.min(24, Math.max(8, rawText.split('\n').length + 2));

    const hint = document.createElement('p');
    hint.className = 'inline-edit-hint';
    hint.textContent = 'Podés usar ![](url-de-imagen) para agregar una imagen, y [texto](url) para un enlace.';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Guardar';
    saveBtn.className = 'inline-edit-save';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'inline-edit-cancel';

    const wrap = document.createElement('div');
    wrap.className = 'inline-edit-block-wrap';
    wrap.appendChild(textarea);
    wrap.appendChild(hint);
    const btnRow = document.createElement('div');
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    wrap.appendChild(btnRow);

    targetEl.replaceWith(wrap);
    textarea.focus();

    function restore(html) {
      targetEl.innerHTML = html;
      wrap.replaceWith(targetEl);
    }

    cancelBtn.addEventListener('click', () => restore(originalHtml));

    saveBtn.addEventListener('click', async () => {
      const newValue = textarea.value.trim();
      if (!newValue) {
        restore(originalHtml);
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
        restore(originalHtml);
      } else {
        alert('Guardado. Recargá la página para ver el resultado con imágenes/enlaces ya renderizados.');
        window.location.reload();
      }
    });
  }

  function injectEditableStyles() {
    if (document.getElementById('inline-edit-styles')) return;
    const style = document.createElement('style');
    style.id = 'inline-edit-styles';
    style.textContent = `
      body.is-admin {
        padding-bottom: 46px;
      }
      body.is-admin [data-edit-target] {
        cursor: pointer;
        outline: 2px dashed rgba(239,79,29,.5);
        outline-offset: 6px;
        border-radius: 4px;
        transition: outline-color .15s;
      }
      body.is-admin [data-edit-target]:hover {
        outline-color: #ef4f1d;
        background: rgba(239,79,29,.05);
      }
      body.is-admin [data-edit-target]::after {
        content: '✏️ Editar';
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: #ef4f1d;
        margin-top: 6px;
      }
      .inline-edit-input, .inline-edit-textarea {
        width: 100%;
        font: inherit;
        padding: 6px 8px;
        border: 2px solid #ef4f1d;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .inline-edit-save, .inline-edit-cancel {
        margin-top: 6px;
        margin-right: 6px;
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 700;
      }
      .inline-edit-save { background: #ef4f1d; color: #fff; }
      .inline-edit-cancel { background: #e5e5e5; color: #333; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const session = await window.supabaseReady;
    if (!session) return; // sin sesión, no se activa nada

    injectEditableStyles();

    // Modo tarjetas (listado): botón "Editar" aparte, edita el título del card
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

    // Modo página de post completo: el propio título/cuerpo es clickeable
    document.querySelectorAll('[data-edit-target]').forEach(function (el) {
      el.classList.add('inline-editable');
      el.title = 'Clic para editar';
      el.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; // no interceptar links dentro del bloque
        const slug = el.getAttribute('data-slug');
        const field = el.getAttribute('data-inline-field');
        if (!slug || !field) return;
        if (field === 'body') {
          startEditBlock(el, slug, field);
        } else {
          startEdit(el, slug, field);
        }
      });
    });
  });
})();
