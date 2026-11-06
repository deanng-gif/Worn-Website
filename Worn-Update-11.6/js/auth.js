// Worn: shared login helpers used by every page that talks to Supabase.
(function () {
  var cfg = window.WORN_CONFIG || {};
  var configured = typeof cfg.supabaseUrl === 'string' && cfg.supabaseUrl.indexOf('https://') === 0 &&
                   typeof cfg.supabaseKey === 'string' && cfg.supabaseKey.indexOf('YOUR-') !== 0;
  var libLoaded = !!(window.supabase && window.supabase.createClient);

  var worn = {
    ready: configured && libLoaded,
    client: null,
    PHOTO_BUCKET: 'body-photos'
  };

  if (worn.ready) {
    worn.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  } else if (!configured) {
    console.warn('Worn: add your Supabase URL and key in js/config.js to turn on accounts.');
  } else {
    console.warn('Worn: the Supabase library did not load. Check your internet connection.');
  }

  worn.notReadyMessage = !configured
    ? "Accounts aren't switched on yet. Add your Supabase details to js/config.js."
    : "We couldn't reach the account service. Check your connection and try again.";

  // Current signed-in user, or null.
  worn.getUser = async function () {
    if (!worn.ready) return null;
    var res = await worn.client.auth.getSession();
    return res.data && res.data.session ? res.data.session.user : null;
  };

  // Only allow redirects to our own pages (e.g. "profile.html").
  worn.safeNext = function (value, fallback) {
    return /^[a-z0-9-]+\.html$/.test(value || '') ? value : fallback;
  };

  // Send signed-out visitors to the log-in page, then back here afterwards.
  worn.requireUser = async function () {
    var user = await worn.getUser();
    if (!user) {
      var here = location.pathname.split('/').pop() || 'index.html';
      location.replace('login.html?next=' + encodeURIComponent(here));
      return null;
    }
    return user;
  };

  // Show a message in a status element. kind: 'error' | 'ok' | 'info'
  worn.say = function (el, text, kind) {
    if (!el) return;
    var colors = { error: '#8A1F14', ok: '#2F5D3A', info: '#5A544C' };
    el.style.color = colors[kind] || colors.info;
    el.textContent = text || '';
  };

  // Turn Supabase's technical errors into plain language.
  worn.friendlyError = function (err) {
    var msg = (err && err.message) || String(err || '');
    if (/invalid login credentials/i.test(msg)) return 'That email and password do not match an account.';
    if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox for the link.';
    if (/already registered|already exists/i.test(msg)) return 'An account with this email already exists. Try logging in instead.';
    if (/password should be at least/i.test(msg)) return 'Your password is too short.';
    if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
    if (/failed to fetch|network/i.test(msg)) return "We couldn't reach the server. Check your connection and try again.";
    return msg || 'Something went wrong. Please try again.';
  };

  window.worn = worn;
})();
