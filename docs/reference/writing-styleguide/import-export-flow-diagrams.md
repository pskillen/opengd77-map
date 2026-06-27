# Import & export flow diagrams (developer)

Working draft for [#135](https://github.com/pskillen/codeplug-tool/issues/135). **Audience: developers and agents.** Mermaid diagrams of the import and export pipelines, calling out the **generic trunk** vs **format-specific divergence**. Pairs with [`feature-reference.md`](feature-reference.md) and [`glossary-dev.md`](glossary-dev.md).

Legend used throughout:
- **Solid trunk** = generic, every format.
- **Subgraph per format** = divergence points.
- "boundary" = the import/export edge where vendor specifics are allowed.

---

## 1. Import — overview (generic trunk + format branches)

```mermaid
flowchart TD
  UI["UI: ImportDropzone / Home / Import &amp; export"]
  Collect["collectFilesFromDataTransfer()<br/>(folder drop, prefer YAML over CSV)"]
  Orchestrate["importFiles()<br/>(explicit format; profile if required)"]
  Branch{"isNativeDocumentAdapter?"}

  NativeParse["parseDocument()<br/>importResultFromNativeProject()"]
  CSVParse["per file: strip BOM → parseCsv (by header)<br/>detectKind → parseEntity"]

  Result["ImportResult<br/>(entities + recognised/skipped/errors)"]
  Apply["applyImportToCodeplug()<br/>merge | overwrite"]
  Resolve["resolve wire names → id FKs (entityRefs)<br/>collapse + normalise channel names"]
  Store["Codeplug in active/new project<br/>(LocalStorage)"]

  UI --> Collect --> Orchestrate --> Branch
  Branch -- "native YAML" --> NativeParse --> Result
  Branch -- "CPS wire (CSV)" --> CSVParse --> Result
  Result --> Apply --> Resolve --> Store
```

Key files: `src/lib/import/index.ts`, `src/lib/importMerge.ts`, `src/lib/entityRefs.ts`, `src/lib/channelNaming.ts`, `src/state/codeplugStore.tsx`.

---

## 2. Import — generic vs format-specific divergence

```mermaid
flowchart LR
  subgraph GENERIC["Generic (all formats)"]
    direction TB
    A[Collect files] --> B[importFiles orchestration]
    B --> C[parseCsv by header name]
    C --> D[ImportResult assembly]
    D --> E[applyImportToCodeplug]
    E --> F[merge by name / channel keys]
    F --> G[resolve contactRef / rxGroupListId]
    G --> H[resolve RGL member refs]
    H --> I[multi-TG import collapse]
    I --> J[normalise channel naming<br/>callsign + name + exportNameMode]
    J --> K[resolve zone member ids]
    K --> L[update meta.sourceFiles]
  end

  subgraph OG["OpenGD77 only"]
    O1[filename + header detect]
    O2[Contacts.csv splits group / private]
    O3[Contact1..N / Channel1..N columns]
    O4[multi-mode collapse in parse -F/-D]
    O5[TG timeslot duplicate collapse on apply]
    O6[skip DTMF / APRS]
    O7[opengd77Extras carried]
  end

  subgraph DM["DM32 only"]
    D1[header-only detect]
    D2[native multiMode row + modeProfiles]
    D3[pipe-separated zone / RGL members]
    D4[skip Scan / DMR-ID]
  end

  subgraph CH["CHIRP only"]
    C1[21-column fingerprint]
    C2[channels only]
    C3[Duplex/Offset → txFrequency + forbidTransmit]
  end

  subgraph NY["Native YAML only"]
    N1[parseDocument → full project]
    N2[new project bypasses merge<br/>preserves UUIDs]
    N3[overwrite replaces codeplug wholesale]
  end

  B --> OG & DM & CH & NY
  E --> OG & DM & CH
  E --> NY
```

---

## 3. Import — merge vs new project (decision view)

```mermaid
flowchart TD
  Start([Import triggered]) --> Where{Entry point}
  Where -- "Home" --> NewProj[New project]
  Where -- "Import &amp; export" --> Active{Active project exists?}
  Active -- no --> NewProj
  Active -- yes --> Mode{Merge or overwrite?}

  NewProj --> Native1{Native YAML?}
  Native1 -- yes --> KeepIds[Use project as-is<br/>preserve UUIDs, no merge]
  Native1 -- no --> MergeEmpty[merge onto emptyCodeplug]

  Mode -- "merge (default)" --> MergeActive["merge: only imported entity types touched<br/>match by wire name; keep existing ids + app-only fields"]
  Mode -- "overwrite" --> OverActive["overwrite: replace arrays per imported type<br/>(native YAML: replace whole codeplug)"]

  KeepIds --> Done([Saved])
  MergeEmpty --> Done
  MergeActive --> Done
  OverActive --> Done
```

Notes:
- Merge is **idempotent** — re-importing unchanged CPS is a no-op.
- Preview (`previewImportMerge`) runs the full apply without mutating the store, powering the confirm modal (unresolved zone members reported).

---

## 4. Export — overview (generic trunk + format branches)

```mermaid
flowchart TD
  UI["UI: Import &amp; export / Settings"]
  Opts["ExportOptions<br/>profile + name settings (useExportSettings)"]
  Adapter["getExportAdapter(formatId)"]
  Delivery{delivery}

  Multi["multi-file: downloadFile / downloadZip"]
  Single["single-file: adapter.download(ctx)"]

  Expand["channel expansion (optional)<br/>modes → RGL fan-out → name finalise"]
  WireMap["model fields → vendor columns (channelWire)"]
  Pack["formatCsv + fflate zip / single blob"]
  Warn["collectWarnings (OpenGD77 only)"]
  Out["Browser download / cloud upload"]

  UI --> Opts --> Adapter --> Delivery
  Delivery -- "OpenGD77, DM32" --> Multi
  Delivery -- "CHIRP, native YAML" --> Single
  Multi --> Expand
  Single --> Expand
  Expand --> WireMap --> Pack --> Out
  Multi --> Warn --> Out
```

> **Source of truth:** export serialises from **typed model fields**, never from `meta.imported.*Wire`. The only opaque carry is `opengd77Extras` (legacy approved).

---

## 5. Export — option application order (the part that confuses people)

```mermaid
flowchart TD
  P[profileId<br/>nameLimit, ladders, caps] --> S[merge UI settings<br/>exportOptionsFromSettings]
  S --> X[expandOptionsFromExport<br/>DM32 hardcodes expandModes:false, expandRxGroupLists:true, skipWhenTxSet, ALL]
  X --> N[effectiveMaxNameLength]
  N --> PerFile[[per entity file]]

  subgraph PerFile_steps["per file"]
    direction TB
    M1[build format TG wire-name map] --> M2[expandAllChannelsForExport]
    M2 --> C1["compose name<br/>(nameModeOverride, useChannelAbbreviation, per-channel exportNameMode)"]
    C1 --> C2["mode expansion (expandModes) → -F / -D"]
    C2 --> C3["RGL fan-out (expandRxGroupLists)<br/>+ multiTalkGroupExportNameMode, useTalkGroupAbbreviation"]
    C3 --> C4["shorten + uniquify (shortenNames, maxNameLength)"]
    C4 --> C5[map row → vendor columns]
    C5 --> C6[profile truncation + warnings - OpenGD77]
  end

  PerFile --> PerFile_steps
```

Critical ordering facts:
- **Profile first** — everything else depends on its caps/limits.
- **Compose before shorten** — `nameModeOverride`/abbreviations decide the base name; shortening only kicks in afterwards if too long.
- **Expansion before shortening** — rows are multiplied (`-F`/`-D`, per-TG) *before* names are budgeted, so suffixes must fit within the limit.
- **Uniquify last** — global `reservedWireNames` ensures uniqueness across the whole export.

---

## 6. Export — RX group list divergence (the headline difference)

```mermaid
flowchart TD
  Ch["DMR channel with rxGroupListId"] --> Fmt{Export format}

  Fmt -- "OpenGD77 / 1701" --> OG1["expandRxGroupLists = false"]
  OG1 --> OG2["channel stays ONE row<br/>keeps TG List reference"]
  OG2 --> OG3["members live in TG_Lists.csv"]
  OG3 --> OG4["TG×timeslot → contact names<br/>Scotland T1 / Scotland T2"]
  OG4 --> OGdone(["1 channel row + TG list"])

  Fmt -- "DM32" --> DM1["expandRxGroupLists = true"]
  DM1 --> DM2{TX contact already set?}
  DM2 -- yes --> DM3["skip fan-out (keep single row)"]
  DM2 -- no --> DM4{RGL name in ALL list?}
  DM4 -- yes --> DM3
  DM4 -- no --> DM5["fan out: one row per member<br/>contactRef=member, rxGroupListId=null<br/>timeslot from member/contact"]
  DM3 --> DMdone(["N or 1 channel rows"])
  DM5 --> DMdone
```

Why: OpenGD77 radios support **true promiscuous RX + independent TG selection**, so an RGL is a *reference*. DM32-class radios have **one TG per channel**, so the app *simulates* the RGL by **duplicating the channel** per member.

---

## 7. Where #142 / #163 / #164 hook in (future divergence)

```mermaid
flowchart TD
  Model["Vendor-neutral model<br/>(one TG, one RGL, one zone)"] --> Exp[Export boundary expansion]

  Exp --> T142["#142 TG timeslot expansion<br/>(OpenGD77): per-slot wire contacts<br/>Scotland T1/T2 + TS Override"]
  Exp --> T163["#163 scratch channel<br/>(DM32-style): {callsign} Scratch per RGL/site"]
  Exp --> T164["#164 scan lists + carrier<br/>(DM32): Scan.csv from zone membership<br/>(OpenGD77): zone = scan, ignored"]

  T142 --> Wire[(CPS wire files)]
  T163 --> Wire
  T164 --> Wire
```

All three follow the same principle already in the codebase: **denormalise at the export edge from a clean model**, format-aware, never leaking radio assumptions back into the model.

---

## 8. Rendering notes (for when these move into the site/docs)

- These render in GitHub markdown and Mantine via a mermaid component. If embedding in-app, sanitise labels (avoid raw `&`, `<`, `>` — already escaped here as `&amp;` etc.).
- For **user-facing** help, simplify: the operator only needs diagrams 3 (merge vs new) and 6 (RGL divergence), reworded in plain language. Diagrams 2, 5, 7 are contributor-only.
