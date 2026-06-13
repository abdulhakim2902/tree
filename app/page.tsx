import { TreeMainContent } from "@/components/partials/tree/tree-main-content";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { treeQueryOptions } from "@/lib/resource-keys/family-query";
import AuthGuard from "@/components/auth-guard";

export default async function FamilyTreePage() {
  const qc = getQueryClient();

  const dehydratedState = dehydrate(qc);

  await Promise.allSettled([qc.prefetchQuery(treeQueryOptions.tree())]);

  return (
    <HydrationBoundary state={dehydratedState}>
      <AuthGuard>
        <TreeMainContent />
      </AuthGuard>
    </HydrationBoundary>
  );
}
