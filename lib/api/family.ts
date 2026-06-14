import { supabase } from "../supabase";
import type { FamilyMember, FamilyRelation, RelationType } from "@/types";

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getAllMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("generation", { ascending: true })
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(id: string): Promise<FamilyMember | null> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createMember(
  member: Omit<FamilyMember, "id" | "created_at" | "updated_at">,
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from("family_members")
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMember(
  id: string,
  updates: Partial<Omit<FamilyMember, "id" | "created_at" | "updated_at">>,
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from("family_members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from("family_members").delete().eq("id", id);

  if (error) throw error;
}

// ─── Relations ────────────────────────────────────────────────────────────────

export async function getAllRelations(): Promise<FamilyRelation[]> {
  const { data, error } = await supabase.from("family_relations").select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getMemberRelations(
  memberId: string,
): Promise<FamilyRelation[]> {
  const { data, error } = await supabase
    .from("family_relations")
    .select("*")
    .or(`member_id.eq.${memberId},related_member_id.eq.${memberId}`);

  if (error) throw error;
  return data ?? [];
}

export async function createRelation(
  memberId: string,
  relatedMemberId: string,
  relationType: RelationType,
): Promise<FamilyRelation> {
  const { data, error } = await supabase
    .from("family_relations")
    .insert({
      member_id: memberId,
      related_member_id: relatedMemberId,
      relation_type: relationType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRelation(id: string): Promise<void> {
  const { error } = await supabase
    .from("family_relations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

export interface TreeData {
  members: FamilyMember[];
  relations: FamilyRelation[];
}

export async function getFamilyTreeData(): Promise<TreeData> {
  const [members, relations] = await Promise.all([
    getAllMembers(),
    getAllRelations(),
  ]);
  return { members, relations };
}
