// functions/generador/index.js  (Cloudflare Pages Functions)
// GET  /generador/  -> página del generador de carteles
// POST /generador/  -> { titulo } => { frase }  (frase clave elegida con Workers AI)
//
// Requisito: en Cloudflare Pages > Settings > Bindings, agregar "Workers AI" con el nombre AI.

const MODELO = '@cf/meta/llama-3.1-8b-instruct'; // si Cloudflare retira el modelo, cambia solo esta línea

const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]/g, '').trim();
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestGet() {
  return new Response(HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow', // que los buscadores no indexen esta página
    },
  });
}

export async function onRequestPost({ request, env }) {
  // Solo acepta peticiones desde la propia página
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: 'origen no permitido' }, 403);
  if (!env.AI) return json({ error: 'Falta el binding AI' }, 503);

  let titulo = '';
  try {
    const raw = await request.text();
    if (raw.length > 2000) return json({ error: 'demasiado largo' }, 413);
    titulo = String(JSON.parse(raw).titulo || '').trim().slice(0, 160);
  } catch (e) {
    return json({ error: 'JSON inválido' }, 400);
  }
  if (titulo.split(/\s+/).length < 3) return json({ frase: '' });

  try {
    const res = await env.AI.run(MODELO, {
      messages: [
        {
          role: 'system',
          content:
            'Eres editor de un diario hiperlocal. Del titular que te den, elige la frase clave: de 1 a 3 palabras consecutivas, ' +
            'copiadas exactamente del titular, que más conviene resaltar. Prefiere el sustantivo o dato central (por ejemplo el tema de la noticia), sin verbos ni palabras de relleno; una sola palabra suele bastar. ' +
            'Si hay una palabra o frase entre comillas, casi siempre es la mejor opción. ' +
            'Responde solo con esa frase, sin comillas ni explicaciones.',
        },
        { role: 'user', content: titulo },
      ],
      max_tokens: 20,
      temperature: 0,
    });
    let frase = String(res.response || '').split('\n')[0].replace(/^["“'«\s]+|["”'»\s.]+$/g, '');
    // Validación: debe ser una secuencia exacta de palabras del titular, de 1 a 4 palabras
    const pw = norm(frase).split(/\s+/).filter(Boolean);
    const tw = norm(titulo).split(/\s+/).filter(Boolean);
    const ok = pw.length >= 1 && pw.length <= 4 && tw.some((_, i) => pw.every((w, k) => tw[i + k] === w));
    return json({ frase: ok ? frase : '' });
  } catch (e) {
    return json({ frase: '', error: 'IA no disponible' }, 200);
  }
}

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generador de Carteles - Barberena Mi Municipio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Narrow:wght@700&family=Barlow+Condensed:wght@700&family=Bebas+Neue&family=Montserrat:wght@800&family=Oswald:wght@700&family=Playfair+Display:wght@800&family=Roboto:wght@400;500;700&family=Roboto+Condensed:ital,wght@0,300;0,700;1,300&family=Roboto+Slab:wght@700&display=swap" rel="stylesheet">
<style>
:root{--rojo:#ef4f1d;--rojo-hover:#d9420f;--negro:#111110;--gris-claro:#f8f9fa;--gris:#6c757d;--linea:#dee2e6;
--fuente-titulo:'Roboto Condensed',sans-serif;--fuente-texto:'Roboto',system-ui,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:#f1f1ef;color:#212529;font-family:var(--fuente-texto);min-height:100vh;display:flex;flex-direction:column}
header{background:#fff;border-bottom:1px solid var(--linea);position:sticky;top:0;z-index:20}
.hd{max-width:1180px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:40px;height:40px;border-radius:50%;display:block}
.brand b{display:block;font-family:var(--fuente-titulo);font-weight:700;font-size:19px;letter-spacing:.06em;color:var(--negro);line-height:1.1}
.brand span{font-family:var(--fuente-titulo);font-weight:300;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--rojo)}
.back{font-size:13px;font-weight:500;color:var(--negro);text-decoration:none;background:#f1f1ef;padding:8px 14px;border-radius:10px}
.back:hover{background:#e6e6e3}
main{flex:1;max-width:1180px;width:100%;margin:0 auto;padding:28px 20px}
.intro h1{font-family:var(--fuente-titulo);font-weight:700;font-size:32px;margin:0;color:var(--negro);letter-spacing:-.005em}
.intro p{margin:6px 0 24px;color:var(--gris);font-size:15px}
.grid{display:grid;grid-template-columns:1fr;gap:24px;align-items:start}
@media(min-width:960px){.grid{grid-template-columns:1.05fr .95fr;gap:32px}.prev{position:sticky;top:88px}}
.prev{order:-1}
@media(min-width:960px){.prev{order:0}}
.card{background:#fff;border:1px solid var(--linea);border-radius:16px;box-shadow:0 10px 30px rgba(17,17,16,.07);padding:22px}
.ch{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:14px;margin-bottom:18px}
.ch h3{margin:0;font-family:var(--fuente-titulo);font-weight:700;font-size:17px;letter-spacing:.04em;text-transform:uppercase;color:var(--negro)}
.ch h3:before{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--rojo);margin-right:10px}
.pill{font-size:12px;font-weight:500;color:var(--gris);background:#f1f1ef;padding:5px 11px;border-radius:99px}
.ghost{font:500 12px var(--fuente-texto);color:var(--gris);background:#f1f1ef;border:0;padding:7px 12px;border-radius:10px;cursor:pointer}
.ghost:hover{background:#fde8e1;color:var(--rojo-hover)}
.sec{margin-bottom:20px}
.sec>label.t{display:flex;align-items:center;gap:9px;font-family:var(--fuente-titulo);font-weight:700;font-size:14px;letter-spacing:.09em;text-transform:uppercase;color:var(--negro);margin-bottom:10px}
.n{display:inline-flex;width:22px;height:22px;border-radius:50%;background:var(--negro);color:#fff;font-size:12px;align-items:center;justify-content:center;letter-spacing:0}
.box{background:var(--gris-claro);border:1px solid #e9ecef;border-radius:12px;padding:14px}
.sm{display:block;font-size:11.5px;font-weight:500;color:var(--gris);margin:0 0 5px}
input[type=text],textarea,select{width:100%;padding:10px 13px;background:#fff;border:1px solid #ced4da;border-radius:10px;font:500 14px var(--fuente-texto);color:#212529}
textarea{resize:vertical;min-height:70px}
input:focus,textarea:focus,select:focus{outline:2px solid var(--rojo);outline-offset:-1px;border-color:var(--rojo)}
input[type=range]{width:100%;accent-color:var(--rojo)}
input[type=color]{width:100%;height:40px;padding:3px;background:#fff;border:1px solid #ced4da;border-radius:10px;cursor:pointer}
.row{display:grid;gap:12px;margin-top:12px}.r2{grid-template-columns:1fr 1fr}.r3{grid-template-columns:1fr 1fr 1fr}
.fmt{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fmt button,.bgb{font-family:var(--fuente-texto);cursor:pointer;border:2px solid var(--linea);background:#fff;border-radius:12px}
.fmt button{padding:10px 6px;font-size:12px;font-weight:700;color:var(--negro)}
.fmt small{display:block;font-weight:400;color:var(--gris);margin-top:2px}
.fmt button.on,.bgb.on{border-color:var(--rojo);background:#fff4f0;box-shadow:0 0 0 3px rgba(239,79,29,.15)}
.bgs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bgb{padding:0;overflow:hidden;aspect-ratio:4/3;position:relative;color:#fff;font-size:11px;font-weight:700}
.bgb span{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;background:linear-gradient(transparent,rgba(0,0,0,.7));text-align:center}
.up{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;width:100%;padding:11px;border:2px dashed #ced4da;border-radius:12px;cursor:pointer;font-weight:700;font-size:13px;color:var(--negro)}
.up:hover{border-color:var(--rojo);background:#fff4f0;color:var(--rojo-hover)}
.chk{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;margin-top:12px}
.chk input{accent-color:var(--rojo);width:18px;height:18px}
.acts{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.btn{flex:1;min-width:150px;border:0;border-radius:12px;padding:14px 16px;font:700 15px var(--fuente-texto);color:#fff;cursor:pointer;transition:transform .1s}
.btn:active{transform:scale(.97)}
.b1{background:var(--rojo);box-shadow:0 8px 18px rgba(239,79,29,.3)}.b1:hover{background:var(--rojo-hover)}
.b2{background:var(--negro)}.b2:hover{background:#2a2a28}
.cvw{background:var(--negro);border-radius:12px;padding:10px;display:flex;justify-content:center}
canvas{width:100%;max-width:460px;height:auto;border-radius:6px;display:block}
.tip{margin-top:14px;padding:12px 14px;background:#fff4f0;border:1px solid #fbd5c8;border-radius:12px;font-size:12.5px;line-height:1.5;color:#7a2a0e}
#toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,30px);opacity:0;background:var(--negro);color:#fff;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:500;transition:.25s;z-index:50;max-width:90vw;text-align:center}
#toast.show{opacity:1;transform:translate(-50%,0)}
footer{background:#fff;border-top:1px solid var(--linea);padding:20px;text-align:center;font-size:12px;color:var(--gris)}
</style>
</head>
<body>
<header><div class="hd">
  <div class="brand"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUzNiAxNTM2Ij4KICA8Y2lyY2xlIGN4PSI3NjgiIGN5PSI3NjgiIHI9Ijc2OCIgZmlsbD0iI0VGNEYxRCIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc2OCA3NjgpIHNjYWxlKDEuMSkgdHJhbnNsYXRlKC04MDAgLTc2OCkiPgogICAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTIuNSAyLjUpIiBmaWxsPSIjZmRmZGZkIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00NTggMzczIEw0NTcgMzc0IEw0NTcgMzc1IEw0NTQgMzc4IEw0NTQgMzc5IEw0NTIgMzgxIEw0NTIgMzgyIEw0NTEgMzgzIEw0NTEgMzg0IEw0NTAgMzg1IEw0NTAgMzg3IEw0NDkgMzg4IEw0NDkgMzkyIEw0NDggMzkzIEw0NDggMTEzOSBMNDQ5IDExNDAgTDQ0OSAxMTQzIEw0NTAgMTE0NCBMNDUwIDExNDYgTDQ1MSAxMTQ3IEw0NTEgMTE0OSBMNDUyIDExNTAgTDQ1MiAxMTUxIEw0NTUgMTE1NCBMNDU1IDExNTUgTDQ2MCAxMTYwIEw0NjEgMTE2MCBMNDYyIDExNjEgTDQ2MyAxMTYxIEw0NjQgMTE2MiBMNDY1IDExNjIgTDQ2NiAxMTYzIEw0NjcgMTE2MyBMNDY4IDExNjQgTDQ2OSAxMTY0IEw0NzAgMTE2NSBMNDczIDExNjUgTDQ3NCAxMTY2IEw5MTcgMTE2NiBMOTE4IDExNjUgTDkzMCAxMTY1IEw5MzEgMTE2NCBMOTM2IDExNjQgTDkzNyAxMTYzIEw5NDMgMTE2MyBMOTQ0IDExNjIgTDk0OSAxMTYyIEw5NTAgMTE2MSBMOTU0IDExNjEgTDk1NSAxMTYwIEw5NTggMTE2MCBMOTU5IDExNTkgTDk2MiAxMTU5IEw5NjMgMTE1OCBMOTY3IDExNTggTDk2OCAxMTU3IEw5NzAgMTE1NyBMOTcxIDExNTYgTDk3MyAxMTU2IEw5NzQgMTE1NSBMOTc3IDExNTUgTDk3OCAxMTU0IEw5ODAgMTE1NCBMOTgxIDExNTMgTDk4MyAxMTUzIEw5ODQgMTE1MiBMOTg2IDExNTIgTDk4NyAxMTUxIEw5ODkgMTE1MSBMOTkwIDExNTAgTDk5MiAxMTUwIEw5OTMgMTE0OSBMOTk0IDExNDkgTDk5NSAxMTQ4IEw5OTcgMTE0OCBMOTk4IDExNDcgTDk5OSAxMTQ3IEwxMDAwIDExNDYgTDEwMDIgMTE0NiBMMTAwMyAxMTQ1IEwxMDA0IDExNDUgTDEwMDUgMTE0NCBMMTAwNiAxMTQ0IEwxMDA3IDExNDMgTDEwMDggMTE0MyBMMTAwOSAxMTQyIEwxMDEwIDExNDIgTDEwMTEgMTE0MSBMMTAxMyAxMTQxIEwxMDE0IDExNDAgTDEwMTUgMTE0MCBMMTAxNiAxMTM5IEwxMDE3IDExMzkgTDEwMTggMTEzOCBMMTAxOSAxMTM4IEwxMDIxIDExMzYgTDEwMjIgMTEzNiBMMTAyMyAxMTM1IEwxMDI0IDExMzUgTDEwMjUgMTEzNCBMMTAyNiAxMTM0IEwxMDI4IDExMzIgTDEwMjkgMTEzMiBMMTAzMCAxMTMxIEwxMDMxIDExMzEgTDEwMzMgMTEyOSBMMTAzNCAxMTI5IEwxMDM2IDExMjcgTDEwMzcgMTEyNyBMMTAzOCAxMTI2IEwxMDM5IDExMjYgTDEwNDEgMTEyNCBMMTA0MiAxMTI0IEwxMDQ0IDExMjIgTDEwNDUgMTEyMiBMMTA0OSAxMTE4IEwxMDUwIDExMTggTDEwNTIgMTExNiBMMTA1MyAxMTE2IEwxMDU4IDExMTEgTDEwNTkgMTExMSBMMTA3OCAxMDkyIEwxMDc4IDEwOTEgTDEwODIgMTA4NyBMMTA4MiAxMDg2IEwxMDg2IDEwODIgTDEwODYgMTA4MSBMMTA4OCAxMDc5IEwxMDg4IDEwNzggTDEwOTEgMTA3NSBMMTA5MSAxMDc0IEwxMDkyIDEwNzMgTDEwOTIgMTA3MiBMMTA5NCAxMDcwIEwxMDk0IDEwNjkgTDEwOTYgMTA2NyBMMTA5NiAxMDY2IEwxMDk3IDEwNjUgTDEwOTcgMTA2NCBMMTA5OCAxMDYzIEwxMDk4IDEwNjIgTDExMDAgMTA2MCBMMTEwMCAxMDU5IEwxMTAxIDEwNTggTDExMDEgMTA1NyBMMTEwMiAxMDU2IEwxMTAyIDEwNTUgTDExMDMgMTA1NCBMMTEwMyAxMDUzIEwxMTA0IDEwNTIgTDExMDQgMTA1MSBMMTEwNSAxMDUwIEwxMTA1IDEwNDkgTDExMDYgMTA0OCBMMTEwNiAxMDQ3IEwxMTA3IDEwNDYgTDExMDcgMTA0NCBMMTEwOCAxMDQzIEwxMTA4IDEwNDIgTDExMDkgMTA0MSBMMTEwOSAxMDQwIEwxMTEwIDEwMzkgTDExMTAgMTAzNyBMMTExMSAxMDM2IEwxMTExIDEwMzQgTDExMTIgMTAzMyBMMTExMiAxMDMyIEwxMTEzIDEwMzEgTDExMTMgMTAyOSBMMTExNCAxMDI4IEwxMTE0IDEwMjYgTDExMTUgMTAyNSBMMTExNSAxMDIyIEwxMTE2IDEwMjEgTDExMTYgMTAxOSBMMTExNyAxMDE4IEwxMTE3IDEwMTYgTDExMTggMTAxNSBMMTExOCAxMDEyIEwxMTE5IDEwMTEgTDExMTkgMTAwOCBMMTEyMCAxMDA3IEwxMTIwIDEwMDQgTDExMjEgMTAwMyBMMTEyMSA5OTkgTDExMjIgOTk4IEwxMTIyIDk5NSBMMTEyMyA5OTQgTDExMjMgOTg4IEwxMTI0IDk4NyBMMTEyNCA5ODEgTDExMjUgOTgwIEwxMTI1IDk3MiBMMTEyNiA5NzEgTDExMjYgOTYzIEwxMTI3IDk2MiBMMTEyNyA5MTcgTDExMjYgOTE2IEwxMTI2IDkwNiBMMTEyNSA5MDUgTDExMjUgODk2IEwxMTI0IDg5NSBMMTEyNCA4ODkgTDExMjMgODg4IEwxMTIzIDg4MyBMMTEyMiA4ODIgTDExMjIgODc5IEwxMTIxIDg3OCBMMTEyMSA4NzQgTDExMjAgODczIEwxMTIwIDg3MCBMMTExOSA4NjkgTDExMTkgODY2IEwxMTE4IDg2NSBMMTExOCA4NjIgTDExMTcgODYxIEwxMTE3IDg1OSBMMTExNiA4NTggTDExMTYgODU2IEwxMTE1IDg1NSBMMTExNSA4NTMgTDExMTQgODUyIEwxMTE0IDg1MCBMMTExMyA4NDkgTDExMTMgODQ3IEwxMTEyIDg0NiBMMTExMiA4NDUgTDExMTEgODQ0IEwxMTExIDg0MyBMMTExMCA4NDIgTDExMTAgODQxIEwxMTA5IDg0MCBMMTEwOSA4MzggTDExMDggODM3IEwxMTA4IDgzNiBMMTEwNyA4MzUgTDExMDcgODM0IEwxMTA2IDgzMyBMMTEwNiA4MzIgTDExMDUgODMxIEwxMTA1IDgzMCBMMTEwNCA4MjkgTDExMDQgODI4IEwxMTAzIDgyNyBMMTEwMyA4MjYgTDExMDIgODI1IEwxMTAyIDgyNCBMMTEwMSA4MjMgTDExMDEgODIyIEwxMDk5IDgyMCBMMTA5OSA4MTkgTDEwOTggODE4IEwxMDk4IDgxNyBMMTA5NyA4MTYgTDEwOTcgODE1IEwxMDk1IDgxMyBMMTA5NSA4MTIgTDEwOTIgODA5IEwxMDkyIDgwOCBMMTA4OSA4MDUgTDEwODkgODA0IEwxMDg3IDgwMiBMMTA4NyA4MDEgTDEwODEgNzk1IEwxMDgxIDc5NCBMMTA2MyA3NzYgTDEwNjIgNzc2IEwxMDU3IDc3MSBMMTA1NiA3NzEgTDEwNTMgNzY4IEwxMDUyIDc2OCBMMTA0OSA3NjUgTDEwNDggNzY1IEwxMDQ3IDc2NCBMMTA0NiA3NjQgTDEwNDQgNzYyIEwxMDQzIDc2MiBMMTA0MSA3NjAgTDEwNDAgNzYwIEwxMDM3IDc1NyBMMTAzNiA3NTcgTDEwMzUgNzU2IEwxMDM0IDc1NiBMMTAzMiA3NTQgTDEwMzEgNzU0IEwxMDMwIDc1MyBMMTAyOSA3NTMgTDEwMjcgNzUxIEwxMDI2IDc1MSBMMTAyNSA3NTAgTDEwMjQgNzUwIEwxMDIzIDc0OSBMMTAyMiA3NDkgTDEwMjEgNzQ4IEwxMDIwIDc0OCBMMTAxOSA3NDcgTDEwMTcgNzQ3IEwxMDE2IDc0NiBMMTAxNSA3NDYgTDEwMTQgNzQ1IEwxMDEzIDc0NSBMMTAxMiA3NDQgTDEwMTEgNzQ0IEwxMDEwIDc0MyBMMTAwOSA3NDMgTDEwMDggNzQyIEwxMDA3IDc0MiBMMTAwNiA3NDEgTDEwMDUgNzQxIEwxMDAzIDczOSBMMTAwNSA3MzcgTDEwMDYgNzM3IEwxMDA4IDczNSBMMTAwOSA3MzUgTDEwMTAgNzM0IEwxMDExIDczNCBMMTAxMyA3MzIgTDEwMTQgNzMyIEwxMDE2IDczMCBMMTAxNyA3MzAgTDEwMTkgNzI4IEwxMDIwIDcyOCBMMTAyMyA3MjUgTDEwMjQgNzI1IEwxMDI5IDcyMCBMMTAzMCA3MjAgTDEwNDUgNzA1IEwxMDQ1IDcwNCBMMTA0NiA3MDMgTDEwNDcgNzAzIEwxMDQ3IDcwMiBMMTA1MSA2OTggTDEwNTEgNjk3IEwxMDU0IDY5NCBMMTA1NCA2OTMgTDEwNTcgNjkwIEwxMDU3IDY4OSBMMTA1OSA2ODcgTDEwNTkgNjg2IEwxMDYxIDY4NCBMMTA2MSA2ODMgTDEwNjMgNjgxIEwxMDYzIDY4MCBMMTA2NCA2NzkgTDEwNjQgNjc4IEwxMDY1IDY3NyBMMTA2NSA2NzYgTDEwNjYgNjc1IEwxMDY2IDY3NCBMMTA2NyA2NzMgTDEwNjcgNjcyIEwxMDY4IDY3MSBMMTA2OCA2NzAgTDEwNjkgNjY5IEwxMDY5IDY2OCBMMTA3MCA2NjcgTDEwNzAgNjY2IEwxMDcxIDY2NSBMMTA3MSA2NjQgTDEwNzIgNjYzIEwxMDcyIDY2MiBMMTA3MyA2NjEgTDEwNzMgNjYwIEwxMDc0IDY1OSBMMTA3NCA2NTcgTDEwNzUgNjU2IEwxMDc1IDY1NCBMMTA3NiA2NTMgTDEwNzYgNjUyIEwxMDc3IDY1MSBMMTA3NyA2NDkgTDEwNzggNjQ4IEwxMDc4IDY0NiBMMTA3OSA2NDUgTDEwNzkgNjQ0IEwxMDgwIDY0MyBMMTA4MCA2NDAgTDEwODEgNjM5IEwxMDgxIDYzNyBMMTA4MiA2MzYgTDEwODIgNjMzIEwxMDgzIDYzMiBMMTA4MyA2MjkgTDEwODQgNjI4IEwxMDg0IDYyNCBMMTA4NSA2MjMgTDEwODUgNjE5IEwxMDg2IDYxOCBMMTA4NiA2MTUgTDEwODcgNjE0IEwxMDg3IDYwOSBMMTA4OCA2MDggTDEwODggNjAxIEwxMDg5IDYwMCBMMTA4OSA1OTAgTDEwOTAgNTg5IEwxMDkwIDU1MCBMMTA4OSA1NDkgTDEwODkgNTQwIEwxMDg4IDUzOSBMMTA4OCA1MzEgTDEwODcgNTMwIEwxMDg3IDUyNCBMMTA4NiA1MjMgTDEwODYgNTIwIEwxMDg1IDUxOSBMMTA4NSA1MTUgTDEwODQgNTE0IEwxMDg0IDUxMSBMMTA4MyA1MTAgTDEwODMgNTA3IEwxMDgyIDUwNiBMMTA4MiA1MDMgTDEwODEgNTAyIEwxMDgxIDQ5OSBMMTA4MCA0OTggTDEwODAgNDk2IEwxMDc5IDQ5NSBMMTA3OSA0OTMgTDEwNzggNDkyIEwxMDc4IDQ5MCBMMTA3NyA0ODkgTDEwNzcgNDg4IEwxMDc2IDQ4NyBMMTA3NiA0ODUgTDEwNzUgNDg0IEwxMDc1IDQ4MyBMMTA3NCA0ODIgTDEwNzQgNDgwIEwxMDczIDQ3OSBMMTA3MyA0NzggTDEwNzIgNDc3IEwxMDcyIDQ3NiBMMTA3MSA0NzUgTDEwNzEgNDc0IEwxMDcwIDQ3MyBMMTA3MCA0NzIgTDEwNjkgNDcxIEwxMDY5IDQ3MCBMMTA2OCA0NjkgTDEwNjggNDY4IEwxMDY3IDQ2NyBMMTA2NyA0NjYgTDEwNjYgNDY1IEwxMDY2IDQ2NCBMMTA2NCA0NjIgTDEwNjQgNDYxIEwxMDYzIDQ2MCBMMTA2MyA0NTkgTDEwNjEgNDU3IEwxMDYxIDQ1NiBMMTA2MCA0NTUgTDEwNjAgNDU0IEwxMDU3IDQ1MSBMMTA1NyA0NTAgTDEwNTQgNDQ3IEwxMDU0IDQ0NiBMMTA0OSA0NDEgTDEwNDkgNDQwIEwxMDMxIDQyMiBMMTAzMCA0MjIgTDEwMjUgNDE3IEwxMDI0IDQxNyBMMTAyMCA0MTMgTDEwMTkgNDEzIEwxMDE4IDQxMiBMMTAxNyA0MTIgTDEwMTUgNDEwIEwxMDE0IDQxMCBMMTAxMSA0MDcgTDEwMTAgNDA3IEwxMDA3IDQwNCBMMTAwNiA0MDQgTDEwMDUgNDAzIEwxMDA0IDQwMyBMMTAwMiA0MDEgTDEwMDEgNDAxIEwxMDAwIDQwMCBMOTk5IDQwMCBMOTk4IDM5OSBMOTk3IDM5OSBMOTk1IDM5NyBMOTkzIDM5NyBMOTkxIDM5NSBMOTkwIDM5NSBMOTg5IDM5NCBMOTg4IDM5NCBMOTg3IDM5MyBMOTg2IDM5MyBMOTg1IDM5MiBMOTg0IDM5MiBMOTgzIDM5MSBMOTgyIDM5MSBMOTgxIDM5MCBMOTc5IDM5MCBMOTc3IDM4OCBMOTc1IDM4OCBMOTc0IDM4NyBMOTcyIDM4NyBMOTcxIDM4NiBMOTcwIDM4NiBMOTY5IDM4NSBMOTY4IDM4NSBMOTY3IDM4NCBMOTY0IDM4NCBMOTYzIDM4MyBMOTYyIDM4MyBMOTYxIDM4MiBMOTU5IDM4MiBMOTU4IDM4MSBMOTU2IDM4MSBMOTU1IDM4MCBMOTUzIDM4MCBMOTUyIDM3OSBMOTUwIDM3OSBMOTQ5IDM3OCBMOTQ4IDM3OCBMOTQ3IDM3NyBMOTQ0IDM3NyBMOTQzIDM3NiBMOTQwIDM3NiBMOTM5IDM3NSBMOTM3IDM3NSBMOTM2IDM3NCBMOTMyIDM3NCBMOTMxIDM3MyBMOTI4IDM3MyBMOTI3IDM3MiBMOTIzIDM3MiBMOTIyIDM3MSBMOTE5IDM3MSBMOTE4IDM3MCBMOTE0IDM3MCBMOTEzIDM2OSBMOTA3IDM2OSBMOTA2IDM2OCBMOTAwIDM2OCBMODk5IDM2NyBMODkwIDM2NyBMODg5IDM2NiBMODc2IDM2NiBMODc1IDM2NSBMNDc4IDM2NSBMNDc3IDM2NiBMNDcyIDM2NiBMNDcxIDM2NyBMNDY5IDM2NyBMNDY4IDM2OCBMNDY2IDM2OCBMNDY1IDM2OSBMNDY0IDM2OSBMNDYzIDM3MCBMNDYyIDM3MCBMNDU5IDM3MyBaTTk1MiA5MDcgTDk1MiA5MDkgTDk1MyA5MTAgTDk1MyA5MTMgTDk1NCA5MTQgTDk1NCA5MTggTDk1NSA5MTkgTDk1NSA5MjMgTDk1NiA5MjQgTDk1NiA5MzAgTDk1NyA5MzEgTDk1NyA5NjQgTDk1NiA5NjUgTDk1NiA5NzIgTDk1NSA5NzMgTDk1NSA5NzYgTDk1NCA5NzcgTDk1NCA5ODAgTDk1MyA5ODEgTDk1MyA5ODQgTDk1MiA5ODUgTDk1MiA5ODcgTDk1MSA5ODggTDk1MSA5OTAgTDk1MCA5OTEgTDk1MCA5OTMgTDk0OSA5OTQgTDk0OSA5OTUgTDk0OCA5OTYgTDk0OCA5OTcgTDk0NyA5OTggTDk0NyA5OTkgTDk0NiAxMDAwIEw5NDYgMTAwMSBMOTQ1IDEwMDIgTDk0NSAxMDAzIEw5NDMgMTAwNSBMOTQzIDEwMDYgTDk0MSAxMDA4IEw5NDEgMTAwOSBMOTM4IDEwMTIgTDkzOCAxMDEzIEw5MjcgMTAyNCBMOTI2IDEwMjQgTDkyMyAxMDI3IEw5MjIgMTAyNyBMOTIwIDEwMjkgTDkxOSAxMDI5IEw5MTcgMTAzMSBMOTE2IDEwMzEgTDkxNSAxMDMyIEw5MTQgMTAzMiBMOTEzIDEwMzMgTDkxMiAxMDMzIEw5MTEgMTAzNCBMOTEwIDEwMzQgTDkwOSAxMDM1IEw5MDggMTAzNSBMOTA3IDEwMzYgTDkwNSAxMDM2IEw5MDQgMTAzNyBMOTAyIDEwMzcgTDkwMSAxMDM4IEw4OTkgMTAzOCBMODk4IDEwMzkgTDg5NSAxMDM5IEw4OTQgMTA0MCBMODkwIDEwNDAgTDg4OSAxMDQxIEw4NzkgMTA0MSBMODc4IDEwNDIgTDYzMyAxMDQyIEw2MzIgMTA0MSBMNjI2IDEwNDEgTDYyNSAxMDQwIEw2MjMgMTA0MCBMNjIyIDEwMzkgTDYyMCAxMDM5IEw2MTkgMTAzOCBMNjE4IDEwMzggTDYxNyAxMDM3IEw2MTYgMTAzNyBMNjE1IDEwMzYgTDYxNCAxMDM2IEw2MTMgMTAzNSBMNjEyIDEwMzUgTDYwMyAxMDI2IEw2MDMgMTAyNSBMNjAxIDEwMjMgTDYwMSAxMDIyIEw2MDAgMTAyMSBMNjAwIDEwMjAgTDU5OSAxMDE5IEw1OTkgMTAxOCBMNTk4IDEwMTcgTDU5OCAxMDE2IEw1OTcgMTAxNSBMNTk3IDEwMTMgTDU5NiAxMDEyIEw1OTYgMTAwOCBMNTk1IDEwMDcgTDU5NSA4OTQgTDU5NiA4OTMgTDU5NiA4ODkgTDU5NyA4ODggTDU5NyA4ODUgTDU5OCA4ODQgTDU5OCA4ODMgTDU5OSA4ODIgTDU5OSA4ODEgTDYwMCA4ODAgTDYwMCA4NzkgTDYwMSA4NzggTDYwMSA4NzcgTDYwMyA4NzUgTDYwMyA4NzQgTDYxMCA4NjcgTDYxMSA4NjcgTDYxMyA4NjUgTDYxNCA4NjUgTDYxNiA4NjMgTDYxNyA4NjMgTDYxOCA4NjIgTDYxOSA4NjIgTDYyMCA4NjEgTDYyMiA4NjEgTDYyMyA4NjAgTDYyNiA4NjAgTDYyNyA4NTkgTDYzMiA4NTkgTDYzMyA4NTggTDgxMyA4NTggTDgyOSA4NDIgTDgyOSA4NDEgTDgzMCA4NDAgTDgzMSA4NDAgTDg3MiA3OTkgTDg3MyA3OTkgTDg3NCA4MDAgTDg3NCA4MDkgTDg3MyA4MTAgTDg3MyA4MTcgTDg3MiA4MTggTDg3MiA4MjcgTDg3MSA4MjggTDg3MSA4MzUgTDg3MCA4MzYgTDg3MCA4NDEgTDg2OSA4NDIgTDg2OSA4NDggTDg2OCA4NDkgTDg2OCA4NTggTDg4NyA4NTggTDg4OCA4NTkgTDg5NCA4NTkgTDg5NSA4NjAgTDkwMCA4NjAgTDkwMSA4NjEgTDkwMyA4NjEgTDkwNCA4NjIgTDkwNyA4NjIgTDkwOCA4NjMgTDkxMCA4NjMgTDkxMSA4NjQgTDkxMiA4NjQgTDkxMyA4NjUgTDkxNSA4NjUgTDkxNiA4NjYgTDkxNyA4NjYgTDkxOCA4NjcgTDkxOSA4NjcgTDkyMCA4NjggTDkyMSA4NjggTDkyMyA4NzAgTDkyNCA4NzAgTDkyNyA4NzMgTDkyOCA4NzMgTDkzMiA4NzcgTDkzMyA4NzcgTDkzOCA4ODIgTDkzOCA4ODMgTDk0MiA4ODcgTDk0MiA4ODggTDk0NCA4OTAgTDk0NCA4OTEgTDk0NSA4OTIgTDk0NSA4OTMgTDk0NiA4OTQgTDk0NiA4OTUgTDk0OCA4OTcgTDk0OCA4OTkgTDk0OSA5MDAgTDk0OSA5MDEgTDk1MCA5MDIgTDk1MCA5MDQgTDk1MSA5MDUgTDk1MSA5MDYgWk01ODggNTE4IEw1ODkgNTE3IEw1ODkgNTE2IEw1OTAgNTE1IEw1OTAgNTE0IEw1OTEgNTEzIEw1OTEgNTEyIEw1OTIgNTExIEw1OTIgNTEwIEw1OTQgNTA4IEw1OTQgNTA3IEw2MDAgNTAxIEw2MDEgNTAxIEw2MDQgNDk4IEw2MDUgNDk4IEw2MDYgNDk3IEw2MDggNDk3IEw2MDkgNDk2IEw2MTAgNDk2IEw2MTEgNDk1IEw2MTQgNDk1IEw2MTUgNDk0IEw2MTkgNDk0IEw2MjAgNDkzIEw4NjYgNDkzIEw4NjcgNDk0IEw4NzEgNDk0IEw4NzIgNDk1IEw4NzUgNDk1IEw4NzYgNDk2IEw4NzcgNDk2IEw4NzggNDk3IEw4ODAgNDk3IEw4ODEgNDk4IEw4ODIgNDk4IEw4ODMgNDk5IEw4ODQgNDk5IEw4ODYgNTAxIEw4ODcgNTAxIEw4ODkgNTAzIEw4OTAgNTAzIEw5MDAgNTEzIEw5MDAgNTE0IEw5MDIgNTE2IEw5MDIgNTE3IEw5MDQgNTE5IEw5MDQgNTIwIEw5MDYgNTIyIEw5MDYgNTIzIEw5MDcgNTI0IEw5MDcgNTI1IEw5MDggNTI2IEw5MDggNTI3IEw5MDkgNTI4IEw5MDkgNTMxIEw5MTAgNTMyIEw5MTAgNTM0IEw5MTEgNTM1IEw5MTEgNTM3IEw5MTIgNTM4IEw5MTIgNTQwIEw5MTMgNTQxIEw5MTMgNTQzIEw5MTQgNTQ0IEw5MTQgNTQ4IEw5MTUgNTQ5IEw5MTUgNTU0IEw5MTYgNTU1IEw5MTYgNTY5IEw5MTcgNTcwIEw5MTcgNjA0IEw5MTYgNjA1IEw5MTYgNjEzIEw5MTUgNjE0IEw5MTUgNjIwIEw5MTQgNjIxIEw5MTQgNjI0IEw5MTMgNjI1IEw5MTMgNjI4IEw5MTIgNjI5IEw5MTIgNjMyIEw5MTEgNjMzIEw5MTEgNjM0IEw5MTAgNjM1IEw5MTAgNjM3IEw5MDkgNjM4IEw5MDkgNjQwIEw5MDggNjQxIEw5MDggNjQyIEw5MDcgNjQzIEw5MDcgNjQ0IEw5MDYgNjQ1IEw5MDYgNjQ2IEw5MDUgNjQ3IEw5MDUgNjQ4IEw5MDQgNjQ5IEw5MDQgNjUwIEw5MDMgNjUxIEw5MDMgNjUyIEw5MDIgNjUzIEw5MDIgNjU0IEw5MDAgNjU2IEw5MDAgNjU3IEw4OTYgNjYxIEw4OTYgNjYyIEw4ODkgNjY5IEw4ODggNjY5IEw4ODQgNjczIEw4ODMgNjczIEw4ODEgNjc1IEw4ODAgNjc1IEw4NzkgNjc2IEw4NzggNjc2IEw4NzcgNjc3IEw4NzYgNjc3IEw4NzQgNjc5IEw4NzMgNjc5IEw4NzIgNjgwIEw4NzAgNjgwIEw4NjkgNjgxIEw4NjcgNjgxIEw4NjYgNjgyIEw4NjQgNjgyIEw4NjMgNjgzIEw4NTkgNjgzIEw4NTggNjg0IEw3NDAgNjg0IEw3MzkgNjg1IEw3MzggNjg1IEw2NzkgNzQ0IEw2NzkgNzQ1IEw2NzggNzQ2IEw2NzcgNzQ2IEw2NzUgNzQ4IEw2NzQgNzQ3IEw2NzQgNzM5IEw2NzUgNzM4IEw2NzUgNzMxIEw2NzYgNzMwIEw2NzYgNzIzIEw2NzcgNzIyIEw2NzcgNzE1IEw2NzggNzE0IEw2NzggNzEwIEw2NzkgNzA5IEw2NzkgNzAyIEw2ODAgNzAxIEw2ODAgNjkzIEw2ODEgNjkyIEw2ODEgNjg1IEw2ODAgNjg0IEw2MTcgNjg0IEw2MTYgNjgzIEw2MTMgNjgzIEw2MTIgNjgyIEw2MTAgNjgyIEw2MDkgNjgxIEw2MDggNjgxIEw2MDcgNjgwIEw2MDYgNjgwIEw2MDUgNjc5IEw2MDQgNjc5IEw2MDEgNjc2IEw2MDAgNjc2IEw1OTUgNjcxIEw1OTUgNjcwIEw1OTIgNjY3IEw1OTIgNjY2IEw1OTAgNjY0IEw1OTAgNjYyIEw1ODkgNjYxIEw1ODkgNjU5IEw1ODggNjU4IEw1ODggNjU2IEw1ODcgNjU1IEw1ODcgNjUyIEw1ODYgNjUxIEw1ODYgNTI2IEw1ODcgNTI1IEw1ODcgNTIxIEw1ODggNTIwIFoiLz4KICA8L2c+Cjwvc3ZnPgo=" alt="BMM"><div><b>BARBERENA MI MUNICIPIO</b><span>Generador de carteles</span></div></div>
  <a class="back" href="/">Volver al sitio</a>
</div></header>

<main>
<div class="intro"><h1>Creador de carteles y afiches</h1><p>Diseña carteles con la identidad de Barberena Mi Municipio, listos para redes sociales.</p></div>
<div class="grid">

<section class="card" id="panel">
  <div class="ch"><h3>Configuración</h3><button class="ghost" id="resetBtn" type="button">Reiniciar</button></div>

  <div class="sec"><label class="t"><span class="n">1</span>Formato</label>
    <div class="fmt" id="fmt">
      <button type="button" data-h="1350" class="on">4:5<small>Feed 1080×1350</small></button>
      <button type="button" data-h="1080">1:1<small>Cuadrado 1080×1080</small></button>
      <button type="button" data-h="1920">9:16<small>Historia 1080×1920</small></button>
    </div></div>

  <div class="sec"><label class="t"><span class="n">2</span>Fondo</label>
    <div class="bgs" id="bgs">
      <button type="button" class="bgb on" data-bg="negro" style="background:radial-gradient(circle at 80% 10%,#4a2012,#0a0a0a 70%)"><span>Negro</span></button>
      <button type="button" class="bgb" data-bg="naranja" style="background:linear-gradient(135deg,#ef4f1d,#c93a0e)"><span>Naranja</span></button>
      <button type="button" class="bgb" data-bg="degradado" style="background:linear-gradient(135deg,#ef4f1d,#111110)"><span>Degradado</span></button>
      <button type="button" class="bgb" data-bg="lineas" style="background:repeating-linear-gradient(135deg,#111110 0 12px,#1d1d1b 12px 24px)"><span>Líneas</span></button>
      <button type="button" class="bgb" data-bg="puntos" style="background:radial-gradient(#555 1.5px,#111110 2px) 0 0/12px 12px"><span>Puntos</span></button>
      <button type="button" class="bgb" id="photoTile" data-bg="foto" style="background:#2b2b29;display:none"><span>Tu foto</span></button>
    </div>
    <label class="up"><span>Subir foto o video desde tu dispositivo</span><input type="file" id="imageLoader" accept="image/*,video/*" hidden></label>
    <div class="box" id="videoOpts" style="display:none;margin-top:12px">
      <span class="sm">Video cargado: <b id="vinfo"></b></span>
      <input type="range" id="vseek" min="0" max="1000" value="0" aria-label="Posición del video">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="ghost" id="vplay" type="button">Vista previa</button>
        <button class="ghost" id="vframe" type="button">Usar este fotograma como foto</button>
      </div>
      <label class="chk"><input type="checkbox" id="vsound" checked> Conservar el sonido</label>
      <button class="btn b1" id="vrec" type="button" style="margin-top:12px;width:100%">Grabar video con el diseño</button>
      <p class="sm" style="margin:10px 0 0;line-height:1.45">Se graba en tiempo real: tarda lo mismo que dura el video. No cambies de pestaña ni bloquees el celular mientras graba. Funciona mejor en Chrome.</p>
    </div>
    <div class="box" id="photoOpts" style="display:none;margin-top:12px">
      <div class="row r2" style="margin-top:0">
        <div><span class="sm">Encuadre de la foto</span><input type="range" id="pos" min="0" max="100" value="25"></div>
        <div><span class="sm">Oscuridad abajo (menos = más foto)</span><input type="range" id="dark" min="30" max="100" value="72"></div>
      </div>
    </div>
  </div>

  <div class="sec"><label class="t"><span class="n">3</span>Texto</label>
    <div class="box">
      <span class="sm">Etiqueta (opcional)</span>
      <input type="text" id="tag" value="Local · Servicios" maxlength="40">
      <span class="sm" style="margin-top:12px">Titular</span>
      <textarea id="head" maxlength="160">Vecinos denuncian falta de agua y exigen boletas sin recargos</textarea>
      <span class="sm" style="margin-top:12px">Palabras en color de acento</span>
      <input type="text" id="hl" value="falta de agua" maxlength="60">
      <label class="chk" style="margin-top:8px"><input type="checkbox" id="autoHl" checked> Detectar la frase clave automáticamente <span id="aiSt" style="color:var(--gris);font-weight:400"></span></label>
      <div class="row r3">
        <div><span class="sm">Tipografía</span>
          <select id="font">
            <option value="Roboto Condensed|700">Roboto Condensed</option>
            <option value="Oswald|700">Oswald</option>
            <option value="Bebas Neue|400">Bebas Neue</option>
            <option value="Anton|400">Anton</option>
            <option value="Barlow Condensed|700">Barlow Condensed</option>
            <option value="Archivo Narrow|700">Archivo Narrow</option>
            <option value="Montserrat|800">Montserrat</option>
            <option value="Roboto Slab|700">Roboto Slab</option>
            <option value="Playfair Display|800">Playfair Display</option>
          </select></div>
        <div><span class="sm">Tamaño máx. (<span id="szv">96</span>px)</span><input type="range" id="sz" min="48" max="130" value="96"></div>
        <div><span class="sm">Ubicación</span>
          <select id="anchor"><option value="abajo">Abajo</option><option value="centro">Centro</option></select></div>
      </div>
      <label class="chk"><input type="checkbox" id="upper"> Titular en mayúsculas</label>
    </div>
  </div>

  <div class="sec"><label class="t"><span class="n">4</span>Pie y créditos</label>
    <div class="box">
      <div class="row r2" style="margin-top:0">
        <div><span class="sm">Nombre</span><input type="text" id="name" value="Barberena Mi Municipio" maxlength="40"></div>
        <div><span class="sm">Dirección web</span><input type="text" id="url" value="barberenamimunicipio.top" maxlength="40"></div>
      </div>
      <span class="sm" style="margin-top:12px">Crédito de la foto (opcional)</span>
      <input type="text" id="credit" value="Foto: archivo" maxlength="40">
      <label class="chk"><input type="checkbox" id="showLogo" checked> Mostrar logo en el pie</label>
    </div>
  </div>

  <div class="sec"><label class="t"><span class="n">5</span>Colores</label>
    <div class="row r2" style="margin-top:0">
      <div><span class="sm">Acento (etiqueta, palabras, URL)</span><input type="color" id="accent" value="#ef4f1d"></div>
      <div><span class="sm">Titular</span><input type="color" id="hcolor" value="#ffffff"></div>
    </div>
  </div>

  <div class="acts">
    <button class="btn b1" id="dl" type="button">Descargar PNG</button>
    <button class="btn b2" id="share" type="button">Compartir</button>
  </div>
</section>

<section class="prev"><div class="card">
  <div class="ch"><h3>Vista previa</h3><span class="pill" id="dim">1080 × 1350 px</span></div>
  <div class="cvw"><canvas id="cv" width="1080" height="1350"></canvas></div>
  <div id="vprog" style="display:none;margin-top:14px">
    <div style="height:8px;background:#e9ecef;border-radius:99px;overflow:hidden"><div id="vbar" style="height:100%;width:0;background:var(--rojo)"></div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span class="sm" id="vtxt" style="margin:0">Grabando…</span><button class="ghost" id="vcancel" type="button">Cancelar</button></div>
  </div>
  <div id="vres" style="display:none;margin-top:14px">
    <a class="btn b2" id="vlink" download="cartel-bmm.webm" style="display:block;text-align:center;text-decoration:none">Descargar video</a>
    <button class="btn b2" id="vshare" type="button" style="margin-top:8px;width:100%">Compartir video</button>
  </div>
  <div class="tip"><b>Consejo:</b> usa titulares de 8 a 12 palabras y marca con acento solo la frase clave. En el formato 4:5 el cartel se ve completo en el feed de Instagram y Facebook.</div>
</div></section>

</div>
</main>
<footer>© 2026 Barberena Mi Municipio · Herramienta de uso interno</footer>
<div id="toast"></div>

<script>
const $=id=>document.getElementById(id);
const cv=$('cv'),mainCtx=cv.getContext('2d');let ctx=mainCtx;
const oc=document.createElement('canvas'),octx=oc.getContext('2d');
const W=1080,M=56;
let H=1350,bg='negro',photo=null;
let vid=null,vurl=null,playing=false,recording=false,cancelled=false,resUrl=null,resBlob=null,audioCtx=null,audioSrc=null,audioFor=null;
const logo=new Image();logo.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUzNiAxNTM2Ij4KICA8Y2lyY2xlIGN4PSI3NjgiIGN5PSI3NjgiIHI9Ijc2OCIgZmlsbD0iI0VGNEYxRCIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc2OCA3NjgpIHNjYWxlKDEuMSkgdHJhbnNsYXRlKC04MDAgLTc2OCkiPgogICAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTIuNSAyLjUpIiBmaWxsPSIjZmRmZGZkIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00NTggMzczIEw0NTcgMzc0IEw0NTcgMzc1IEw0NTQgMzc4IEw0NTQgMzc5IEw0NTIgMzgxIEw0NTIgMzgyIEw0NTEgMzgzIEw0NTEgMzg0IEw0NTAgMzg1IEw0NTAgMzg3IEw0NDkgMzg4IEw0NDkgMzkyIEw0NDggMzkzIEw0NDggMTEzOSBMNDQ5IDExNDAgTDQ0OSAxMTQzIEw0NTAgMTE0NCBMNDUwIDExNDYgTDQ1MSAxMTQ3IEw0NTEgMTE0OSBMNDUyIDExNTAgTDQ1MiAxMTUxIEw0NTUgMTE1NCBMNDU1IDExNTUgTDQ2MCAxMTYwIEw0NjEgMTE2MCBMNDYyIDExNjEgTDQ2MyAxMTYxIEw0NjQgMTE2MiBMNDY1IDExNjIgTDQ2NiAxMTYzIEw0NjcgMTE2MyBMNDY4IDExNjQgTDQ2OSAxMTY0IEw0NzAgMTE2NSBMNDczIDExNjUgTDQ3NCAxMTY2IEw5MTcgMTE2NiBMOTE4IDExNjUgTDkzMCAxMTY1IEw5MzEgMTE2NCBMOTM2IDExNjQgTDkzNyAxMTYzIEw5NDMgMTE2MyBMOTQ0IDExNjIgTDk0OSAxMTYyIEw5NTAgMTE2MSBMOTU0IDExNjEgTDk1NSAxMTYwIEw5NTggMTE2MCBMOTU5IDExNTkgTDk2MiAxMTU5IEw5NjMgMTE1OCBMOTY3IDExNTggTDk2OCAxMTU3IEw5NzAgMTE1NyBMOTcxIDExNTYgTDk3MyAxMTU2IEw5NzQgMTE1NSBMOTc3IDExNTUgTDk3OCAxMTU0IEw5ODAgMTE1NCBMOTgxIDExNTMgTDk4MyAxMTUzIEw5ODQgMTE1MiBMOTg2IDExNTIgTDk4NyAxMTUxIEw5ODkgMTE1MSBMOTkwIDExNTAgTDk5MiAxMTUwIEw5OTMgMTE0OSBMOTk0IDExNDkgTDk5NSAxMTQ4IEw5OTcgMTE0OCBMOTk4IDExNDcgTDk5OSAxMTQ3IEwxMDAwIDExNDYgTDEwMDIgMTE0NiBMMTAwMyAxMTQ1IEwxMDA0IDExNDUgTDEwMDUgMTE0NCBMMTAwNiAxMTQ0IEwxMDA3IDExNDMgTDEwMDggMTE0MyBMMTAwOSAxMTQyIEwxMDEwIDExNDIgTDEwMTEgMTE0MSBMMTAxMyAxMTQxIEwxMDE0IDExNDAgTDEwMTUgMTE0MCBMMTAxNiAxMTM5IEwxMDE3IDExMzkgTDEwMTggMTEzOCBMMTAxOSAxMTM4IEwxMDIxIDExMzYgTDEwMjIgMTEzNiBMMTAyMyAxMTM1IEwxMDI0IDExMzUgTDEwMjUgMTEzNCBMMTAyNiAxMTM0IEwxMDI4IDExMzIgTDEwMjkgMTEzMiBMMTAzMCAxMTMxIEwxMDMxIDExMzEgTDEwMzMgMTEyOSBMMTAzNCAxMTI5IEwxMDM2IDExMjcgTDEwMzcgMTEyNyBMMTAzOCAxMTI2IEwxMDM5IDExMjYgTDEwNDEgMTEyNCBMMTA0MiAxMTI0IEwxMDQ0IDExMjIgTDEwNDUgMTEyMiBMMTA0OSAxMTE4IEwxMDUwIDExMTggTDEwNTIgMTExNiBMMTA1MyAxMTE2IEwxMDU4IDExMTEgTDEwNTkgMTExMSBMMTA3OCAxMDkyIEwxMDc4IDEwOTEgTDEwODIgMTA4NyBMMTA4MiAxMDg2IEwxMDg2IDEwODIgTDEwODYgMTA4MSBMMTA4OCAxMDc5IEwxMDg4IDEwNzggTDEwOTEgMTA3NSBMMTA5MSAxMDc0IEwxMDkyIDEwNzMgTDEwOTIgMTA3MiBMMTA5NCAxMDcwIEwxMDk0IDEwNjkgTDEwOTYgMTA2NyBMMTA5NiAxMDY2IEwxMDk3IDEwNjUgTDEwOTcgMTA2NCBMMTA5OCAxMDYzIEwxMDk4IDEwNjIgTDExMDAgMTA2MCBMMTEwMCAxMDU5IEwxMTAxIDEwNTggTDExMDEgMTA1NyBMMTEwMiAxMDU2IEwxMTAyIDEwNTUgTDExMDMgMTA1NCBMMTEwMyAxMDUzIEwxMTA0IDEwNTIgTDExMDQgMTA1MSBMMTEwNSAxMDUwIEwxMTA1IDEwNDkgTDExMDYgMTA0OCBMMTEwNiAxMDQ3IEwxMTA3IDEwNDYgTDExMDcgMTA0NCBMMTEwOCAxMDQzIEwxMTA4IDEwNDIgTDExMDkgMTA0MSBMMTEwOSAxMDQwIEwxMTEwIDEwMzkgTDExMTAgMTAzNyBMMTExMSAxMDM2IEwxMTExIDEwMzQgTDExMTIgMTAzMyBMMTExMiAxMDMyIEwxMTEzIDEwMzEgTDExMTMgMTAyOSBMMTExNCAxMDI4IEwxMTE0IDEwMjYgTDExMTUgMTAyNSBMMTExNSAxMDIyIEwxMTE2IDEwMjEgTDExMTYgMTAxOSBMMTExNyAxMDE4IEwxMTE3IDEwMTYgTDExMTggMTAxNSBMMTExOCAxMDEyIEwxMTE5IDEwMTEgTDExMTkgMTAwOCBMMTEyMCAxMDA3IEwxMTIwIDEwMDQgTDExMjEgMTAwMyBMMTEyMSA5OTkgTDExMjIgOTk4IEwxMTIyIDk5NSBMMTEyMyA5OTQgTDExMjMgOTg4IEwxMTI0IDk4NyBMMTEyNCA5ODEgTDExMjUgOTgwIEwxMTI1IDk3MiBMMTEyNiA5NzEgTDExMjYgOTYzIEwxMTI3IDk2MiBMMTEyNyA5MTcgTDExMjYgOTE2IEwxMTI2IDkwNiBMMTEyNSA5MDUgTDExMjUgODk2IEwxMTI0IDg5NSBMMTEyNCA4ODkgTDExMjMgODg4IEwxMTIzIDg4MyBMMTEyMiA4ODIgTDExMjIgODc5IEwxMTIxIDg3OCBMMTEyMSA4NzQgTDExMjAgODczIEwxMTIwIDg3MCBMMTExOSA4NjkgTDExMTkgODY2IEwxMTE4IDg2NSBMMTExOCA4NjIgTDExMTcgODYxIEwxMTE3IDg1OSBMMTExNiA4NTggTDExMTYgODU2IEwxMTE1IDg1NSBMMTExNSA4NTMgTDExMTQgODUyIEwxMTE0IDg1MCBMMTExMyA4NDkgTDExMTMgODQ3IEwxMTEyIDg0NiBMMTExMiA4NDUgTDExMTEgODQ0IEwxMTExIDg0MyBMMTExMCA4NDIgTDExMTAgODQxIEwxMTA5IDg0MCBMMTEwOSA4MzggTDExMDggODM3IEwxMTA4IDgzNiBMMTEwNyA4MzUgTDExMDcgODM0IEwxMTA2IDgzMyBMMTEwNiA4MzIgTDExMDUgODMxIEwxMTA1IDgzMCBMMTEwNCA4MjkgTDExMDQgODI4IEwxMTAzIDgyNyBMMTEwMyA4MjYgTDExMDIgODI1IEwxMTAyIDgyNCBMMTEwMSA4MjMgTDExMDEgODIyIEwxMDk5IDgyMCBMMTA5OSA4MTkgTDEwOTggODE4IEwxMDk4IDgxNyBMMTA5NyA4MTYgTDEwOTcgODE1IEwxMDk1IDgxMyBMMTA5NSA4MTIgTDEwOTIgODA5IEwxMDkyIDgwOCBMMTA4OSA4MDUgTDEwODkgODA0IEwxMDg3IDgwMiBMMTA4NyA4MDEgTDEwODEgNzk1IEwxMDgxIDc5NCBMMTA2MyA3NzYgTDEwNjIgNzc2IEwxMDU3IDc3MSBMMTA1NiA3NzEgTDEwNTMgNzY4IEwxMDUyIDc2OCBMMTA0OSA3NjUgTDEwNDggNzY1IEwxMDQ3IDc2NCBMMTA0NiA3NjQgTDEwNDQgNzYyIEwxMDQzIDc2MiBMMTA0MSA3NjAgTDEwNDAgNzYwIEwxMDM3IDc1NyBMMTAzNiA3NTcgTDEwMzUgNzU2IEwxMDM0IDc1NiBMMTAzMiA3NTQgTDEwMzEgNzU0IEwxMDMwIDc1MyBMMTAyOSA3NTMgTDEwMjcgNzUxIEwxMDI2IDc1MSBMMTAyNSA3NTAgTDEwMjQgNzUwIEwxMDIzIDc0OSBMMTAyMiA3NDkgTDEwMjEgNzQ4IEwxMDIwIDc0OCBMMTAxOSA3NDcgTDEwMTcgNzQ3IEwxMDE2IDc0NiBMMTAxNSA3NDYgTDEwMTQgNzQ1IEwxMDEzIDc0NSBMMTAxMiA3NDQgTDEwMTEgNzQ0IEwxMDEwIDc0MyBMMTAwOSA3NDMgTDEwMDggNzQyIEwxMDA3IDc0MiBMMTAwNiA3NDEgTDEwMDUgNzQxIEwxMDAzIDczOSBMMTAwNSA3MzcgTDEwMDYgNzM3IEwxMDA4IDczNSBMMTAwOSA3MzUgTDEwMTAgNzM0IEwxMDExIDczNCBMMTAxMyA3MzIgTDEwMTQgNzMyIEwxMDE2IDczMCBMMTAxNyA3MzAgTDEwMTkgNzI4IEwxMDIwIDcyOCBMMTAyMyA3MjUgTDEwMjQgNzI1IEwxMDI5IDcyMCBMMTAzMCA3MjAgTDEwNDUgNzA1IEwxMDQ1IDcwNCBMMTA0NiA3MDMgTDEwNDcgNzAzIEwxMDQ3IDcwMiBMMTA1MSA2OTggTDEwNTEgNjk3IEwxMDU0IDY5NCBMMTA1NCA2OTMgTDEwNTcgNjkwIEwxMDU3IDY4OSBMMTA1OSA2ODcgTDEwNTkgNjg2IEwxMDYxIDY4NCBMMTA2MSA2ODMgTDEwNjMgNjgxIEwxMDYzIDY4MCBMMTA2NCA2NzkgTDEwNjQgNjc4IEwxMDY1IDY3NyBMMTA2NSA2NzYgTDEwNjYgNjc1IEwxMDY2IDY3NCBMMTA2NyA2NzMgTDEwNjcgNjcyIEwxMDY4IDY3MSBMMTA2OCA2NzAgTDEwNjkgNjY5IEwxMDY5IDY2OCBMMTA3MCA2NjcgTDEwNzAgNjY2IEwxMDcxIDY2NSBMMTA3MSA2NjQgTDEwNzIgNjYzIEwxMDcyIDY2MiBMMTA3MyA2NjEgTDEwNzMgNjYwIEwxMDc0IDY1OSBMMTA3NCA2NTcgTDEwNzUgNjU2IEwxMDc1IDY1NCBMMTA3NiA2NTMgTDEwNzYgNjUyIEwxMDc3IDY1MSBMMTA3NyA2NDkgTDEwNzggNjQ4IEwxMDc4IDY0NiBMMTA3OSA2NDUgTDEwNzkgNjQ0IEwxMDgwIDY0MyBMMTA4MCA2NDAgTDEwODEgNjM5IEwxMDgxIDYzNyBMMTA4MiA2MzYgTDEwODIgNjMzIEwxMDgzIDYzMiBMMTA4MyA2MjkgTDEwODQgNjI4IEwxMDg0IDYyNCBMMTA4NSA2MjMgTDEwODUgNjE5IEwxMDg2IDYxOCBMMTA4NiA2MTUgTDEwODcgNjE0IEwxMDg3IDYwOSBMMTA4OCA2MDggTDEwODggNjAxIEwxMDg5IDYwMCBMMTA4OSA1OTAgTDEwOTAgNTg5IEwxMDkwIDU1MCBMMTA4OSA1NDkgTDEwODkgNTQwIEwxMDg4IDUzOSBMMTA4OCA1MzEgTDEwODcgNTMwIEwxMDg3IDUyNCBMMTA4NiA1MjMgTDEwODYgNTIwIEwxMDg1IDUxOSBMMTA4NSA1MTUgTDEwODQgNTE0IEwxMDg0IDUxMSBMMTA4MyA1MTAgTDEwODMgNTA3IEwxMDgyIDUwNiBMMTA4MiA1MDMgTDEwODEgNTAyIEwxMDgxIDQ5OSBMMTA4MCA0OTggTDEwODAgNDk2IEwxMDc5IDQ5NSBMMTA3OSA0OTMgTDEwNzggNDkyIEwxMDc4IDQ5MCBMMTA3NyA0ODkgTDEwNzcgNDg4IEwxMDc2IDQ4NyBMMTA3NiA0ODUgTDEwNzUgNDg0IEwxMDc1IDQ4MyBMMTA3NCA0ODIgTDEwNzQgNDgwIEwxMDczIDQ3OSBMMTA3MyA0NzggTDEwNzIgNDc3IEwxMDcyIDQ3NiBMMTA3MSA0NzUgTDEwNzEgNDc0IEwxMDcwIDQ3MyBMMTA3MCA0NzIgTDEwNjkgNDcxIEwxMDY5IDQ3MCBMMTA2OCA0NjkgTDEwNjggNDY4IEwxMDY3IDQ2NyBMMTA2NyA0NjYgTDEwNjYgNDY1IEwxMDY2IDQ2NCBMMTA2NCA0NjIgTDEwNjQgNDYxIEwxMDYzIDQ2MCBMMTA2MyA0NTkgTDEwNjEgNDU3IEwxMDYxIDQ1NiBMMTA2MCA0NTUgTDEwNjAgNDU0IEwxMDU3IDQ1MSBMMTA1NyA0NTAgTDEwNTQgNDQ3IEwxMDU0IDQ0NiBMMTA0OSA0NDEgTDEwNDkgNDQwIEwxMDMxIDQyMiBMMTAzMCA0MjIgTDEwMjUgNDE3IEwxMDI0IDQxNyBMMTAyMCA0MTMgTDEwMTkgNDEzIEwxMDE4IDQxMiBMMTAxNyA0MTIgTDEwMTUgNDEwIEwxMDE0IDQxMCBMMTAxMSA0MDcgTDEwMTAgNDA3IEwxMDA3IDQwNCBMMTAwNiA0MDQgTDEwMDUgNDAzIEwxMDA0IDQwMyBMMTAwMiA0MDEgTDEwMDEgNDAxIEwxMDAwIDQwMCBMOTk5IDQwMCBMOTk4IDM5OSBMOTk3IDM5OSBMOTk1IDM5NyBMOTkzIDM5NyBMOTkxIDM5NSBMOTkwIDM5NSBMOTg5IDM5NCBMOTg4IDM5NCBMOTg3IDM5MyBMOTg2IDM5MyBMOTg1IDM5MiBMOTg0IDM5MiBMOTgzIDM5MSBMOTgyIDM5MSBMOTgxIDM5MCBMOTc5IDM5MCBMOTc3IDM4OCBMOTc1IDM4OCBMOTc0IDM4NyBMOTcyIDM4NyBMOTcxIDM4NiBMOTcwIDM4NiBMOTY5IDM4NSBMOTY4IDM4NSBMOTY3IDM4NCBMOTY0IDM4NCBMOTYzIDM4MyBMOTYyIDM4MyBMOTYxIDM4MiBMOTU5IDM4MiBMOTU4IDM4MSBMOTU2IDM4MSBMOTU1IDM4MCBMOTUzIDM4MCBMOTUyIDM3OSBMOTUwIDM3OSBMOTQ5IDM3OCBMOTQ4IDM3OCBMOTQ3IDM3NyBMOTQ0IDM3NyBMOTQzIDM3NiBMOTQwIDM3NiBMOTM5IDM3NSBMOTM3IDM3NSBMOTM2IDM3NCBMOTMyIDM3NCBMOTMxIDM3MyBMOTI4IDM3MyBMOTI3IDM3MiBMOTIzIDM3MiBMOTIyIDM3MSBMOTE5IDM3MSBMOTE4IDM3MCBMOTE0IDM3MCBMOTEzIDM2OSBMOTA3IDM2OSBMOTA2IDM2OCBMOTAwIDM2OCBMODk5IDM2NyBMODkwIDM2NyBMODg5IDM2NiBMODc2IDM2NiBMODc1IDM2NSBMNDc4IDM2NSBMNDc3IDM2NiBMNDcyIDM2NiBMNDcxIDM2NyBMNDY5IDM2NyBMNDY4IDM2OCBMNDY2IDM2OCBMNDY1IDM2OSBMNDY0IDM2OSBMNDYzIDM3MCBMNDYyIDM3MCBMNDU5IDM3MyBaTTk1MiA5MDcgTDk1MiA5MDkgTDk1MyA5MTAgTDk1MyA5MTMgTDk1NCA5MTQgTDk1NCA5MTggTDk1NSA5MTkgTDk1NSA5MjMgTDk1NiA5MjQgTDk1NiA5MzAgTDk1NyA5MzEgTDk1NyA5NjQgTDk1NiA5NjUgTDk1NiA5NzIgTDk1NSA5NzMgTDk1NSA5NzYgTDk1NCA5NzcgTDk1NCA5ODAgTDk1MyA5ODEgTDk1MyA5ODQgTDk1MiA5ODUgTDk1MiA5ODcgTDk1MSA5ODggTDk1MSA5OTAgTDk1MCA5OTEgTDk1MCA5OTMgTDk0OSA5OTQgTDk0OSA5OTUgTDk0OCA5OTYgTDk0OCA5OTcgTDk0NyA5OTggTDk0NyA5OTkgTDk0NiAxMDAwIEw5NDYgMTAwMSBMOTQ1IDEwMDIgTDk0NSAxMDAzIEw5NDMgMTAwNSBMOTQzIDEwMDYgTDk0MSAxMDA4IEw5NDEgMTAwOSBMOTM4IDEwMTIgTDkzOCAxMDEzIEw5MjcgMTAyNCBMOTI2IDEwMjQgTDkyMyAxMDI3IEw5MjIgMTAyNyBMOTIwIDEwMjkgTDkxOSAxMDI5IEw5MTcgMTAzMSBMOTE2IDEwMzEgTDkxNSAxMDMyIEw5MTQgMTAzMiBMOTEzIDEwMzMgTDkxMiAxMDMzIEw5MTEgMTAzNCBMOTEwIDEwMzQgTDkwOSAxMDM1IEw5MDggMTAzNSBMOTA3IDEwMzYgTDkwNSAxMDM2IEw5MDQgMTAzNyBMOTAyIDEwMzcgTDkwMSAxMDM4IEw4OTkgMTAzOCBMODk4IDEwMzkgTDg5NSAxMDM5IEw4OTQgMTA0MCBMODkwIDEwNDAgTDg4OSAxMDQxIEw4NzkgMTA0MSBMODc4IDEwNDIgTDYzMyAxMDQyIEw2MzIgMTA0MSBMNjI2IDEwNDEgTDYyNSAxMDQwIEw2MjMgMTA0MCBMNjIyIDEwMzkgTDYyMCAxMDM5IEw2MTkgMTAzOCBMNjE4IDEwMzggTDYxNyAxMDM3IEw2MTYgMTAzNyBMNjE1IDEwMzYgTDYxNCAxMDM2IEw2MTMgMTAzNSBMNjEyIDEwMzUgTDYwMyAxMDI2IEw2MDMgMTAyNSBMNjAxIDEwMjMgTDYwMSAxMDIyIEw2MDAgMTAyMSBMNjAwIDEwMjAgTDU5OSAxMDE5IEw1OTkgMTAxOCBMNTk4IDEwMTcgTDU5OCAxMDE2IEw1OTcgMTAxNSBMNTk3IDEwMTMgTDU5NiAxMDEyIEw1OTYgMTAwOCBMNTk1IDEwMDcgTDU5NSA4OTQgTDU5NiA4OTMgTDU5NiA4ODkgTDU5NyA4ODggTDU5NyA4ODUgTDU5OCA4ODQgTDU5OCA4ODMgTDU5OSA4ODIgTDU5OSA4ODEgTDYwMCA4ODAgTDYwMCA4NzkgTDYwMSA4NzggTDYwMSA4NzcgTDYwMyA4NzUgTDYwMyA4NzQgTDYxMCA4NjcgTDYxMSA4NjcgTDYxMyA4NjUgTDYxNCA4NjUgTDYxNiA4NjMgTDYxNyA4NjMgTDYxOCA4NjIgTDYxOSA4NjIgTDYyMCA4NjEgTDYyMiA4NjEgTDYyMyA4NjAgTDYyNiA4NjAgTDYyNyA4NTkgTDYzMiA4NTkgTDYzMyA4NTggTDgxMyA4NTggTDgyOSA4NDIgTDgyOSA4NDEgTDgzMCA4NDAgTDgzMSA4NDAgTDg3MiA3OTkgTDg3MyA3OTkgTDg3NCA4MDAgTDg3NCA4MDkgTDg3MyA4MTAgTDg3MyA4MTcgTDg3MiA4MTggTDg3MiA4MjcgTDg3MSA4MjggTDg3MSA4MzUgTDg3MCA4MzYgTDg3MCA4NDEgTDg2OSA4NDIgTDg2OSA4NDggTDg2OCA4NDkgTDg2OCA4NTggTDg4NyA4NTggTDg4OCA4NTkgTDg5NCA4NTkgTDg5NSA4NjAgTDkwMCA4NjAgTDkwMSA4NjEgTDkwMyA4NjEgTDkwNCA4NjIgTDkwNyA4NjIgTDkwOCA4NjMgTDkxMCA4NjMgTDkxMSA4NjQgTDkxMiA4NjQgTDkxMyA4NjUgTDkxNSA4NjUgTDkxNiA4NjYgTDkxNyA4NjYgTDkxOCA4NjcgTDkxOSA4NjcgTDkyMCA4NjggTDkyMSA4NjggTDkyMyA4NzAgTDkyNCA4NzAgTDkyNyA4NzMgTDkyOCA4NzMgTDkzMiA4NzcgTDkzMyA4NzcgTDkzOCA4ODIgTDkzOCA4ODMgTDk0MiA4ODcgTDk0MiA4ODggTDk0NCA4OTAgTDk0NCA4OTEgTDk0NSA4OTIgTDk0NSA4OTMgTDk0NiA4OTQgTDk0NiA4OTUgTDk0OCA4OTcgTDk0OCA4OTkgTDk0OSA5MDAgTDk0OSA5MDEgTDk1MCA5MDIgTDk1MCA5MDQgTDk1MSA5MDUgTDk1MSA5MDYgWk01ODggNTE4IEw1ODkgNTE3IEw1ODkgNTE2IEw1OTAgNTE1IEw1OTAgNTE0IEw1OTEgNTEzIEw1OTEgNTEyIEw1OTIgNTExIEw1OTIgNTEwIEw1OTQgNTA4IEw1OTQgNTA3IEw2MDAgNTAxIEw2MDEgNTAxIEw2MDQgNDk4IEw2MDUgNDk4IEw2MDYgNDk3IEw2MDggNDk3IEw2MDkgNDk2IEw2MTAgNDk2IEw2MTEgNDk1IEw2MTQgNDk1IEw2MTUgNDk0IEw2MTkgNDk0IEw2MjAgNDkzIEw4NjYgNDkzIEw4NjcgNDk0IEw4NzEgNDk0IEw4NzIgNDk1IEw4NzUgNDk1IEw4NzYgNDk2IEw4NzcgNDk2IEw4NzggNDk3IEw4ODAgNDk3IEw4ODEgNDk4IEw4ODIgNDk4IEw4ODMgNDk5IEw4ODQgNDk5IEw4ODYgNTAxIEw4ODcgNTAxIEw4ODkgNTAzIEw4OTAgNTAzIEw5MDAgNTEzIEw5MDAgNTE0IEw5MDIgNTE2IEw5MDIgNTE3IEw5MDQgNTE5IEw5MDQgNTIwIEw5MDYgNTIyIEw5MDYgNTIzIEw5MDcgNTI0IEw5MDcgNTI1IEw5MDggNTI2IEw5MDggNTI3IEw5MDkgNTI4IEw5MDkgNTMxIEw5MTAgNTMyIEw5MTAgNTM0IEw5MTEgNTM1IEw5MTEgNTM3IEw5MTIgNTM4IEw5MTIgNTQwIEw5MTMgNTQxIEw5MTMgNTQzIEw5MTQgNTQ0IEw5MTQgNTQ4IEw5MTUgNTQ5IEw5MTUgNTU0IEw5MTYgNTU1IEw5MTYgNTY5IEw5MTcgNTcwIEw5MTcgNjA0IEw5MTYgNjA1IEw5MTYgNjEzIEw5MTUgNjE0IEw5MTUgNjIwIEw5MTQgNjIxIEw5MTQgNjI0IEw5MTMgNjI1IEw5MTMgNjI4IEw5MTIgNjI5IEw5MTIgNjMyIEw5MTEgNjMzIEw5MTEgNjM0IEw5MTAgNjM1IEw5MTAgNjM3IEw5MDkgNjM4IEw5MDkgNjQwIEw5MDggNjQxIEw5MDggNjQyIEw5MDcgNjQzIEw5MDcgNjQ0IEw5MDYgNjQ1IEw5MDYgNjQ2IEw5MDUgNjQ3IEw5MDUgNjQ4IEw5MDQgNjQ5IEw5MDQgNjUwIEw5MDMgNjUxIEw5MDMgNjUyIEw5MDIgNjUzIEw5MDIgNjU0IEw5MDAgNjU2IEw5MDAgNjU3IEw4OTYgNjYxIEw4OTYgNjYyIEw4ODkgNjY5IEw4ODggNjY5IEw4ODQgNjczIEw4ODMgNjczIEw4ODEgNjc1IEw4ODAgNjc1IEw4NzkgNjc2IEw4NzggNjc2IEw4NzcgNjc3IEw4NzYgNjc3IEw4NzQgNjc5IEw4NzMgNjc5IEw4NzIgNjgwIEw4NzAgNjgwIEw4NjkgNjgxIEw4NjcgNjgxIEw4NjYgNjgyIEw4NjQgNjgyIEw4NjMgNjgzIEw4NTkgNjgzIEw4NTggNjg0IEw3NDAgNjg0IEw3MzkgNjg1IEw3MzggNjg1IEw2NzkgNzQ0IEw2NzkgNzQ1IEw2NzggNzQ2IEw2NzcgNzQ2IEw2NzUgNzQ4IEw2NzQgNzQ3IEw2NzQgNzM5IEw2NzUgNzM4IEw2NzUgNzMxIEw2NzYgNzMwIEw2NzYgNzIzIEw2NzcgNzIyIEw2NzcgNzE1IEw2NzggNzE0IEw2NzggNzEwIEw2NzkgNzA5IEw2NzkgNzAyIEw2ODAgNzAxIEw2ODAgNjkzIEw2ODEgNjkyIEw2ODEgNjg1IEw2ODAgNjg0IEw2MTcgNjg0IEw2MTYgNjgzIEw2MTMgNjgzIEw2MTIgNjgyIEw2MTAgNjgyIEw2MDkgNjgxIEw2MDggNjgxIEw2MDcgNjgwIEw2MDYgNjgwIEw2MDUgNjc5IEw2MDQgNjc5IEw2MDEgNjc2IEw2MDAgNjc2IEw1OTUgNjcxIEw1OTUgNjcwIEw1OTIgNjY3IEw1OTIgNjY2IEw1OTAgNjY0IEw1OTAgNjYyIEw1ODkgNjYxIEw1ODkgNjU5IEw1ODggNjU4IEw1ODggNjU2IEw1ODcgNjU1IEw1ODcgNjUyIEw1ODYgNjUxIEw1ODYgNTI2IEw1ODcgNTI1IEw1ODcgNTIxIEw1ODggNTIwIFoiLz4KICA8L2c+Cjwvc3ZnPgo=';
logo.onload=draw;

function norm(s){return s.toLowerCase().replace(/[.,;:!?¡¿"“”()]/g,'')}
function fontSpec(){const [f,w]=$('font').value.split('|');return {f,w}}

function spaced(t,x,y,sp){
  for(const ch of t){ctx.fillText(ch,x,y);x+=ctx.measureText(ch).width+sp}
}
function spacedW(t,sp){let w=0;for(const ch of t)w+=ctx.measureText(ch).width+sp;return w-sp}

function msize(m){return m.tagName==='VIDEO'?[m.videoWidth,m.videoHeight]:[m.width,m.height]}
function drawBg(ac){
  if(bg==='foto'&&photo&&msize(photo)[0]>0){
    const [pw,ph]=msize(photo);
    const s=Math.max(W/pw,H/ph),dw=pw*s,dh=ph*s,p=$('pos').value/100;
    const dx=dw>W?-(dw-W)*p:(W-dw)/2, dy=dh>H?-(dh-H)*p:(H-dh)/2;
    ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,W,H);
    ctx.drawImage(photo,dx,dy,dw,dh);return;
  }
  const a=$('accent').value;
  if(bg==='naranja'){
    const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,a);g.addColorStop(1,'#b8330b');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);return;
  }
  if(bg==='degradado'){
    const g=ctx.createLinearGradient(0,0,W*.8,H);g.addColorStop(0,a);g.addColorStop(.75,'#111110');g.addColorStop(1,'#0a0a0a');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);return;
  }
  ctx.fillStyle=bg==='negro'?'#0a0a0a':'#111110';ctx.fillRect(0,0,W,H);
  if(bg==='negro'){
    const r=ctx.createRadialGradient(W*.85,0,0,W*.85,0,H*.8);r.addColorStop(0,a+'55');r.addColorStop(1,'#00000000');
    ctx.fillStyle=r;ctx.fillRect(0,0,W,H);
  }
  if(bg==='lineas'){
    ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=26;ctx.beginPath();
    for(let i=-H;i<W+H;i+=90){ctx.moveTo(i,0);ctx.lineTo(i+H,H)}ctx.stroke();
    ctx.fillStyle=a;ctx.beginPath();ctx.moveTo(W-300,0);ctx.lineTo(W,0);ctx.lineTo(W,300);ctx.closePath();ctx.fill();
  }
  if(bg==='puntos'){
    ctx.fillStyle='rgba(255,255,255,.14)';
    for(let y=36;y<H;y+=54)for(let x=36;x<W;x+=54){ctx.beginPath();ctx.arc(x,y,3.2,0,7);ctx.fill()}
  }
}

const SHORTW=new Set('a y o e u de del la el en un una al con por los las su que se lo le sin para'.split(' '));
function layoutHead(text,fs,font,w,hlPhrase){
  const toks=text.split(/\\s+/).filter(Boolean);
  const hlw=hlPhrase.split(/\\s+/).filter(Boolean).map(norm);
  const mark=new Array(toks.length).fill(false);
  if(hlw.length){
    const nt=toks.map(norm);
    for(let i=0;i+hlw.length<=nt.length;i++){
      if(hlw.every((x,k)=>nt[i+k]===x)){for(let k=0;k<hlw.length;k++)mark[i+k]=true;break}
    }
  }
  ctx.font=\`\${w} \${fs}px "\${font}", sans-serif\`;
  const sp=ctx.measureText(' ').width,maxW=W-2*M;
  const lines=[];let cur=[],cw=0;
  toks.forEach((t,i)=>{
    const tw=ctx.measureText(t).width;
    if(cur.length&&cw+sp+tw>maxW){
      const carry=[];
      while(cur.length>1&&SHORTW.has(norm(cur[cur.length-1].t)))carry.unshift(cur.pop());
      lines.push(cur);cur=carry;cw=cur.reduce((s,o,k)=>s+o.w+(k?sp:0),0);
    }
    cw+=(cur.length?sp:0)+tw;cur.push({t,hl:mark[i],w:tw});
  });
  if(cur.length)lines.push(cur);
  return {lines,sp};
}


// ---- Frase clave automática (reglas, sin IA) ----
const STOP=new Set('el la los las un una unos unas de del al a en y e o u que se su sus por con sin para ante bajo entre hacia hasta desde sobre tras es son fue ser ha han hay lo le les mi tu nos este esta estos estas ese esa eso como mas muy ya no ni pero si tambien quienes quien cual cuales esto eso otros otras todo todos toda todas nuevo nueva nuevos nuevas sea cuando donde porque pues mientras tras ante vecinos'.split(' ').filter(x=>x!=='vecinos'));
const BRIDGE=new Set(['de','del','en']);
const VERBS=new Set('denuncian denuncia anuncia anuncian inaugura inauguran exigen exige piden pide reportan reporta confirman confirma informa informan lanza lanzan presenta presentan realiza realizan celebra celebran consume afectara afectaran habra hubo llega llegan abre abren cierra cierran suspende suspenden ofrece ofrecen invita invitan convoca convocan reclaman reclama advierten advierte descubren  registra registran llama llaman dice dijo afirma asegura critica critican escriben escribe responde responden acusa acusan plantea plantean propone proponen aprueba aprueban busca buscan pretende pretenden prohibe prohiben regular restringir prohibir aprobar eliminar reducir aumentar mejorar construir'.split(' '));
const KEY=new Set('urgente alerta aviso importante emergencia accidente incendio robo agua luz energia drenaje seguridad salud gratis gratuito nuevo nueva hoy cierre suspension corte cortes apagon bloqueo derrumbe lluvia peligro reunion asamblea feria festival campana jornada convocatoria obra obras escasez recargos multa'.split(' '));
function strip(s){return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9ñ]/g,'')}
function autoPhrase(text){
  const toks=text.trim().split(/\\s+/).filter(Boolean);if(toks.length<3)return '';
  let q=false;
  const info=toks.map((t,i)=>{const n=strip(t);
    const st=/^["“«]/.test(t),en=/["”»][.,;:!?]*$/.test(t);const quoted=q||st;if(st&&!en)q=true;if(en)q=false;
    const content=!!n&&!STOP.has(n)&&(n.length>=3||/\\d/.test(n)||t===t.toUpperCase()&&n.length>=2);
    return {t,n,quoted,content,bridge:BRIDGE.has(n),brk:/[,;:.!?]$/.test(t),cap:i>0&&/^[A-ZÁÉÍÓÚÑ]/.test(t),
      verb:VERBS.has(n)||(n.length>=6&&/(aron|ieron|ando|iendo)$/.test(n)),dig:/\\d/.test(n)}});
  let best=null;
  for(let i=0;i<toks.length;i++){
    if(!info[i].content)continue;
    let cc=0,j=i;
    while(j<toks.length&&cc<3){
      if(info[j].content){cc++;
        const seg=info.slice(i,j+1);
        let sc=cc*2;
        seg.forEach(o=>{if(o.content){if(KEY.has(o.n))sc+=3;if(o.dig)sc+=2;if(o.cap)sc+=2;if(o.quoted)sc+=4;if(o.verb)sc-=3}});
        if(i===0)sc-=1;
        const len=j-i+1;
        if(len<=3&&(!best||sc>best.sc||(sc===best.sc&&len<best.len)))best={sc,len,i,j};
        if(info[j].brk)break;
        j++;
      }else if(info[j].bridge&&j+1<toks.length&&cc>0){
        let k=j;while(k<toks.length&&info[k].bridge&&k-j<2)k++;
        if(k<toks.length&&info[k].content&&!info[j-1].brk)j=k;else break;
      }else break;
    }
  }
  return best?toks.slice(best.i,best.j+1).join(' ').replace(/^["“«]+|["”»,;:.!?]+$/g,''):'';
}
function autoHL(){if($('autoHl').checked)$('hl').value=autoPhrase($('head').value)}
// Refinamiento con IA (Workers AI) vía POST a /generador/. Si falla, se queda el resultado por reglas.
let aiT;const aiCache={};
function applyAI(f,t){if(f&&$('autoHl').checked&&$('head').value.trim()===t){$('hl').value=f;draw()}}
function scheduleAI(){
  clearTimeout(aiT);
  if(!$('autoHl').checked)return;
  const t=$('head').value.trim();
  if(t.split(/\\s+/).length<3)return;
  aiT=setTimeout(async()=>{
    if(!$('autoHl').checked)return;
    if(t in aiCache){applyAI(aiCache[t],t);return}
    $('aiSt').textContent='· analizando con IA…';
    try{
      const r=await fetch('/generador/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({titulo:t})});
      if(r.ok){const d=await r.json();aiCache[t]=d.frase||'';applyAI(aiCache[t],t)}
    }catch(e){}
    $('aiSt').textContent='';
  },1000);
}

function draw(){
  cv.width=W;cv.height=H;
  const photoMode=bg==='foto'&&photo;
  const accent=$('accent').value;
  const ac=bg==='naranja'?'#111110':accent;
  const {f,w}=fontSpec();
  let text=$('head').value.trim().replace(/"([^"]*)"/g,'“$1”');if($('upper').checked)text=text.toUpperCase();
  const tagTxt=$('tag').value.trim().toUpperCase();
  const maxLines=H>1500?5:4;

  // medidas del bloque de texto
  let fs=+$('sz').value,L;
  for(;;){L=layoutHead(text,fs,f,w,$('hl').value);if(L.lines.length<=maxLines||fs<=44)break;fs-=2}
  const lh=fs*1.06,tagH=tagTxt?40:0,gap=tagTxt?24:0;
  const total=tagH+gap+L.lines.length*lh;
  const footTop=H-64-84,lineY=footTop-38;
  let top=lineY-60-total;
  if($('anchor').value==='centro')top=Math.max(90,(lineY-total)/2);
  top=Math.max(60,top);

  drawBg(ac);
  ctx=octx;oc.width=W;oc.height=H; // el texto y el degradado se dibujan en una capa aparte (sirve para video)

  if(photoMode){
    const k=$('dark').value/100;
    const cl=v=>Math.min(1,Math.max(0,v/H));
    const s0=cl(top-460),sA=Math.max(s0+.01,cl(top-300)),sB=Math.max(sA+.01,cl(top-80));
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(10,10,10,0)');g.addColorStop(s0,'rgba(10,10,10,0)');
    g.addColorStop(sA,\`rgba(10,10,10,\${(k*.45).toFixed(2)})\`);g.addColorStop(sB,\`rgba(10,10,10,\${(k*.9).toFixed(2)})\`);
    g.addColorStop(1,\`rgba(10,10,10,\${k.toFixed(2)})\`);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }else if(bg!=='naranja'){
    const g=ctx.createLinearGradient(0,H*.55,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');
    ctx.fillStyle=g;ctx.fillRect(0,H*.55,W,H*.45);
  }

  ctx.textBaseline='alphabetic';ctx.textAlign='left';

  // etiqueta
  let y=top;
  if(tagTxt){
    ctx.font='700 22px "Roboto Condensed", sans-serif';
    const tw=spacedW(tagTxt,6)+40;
    ctx.fillStyle=ac;ctx.fillRect(M,y,tw,tagH);
    ctx.fillStyle='#fff';ctx.textBaseline='middle';spaced(tagTxt,M+20,y+tagH/2+1,6);ctx.textBaseline='alphabetic';
    y+=tagH+gap;
  }

  // crédito de foto
  const cr=$('credit').value.trim();
  if(cr&&photoMode){
    ctx.font='italic 300 26px "Roboto Condensed", sans-serif';ctx.fillStyle='rgba(255,255,255,.72)';
    ctx.textAlign='right';ctx.fillText(cr,W-M,top+(tagTxt?tagH/2+8:-14));ctx.textAlign='left';
  }

  // titular
  ctx.font=\`\${w} \${fs}px "\${f}", sans-serif\`;
  if(photoMode){ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=14}
  L.lines.forEach((ln,i)=>{
    let x=M;const by=y+i*lh+fs*.84;
    ln.forEach(o=>{ctx.fillStyle=o.hl?ac:$('hcolor').value;ctx.fillText(o.t,x,by);x+=o.w+L.sp});
  });
  ctx.shadowBlur=0;ctx.shadowColor='transparent';

  // línea y pie
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(M,lineY);ctx.lineTo(W-M,lineY);ctx.stroke();
  let tx=M;
  if($('showLogo').checked&&logo.complete&&logo.naturalWidth){
    ctx.save();ctx.beginPath();ctx.arc(M+42,footTop+42,42,0,7);ctx.clip();
    ctx.drawImage(logo,M,footTop,84,84);ctx.restore();
    if(bg==='naranja'){ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(M+42,footTop+42,42,0,7);ctx.stroke()}
    tx=M+84+28;
  }
  const nm=$('name').value.trim().toUpperCase(),ur=$('url').value.trim();
  ctx.fillStyle='#fff';ctx.font='300 38px "Roboto Condensed", sans-serif';spaced(nm,tx,footTop+38,5);
  ctx.fillStyle=ac;ctx.font='italic 300 36px "Roboto Condensed", sans-serif';ctx.fillText(ur,tx,footTop+78);
  ctx=mainCtx;ctx.drawImage(oc,0,0);
  $('dim').textContent=\`\${W} × \${H} px\`;
}
// Cuadro de video: fondo + la capa ya dibujada
function frame(){
  if(!vid||bg!=='foto')return;
  ctx=mainCtx;drawBg('');ctx.drawImage(oc,0,0);
}


// ---------------- VIDEO ----------------
const fmtT=s=>\`\${Math.floor(s/60)}:\${String(Math.floor(s%60)).padStart(2,'0')}\`;
function clearVideo(){
  playing=false;
  if(vid){try{vid.pause()}catch(e){}}
  if(vurl)URL.revokeObjectURL(vurl);
  vid=null;vurl=null;audioSrc=null;audioFor=null;
  $('videoOpts').style.display='none';$('vres').style.display='none';
  $('vplay').textContent='Vista previa';
}
function setVideo(file){
  clearVideo();
  const v=document.createElement('video');
  vurl=URL.createObjectURL(file);
  v.src=vurl;v.muted=true;v.playsInline=true;v.preload='auto';v.loop=false;
  v.addEventListener('loadeddata',()=>{
    vid=v;photo=v;
    $('vinfo').textContent=\`\${fmtT(v.duration)} · \${v.videoWidth}×\${v.videoHeight}\`;
    $('vseek').value=0;$('pos').value=25;
    $('photoTile').style.display='block';$('photoTile').firstElementChild.textContent='Tu video';
    setBg('foto');
    try{v.currentTime=0.05}catch(e){}
  },{once:true});
  v.addEventListener('seeked',()=>{if(vid===v&&!recording){if(!playing)frame()}});
  v.addEventListener('ended',()=>{if(!recording){playing=false;$('vplay').textContent='Vista previa'}});
  v.addEventListener('error',()=>toast('No se pudo leer ese video. Prueba con un MP4.'));
}
function previewLoop(){
  if(!playing||recording)return;
  frame();
  if(!vid.seeking)$('vseek').value=Math.round(vid.currentTime/vid.duration*1000);
  requestAnimationFrame(previewLoop);
}
$('vplay').onclick=()=>{
  if(!vid||recording)return;
  if(vid.paused){vid.muted=true;vid.play().then(()=>{playing=true;$('vplay').textContent='Pausar';previewLoop()}).catch(()=>toast('El navegador bloqueó la reproducción.'))}
  else{vid.pause();playing=false;$('vplay').textContent='Vista previa'}
};
$('vseek').addEventListener('input',()=>{if(vid&&!recording&&isFinite(vid.duration))vid.currentTime=$('vseek').value/1000*vid.duration});
$('vframe').onclick=()=>{
  if(!vid||recording)return;
  const c=document.createElement('canvas');c.width=vid.videoWidth;c.height=vid.videoHeight;
  c.getContext('2d').drawImage(vid,0,0);
  const url=c.toDataURL('image/jpeg',.3);
  clearVideo();photo=c;
  $('photoTile').style.background=\`url(\${url}) center/cover\`;$('photoTile').firstElementChild.textContent='Tu foto';
  setBg('foto');toast('Listo: ese fotograma ahora funciona como foto.');
};

const MIMES=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
function setBusy(b){
  const p=$('panel');p.style.pointerEvents=b?'none':'';p.style.opacity=b?'.55':'';
  $('vprog').style.display=b?'block':'none';
}
async function recordVideo(){
  if(!vid||recording)return;
  if(!window.MediaRecorder||!cv.captureStream){toast('Este navegador no puede grabar video. Usa Chrome.');return}
  const mime=MIMES.find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){toast('Este navegador no puede grabar video. Usa Chrome.');return}
  recording=true;cancelled=false;playing=false;vid.pause();
  $('vres').style.display='none';setBusy(true);$('vbar').style.width='0';$('vtxt').textContent='Preparando…';
  try{
    await new Promise(res=>{const h=()=>{vid.removeEventListener('seeked',h);res()};vid.addEventListener('seeked',h);vid.currentTime=0;setTimeout(res,600)});
    draw(); // construye la capa de texto y pinta el primer cuadro
    const stream=cv.captureStream(30);
    let nota='';
    if($('vsound').checked){
      try{
        audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
        if(audioFor!==vid){audioSrc=audioCtx.createMediaElementSource(vid);audioFor=vid}
        const dest=audioCtx.createMediaStreamDestination();
        audioSrc.disconnect();audioSrc.connect(dest);
        await audioCtx.resume();
        vid.muted=false;vid.volume=1;
        dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
      }catch(e){nota=' (sin sonido)'}
    }else vid.muted=true;
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
    const chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    const stopped=new Promise(res=>{rec.onstop=res});
    $('vcancel').onclick=()=>{cancelled=true};
    rec.start(500);
    await vid.play();
    const dur=vid.duration;
    await new Promise(res=>{
      vid.onended=()=>{frame();res()};
      const tick=()=>{
        if(cancelled){res();return}
        frame();
        const p=Math.min(1,vid.currentTime/dur);
        $('vbar').style.width=(p*100).toFixed(1)+'%';
        $('vtxt').textContent=\`Grabando… \${fmtT(vid.currentTime)} / \${fmtT(dur)}\${nota}\`;
        requestAnimationFrame(tick);
      };
      tick();
    });
    vid.onended=null;vid.pause();
    await new Promise(r=>setTimeout(r,300));
    if(rec.state!=='inactive')rec.stop();
    await stopped;
    if(cancelled){toast('Grabación cancelada.')}
    else if(chunks.length){
      const type=mime.split(';')[0],ext=type==='video/mp4'?'mp4':'webm';
      resBlob=new Blob(chunks,{type});
      if(resUrl)URL.revokeObjectURL(resUrl);
      resUrl=URL.createObjectURL(resBlob);
      const a=$('vlink');a.href=resUrl;a.download='cartel-bmm.'+ext;a.textContent='Descargar video ('+ext.toUpperCase()+')';
      $('vres').style.display='block';
      toast('Video listo.');
    }else toast('La grabación salió vacía. Inténtalo de nuevo.');
  }catch(e){
    toast('No se pudo grabar el video: '+(e&&e.message?e.message:e));
  }finally{
    recording=false;vid.muted=true;setBusy(false);
    try{vid.currentTime=0}catch(e){}
    $('vplay').textContent='Vista previa';draw();
  }
}
$('vrec').onclick=recordVideo;
$('vshare').onclick=async()=>{
  if(!resBlob)return;
  const type=resBlob.type,name='cartel-bmm.'+(type==='video/mp4'?'mp4':'webm');
  const file=new File([resBlob],name,{type});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Barberena Mi Municipio'})}catch(e){}}
  else toast('Este navegador no permite compartir directo; usa "Descargar video".');
};

function loadFonts(){
  const {f,w}=fontSpec();
  return Promise.all([\`300 30px "Roboto Condensed"\`,\`italic 300 30px "Roboto Condensed"\`,\`700 30px "Roboto Condensed"\`,\`\${w} 30px "\${f}"\`].map(s=>document.fonts.load(s,'Aáéíóúñ'))).then(draw).catch(draw);
}

function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3200)}

function setBg(k){
  bg=k;document.querySelectorAll('.bgb').forEach(b=>b.classList.toggle('on',b.dataset.bg===k));
  $('photoOpts').style.display=(k==='foto')?'block':'none';
  $('videoOpts').style.display=(k==='foto'&&vid)?'block':'none';draw();
}
document.querySelectorAll('.bgb').forEach(b=>b.onclick=()=>setBg(b.dataset.bg));
document.querySelectorAll('#fmt button').forEach(b=>b.onclick=()=>{
  H=+b.dataset.h;document.querySelectorAll('#fmt button').forEach(x=>x.classList.toggle('on',x===b));draw();
});
$('imageLoader').onchange=e=>{
  const file=e.target.files[0];e.target.value='';if(!file||recording)return;
  if(file.type.startsWith('video/')){setVideo(file);return}
  clearVideo();$('photoTile').firstElementChild.textContent='Tu foto';
  const r=new FileReader();
  r.onload=ev=>{const im=new Image();im.onload=()=>{photo=im;$('photoTile').style.display='block';
    $('photoTile').style.background=\`url(\${ev.target.result}) center/cover\`;$('pos').value=25;setBg('foto')};im.src=ev.target.result};
  r.readAsDataURL(file);
};
['tag','head','hl','sz','anchor','upper','name','url','credit','showLogo','accent','hcolor','pos','dark'].forEach(id=>{
  $(id).addEventListener('input',()=>{
    if(id==='sz')$('szv').textContent=$('sz').value;
    if(id==='head'||id==='upper'){autoHL();if(id==='head')scheduleAI()}
    if(id==='hl')$('autoHl').checked=false;
    draw()});
  $(id).addEventListener('change',draw);
});
$('autoHl').addEventListener('change',()=>{autoHL();draw();scheduleAI()});
$('font').addEventListener('change',loadFonts);

function blob(){return new Promise(r=>cv.toBlob(r,'image/png'))}
$('dl').onclick=async()=>{
  const b=await blob(),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download='cartel-bmm.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
};
$('share').onclick=async()=>{
  const b=await blob(),file=new File([b],'cartel-bmm.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'Barberena Mi Municipio'})}catch(e){}
  }else{
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cartel-bmm.png';a.click();
    toast('Este navegador no permite compartir directo; se descargó la imagen.');
  }
};
$('resetBtn').onclick=()=>{
  $('tag').value='Local · Servicios';$('head').value='Vecinos denuncian falta de agua y exigen boletas sin recargos';
  $('autoHl').checked=true;$('hl').value='falta de agua';$('font').value='Roboto Condensed|700';$('sz').value=96;$('szv').textContent='96';
  $('anchor').value='abajo';$('upper').checked=false;$('name').value='Barberena Mi Municipio';
  $('url').value='barberenamimunicipio.top';$('credit').value='Foto: archivo';$('showLogo').checked=true;
  $('accent').value='#ef4f1d';$('hcolor').value='#ffffff';$('dark').value=72;
  H=1350;document.querySelectorAll('#fmt button').forEach((x,i)=>x.classList.toggle('on',i===0));
  clearVideo();setBg('negro');loadFonts();toast('Valores restablecidos.');
};
draw();loadFonts();document.fonts.ready.then(draw);
</script>
</body>
</html>
`;
