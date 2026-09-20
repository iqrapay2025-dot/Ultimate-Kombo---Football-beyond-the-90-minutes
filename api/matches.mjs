const COMPETITIONS = "PL,PD,SA,BL1,FL1,CL";
const isoDate = (d) => d.toISOString().slice(0, 10);

export default async function handler(req, res) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    res.status(500).json({ error: "Missing FOOTBALL_DATA_KEY" });
    return;
  }

  const now = Date.now();
  const from = isoDate(new Date(now - 2 * 864e5));
  const to = isoDate(new Date(now + 4 * 864e5));
  const url = `https://api.football-data.org/v4/matches?dateFrom=${from}&dateTo=${to}&competitions=${COMPETITIONS}`;

  try {
    const upstream = await fetch(url, { headers: { "X-Auth-Token": key } });
    if (!upstream.ok) {
      res.setHeader("Cache-Control", "public, s-maxage=30");
      res.status(upstream.status === 429 ? 429 : 502).json({ error: `Upstream ${upstream.status}` });
      return;
    }
    const data = await upstream.json();
    const matches = (data.matches || []).map((m) => ({
      id: m.id,
      utc: m.utcDate,
      status: m.status,
      comp: m.competition && m.competition.name,
      home: { name: m.homeTeam.shortName || m.homeTeam.name, tla: m.homeTeam.tla, crest: m.homeTeam.crest || null },
      away: { name: m.awayTeam.shortName || m.awayTeam.name, tla: m.awayTeam.tla, crest: m.awayTeam.crest || null },
      hs: m.score?.fullTime?.home ?? null,
      as: m.score?.fullTime?.away ?? null,
    }));
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ updated: new Date().toISOString(), matches });
  } catch (e) {
    res.status(502).json({ error: "Could not reach football-data.org" });
  }
}