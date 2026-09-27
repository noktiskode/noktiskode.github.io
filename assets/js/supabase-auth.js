/**
 * Cliente de Supabase para BMM — sesión de login persistente.
 * Cargar este script en todas las páginas, ANTES de inline-edit-supabase.js.
 * Requiere haber cargado antes: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
 */
(function () {
  // La URL del proyecto y la clave "anon" son públicas por diseño:
  // la seguridad real la dan las políticas RLS de la base de datos,
  // no el secreto de esta clave. NUNCA pongas acá la service_role key.
  const SUPABASE_URL = 'https://iolchsadedieagiqrxzu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbGNoc2FkZWRpZWFnaXFyeHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI1ODYsImV4cCI6MjEwNjA0ODU4Nn0.lOUc-vt2JFfDIidKO7m_dFgjnmDWIGQnzXADHcBTjyg';

  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,   // te mantiene conectado entre visitas
      autoRefreshToken: true  // renueva el token solo, sin pedirte login de nuevo
    }
  });

  function injectAdminBar(session) {
    if (!session || document.getElementById('bmm-admin-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'bmm-admin-bar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
      'background:#111;color:#fff;font:13px system-ui,sans-serif;' +
      'padding:8px 14px;display:flex;justify-content:space-between;' +
      'align-items:center;gap:10px;box-shadow:0 -2px 8px rgba(0,0,0,.3);';

    const label = document.createElement('span');
    label.textContent = '🟢 Conectado como ' + (session.user && session.user.email ? session.user.email : 'admin');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Cerrar sesión';
    btn.style.cssText = 'background:#ef4f1d;color:#fff;border:none;' +
      'padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:700;flex-shrink:0;';
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      btn.textContent = 'Saliendo…';
      await window.supabaseClient.auth.signOut();
      window.location.reload();
    });

    bar.appendChild(label);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  // Marca el <body> con una clase cuando hay sesión activa, para que el CSS
  // pueda mostrar/ocultar elementos de admin sin esperar al JS de cada uno.
  window.supabaseClient.auth.onAuthStateChange(function (_event, session) {
    document.body.classList.toggle('is-admin', !!session);
    if (session) injectAdminBar(session);
  });

  // Revisa la sesión ya guardada al cargar la página (login persistente real)
  window.supabaseReady = window.supabaseClient.auth.getSession().then(function (res) {
    const session = res.data.session;
    document.body.classList.toggle('is-admin', !!session);
    if (session) {
      // Espera a que el <body> exista si el script corrió antes de tiempo
      if (document.body) injectAdminBar(session);
      else document.addEventListener('DOMContentLoaded', () => injectAdminBar(session));
    }
    return session;
  });
})();
