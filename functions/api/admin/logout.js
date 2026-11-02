// functions/api/admin/logout.js
import { json, cookieBorrada } from '../../_auth.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': cookieBorrada() });
}
