const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 8787);
const RIOT_API_KEY = process.env.RIOT_API_KEY || "";
const ROOT = __dirname;

const regionMap = {
  eu: { route: "europe", shard: "eu" },
  na: { route: "americas", shard: "na" },
  br: { route: "americas", shard: "br" },
  latam: { route: "americas", shard: "latam" },
  ap: { route: "asia", shard: "ap" },
  kr: { route: "asia", shard: "kr" },
};

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/valorant/status") {
    const wantsJson = url.searchParams.get("format") === "json";
    if (!wantsJson) {
      sendStatusHtml(res);
      return;
    }
    sendJson(res, 200, {
      ok: true,
      hasRiotApiKey: Boolean(RIOT_API_KEY),
      keyFingerprint: RIOT_API_KEY ? fingerprintKey(RIOT_API_KEY) : null,
      keyLength: RIOT_API_KEY.length,
      note: "Fingerprint is safe to show. It changes when the backend is restarted with a different key.",
    });
    return;
  }

  if (url.pathname === "/status") {
    sendStatusHtml(res);
    return;
  }

  if (url.pathname === "/api/valorant/check") {
    const player = url.searchParams.get("player") || "";
    const tag = url.searchParams.get("tag") || "";
    const region = (url.searchParams.get("region") || "eu").toLowerCase();
    const regionInfo = regionMap[region] || regionMap.eu;
    const checks = await runRiotChecks({ player, tag, regionInfo });
    sendJson(res, 200, {
      hasRiotApiKey: Boolean(RIOT_API_KEY),
      keyFingerprint: RIOT_API_KEY ? fingerprintKey(RIOT_API_KEY) : null,
      checks,
    });
    return;
  }

  if (url.pathname === "/check") {
    const player = url.searchParams.get("player") || "";
    const tag = url.searchParams.get("tag") || "";
    const region = (url.searchParams.get("region") || "eu").toLowerCase();
    const regionInfo = regionMap[region] || regionMap.eu;
    const checks = await runRiotChecks({ player, tag, regionInfo });
    sendCheckHtml(res, { player, tag, region, checks });
    return;
  }

  if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
    await serveStatic(url.pathname, res);
    return;
  }

  if (url.pathname !== "/api/valorant/analyze") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (!url.searchParams.has("player") && !url.searchParams.has("tag")) {
    sendHtml(
      res,
      200,
      `<h1>ClutchMind backend is running</h1>
       <p>Use the app page, not this API URL directly.</p>
       <p>Open <a href="file:///C:/Users/xiari/Documents/Codex/2026-05-22/dok-e-vytv-et-k-dy/index.html">ClutchMind Coach</a>.</p>
       <p>Real Riot data requires RIOT_API_KEY plus approved Riot API/RSO access. Without it, use JSON import or fix the backend connection.</p>`,
    );
    return;
  }

  if (!RIOT_API_KEY) {
    sendJson(res, 503, {
      error: "RIOT_API_KEY is missing",
      message: "Set RIOT_API_KEY to use real Riot match data. The browser app will not invent match data without it.",
      hint: "Backend běží bez Riot API klíče. Spusť START_CLUTCHMIND.bat znovu a vlož aktuální klíč do černého okna.",
    });
    return;
  }

  try {
    const player = required(url.searchParams.get("player"), "player");
    const tag = required(url.searchParams.get("tag"), "tag");
    const region = (url.searchParams.get("region") || "eu").toLowerCase();
    const regionInfo = regionMap[region] || regionMap.eu;
    const content = await loadContent(regionInfo.shard);

    const account = await riotFetch(
      `https://${regionInfo.route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player)}/${encodeURIComponent(tag)}`,
    );
    const matchlist = await riotFetch(
      `https://${regionInfo.shard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${encodeURIComponent(account.puuid)}`,
    );

    const ids = (matchlist.history || []).slice(0, 8).map((item) => item.matchId);
    const rawMatches = await Promise.all(
      ids.map((id) =>
        riotFetch(`https://${regionInfo.shard}.api.riotgames.com/val/match/v1/matches/${encodeURIComponent(id)}`),
      ),
    );
    const matches = rawMatches
      .map((match) => summarizeMatch(match, account.puuid, player, content))
      .filter(Boolean);

    sendJson(res, 200, { player, tag, region, matches });
  } catch (error) {
    sendJson(res, error.httpStatus || 500, {
      error: error.message || "Unknown backend error",
      hint: error.hint || "Backend error. Check the terminal window for details.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`ClutchMind backend listening on http://localhost:${PORT}`);
  console.log(`RIOT_API_KEY loaded: ${RIOT_API_KEY ? `yes (${fingerprintKey(RIOT_API_KEY)})` : "no"}`);
});

async function riotFetch(url) {
  const response = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Riot API ${response.status}: ${detail}`);
    error.httpStatus = response.status === 403 ? 403 : 502;
    error.hint = buildRiotHint(response.status);
    throw error;
  }
  return response.json();
}

async function riotCheck(name, url) {
  if (!RIOT_API_KEY) {
    return { name, ok: false, status: 503, detail: "RIOT_API_KEY is missing" };
  }
  try {
    const response = await fetch(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
    const text = await response.text();
    return {
      name,
      ok: response.ok,
      status: response.status,
      detail: text.slice(0, 240),
    };
  } catch (error) {
    return { name, ok: false, status: 0, detail: error.message || "Network error" };
  }
}

async function runRiotChecks({ player, tag, regionInfo }) {
  const checks = [];
  checks.push(
    await riotCheck("account-by-riot-id", `https://${regionInfo.route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player)}/${encodeURIComponent(tag)}`),
  );
  checks.push(await riotCheck("valorant-content", `https://${regionInfo.shard}.api.riotgames.com/val/content/v1/contents?locale=en-US`));

  const accountCheck = checks[0];
  if (accountCheck.ok) {
    try {
      const account = JSON.parse(accountCheck.detail);
      checks.push(
        await riotCheck("valorant-matchlist", `https://${regionInfo.shard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${encodeURIComponent(account.puuid)}`),
      );
    } catch (error) {
      checks.push({ name: "valorant-matchlist", ok: false, status: 0, detail: `Could not parse account response: ${error.message}` });
    }
  }
  return checks;
}

function buildRiotHint(status) {
  if (status === 403) {
    return "Riot API vrátil 403 Forbidden: klíč je přítomný, ale Riot ho pro tento Valorant endpoint odmítl. Nejčastěji je klíč expirovaný, zneplatněný, opsaný špatně, nebo nemá povolený přístup k VALORANT API/RSO.";
  }
  if (status === 404) {
    return "Riot API vrátil 404: hráč, tag nebo region nejspíš nesedí.";
  }
  if (status === 429) {
    return "Riot API vrátil 429: překročený rate limit. Chvíli počkej a zkus to znovu.";
  }
  return "Riot API request selhal. Zkontroluj backend okno a Riot Developer Portal.";
}

function summarizeMatch(match, puuid, playerName, content) {
  const player = (match.players || []).find((item) => item.puuid === puuid);
  if (!player) return null;

  const rounds = Math.max(1, Number(match.metadata?.roundsPlayed || player.stats?.roundsPlayed || 1));
  const stats = player.stats || {};
  const shots = collectShots(match, puuid);
  const hs = shots.total ? Math.round((shots.head / shots.total) * 100) : 0;
  const acs = stats.score ? Math.round(Number(stats.score) / rounds) : 0;
  const team = (match.teams || []).find((item) => item.teamId === player.teamId);
  const result = team?.won ? "win" : "loss";
  const score = buildScore(match, player.teamId);

  return {
    player: player.gameName || playerName,
    agent: content.characters[player.characterId] || player.characterId,
    role: "",
    map: content.maps[match.matchInfo?.mapId] || match.matchInfo?.mapId || "Unknown",
    result,
    score,
    kills: Number(stats.kills || 0),
    deaths: Number(stats.deaths || 0),
    assists: Number(stats.assists || 0),
    acs,
    hs,
    notes: "Nacteno z Riot match API. Coach odhaduje chyby ze statistickych vzorcu; VOD review bude presnejsi.",
  };
}

async function loadContent(shard) {
  try {
    const content = await riotFetch(`https://${shard}.api.riotgames.com/val/content/v1/contents?locale=en-US`);
    return {
      characters: Object.fromEntries((content.characters || []).map((item) => [item.id, item.name])),
      maps: Object.fromEntries((content.maps || []).map((item) => [item.id, item.name])),
    };
  } catch {
    return { characters: {}, maps: {} };
  }
}

function collectShots(match, puuid) {
  let head = 0;
  let body = 0;
  let leg = 0;
  for (const round of match.roundResults || []) {
    for (const damage of round.playerStats || []) {
      if (damage.puuid !== puuid) continue;
      for (const entry of damage.damage || []) {
        head += Number(entry.headshots || 0);
        body += Number(entry.bodyshots || 0);
        leg += Number(entry.legshots || 0);
      }
    }
  }
  return { head, total: head + body + leg };
}

function buildScore(match, teamId) {
  const teams = match.teams || [];
  const own = teams.find((team) => team.teamId === teamId);
  const enemy = teams.find((team) => team.teamId !== teamId);
  if (!own || !enemy) return "";
  return `${own.roundsWon || 0}:${enemy.roundsWon || 0}`;
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(`<!doctype html><html><head><title>ClutchMind Backend</title></head><body>${html}</body></html>`);
}

function sendStatusHtml(res) {
  const keyLoaded = Boolean(RIOT_API_KEY);
  const fingerprint = keyLoaded ? fingerprintKey(RIOT_API_KEY) : "neni nacteny";
  sendHtml(
    res,
    200,
    `<main style="font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;line-height:1.55">
      <h1>ClutchMind backend bezi</h1>
      <p><strong>Riot API key:</strong> ${keyLoaded ? "nacteny" : "neni nacteny"}</p>
      <p><strong>Fingerprint:</strong> ${fingerprint}</p>
      <p><strong>Delka klice:</strong> ${RIOT_API_KEY.length}</p>
      <p>Fingerprint neni tajny klic. Slouzi jen k overeni, ze backend po restartu opravdu pouziva novy key.</p>
      <p><a href="/">Zpet do ClutchMind Coach</a></p>
      <p><a href="/api/valorant/status?format=json">Zobrazit JSON status</a></p>
    </main>`,
  );
}

function sendCheckHtml(res, { player, tag, region, checks }) {
  const rows = checks
    .map(
      (check) => `
        <tr>
          <td>${escapeHtml(check.name)}</td>
          <td>${check.ok ? "OK" : "FAIL"}</td>
          <td>${check.status}</td>
          <td><code>${escapeHtml(check.detail || "")}</code></td>
        </tr>
      `,
    )
    .join("");
  sendHtml(
    res,
    200,
    `<main style="font-family:system-ui,sans-serif;max-width:1100px;margin:40px auto;line-height:1.45">
      <h1>Riot API kontrola</h1>
      <p><strong>Hrac:</strong> ${escapeHtml(player)}#${escapeHtml(tag)} · <strong>Region:</strong> ${escapeHtml(region)}</p>
      <p><strong>Key fingerprint:</strong> ${RIOT_API_KEY ? fingerprintKey(RIOT_API_KEY) : "neni nacteny"}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
        <thead>
          <tr><th>Test</th><th>Vysledek</th><th>Status</th><th>Detail</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p><a href="/">Zpet do ClutchMind Coach</a></p>
    </main>`,
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, accept");
}

function fingerprintKey(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 10);
}

async function serveStatic(pathname, res) {
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  const safePath = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(ROOT, safePath);
  const allowed = new Set(["index.html", "styles.css", "app.js", "riot-review.html"]);

  if (!allowed.has(safePath)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  try {
    const content = await fs.readFile(fullPath);
    const type = safePath.endsWith(".css")
      ? "text/css"
      : safePath.endsWith(".js")
        ? "application/javascript"
        : "text/html; charset=utf-8";
    res.writeHead(200, {
      "content-type": type,
      "cache-control": "no-store",
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}
