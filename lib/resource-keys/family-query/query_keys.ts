import { resourceKeys } from "..";

export const queryKeys = {
  all: [resourceKeys.family] as const,
  tree: () => [...queryKeys.all, resourceKeys.members] as const,
};
