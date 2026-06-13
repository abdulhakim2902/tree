"use client";

import { useFamily } from "@/hooks/use-family";
import { FamilyMember } from "@/types";
import { transformFamilyData } from "@/utils/tree-transformer";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useEdgesState,
  useNodesState,
} from "reactflow";

import "reactflow/dist/style.css";

import {
  Plus,
  Link,
  Search,
  RefreshCw,
  Loader,
  Moon,
  Star,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { deleteMember } from "@/lib/family";
import { PrintButton, MemberDetail, MemberForm } from "./components";
import memberNode from "./components/member-node";
import { useAuth } from "@/providers/auth-provider";
import ManageRelations from "./components/manage-relation";
import { useRole } from "@/hooks/use-role";
import { useRouter } from "next/navigation";

type FamilyTreeViewProps = {};

const NODE_TYPES = { member: memberNode };

export const TreeMainContent = (props: FamilyTreeViewProps) => {
  const { user, signOut } = useAuth();
  const { canEdit, isAdmin } = useRole();
  const { push } = useRouter();

  const [selectedMember, setSelectedMember] = useState<FamilyMember>();
  const [editMember, setEditMember] = useState<FamilyMember>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showManageRelations, setShowManageRelations] = useState(false);
  const [search, setSearch] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const {
    members = [],
    relations = [],
    loadData,
    isLoading,
    generationGroups,
  } = useFamily({ search });

  const handleSelectMember = useCallback((m: FamilyMember) => {
    setSelectedMember(m);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleEdit = useCallback((member: FamilyMember) => {
    setEditMember(member);
  }, []);

  const handleDelete = useCallback(
    async (member: FamilyMember) => {
      if (
        !confirm(
          `Hapus ${member.full_name} dari pohon keluarga?\n\nSemua relasi terkait juga akan dihapus.`,
        )
      )
        return;
      try {
        await deleteMember(member.id);
        setSelectedMember(undefined);
        await loadData();
      } catch (err: any) {
        alert("Gagal menghapus: " + (err.message || "Terjadi kesalahan"));
      }
    },
    [loadData],
  );

  useEffect(() => {
    if (members.length <= 0) return;

    const { nodes, edges } = transformFamilyData(
      members,
      relations,
      handleSelectMember,
    );

    setNodes(nodes);
    setEdges(edges);
  }, [members, relations, setEdges, setNodes, handleSelectMember]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--batik-cream)" }}
    >
      {/* Top Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">🌳</span>
            <div>
              <h1 className="font-bold text-base leading-tight font-display">
                Pohon Keluarga
              </h1>
              <p className="text-xs text-yellow-200 opacity-80">
                Silaturahmi Lebaran
              </p>
            </div>
          </div>

          {/* Lebaran decoration */}
          <div className="hidden sm:flex items-center gap-2 text-yellow-200 text-sm opacity-70">
            <Moon size={14} /> Minal Aidin Wal Faizin <Star size={14} />
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-yellow-200 opacity-70">
              {members.length} anggota
            </span>
            <PrintButton familyName="Pohon Keluarga" />
            <button
              onClick={() => loadData}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-white/20">
              <span className="text-xs text-yellow-200/70 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Keluar"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Ornament line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            flex-shrink-0 bg-batik-cream border-r border-batik-light flex flex-col
            transition-all duration-300 overflow-hidden
            ${sidebarOpen ? "w-72" : "w-0"}
          `}
        >
          <div className="flex-1 flex flex-col min-w-72 overflow-hidden">
            {/* Actions — hanya tampil untuk admin & editor */}
            {/* Actions */}
            {canEdit && (
              <div className="p-3 border-b border-batik-light space-y-2">
                <button
                  onClick={() => setShowAddMember(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-xl text-sm font-semibold hover:from-amber-800 hover:to-amber-900 transition-all shadow"
                >
                  <Plus size={16} /> Tambah Anggota
                </button>
                <button
                  onClick={() => setShowManageRelations(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-batik-light text-batik-brown border border-batik-muted rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Link size={16} /> Kelola Relasi
                </button>
              </div>
            )}
            {isAdmin && (
              <div className="px-3 pt-2 pb-1 border-b border-batik-light">
                <button
                  onClick={() => push("/admin")}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 transition-colors"
                >
                  <Shield size={13} /> Halaman Admin
                </button>
              </div>
            )}

            {/* Search */}
            <div className="px-3 py-2 border-b border-batik-light">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-batik-muted"
                />
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-batik-light bg-white text-sm text-batik-dark focus:outline-none focus:border-batik-gold"
                />
              </div>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-lg skeleton" />
                  ))}
                </div>
              ) : (
                Object.entries(generationGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([gen, mems]) => (
                    <div key={gen}>
                      <div className="px-3 py-1.5 bg-batik-light/50 border-y border-batik-light sticky top-0 z-10">
                        <p className="text-xs font-bold text-batik-copper uppercase tracking-wide">
                          Generasi {gen} · {mems.length} orang
                        </p>
                      </div>
                      {mems.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMember(m)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 text-left
                            border-b border-batik-light/50 hover:bg-amber-50 transition-colors
                            ${selectedMember?.id === m.id ? "bg-amber-50 border-l-2 border-l-amber-600" : ""}
                          `}
                        >
                          <div
                            className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${
                              m.gender === "laki-laki"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }
                          `}
                          >
                            {(m.nickname?.[0] ?? m.full_name[0]).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-batik-dark truncate">
                              {m.nickname || m.full_name.split(" ")[0]}
                            </p>
                            <p className="text-xs text-batik-copper truncate">
                              {m.full_name}
                            </p>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-batik-muted flex-shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  ))
              )}

              {!isLoading && members.length === 0 && (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">🌳</div>
                  <p className="text-batik-brown font-semibold text-sm">
                    Belum ada anggota
                  </p>
                  <p className="text-batik-copper text-xs mt-1">
                    Mulai tambahkan anggota keluarga
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tree Canvas */}
          <div
            className={`flex-1 relative ${selectedMember ? "hidden md:block" : ""}`}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-batik-cream/80">
                <div className="text-center">
                  <Loader
                    size={32}
                    className="animate-spin text-batik-gold mx-auto mb-2"
                  />
                  <p className="text-batik-brown text-sm">
                    Memuat pohon keluarga...
                  </p>
                </div>
              </div>
            )}

            {!isLoading && nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                  <div className="text-6xl mb-4">🌳</div>
                  <h2 className="text-xl font-bold text-batik-brown font-display mb-2">
                    Pohon Keluarga Kosong
                  </h2>
                  <p className="text-batik-copper text-sm mb-6">
                    Mulai bangun silsilah keluarga Anda untuk menyambut lebaran
                    bersama
                  </p>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-xl font-semibold shadow hover:shadow-lg transition-all"
                  >
                    Tambah Anggota Pertama
                  </button>
                </div>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              draggable={false}
              nodesDraggable={false}
              edgesUpdatable={false}
              edgesFocusable={false}
              nodesConnectable={false}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2}
              attributionPosition="bottom-right"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="#D4A96A"
                style={{ opacity: 0.3 }}
              />
              <Controls />
              <MiniMap
                nodeColor={(n) =>
                  n.data?.member?.gender === "laki-laki" ? "#F59E0B" : "#F43F5E"
                }
                maskColor="rgba(253, 246, 227, 0.7)"
              />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-batik-light rounded-xl px-4 py-2 flex items-center gap-4 text-xs text-batik-brown shadow">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-amber-500" />
                <span>Orang tua-anak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-0.5 bg-amber-700"
                  style={{ borderTop: "2px dashed" }}
                />
                <span>Suami-Istri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Laki-laki</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span>Perempuan</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Member Detail */}
          {selectedMember && (
            <div className="w-80 flex-shrink-0 border-l border-batik-light overflow-hidden">
              <MemberDetail
                member={selectedMember}
                relations={relations}
                allMembers={members}
                onClose={() => setSelectedMember(undefined)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {(showAddMember || editMember) && (
        <MemberForm
          member={editMember}
          onSave={async (saved) => {
            setShowAddMember(false);
            setEditMember(undefined);
            await loadData();
            if (selectedMember?.id === saved.id) setSelectedMember(saved);
            await loadData();
          }}
          onClose={() => {
            setShowAddMember(false);
            setEditMember(undefined);
          }}
        />
      )}

      {showManageRelations && (
        <ManageRelations
          members={members}
          relations={relations}
          onClose={() => setShowManageRelations(false)}
          onRefresh={loadData}
        />
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-xs border border-batik-gold/30 fade-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-batik-dark font-display mb-1">
                Keluar dari Aplikasi?
              </h3>
              <p className="text-sm text-batik-copper mb-6">
                Anda perlu login kembali dengan magic link untuk mengakses pohon
                keluarga.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    signOut();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white text-sm font-semibold hover:from-amber-800 hover:to-amber-900 transition-all flex items-center justify-center gap-2 shadow"
                >
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
