"use client";

import { treeQueryOptions } from "@/lib/resource-keys/family-query";
import { FamilyMember } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useFamily = ({ search }: { search: string }) => {
  const { data, isLoading, refetch } = useQuery({
    ...treeQueryOptions.tree(),
  });

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

  return {
    isLoading,
    members: data?.members,
    relations: data?.relations,
    loadData: refetch,
    generationGroups,
  };
};
