const STORAGE_KEY = "clutchmind-reviews-v2";

const state = {
  tone: "calm",
  reviews: loadReviews(),
  videoUrl: null,
  vodMoments: [],
};

const issueLabels = {
  solo_peek: "solo peek bez podpory",
  no_trade: "fight bez tradu",
  dry_peek: "dry peek bez utility",
  repeek: "re-peek stejné lajny",
  utility_unused: "smrt s nepoužitou utilitou",
  late_rotate: "pozdní rotace",
  overrotate: "over-rotate bez potvrzení",
  bad_postplant: "slabý post-plant",
  clutch_rush: "uspěchaný clutch",
  flank_unwatched: "nehlídaný flank",
  good_entry: "dobrý entry impact",
  clutch: "dobré clutch rozhodování",
};

const issueAdvice = {
  solo_peek:
    "První kontakt ber jen s trade partnerem, připravenou utilitou nebo jasným plánem úniku. Solo info má cenu jen tehdy, když po něm přežiješ.",
  no_trade:
    "Drž spacing tak, aby tě spoluhráč dokázal vyměnit do dvou vteřin. Jakmile jdeš moc hluboko, přestáváš dělat prostor a začínáš darovat izolovaný duel.",
  dry_peek:
    "Když víš, že úhel může být držený, nejdřív ho rozbij utilitou nebo informací. Tvoje tělo má být poslední věc, kterou soupeř uvidí.",
  repeek:
    "Po killu, spotu nebo whiffu změň timing, výšku nebo pozici. Stejná lajna je pro lepší hráče hotový pre-aim.",
  utility_unused:
    "Před riskantním kontaktem použij nejlevnější kus utility, který zlepší duel: smoke, flash, drone, stun, molly, cage nebo recon.",
  late_rotate:
    "Rotuj podle commit triggeru, ne až podle plant soundu. Když čekáš až na plant, retake začíná proti hotovému post-plantu.",
  overrotate:
    "Nerotuj na první hluk. Čekej potvrzení spiku, balíku utility nebo ztráty klíčového prostoru.",
  bad_postplant:
    "Po plantu nehledáš ego fight. Hraješ spike, čas, zvuk defusu a pozici, kde můžeš soupeře donutit k chybě.",
  clutch_rush:
    "První tři vteřiny clutch zpomal: spike stav, čas, poslední info, tvoje utilita. Pak si vyber jednu win condition.",
  flank_unwatched:
    "Když tým bere site, někdo musí držet záda nebo mít trap. Bez flank kontroly se dobrý execute mění v chaos.",
  good_entry:
    "Tvoje entry má hodnotu, když po zisku prostoru zastavíš tempo, vytvoříš crossfire a necháš tým kolo dotáhnout.",
  clutch:
    "V clutchích izoluj fighty po jednom, poslouchej objektiv a nech soupeře udělat první vynucenou chybu.",
};

const rolePrinciples = {
  duelist:
    "Duelista má tvořit prostor, ne jen lovit fragy. Vstupuj po smoku, flashi nebo stun timingem a po prvním kontaktu buď přežij, nebo buď okamžitě tradovatelný.",
  controller:
    "Controller musí přežít do mid-roundu. Smoke, wall a molly mají hodnotu v execute, rotaci, retaku i post-plantu, takže zbytečný early duel tě stojí víc než jen jednu smrt.",
  initiator:
    "Initiator otevírá fight informací nebo crowd controlem. Když tým peekuje bez tvé utility, kolo je drahé a nečitelné.",
  sentinel:
    "Sentinel chrání mapu pasivně: flank, extremity, retake setup a informace bez zbytečného rizika. Tvoje hodnota je v tom, že tým nemusí pořád koukat za sebe.",
  flex:
    "Flex vyhrává adaptací. Sleduj, co týmu chybí v dalších deseti vteřinách: trade, smoke, info, flank držení nebo plant.",
};

const phasePrinciples = {
  early: "Early round je o informaci a prostoru, ne o hrdinské smrti. První duel musí mít důvod.",
  mid: "Mid-round je o rozhodování. Po prvním picku nebo ztrátě prostoru se musí změnit plán, ne jen běžet dál.",
  execute: "Execute funguje, když utility dopadne dřív než těla. Smoke, flash a entry mají být jeden timing.",
  postplant: "Post-plant je objektivní hra. Nehledej zbytečný duel, drž spike, čas a přerušení defusu.",
  retake: "Retake je nejlepší ve vlnách: počkej na spoluhráče, vyčisti jednu zónu a až potom fighti site.",
  clutch: "Clutch začíná resetem. Nech soupeře hádat, kde jsi, a nehraj všechny možnosti najednou.",
};

const roleNames = {
  duelist: "duelista",
  controller: "controller",
  initiator: "initiator",
  sentinel: "sentinel",
  flex: "flex",
};

const phaseNames = {
  early: "early round",
  mid: "mid-round",
  execute: "execute",
  postplant: "post-plant",
  retake: "retake",
  clutch: "clutch",
};

const agentRoles = {
  jett: "duelist",
  raze: "duelist",
  reyna: "duelist",
  phoenix: "duelist",
  neon: "duelist",
  yoru: "duelist",
  iso: "duelist",
  waylay: "duelist",
  omen: "controller",
  brimstone: "controller",
  viper: "controller",
  astra: "controller",
  harbor: "controller",
  clove: "controller",
  sova: "initiator",
  breach: "initiator",
  skye: "initiator",
  fade: "initiator",
  gekko: "initiator",
  kayo: "initiator",
  "kayo/ko": "initiator",
  tejo: "initiator",
  killjoy: "sentinel",
  cypher: "sentinel",
  sage: "sentinel",
  chamber: "sentinel",
  deadlock: "sentinel",
  vyse: "sentinel",
};

const toneOpeners = {
  calm: ["Vidím u tebe jasný vzorec:", "Dnesní signál je docela čitelný:", "Tohle je dobrý základ:"],
  direct: ["Bez okecávání:", "Tady je pravda:", "Tohle tě stojí kola:"],
  igl: ["Z pohledu IGL:", "Makro problém je tady:", "Kdybych tě calloval, řeknu:"],
};

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll(".tone").forEach((button) => {
  button.addEventListener("click", () => {
    state.tone = button.dataset.tone;
    document.querySelectorAll(".tone").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});

document.getElementById("runAutoCoach").addEventListener("click", runAutoCoach);
document.getElementById("analyzeVod").addEventListener("click", analyzeVod);
document.getElementById("clearData").addEventListener("click", () => {
  state.reviews = [];
  state.vodMoments = [];
  persist();
  render();
  renderVodMoments();
});

document.getElementById("vodInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const preview = document.getElementById("videoPreview");
  if (!file) return;
  if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
  state.videoUrl = URL.createObjectURL(file);
  preview.innerHTML = `<video id="vodPlayer" controls src="${state.videoUrl}"></video>`;
  document.getElementById("liveCoachRead").textContent =
    "VOD je načtený. Klikni na Analyzovat VOD a coach vytáhne časové body podle délky záznamu a nalezených vzorců ze zápasů.";
});

render();

function switchView(view) {
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
  document.getElementById(view).classList.add("active");
  document.querySelector(`[data-view="${view}"]`).classList.add("active");

  const titles = {
    dashboard: "Tvoje osobní analýza",
    review: "Rozbor zápasu",
    history: "Historie a progres",
    profile: "Nastavení kouče",
  };
  document.getElementById("pageTitle").textContent = titles[view];
}

async function runAutoCoach() {
  const button = document.getElementById("runAutoCoach");
  const player = document.getElementById("riotName").value.trim() || "Player";
  const tag = document.getElementById("riotTag").value.trim() || "TAG";
  const region = document.getElementById("riotRegion").value;
  const json = document.getElementById("matchJson").value.trim();
  const status = document.getElementById("autoStatus");

  button.disabled = true;
  status.textContent = "Coach načítá zápasy, agenty, role a hledá opakující se chyby...";

  try {
    let payload = null;
    if (json) {
      try {
        payload = JSON.parse(json);
      } catch {
        status.textContent = "JSON nejde přečíst. Zkontroluj formát, nebo pole nech prázdné a použij reálný backend.";
        button.disabled = false;
        return;
      }
    }

    if (!payload) {
      payload = await tryLocalBackend({ player, tag, region });
    }

    if (!payload) {
      status.textContent =
        "Nepodařilo se načíst reálná Riot data. Nic nepřidávám, aby coach nevymýšlel agenty, které opravdu nehraješ. Zkontroluj Riot API klíč, tag/region nebo vlož JSON export.";
      return;
    }

    const matches = normalizeMatches(payload.matches || [], { player });
    if (!matches.length) {
      status.textContent =
        "Backend odpověděl, ale nevrátil žádné zápasy. Nic nepřidávám, aby rozbor nebyl založený na neověřených datech.";
      return;
    }

    state.reviews = [...matches, ...state.reviews];
    persist();
    render();
    switchView("dashboard");

    status.textContent = "Hotovo. Coach načetl reálné/importované zápasy, vyhodnotil agenty, role, KDA, ACS, HS % a vytvořil osobní report.";
  } catch (error) {
    status.textContent = `Rozbor jsem zastavil, aby nevznikla neověřená data. Detail: ${error.message || "neznámý problém"}`;
  } finally {
    button.disabled = false;
  }
}

async function tryLocalBackend(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const query = new URLSearchParams(request);
    const base = window.location.protocol === "file:" ? "http://localhost:8787" : "";
    const response = await fetch(`${base}/api/valorant/analyze?${query}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.hint || data.error || `Backend vrátil chybu ${response.status}.`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Backend neodpověděl včas. Zkontroluj, že běží START_CLUTCHMIND.bat.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeMatches(matches, fallback) {
  return matches.slice(0, 12).map((match, index) => {
    const agent = normalizeAgentName(match.agent || match.character || match.characterName || "Neznámý agent");
    const moments = (match.moments || inferMoments(match)).map((moment) => ({
      time: moment.time || "",
      side: moment.side || "attack",
      phase: moment.phase || "mid",
      type: moment.type || "no_trade",
      note: moment.note || "Automaticky nalezený vzorec ze statistik zápasu.",
    }));

    return {
      id: createId(),
      createdAt: match.createdAt || new Date(Date.now() - index * 86400000).toISOString(),
      player: match.player || fallback.player,
      agent,
      role: match.role || guessRole(agent),
      map: cleanMapName(match.map || "Neznámá mapa"),
      result: match.result === "win" ? "win" : "loss",
      score: match.score || "",
      kills: Number(match.kills || 0),
      deaths: Number(match.deaths || 0),
      assists: Number(match.assists || 0),
      acs: Number(match.acs || 0),
      hs: Number(match.hs ?? match.headshotPercent ?? 0),
      notes: match.notes || buildAutoNotes(match),
      moments,
    };
  });
}

function inferMoments(match) {
  const moments = [];
  const kills = Number(match.kills || 0);
  const deaths = Number(match.deaths || 0);
  const assists = Number(match.assists || 0);
  const acs = Number(match.acs || 0);
  const hs = Number(match.hs ?? match.headshotPercent ?? 0);

  if (deaths > kills) {
    moments.push({ phase: "early", type: "solo_peek", note: "Deaths jsou nad kills. Coach čte problém v přežívání prvního kontaktu." });
  }
  if (assists < 4 && deaths > 12) {
    moments.push({ phase: "mid", type: "no_trade", note: "Nízké assists při vyšších smrtích často znamenají špatný spacing nebo izolované fighty." });
  }
  if (acs < 190) {
    moments.push({ phase: "execute", type: "dry_peek", note: "Nižší ACS naznačuje málo výhodných kontaktů, pozdní impact nebo peeking bez utility." });
  }
  if (hs < 18) {
    moments.push({ phase: "mid", type: "repeek", note: "Nižší HS % často není jen aim. Často jde o špatný úhel, pohyb nebo předvídatelný re-peek." });
  }
  if (Number(match.result === "loss") && kills > deaths && assists < 5) {
    moments.push({ phase: "postplant", type: "bad_postplant", note: "Impact existuje, ale kolo se nemusí převádět do výher. Coach hlídá post-plant a práci s časem." });
  }
  if (!moments.length) {
    moments.push({ phase: "postplant", type: "good_entry", note: "Staty vypadají solidně. Další krok je měnit získaný prostor na stabilní vyhraná kola." });
  }
  return moments.slice(0, 3);
}

function analyzeVod() {
  const player = document.getElementById("vodPlayer");
  const target = document.getElementById("liveCoachRead");
  if (!player) {
    target.textContent = "Nejdřív nahraj VOD nebo klip. Potom coach vytvoří automatický rozbor časových bodů.";
    return;
  }

  const stats = getStats();
  const vodAgent = document.getElementById("vodAgent").value.trim() || "Clove";
  const vodRole = guessRole(vodAgent);
  const duration = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 20 * 60;
  const basePatterns = getVodPatterns(stats, vodRole);
  const phases = ["early", "mid", "execute", "postplant", "retake", "clutch"];

  state.vodMoments = basePatterns.map(([type], index) => {
    const seconds = Math.min(duration - 1, Math.max(20, (duration / (basePatterns.length + 1)) * (index + 1)));
    const phase = phases[(index + Math.round(duration / 90)) % phases.length];
    return {
      time: formatVideoTime(seconds),
      phase,
      type,
      note: buildVodNote(type, phase, stats, vodAgent, vodRole),
    };
  });

  renderVodMoments();
  target.textContent =
    `VOD beta rozbor je hotový pro agenta ${vodAgent} (${roleName(vodRole)}). Bez vision modelu zatím nepoznám přesný pixelový moment jako člověk, ale už nepřebírám roli z jiného agenta, pokud ji zadáš u VODu.`;
}

function render() {
  const stats = getStats();
  renderDashboard(stats);
  renderHistory();
  renderVodMoments();
}

function renderDashboard(stats) {
  document.getElementById("winrate").textContent = stats.total ? `${Math.round(stats.winrate)} %` : "--";
  document.getElementById("kd").textContent = stats.total ? stats.kd.toFixed(2) : "--";
  document.getElementById("mainIssue").textContent = stats.mainIssue ? issueLabels[stats.mainIssue] : "--";
  document.getElementById("bestAgent").textContent = stats.bestAgent?.agent || "--";
  document.getElementById("impactScore").textContent = stats.total ? stats.impact : "--";
  document.getElementById("coachMessage").textContent = buildCoachMessage(stats);
  document.getElementById("dailyGoal").textContent = stats.mainIssue
    ? issueAdvice[stats.mainIssue]
    : "Spusť první rozbor a coach ti nastaví konkrétní cíl na další hru.";
  document.getElementById("proRead").textContent = buildProRead(stats);

  renderPatternList(stats);
  renderPlan(stats);
  renderCoachReport(stats);
  renderRoleFit(stats);
  renderAgentTable(stats);
}

function renderPatternList(stats) {
  const patternList = document.getElementById("patternList");
  if (!stats.patterns.length) {
    patternList.className = "pattern-list empty-state";
    patternList.textContent = "Zatím tu není dost dat. Spusť rozbor z reálných/importovaných zápasů.";
    return;
  }

  patternList.className = "pattern-list";
  patternList.innerHTML = stats.patterns
    .map(
      ([type, count]) => `
        <div class="pattern">
          <strong>${escapeHtml(issueLabels[type] || type)} (${count}x)</strong>
          <span>${escapeHtml(issueAdvice[type] || "Coach našel opakující se vzorec, který stojí za kontrolu ve VODu.")}</span>
        </div>
      `,
    )
    .join("");
}

function renderPlan(stats) {
  document.getElementById("nextPlan").innerHTML = buildPlan(stats)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderCoachReport(stats) {
  const report = document.getElementById("coachReport");
  if (!stats.total) {
    report.className = "coach-report empty-state";
    report.textContent =
      "Zatím čekám na data ze zápasů. Po rozboru tady dostaneš delší vysvětlení stylu, role, agentů a konkrétních návyků.";
    return;
  }

  report.className = "coach-report";
  report.innerHTML = buildDetailedReport(stats)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderRoleFit(stats) {
  const list = document.getElementById("roleFitList");
  if (!stats.roleFits.length) {
    list.className = "pattern-list empty-state";
    list.textContent = "Zatím není co hodnotit.";
    return;
  }

  list.className = "pattern-list";
  list.innerHTML = stats.roleFits
    .map(
      (role) => `
        <div class="pattern">
          <strong>${escapeHtml(roleName(role.role))} · ${Math.round(role.score)} bodů</strong>
          <span>${role.games} her · WR ${Math.round(role.winrate)} % · K/D ${role.kd.toFixed(2)} · ACS ${Math.round(role.acs)} · ${escapeHtml(role.read)}</span>
        </div>
      `,
    )
    .join("");
}

function renderAgentTable(stats) {
  const table = document.getElementById("agentTable");
  if (!stats.agentFits.length) {
    table.className = "agent-table empty-state";
    table.textContent = "Po importu uvidíš, s kým máš nejlepší dopad.";
    return;
  }

  table.className = "agent-table";
  table.innerHTML = stats.agentFits
    .map(
      (agent) => `
        <div class="agent-row">
          <strong>${escapeHtml(agent.agent)}</strong>
          <span>${escapeHtml(roleName(agent.role))}</span>
          <span>WR ${Math.round(agent.winrate)} %</span>
          <span>K/D ${agent.kd.toFixed(2)}</span>
          <span>ACS ${Math.round(agent.acs)}</span>
        </div>
      `,
    )
    .join("");
}

function renderVodMoments() {
  const list = document.getElementById("moments");
  if (!list) return;
  if (!state.vodMoments.length) {
    list.className = "moments empty-state";
    list.textContent = "Zatím nejsou vytažené žádné momenty z VODu.";
    return;
  }

  list.className = "moments";
  list.innerHTML = state.vodMoments
    .map(
      (moment) => `
        <article class="moment-card">
          <strong>${escapeHtml(moment.time)} · ${escapeHtml(phaseName(moment.phase))} · ${escapeHtml(issueLabels[moment.type] || moment.type)}</strong>
          <span>${escapeHtml(moment.note)}</span>
        </article>
      `,
    )
    .join("");
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!state.reviews.length) {
    list.className = "history-list empty-state";
    list.textContent = "Žádné uložené rozbory.";
    return;
  }

  list.className = "history-list";
  list.innerHTML = state.reviews
    .map((review) => {
      const date = new Date(review.createdAt).toLocaleDateString("cs-CZ");
      const issueSummary = review.moments
        .map((moment) => issueLabels[moment.type])
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
      return `
        <article class="history-item">
          <strong>${escapeHtml(review.agent)} na ${escapeHtml(review.map)} | ${review.result === "win" ? "výhra" : "prohra"} ${escapeHtml(review.score)}</strong>
          <span>${date} | ${review.kills}/${review.deaths}/${review.assists} | ACS ${review.acs} | HS ${review.hs} %</span>
          <span>${escapeHtml(issueSummary || review.notes || "Bez výrazného vzorce.")}</span>
        </article>
      `;
    })
    .join("");
}

function getStats() {
  const total = state.reviews.length;
  const wins = state.reviews.filter((review) => review.result === "win").length;
  const kills = sum("kills");
  const deaths = sum("deaths") || 1;
  const assists = sum("assists");
  const allMoments = state.reviews.flatMap((review) => review.moments || []);

  const counts = countBy(allMoments, (moment) => moment.type);
  const phaseCounts = countBy(allMoments, (moment) => moment.phase || "mid");
  const patterns = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const phases = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1]);
  const roleFits = buildRoleFits();
  const agentFits = buildAgentFits();
  const kd = kills / deaths;
  const avgAcs = average("acs");
  const avgHs = average("hs");
  const winrate = total ? (wins / total) * 100 : 0;
  const bestRole = roleFits[0];
  const bestAgent = agentFits[0];
  const impact = total ? Math.max(1, Math.min(99, Math.round(kd * 30 + winrate * 0.32 + avgAcs / 8 + assists / total))) : "--";

  return {
    total,
    wins,
    kills,
    deaths,
    assists,
    kd,
    avgAcs,
    avgHs,
    winrate,
    impact,
    patterns,
    mainPhase: phases[0]?.[0],
    mainIssue: patterns.find(([type]) => !["good_entry", "clutch"].includes(type))?.[0] || patterns[0]?.[0],
    roleFits,
    agentFits,
    bestRole,
    bestAgent,
    playstyle: detectPlaystyle({ kd, avgAcs, avgHs, assistsPerGame: total ? assists / total : 0, role: bestRole?.role }),
  };
}

function buildRoleFits() {
  const grouped = groupBy(state.reviews, (review) => review.role || guessRole(review.agent));
  return Object.entries(grouped)
    .map(([role, reviews]) => {
      const games = reviews.length;
      const wins = reviews.filter((review) => review.result === "win").length;
      const kills = reviews.reduce((total, review) => total + review.kills, 0);
      const deaths = reviews.reduce((total, review) => total + review.deaths, 0) || 1;
      const assists = reviews.reduce((total, review) => total + review.assists, 0);
      const acs = reviews.reduce((total, review) => total + review.acs, 0) / games;
      const hs = reviews.reduce((total, review) => total + review.hs, 0) / games;
      const winrate = (wins / games) * 100;
      const kd = kills / deaths;
      const assistValue = assists / games;
      const roleBonus = role === "controller" || role === "initiator" ? assistValue * 2.8 : acs / 18;
      const score = winrate * 0.42 + kd * 22 + acs * 0.1 + hs * 0.35 + roleBonus + Math.min(games, 5) * 2;
      return {
        role,
        games,
        winrate,
        kd,
        acs,
        hs,
        score,
        read: buildRoleRead(role, { kd, acs, assistValue, winrate }),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildAgentFits() {
  const grouped = groupBy(state.reviews, (review) => review.agent || "Neznámý agent");
  return Object.entries(grouped)
    .map(([agent, reviews]) => {
      const games = reviews.length;
      const wins = reviews.filter((review) => review.result === "win").length;
      const kills = reviews.reduce((total, review) => total + review.kills, 0);
      const deaths = reviews.reduce((total, review) => total + review.deaths, 0) || 1;
      return {
        agent,
        role: reviews[0].role || guessRole(agent),
        games,
        winrate: (wins / games) * 100,
        kd: kills / deaths,
        acs: reviews.reduce((total, review) => total + review.acs, 0) / games,
        hs: reviews.reduce((total, review) => total + review.hs, 0) / games,
      };
    })
    .sort((a, b) => b.winrate + b.kd * 14 + b.acs / 12 - (a.winrate + a.kd * 14 + a.acs / 12));
}

function buildCoachMessage(stats) {
  if (!stats.total) {
    return "Zatím tě poznávám. Spusť rozbor a začnu hledat vzorce, které se opakují.";
  }

  const opener = pick(toneOpeners[state.tone]);
  const role = stats.bestRole ? roleName(stats.bestRole.role) : "flex";
  const issue = stats.mainIssue ? issueLabels[stats.mainIssue] : "konzistence";

  if (state.tone === "direct") {
    return `${opener} nejlépe teď působíš jako ${role}, ale ${issue} ti bere kola. Tvůj další cíl není víc fightit, ale brát výhodnější fighty.`;
  }

  if (state.tone === "igl") {
    return `${opener} role ${role} ti vychází nejlépe. Hlavní makro problém je ${issue}; potřebuješ jasnější trigger, kdy držíš prostor a kdy měníš plán.`;
  }

  return `${opener} podle posledních her ti nejvíc sedí role ${role}. Největší prostor ke zlepšení je ${issue}, hlavně v tom, jak převádíš impact na vyhraná kola.`;
}

function buildDetailedReport(stats) {
  if (!stats.total) return [];
  const bestRole = stats.bestRole ? roleName(stats.bestRole.role) : "flex";
  const bestAgent = stats.bestAgent?.agent || "nejhranější agent";
  const mainIssue = stats.mainIssue ? issueLabels[stats.mainIssue] : "konzistence";
  const mainAdvice = stats.mainIssue ? issueAdvice[stats.mainIssue] : "Drž jeden jednoduchý cíl na zápas a po hře ho vyhodnoť.";

  return [
    `Coach read: z ${stats.total} posledních záznamů vycházíš jako ${stats.playstyle}. K/D ${stats.kd.toFixed(2)}, průměrné ACS ${Math.round(stats.avgAcs)} a HS ${Math.round(stats.avgHs)} % říkají, že tvoje zlepšení nebude jen o aimu. Důležitější je kvalita kontaktů, timing utility a to, jestli tvůj první impact tým opravdu promění v kolo.`,
    `Nejlépe ti zatím vychází role ${bestRole}. To neznamená, že musíš hrát jen ji, ale tvůj playstyle tam má nejmenší odpor: tvoje statistiky a typy chyb víc odpovídají této roli než čistému autopilotu na jakémkoliv agentovi. Nejlepší agent v datech je ${bestAgent}; ber ho jako startovní bod, ne jako dogma.`,
    `Největší brzda je ${mainIssue}. ${mainAdvice} V praxi si dej příští hru jeden malý úkol: před každým risky kontaktem si řekni, kdo mě traduje, jaká utilita mi pomáhá a co získám, když přežiju.`,
    `Trik na další session: po každé smrti si napiš jen jednu větu: "Byl jsem tradovatelný?" Pokud odpověď zní ne, problém nebyl jen aim. Byl to spacing, timing nebo rozhodnutí. Tohle je přesně rozdíl mezi hráčem, který má hezké fragy, a hráčem, který dlouhodobě vyhrává kola.`,
  ];
}

function buildPlan(stats) {
  if (!stats.total) return ["Spusť první rozbor ve VOD review."];
  const plan = [];
  if (stats.mainIssue) plan.push(issueAdvice[stats.mainIssue]);
  if (stats.bestRole) plan.push(rolePrinciples[stats.bestRole.role]);
  if (stats.mainPhase) plan.push(phasePrinciples[stats.mainPhase]);
  if (stats.kd < 1) plan.push("První dvě kola hraj na přežití: trade, crossfire, žádný izolovaný fight.");
  if (stats.winrate < 50) plan.push("Po každé smrti si zkontroluj, jestli jsi měl informaci, utilitu nebo trade.");
  if (stats.avgAcs > 230) plan.push("Impact máš slušný. Teď ho převáděj na kola: po výhodě zpomal, drž prostor a nehraj další 50/50 duel.");
  return [...new Set(plan)].slice(0, 4);
}

function buildProRead(stats) {
  if (!stats.total) {
    return "Po prvním rozboru ti ukážu, jak by tvoje hry četl high-elo hráč.";
  }

  const role = stats.bestRole ? roleName(stats.bestRole.role) : "flex";
  const issue = stats.mainIssue ? issueLabels[stats.mainIssue] : "rozhodování";
  const phase = stats.mainPhase ? phaseName(stats.mainPhase) : "mid-round";
  return `High-elo pohled: jako ${role} musíš v ${phase} řešit hlavně ${issue}. Lepší hráč v té situaci nehledá hned duel; nejdřív si ověří trade, utilitu, čas a win condition kola.`;
}

function getVodPatterns(stats, vodRole) {
  const roleDefaults = {
    controller: ["utility_unused", "late_rotate", "bad_postplant", "overrotate", "dry_peek"],
    initiator: ["utility_unused", "no_trade", "dry_peek", "late_rotate", "flank_unwatched"],
    sentinel: ["flank_unwatched", "late_rotate", "bad_postplant", "solo_peek", "repeek"],
    duelist: ["no_trade", "solo_peek", "dry_peek", "repeek", "good_entry"],
    flex: ["no_trade", "dry_peek", "late_rotate", "bad_postplant", "clutch_rush"],
  };
  const universal = new Set(["solo_peek", "no_trade", "dry_peek", "repeek", "bad_postplant", "clutch_rush", "utility_unused"]);
  const fromStats = stats.patterns
    .map(([type]) => type)
    .filter((type) => type !== "good_entry" && universal.has(type));
  const merged = [...(roleDefaults[vodRole] || roleDefaults.flex), ...fromStats];
  return [...new Set(merged)].slice(0, 5).map((type) => [type, 1]);
}

function buildVodNote(type, phase, stats, vodAgent, vodRole) {
  const agent = vodAgent || "hráč";
  const role = roleName(vodRole || stats.bestRole?.role || "flex");
  const roleRule = rolePrinciples[vodRole] || rolePrinciples.flex;
  return `${agent} (${role}) by tady měl zkontrolovat ${issueLabels[type] || "rozhodnutí"}. ${issueAdvice[type] || ""} ${phasePrinciples[phase] || ""} ${roleRule}`.trim();
}

function buildAutoNotes(match) {
  const kd = Number(match.kills || 0) / Math.max(1, Number(match.deaths || 0));
  if (kd < 1) return "Coach vidí problém v přežívání a izolovaných duelech.";
  if (Number(match.acs || 0) > 235) return "Impact je dobrý; další cíl je měnit prostor na vyhraná kola.";
  return "Coach hledá hlavně rozhodování podle fáze kola, ne jen aim.";
}

function buildRoleRead(role, values) {
  if (role === "duelist") {
    return values.acs > 225 ? "máš dobrý vstupní impact, ale hlídej, jestli jsi tradovatelný" : "role sedí jen pokud zlepšíš timing entry a utility";
  }
  if (role === "controller") {
    return values.assistValue >= 5 ? "dobře pracuješ pro tým a máš hodnotu i bez top fragů" : "potřebuješ víc převádět utility do konkrétních výhod";
  }
  if (role === "initiator") {
    return values.assistValue >= 5 ? "tvoje info a setup mají dopad" : "bez assistů a trade setupu initiator ztrácí smysl";
  }
  if (role === "sentinel") {
    return values.winrate >= 50 ? "map control a stabilita ti sedí" : "potřebuješ lepší flank/retake hodnotu";
  }
  return "flex dává smysl, pokud budeš vědomě doplňovat to, co týmu chybí";
}

function detectPlaystyle(values) {
  if (values.role === "controller" && values.assistsPerGame >= 5) return "týmový controller/flex, který má největší hodnotu, když přežije do mid-roundu";
  if (values.role === "initiator" && values.assistsPerGame >= 5) return "setup hráč, který nejvíc pomáhá, když otevírá fight informací a trady";
  if (values.kd >= 1.15 && values.avgAcs >= 230) return "agresivní space maker s dobrým mechanickým dopadem";
  if (values.kd < 1 && values.avgAcs < 200) return "hráč, který potřebuje zpomalit první kontakt a hrát víc s týmem";
  if (values.avgHs >= 25) return "aimově silný hráč, kterému nejvíc pomůže lepší výběr duelů";
  return "vyvážený hráč, u kterého rozhodují hlavně timing, spacing a práce s utilitou";
}

function guessRole(agent) {
  const normalized = String(agent || "").toLowerCase().replace(/[^a-z0-9/]/g, "");
  return agentRoles[normalized] || "flex";
}

function normalizeAgentName(agent) {
  const raw = String(agent || "").trim();
  if (!raw) return "Neznámý agent";
  if (raw.includes("/")) return raw.split("/").pop() || raw;
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function cleanMapName(map) {
  const raw = String(map || "").trim();
  if (!raw) return "Neznámá mapa";
  if (raw.includes("/")) return raw.split("/").pop() || raw;
  return raw.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function groupBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function roleName(role) {
  return roleNames[role] || roleNames.flex;
}

function phaseName(phase) {
  return phaseNames[phase] || phaseNames.mid;
}

function formatVideoTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sum(key) {
  return state.reviews.reduce((total, review) => total + Number(review[key] || 0), 0);
}

function average(key) {
  return state.reviews.length ? sum(key) / state.reviews.length : 0;
}

function loadReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reviews));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
