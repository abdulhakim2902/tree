"use client";

import { deleteMember } from "@/lib/api";
import { treeQueryOptions } from "@/lib/resource-keys/family-query";
import { FamilyMember } from "@/types";
import { transformFamilyData } from "@/utils/tree-transformer";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEdgesState, useNodesState } from "reactflow";

export const useTree = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showManageRelations, setShowManageRelations] = useState(false);
  const [search, setSearch] = useState("");
  const [showSaveMember, setShowSaveMember] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data, isLoading, refetch } = useQuery({
    ...treeQueryOptions.tree(),
  });

  const members = data?.members || [];
  const relations = data?.relations || [];

  const filteredMembers = useMemo(
    () =>
      data?.members?.filter(
        (m) =>
          m.full_name.toLowerCase().includes(search.toLowerCase()) ||
          m.nickname?.toLowerCase().includes(search.toLowerCase()) ||
          m.job?.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const generationGroups = useMemo(() => {
    const groups: Record<number, FamilyMember[]> = {};
    for (const m of filteredMembers || []) {
      if (!groups[m.generation]) groups[m.generation] = [];
      groups[m.generation].push(m);
    }
    return groups;
  }, [filteredMembers]);

  const onSelect = useCallback((m: FamilyMember) => {
    setSelectedMember(m);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const onSave = useCallback((saved: FamilyMember) => {
    setShowSaveMember(false);
    refetch();

    if (selectedMember?.id === saved.id) {
      setSelectedMember(saved);
    }
  }, []);

  const onDelete = useCallback((member: FamilyMember) => {
    const deleteConfirmationMessage = `Hapus ${member.full_name} dari pohon keluarga?\n\nSemua relasi terkait juga akan dihapus.`;
    if (!confirm(deleteConfirmationMessage)) {
      return;
    }
    deleteMember(member.id)
      .then(() => {
        setSelectedMember(undefined);
        refetch();
      })
      .catch((err) => {
        alert("Gagal menghapus: " + (err.message || "Terjadi kesalahan"));
      });
  }, []);

  useEffect(() => {
    if (members.length <= 0) return;

    const { nodes, edges } = transformFamilyData(members, relations, onSelect);

    setNodes(nodes);
    setEdges(edges);
  }, [members, relations, setEdges, setNodes, onSelect]);

  return {
    isLoading,
    members,
    relations,
    refresh: refetch,
    generationGroups,

    graph: {
      nodes: {
        data: nodes,
        onChange: onNodesChange,
      },
      edges: {
        data: edges,
        onChange: onEdgesChange,
      },
    },

    sidebar: {
      open: sidebarOpen,
      onOpen: setSidebarOpen,
    },

    logoutConfirmation: {
      open: showLogoutConfirm,
      onOpen: setShowLogoutConfirm,
    },

    manageRelationsModal: {
      open: showManageRelations,
      onOpen: setShowManageRelations,
    },

    save: {
      open: showSaveMember,
      onOpen: (m?: FamilyMember) => {
        setShowSaveMember(true);
        setSelectedMember(m);
      },
      onClose: () => setShowSaveMember(false),
      onAction: onSave,
    },

    selected: {
      member: selectedMember,
      onSelect: onSelect,
      onClose: () => setSelectedMember(undefined),
    },

    search,
    onSearch: setSearch,

    onDelete,
  };
};
