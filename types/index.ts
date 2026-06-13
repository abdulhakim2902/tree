export type Gender = 'laki-laki' | 'perempuan'

export type RelationType =
  | 'ayah' | 'ibu' | 'anak' | 'suami' | 'istri'
  | 'kakek' | 'nenek' | 'cucu' | 'saudara'
  | 'paman' | 'bibi' | 'sepupu'

export interface FamilyMember {
  id: string
  full_name: string
  nickname?: string
  birth_date?: string
  birth_place?: string
  phone?: string
  photo_url?: string
  gender: Gender
  generation: number
  address?: string
  job?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FamilyRelation {
  id: string
  member_id: string
  related_member_id: string
  relation_type: RelationType
  created_at: string
}

export interface FamilyRelationWithMembers extends FamilyRelation {
  member: FamilyMember
  related_member: FamilyMember
}

export interface TreeNode {
  id: string
  member: FamilyMember
  children: TreeNode[]
  spouse?: FamilyMember
  position?: { x: number; y: number }
}
