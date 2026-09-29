const crypto = require('crypto');

const SITE_URL = process.env.SITE_URL || 'https://www.elrompearos.com';

function gameSlug(game) {
  return `${game.visitor_team.abbreviation.toLowerCase()}-vs-${game.home_team.abbreviation.toLowerCase()}-${game.id}`;
}

function buildResultText(game) {
  const url = `${SITE_URL}/partido/${gameSlug(game)}?season=${game.season}`;
  return `🏀 Resultado final\n\n${game.visitor_team.full_name} ${game.visitor_team_score} - ${game.home_team_score} ${game.home_team.full_name}\n\nEstadísticas del partido: ${url}`;
}

async function postToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) {
    throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
  }
  return true;
}

// Firma OAuth 1.0a "user context", que es lo que exige POST /2/tweets en el
// plan gratuito de la API de X. No hace falta ninguna libreria: son cuatro
// pasos (parametros ordenados, base string, clave de firma, HMAC-SHA1) segun
// la especificacion de OAuth 1.0a.
function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildOAuthHeader(method, url) {
  const oauthParams = {
    oauth_consumer_key: process.env.TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0'
  };

  const paramString = Object.keys(oauthParams).sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(process.env.TWITTER_API_SECRET)}&${percentEncode(process.env.TWITTER_ACCESS_SECRET)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  const headerParams = { ...oauthParams, oauth_signature: signature };
  return 'OAuth ' + Object.keys(headerParams).sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`)
    .join(', ');
}

async function postToTwitter(text) {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    return false;
  }

  const url = 'https://api.twitter.com/2/tweets';
  // El limite de X son 280 caracteres.
  const tweetText = text.length > 280 ? `${text.slice(0, 277)}...` : text;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: buildOAuthHeader('POST', url),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: tweetText })
  });
  if (!res.ok) {
    throw new Error(`X/Twitter API ${res.status}: ${await res.text()}`);
  }
  return true;
}

// Publica el resultado final de un partido en los canales configurados.
// Si no hay credenciales de ningun canal en las variables de entorno, no
// hace nada (asi el sitio sigue funcionando igual sin esta funcionalidad
// activada, igual que ya pasa hoy sin BALLDONTLIE_API_KEY en local).
async function publishGameResult(game) {
  const text = buildResultText(game);
  const results = await Promise.allSettled([postToTelegram(text), postToTwitter(text)]);

  const platforms = ['Telegram', 'X/Twitter'];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[social] fallo publicando en ${platforms[i]}: ${r.reason.message}`);
    }
  });

  const published = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  if (published > 0) {
    console.log(`[social] resultado publicado (${game.visitor_team.abbreviation} @ ${game.home_team.abbreviation})`);
  }
}

module.exports = { publishGameResult, postToTelegram, postToTwitter };
