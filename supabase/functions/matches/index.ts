const COMPS = "PL,PD,SA,BL1,FL1,CL";

let cache: { at: number; body: string } | null = null;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (cache && Date.now() - cache.at < 60_000) {
    return new Response(cache.body, { headers: cors });
  }

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const from = iso(new Date(Date.now() - 2 * 864e5));
  const to = iso(new Date(Date.now() + 4 * 864e5));

  const r = await fetch(
    `https://api.football-data.org/v4/matches?dateFrom=${from}&dateTo=${to}&competitions=${COMPS}`,
    { headers: { "X-Auth-Token": Deno.env.get("FOOTBALL_DATA_KEY")! } },
  );

  if (!r.ok) {
    return new Response(JSON.stringify({ error: `Upstream ${r.status}` }), {
      status: 502,
      headers: cors,
    });
  }

  const d = await r.json();
  // deno-lint-ignore no-explicit-any
  const matches = (d.matches ?? []).map((m: any) => ({
    id: m.id,
    utc: m.utcDate,
    status: m.status,
    comp: m.competition?.name,
    home: { name: m.homeTeam.shortName || m.homeTeam.name, tla: m.homeTeam.tla },
    away: { name: m.awayTeam.shortName || m.awayTeam.name, tla: m.awayTeam.tla },
    hs: m.score?.fullTime?.home ?? null,
    as: m.score?.fullTime?.away ?? null,
  }));

  const body = JSON.stringify({ updated: new Date().toISOString(), matches });
  cache = { at: Date.now(), body };
  return new Response(body, { headers: cors });
});
