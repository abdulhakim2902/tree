import { FamilyMember, FamilyRelation } from "@/types";
import { Edge, MarkerType, Node } from "reactflow";

const PARENT_RELATIONS = new Set(["anak", "cucu"]);
const SPOUSE_RELATIONS = new Set(["suami", "istri"]);

export function transformFamilyData(
  members: FamilyMember[],
  relations: FamilyRelation[],
  onSelectMember: (m: FamilyMember) => void,
): { nodes: Node[]; edges: Edge[] } {
  if (!members.length) return { nodes: [], edges: [] };

  const NODE_W = 180;
  const H_GAP = 50; // gap antar node biasa
  const COUPLE_GAP = 30; // gap antara suami-istri
  const V_GAP = 100;
  const NODE_H = 200;
  const GEN_HEIGHT = NODE_H + V_GAP;

  // ── 1. Bangun map relasi ──────────────────────────────────────────────────
  // parent → [children]  (relasi "anak": member_id=parent, related=child)
  const childrenOf: Record<string, string[]> = {};
  const parentOf: Record<string, string> = {};
  const spouseOf: Record<string, string> = {}; // id → spouse id

  for (const rel of relations) {
    if (rel.relation_type === "anak" || rel.relation_type === "cucu") {
      const p = rel.member_id,
        c = rel.related_member_id;
      if (!childrenOf[p]) childrenOf[p] = [];
      if (!childrenOf[p].includes(c)) childrenOf[p].push(c);
      parentOf[c] = p;
    }
    if (rel.relation_type === "suami" || rel.relation_type === "istri") {
      spouseOf[rel.member_id] = rel.related_member_id;
      spouseOf[rel.related_member_id] = rel.member_id;
    }
  }

  // ── 2. Kelompokkan per generasi ───────────────────────────────────────────
  const byGen: Record<number, FamilyMember[]> = {};
  for (const m of members) {
    if (!byGen[m.generation]) byGen[m.generation] = [];
    byGen[m.generation].push(m);
  }
  const generations = Object.keys(byGen)
    .map(Number)
    .sort((a, b) => a - b);
  const minGen = generations[0];

  // ── 3. Tentukan "unit" layout per generasi ────────────────────────────────
  // Unit = pasangan (couple) atau individu. Couple selalu berdampingan.
  type Unit = { ids: string[]; width: number };

  const unitsByGen: Record<number, Unit[]> = {};
  for (const gen of generations) {
    const mems = byGen[gen];
    const visited = new Set<string>();
    const units: Unit[] = [];
    for (const m of mems) {
      if (visited.has(m.id)) continue;
      visited.add(m.id);
      const sp = spouseOf[m.id];
      if (sp && byGen[gen]?.find((x) => x.id === sp) && !visited.has(sp)) {
        visited.add(sp);
        // urutan: ayah/suami duluan
        const isMaleFirst = m.gender === "laki-laki";
        units.push({
          ids: isMaleFirst ? [m.id, sp] : [sp, m.id],
          width: NODE_W * 2 + COUPLE_GAP,
        });
      } else {
        units.push({ ids: [m.id], width: NODE_W });
      }
    }
    unitsByGen[gen] = units;
  }

  // ── 4. Hitung X tiap unit, bottom-up lalu sesuaikan ──────────────────────
  const positions: Record<string, { x: number; y: number }> = {};

  // Helper: pusat X dari sekumpulan id yang sudah diposisikan
  const centerX = (ids: string[]) => {
    const xs = ids.filter((id) => positions[id]).map((id) => positions[id].x);
    if (!xs.length) return null;
    return (Math.min(...xs) + Math.max(...xs) + NODE_W) / 2 - NODE_W / 2;
  };

  // Helper: letakkan unit mulai dari startX
  const placeUnit = (unit: Unit, startX: number, y: number) => {
    if (unit.ids.length === 2) {
      positions[unit.ids[0]] = { x: startX, y };
      positions[unit.ids[1]] = { x: startX + NODE_W + COUPLE_GAP, y };
    } else {
      positions[unit.ids[0]] = { x: startX, y };
    }
  };

  // Helper: midpoint X dari unit
  const unitMidX = (unit: Unit, startX: number) =>
    unit.ids.length === 2
      ? startX + (NODE_W + COUPLE_GAP) / 2
      : startX + NODE_W / 2;

  // Bottom-up: posisikan generasi terbawah dulu
  for (let gi = generations.length - 1; gi >= 0; gi--) {
    const gen = generations[gi];
    const units = unitsByGen[gen];
    const y = (gen - minGen) * GEN_HEIGHT;

    // Cari unit mana yang punya anak sudah diposisikan
    const anchoredUnits: { unit: Unit; idealCenterX: number }[] = [];
    for (const unit of units) {
      // Kumpulkan semua anak dari semua anggota unit
      const kids = unit.ids.flatMap((id) => childrenOf[id] ?? []);
      const posKids = kids.filter((id) => positions[id]);
      if (posKids.length > 0) {
        const minKX = Math.min(...posKids.map((id) => positions[id].x));
        const maxKX = Math.max(
          ...posKids.map((id) => positions[id].x + NODE_W),
        );
        anchoredUnits.push({ unit, idealCenterX: (minKX + maxKX) / 2 });
      }
    }

    if (anchoredUnits.length > 0) {
      // Letakkan unit yang punya anchor dulu
      const anchoredIds = new Set(anchoredUnits.flatMap((a) => a.unit.ids));
      for (const { unit, idealCenterX } of anchoredUnits) {
        const startX = idealCenterX - unit.width / 2;
        placeUnit(unit, startX, y);
      }
      // Letakkan unit tanpa anchor di sebelah kanan/kiri
      let cursor =
        Math.min(
          ...anchoredUnits
            .flatMap((a) => a.unit.ids)
            .map((id) => positions[id]?.x ?? 0),
        ) -
        H_GAP -
        NODE_W;
      for (const unit of units) {
        if (unit.ids.every((id) => !positions[id])) {
          placeUnit(unit, cursor, y);
          cursor -= unit.width + H_GAP;
        }
      }
    } else {
      // Tidak ada anchor: spread dari tengah
      const totalWidth =
        units.reduce((s, u) => s + u.width, 0) + H_GAP * (units.length - 1);
      let cursor = -totalWidth / 2;
      for (const unit of units) {
        placeUnit(unit, cursor, y);
        cursor += unit.width + H_GAP;
      }
    }
  }

  // ── 5. Resolve overlaps per generasi ─────────────────────────────────────
  for (const gen of generations) {
    const y = (gen - minGen) * GEN_HEIGHT;
    // Flatten semua id dalam generasi, sorted by x
    const allIds = byGen[gen].map((m) => m.id).filter((id) => positions[id]);
    allIds.sort((a, b) => positions[a].x - positions[b].x);

    for (let i = 1; i < allIds.length; i++) {
      const prev = positions[allIds[i - 1]];
      const curr = positions[allIds[i]];
      const minX =
        prev.x +
        NODE_W +
        (spouseOf[allIds[i - 1]] === allIds[i] ? COUPLE_GAP : H_GAP);
      if (curr.x < minX) {
        const shift = minX - curr.x;
        // Geser id ini dan semua yang di kanannya
        for (let j = i; j < allIds.length; j++) {
          positions[allIds[j]].x += shift;
        }
      }
    }
  }

  // ── 6. Re-center parent di atas anak-anaknya (top-down) ──────────────────
  for (const gen of generations) {
    const units = unitsByGen[gen];
    for (const unit of units) {
      const kids = unit.ids
        .flatMap((id) => childrenOf[id] ?? [])
        .filter((id) => positions[id]);
      if (kids.length === 0) continue;
      const minKX = Math.min(...kids.map((id) => positions[id].x));
      const maxKX = Math.max(...kids.map((id) => positions[id].x + NODE_W));
      const idealCenter = (minKX + maxKX) / 2;
      const startX = idealCenter - unit.width / 2;
      const y = (gen - minGen) * GEN_HEIGHT;
      placeUnit(unit, startX, y);
    }
  }

  // ── 7. Fallback ───────────────────────────────────────────────────────────
  members.forEach((m, i) => {
    if (!positions[m.id]) {
      positions[m.id] = {
        x: i * (NODE_W + H_GAP),
        y: (m.generation - minGen) * GEN_HEIGHT,
      };
    }
  });

  const nodes: Node[] = members.map((m) => ({
    id: m.id,
    type: "member",
    position: positions[m.id],
    draggable: false,
    data: {
      member: m,
      isRoot: m.generation === minGen,
      onSelect: onSelectMember,
    },
  }));

  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const rel of relations) {
    const key = [rel.member_id, rel.related_member_id, rel.relation_type]
      .sort()
      .join("-");
    if (seen.has(key)) continue;
    seen.add(key);

    if (PARENT_RELATIONS.has(rel.relation_type)) {
      // parent → child
      const parentId = rel.member_id;
      const childId = rel.related_member_id;
      edges.push({
        id: rel.id,
        source: parentId,
        target: childId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#C9961A" },
        style: { stroke: "#C9961A", strokeWidth: 2 },
        label: "anak",
        labelStyle: { fontSize: 10, fill: "#8B4513" },
        labelBgStyle: { fill: "#FDF6E3", fillOpacity: 0.8 },
      });
    } else if (SPOUSE_RELATIONS.has(rel.relation_type)) {
      edges.push({
        id: rel.id,
        source: rel.member_id,
        target: rel.related_member_id,
        type: "straight",
        style: { stroke: "#A0522D", strokeWidth: 2, strokeDasharray: "6 3" },
        label: "❤",
        labelStyle: { fontSize: 12, fill: "#A0522D" },
        labelBgStyle: { fill: "#FDF6E3", fillOpacity: 0.8 },
      });
    } else {
      edges.push({
        id: rel.id,
        source: rel.member_id,
        target: rel.related_member_id,
        type: "smoothstep",
        style: { stroke: "#D4A96A", strokeWidth: 1.5, strokeDasharray: "4 2" },
        label: rel.relation_type,
        labelStyle: { fontSize: 9, fill: "#8B4513" },
        labelBgStyle: { fill: "#FDF6E3", fillOpacity: 0.8 },
      });
    }
  }

  return { nodes, edges };
}
