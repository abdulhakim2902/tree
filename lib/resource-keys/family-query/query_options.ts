import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query_keys";
import { getFamilyTreeData } from "@/lib/api/family";

export const treeQueryOptions = {
  tree: () => {
    return queryOptions<Awaited<ReturnType<typeof getFamilyTreeData>>>({
      queryKey: queryKeys.tree(),
      queryFn: () => getFamilyTreeData(),
    });
  },
};
