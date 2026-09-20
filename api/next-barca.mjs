export default async function handler(req, res) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    res.status(500).json({ error: "Missing FOOTBALL_DATA_KEY" });
    return;
  }
  try {
    const r = await fetch(
      "https://api.football-data.org/v4/teams/81/matches?status=SCHEDULED,TIMED&limit=1",
      { headers: { "X-Auth-Token": key } }
    );
    if (!r.ok) {
      res.status(502).json({ error: `Upstream ${r.status}` });
      return;
    }
    const d = await r.json();
    const m = (d.matches || [])[0];
    const match = m
      ? {
          id: m.id,
          utc: m.utcDate,
          status: m.status,
          comp: m.competition && m.competition.name,
          home: { name: m.homeTeam.shortName || m.homeTeam.name, tla: m.homeTeam.tla, crest: m.homeTeam.crest || null },
          away: { name: m.awayTeam.shortName || m.awayTeam.name, tla: m.awayTeam.tla, crest: m.awayTeam.crest || null },
        }
      : null;
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    res.status(200).json({ match });
  } catch (e) {
    res.status(502).json({ error: "Could not reach football-data.org" });
  }
}