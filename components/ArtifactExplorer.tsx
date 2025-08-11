"use client";
import React, { useEffect, useMemo, useState } from "react";
import seed from "@/data/seed.json";

type Platform = "windows" | "linux" | "m365" | "gws";

type Location = { path: string; scope?: string; notes?: string };

type TimestampField = { name: string; source?: string; tz_behavior?: string; precision?: string; notes?: string };

type ParserRef = { tool_name: string; command_example?: string; output_fields?: Record<string, string>; links?: string[] };

type EventIdGroup = {
  ids: string[];           // e.g., ["4624","4625"]
  source: string;          // e.g., "Security" or provider name
  description: string;     // what these events indicate
};

type CollectionSteps = { category: string; steps: string[] };

type CollectionGroup = { category: string; steps: string[] }; 

type Artifact = {
  id: string; name: string; slug: string; platform: Platform; tactic_tags?: string[]; artifact_class?: string; summary: string; description?: string;
  locations?: Location[]; timestamps?: TimestampField[]; parsers?: ParserRef[]; collection_methods?: string[]; validation?: string[]; known_pitfalls?: string[];
  references?: { title: string; url: string }[]; event_ids?: EventIdGroup[]; collection_steps?: CollectionSteps[]; gui_log_collection_steps?: string[]; due_diligence_checks?: string[]; additional_checks?: string[];
};

const PLATFORM_LABEL: Record<Platform, string> = { windows: "Windows", linux: "Linux", m365: "Microsoft 365", gws: "Google Workspace" };

function classNames(...xs: Array<string | false | undefined>) { return xs.filter(Boolean).join(" "); }
function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
async function copyLines(lines: string[], title?: string) {
  const text = (title ? `# ${title}\n` : "") + lines.map(l => `- ${l}`).join("\n");
  try {
    await navigator.clipboard.writeText(text.trim());
    alert("Copied to clipboard.");
  } catch {
    alert("Could not copy to clipboard.");
  }
}

export default function ArtifactExplorer() {
  const SEED = seed as unknown as Artifact[];
  const [query, setQuery] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["windows", "linux", "m365", "gws"]);
  const [tactics, setTactics] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [selected, setSelected] = useState<Artifact | null>(null);

  const allTactics = useMemo(() => uniq(SEED.flatMap((a) => a.tactic_tags ?? [])).sort(), [SEED]);
  const allTools = useMemo(() => uniq(SEED.flatMap((a) => (a.parsers ?? []).map((p) => p.tool_name))).sort(), [SEED]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEED.filter((a) =>
      platforms.includes(a.platform) &&
      (tactics.length === 0 || (a.tactic_tags ?? []).some((t) => tactics.includes(t))) &&
      (tools.length === 0 || (a.parsers ?? []).some((p) => tools.includes(p.tool_name))) &&
      (q === "" ||
      a.name.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      (a.locations ?? []).some((l) => l.path.toLowerCase().includes(q)) ||
      (a.event_ids ?? []).some(g =>
        g.source.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.ids.some(id => id.includes(q))
      )
    )
    );
  }, [query, platforms, tactics, tools, SEED]);

  function togglePlatform(p: Platform) { setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])); }
  function toggleTactic(t: string) { setTactics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])); }
  function toggleTool(t: string) { setTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])); }
  function clearAll() { setQuery(""); setPlatforms(["windows", "linux", "m365", "gws"]); setTactics([]); setTools([]); }

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold">DF</div>
            <h1 className="text-xl font-semibold">DFIR Artifact Explorer</h1>
          </div>
          <div className="flex-1 md:max-w-xl">
            <label className="sr-only" htmlFor="global-search">Search artifacts</label>
            <input id="global-search" className="w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Search by name, path, or description…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2"><button onClick={clearAll} className="rounded-xl border px-3 py-2 hover:bg-gray-100">Reset</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Platforms</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["windows","linux","m365","gws"] as Platform[]).map((p) => (
                <button key={p} onClick={() => togglePlatform(p)} className={classNames("px-3 py-1 rounded-full border text-sm", platforms.includes(p) ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100")} aria-pressed={platforms.includes(p)}>
                  {PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tactics</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {allTactics.map((t) => (
                <button key={t} onClick={() => toggleTactic(t)} className={classNames("px-3 py-1 rounded-full border text-sm", tactics.includes(t) ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100")} aria-pressed={tactics.includes(t)}>
                  {t}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tools</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {allTools.map((t) => (
                <button key={t} onClick={() => toggleTool(t)} className={classNames("px-3 py-1 rounded-full border text-sm", tools.includes(t) ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100")} aria-pressed={tools.includes(t)}>
                  {t}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="md:col-span-9">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <article key={a.id} className="bg-white rounded-2xl border shadow-sm hover:shadow transition cursor-pointer" onClick={() => setSelected(a)}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{PLATFORM_LABEL[a.platform]}</span>
                    {a.tactic_tags?.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border text-gray-600">{t}</span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{a.summary}</p>
                  {a.locations && (
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold text-gray-500">Location(s)</h4>
                      <ul className="mt-1 space-y-1">
                        {a.locations.slice(0, 2).map((l, idx) => (
                          <li key={idx} className="text-xs font-mono break-all bg-gray-50 border rounded px-2 py-1">{l.path}</li>
                        ))}
                        {a.locations.length > 2 && (<li className="text-xs text-gray-500">+{a.locations.length - 2} more</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-20 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} aria-hidden="true" />
          <aside className="w-full max-w-6xl h-full overflow-y-auto bg-white border-l shadow-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{PLATFORM_LABEL[selected.platform]}</span>
                  {selected.tactic_tags?.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border text-gray-600">{t}</span>
                  ))}
                </div>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                {selected.artifact_class && (<p className="text-sm text-gray-500">Class: {selected.artifact_class}</p>)}
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg border px-2 py-1 hover:bg-gray-100" aria-label="Close details">Close</button>
            </div>
            {selected.summary && (<p className="mt-3 text-sm text-gray-700">{selected.summary}</p>)}
            {selected.description && (<p className="mt-2 text-sm text-gray-600">{selected.description}</p>)}
            {selected.locations && selected.locations.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Locations</h3>
                <ul className="mt-2 space-y-2">
                  {selected.locations.map((l, idx) => (
                    <li key={idx} className="text-xs font-mono bg-gray-50 border rounded p-2 break-all">
                      <div className="flex items-center justify-between gap-2">
                        <span>{l.path}</span>
                        <button className="text-xs underline" onClick={async () => { try { await navigator.clipboard.writeText(l.path); } catch {} }}>Copy</button>
                      </div>
                      {l.scope && <div className="text-[11px] text-gray-500">Scope: {l.scope}</div>}
                      {l.notes && <div className="text-[11px] text-gray-500">{l.notes}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {selected.timestamps && selected.timestamps.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Timestamps</h3>
                <div className="mt-2 border rounded-xl divide-y">
                  {selected.timestamps.map((t, idx) => (
                    <div key={idx} className="p-3 text-sm">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-600">{t.source}</div>
                      <div className="text-xs text-gray-500">TZ: {t.tz_behavior} · Precision: {t.precision}</div>
                      {t.notes && <div className="text-xs text-gray-500 mt-1">{t.notes}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {selected.parsers && selected.parsers.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Parsers & Commands</h3>
                <div className="mt-2 space-y-3">
                  {selected.parsers.map((p, idx) => (
                    <div key={idx} className="border rounded-xl p-3">
                      <div className="text-sm font-medium">{p.tool_name}</div>
                      {p.command_example && (
                        <div className="mt-2 text-xs font-mono bg-gray-50 border rounded p-2 break-all">
                          <div className="flex items-center justify-between gap-2">
                            <span>{p.command_example}</span>
                            <button className="text-xs underline" onClick={async () => { try { await navigator.clipboard.writeText(p.command_example!); } catch {} }}>Copy</button>
                          </div>
                        </div>
                      )}
                      {p.output_fields && (
                        <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                          {Object.entries(p.output_fields).map(([k, v]) => (<li key={k}><span className="font-mono">{k}</span>: {v}</li>))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {selected.validation && selected.validation.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Validation / Corroboration</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {selected.validation.map((v, idx) => (<li key={idx}>{v}</li>))}
                </ul>
              </section>
            )}
            {selected.known_pitfalls && selected.known_pitfalls.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Known Pitfalls</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {selected.known_pitfalls.map((v, idx) => (<li key={idx}>{v}</li>))}
                </ul>
              </section>
            )}
            {selected.references && selected.references.length > 0 && (
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700">References</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {selected.references.map((r, idx) => (
                    <li key={idx}><a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
                  ))}
                </ul>
              </section>
            )}
          {selected.gui_log_collection_steps && selected.gui_log_collection_steps.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">M365 GUI Log Collection</h3>
                <button
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => copyLines(selected.gui_log_collection_steps!, "M365 GUI Log Collection")}
                >
                  Copy all
                </button>
              </div>
              <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                {selected.gui_log_collection_steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </section>
          )}

          {/* Due Diligence Checks */}
          {selected.due_diligence_checks && selected.due_diligence_checks.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Due Diligence Checks</h3>
                <button
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => copyLines(selected.due_diligence_checks!, "Due Diligence Checks")}
                >
                  Copy all
                </button>
              </div>
              <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                {selected.due_diligence_checks.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </section>
          )}

          {/* Additional Checks */}
          {selected.additional_checks && selected.additional_checks.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Additional Checks</h3>
                <button
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => copyLines(selected.additional_checks!, "Additional Checks")}
                >
                  Copy all
                </button>
              </div>
              <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                {selected.additional_checks.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </section>
          )}
          {!selected.gui_log_collection_steps && selected.collection_steps && selected.collection_steps.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700">Collection Steps</h3>
              <div className="mt-2 space-y-4">
                {selected.collection_steps.map((grp, idx) => (
                  <details key={idx} className="border rounded-xl p-3 bg-white" open={idx === 0}>
                    <summary className="cursor-pointer text-sm font-medium">{grp.category}</summary>
                    <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
                      {grp.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </details>
                ))}
              </div>
            </section>
          )}
          {selected.event_ids && selected.event_ids.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700">Event IDs</h3>
              <div className="mt-2 space-y-3">
                {selected.event_ids.map((g, idx) => (
                  <div key={idx} className="border rounded-xl p-3">
                    <div className="text-sm">
                      <span className="font-medium">Source:</span> {g.source}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">IDs:</span>{" "}
                      <span className="font-mono">{g.ids.join(", ")}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">{g.description}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          </aside>
        </div>
      )}
      <footer className="py-10 text-center text-xs text-gray-500">Built with ❤️ for DFIR - YG. </footer>
    </div>
  );
}