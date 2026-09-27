/**
 * Edición inline para BMM (Barberena Mi Municipio)
 * -------------------------------------------------
 * Usa el token de GitHub que Decap CMS guarda en localStorage
 * (tras iniciar sesión en /admin/) para editar campos del post
 * directamente desde la tarjeta donde está listado, sin pasar
 * por el editor completo de Decap.
 *
 * Prototipo inicial: solo edita el campo "title" del front matter.
 * Se puede extender a "excerpt" o "category" repitiendo el patrón.
 *
 * Requiere:
 *   - Que el usuario ya haya iniciado sesión en /admin/ (Decap guarda
 *     el token en localStorage bajo la clave "decap-cms-user").
 *   - Que el token de GitHub tenga permiso de escritura sobre el repo.
 */
(function () {
  const REPO = 'noktiskode/noktiskode.github.io';
  const BRANCH = 'main';
  const API = 'https://api.github.com';

  function getToken() {
    try {
      const raw = localStorage.getItem('decap-cms-user');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.token || null;
    } catch (e) {
      return null;
    }
  }

  function ghHeaders(token) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json'
    };
  }

  async function fetchFile(path, token) {
    const res = await fetch(`${API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
      headers: ghHeaders(token)
    });
    if (!res.ok) throw new Error(`No se pudo leer el archivo (${res.status})`);
    const json = await res.json();
    const content = decodeURIComponent(escape(atob(json.content)));
    return { content, sha: json.sha };
  }

  async function saveFile(path, newContent, sha, token, message) {
    const encoded = btoa(unescape(encodeURIComponent(newContent)));
    const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message || 'Editar entrada desde el sitio',
        content: encoded,
        sha: sha,
        branch: BRANCH
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `No se pudo guardar (${res.status})`);
    }
    return res.json();
  }

  // Reemplaza el valor de un campo de una sola línea en el front matter YAML.
  // Ej: setFrontMatterField(contenido, 'title', 'Nuevo título')
  function setFrontMatterField(fileContent, field, newValue) {
    const match = fileContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) throw new Error('No se encontró el front matter en el archivo');
    let [, frontMatter, body] = match;
    const lineRegex = new RegExp(`^${field}:.*$`, 'm');
    const needsQuotes = /[:#]/.test(newValue);
    const safeValue = needsQuotes ? `"${newValue.replace(/"/g, '\\"')}"` : newValue;
    const newLine = `${field}: ${safeValue}`;
    frontMatter = lineRegex.test(frontMatter)
      ? frontMatter.replace(lineRegex, newLine)
      : `${frontMatter}\n${newLine}`;
    return `---\n${frontMatter}\n---\n${body}`;
  }

  function startEdit(anchorEl, path, field, token) {
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
      try {
        const { content, sha } = await fetchFile(path, token);
        const updated = setFrontMatterField(content, field, newValue);
        await saveFile(path, updated, sha, token, `Editar ${field} vía sitio`);
        restore(newValue);
        alert('Guardado. Cloudflare Pages va a reconstruir el sitio en unos segundos.');
      } catch (err) {
        alert('Error al guardar: ' + err.message);
        restore(originalText);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const token = getToken();
    if (!token) return; // sin sesión, no se activa nada

    document.querySelectorAll('[data-edit-link]').forEach(function (btn) {
      btn.style.display = 'inline-block';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const path = btn.getAttribute('data-inline-path');
        const field = btn.getAttribute('data-inline-field') || 'title';
        const card = btn.closest('.cb-post');
        const titleLink = card && card.querySelector('h2 a');
        if (!path || !titleLink) return;
        startEdit(titleLink, path, field, token);
      });
    });
  });
})();
        
