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

  // Marca el <body> con una clase cuando hay sesión activa, para que el CSS
  // pueda mostrar/ocultar elementos de admin sin esperar al JS de cada uno.
  window.supabaseClient.auth.onAuthStateChange(function (_event, session) {
    document.body.classList.toggle('is-admin', !!session);
  });

  // Revisa la sesión ya guardada al cargar la página (login persistente real)
  window.supabaseReady = window.supabaseClient.auth.getSession().then(function (res) {
    const session = res.data.session;
    document.body.classList.toggle('is-admin', !!session);
    return session;
  });
})();
