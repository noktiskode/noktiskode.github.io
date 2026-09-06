export async function onRequest(context) {
    const {
        request, 
        env, 
        params, 
        waitUntil, 
        next, 
        data, 
    } = context;

    const client_id = env.GITHUB_CLIENT_ID;

    try {
        const url = new URL(request.url);
        const state = crypto.randomUUID();

        const redirectUrl = new URL('https://github.com/login/oauth/authorize');
        redirectUrl.searchParams.set('client_id', client_id);
        // Ajusta la ruta para que incluya /auth/callback
        redirectUrl.searchParams.set('redirect_uri', url.origin + '/api/auth/callback');
        redirectUrl.searchParams.set('scope', 'repo user');
        redirectUrl.searchParams.set('state', state);

        // Guardamos el state en una cookie httpOnly de corta duración para
        // poder compararlo cuando GitHub redirija de vuelta al callback.
        return new Response(null, {
            status: 302,
            headers: {
                'Location': redirectUrl.href,
                'Set-Cookie': `oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
            },
        });

    } catch (error) {
        console.error(error);
        return new Response(error.message, {
            status: 500,
        });
    }
}
