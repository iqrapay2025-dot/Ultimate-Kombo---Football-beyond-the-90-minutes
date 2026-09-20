const LEAGUES = ["PL", "PD", "SA", "BL1", "FL1"];

export default async function handler(req, res) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    res.status(500).json({ error: "Missing FOOTBALL_DATA_KEY" });
    return;
  }
  try {
    const out = {};
    for (const code of LEAGUES) {
      const r = await fetch(`https://api.football-data.org/v4/competitions/${code}/standings`, {
        headers: { "X-Auth-Token": key },
      });
      if (!r.ok) continue;
      const d = await r.json();
      const table = (d.standings && d.standings[0] && d.standings[0].table) || [];
      out[code] = {
        name: d.competition && d.competition.name,
        table: table.map((t) => ({
          pos: t.position,
          name: t.team.shortName || t.team.name,
          tla: t.team.tla,
          crest: t.team.crest || null,
          p: t.playedGames,
          w: t.won,
          d: t.draw,
          l: t.lost,
          gd: t.goalDifference,
          pts: t.points,
        })),
      };
    }
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ updated: new Date().toISOString(), leagues: out });
  } catch (e) {
    res.status(502).json({ error: "Could not reach football-data.org" });
  }
}