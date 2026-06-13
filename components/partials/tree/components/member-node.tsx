import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { FamilyMember } from "@/types";

interface MemberNodeProps {
  data: {
    member: FamilyMember;
    isRoot?: boolean;
    onSelect: (member: FamilyMember) => void;
  };
}

function MemberNode({ data }: MemberNodeProps) {
  const { member, isRoot, onSelect } = data;

  const isMale = member.gender === "laki-laki";
  const initial = member.nickname?.[0] ?? member.full_name[0];

  const age = member.birth_date
    ? new Date().getFullYear() - new Date(member.birth_date).getFullYear()
    : null;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#C9961A",
          width: 10,
          height: 10,
          border: "2px solid #FDF6E3",
        }}
      />

      <div
        onClick={() => onSelect(member)}
        className={`
          relative cursor-pointer select-none
          rounded-xl border-2 shadow-md
          transition-all duration-200
          hover:shadow-lg hover:-translate-y-0.5
          ${
            isRoot
              ? "border-yellow-600 bg-gradient-to-b from-yellow-700 to-amber-800 text-white"
              : isMale
                ? "border-amber-700 bg-gradient-to-b from-amber-50 to-orange-50 text-amber-900"
                : "border-pink-700 bg-gradient-to-b from-pink-50 to-rose-50 text-rose-900"
          }
        `}
        style={{ width: 160 }}
      >
        {/* Ornament top */}
        <div
          className={`h-1 rounded-t-xl ${
            isRoot ? "bg-yellow-400" : isMale ? "bg-amber-400" : "bg-rose-400"
          }`}
        />

        <div className="p-3">
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-current shadow"
              />
            ) : (
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  text-xl font-bold border-2 shadow
                  ${
                    isRoot
                      ? "bg-yellow-400 text-amber-900 border-yellow-300"
                      : isMale
                        ? "bg-amber-200 text-amber-800 border-amber-300"
                        : "bg-rose-200 text-rose-800 border-rose-300"
                  }
                `}
              >
                {initial.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <p className="text-center font-bold text-xs leading-tight line-clamp-2 mb-0.5">
            {member.nickname || member.full_name.split(" ")[0]}
          </p>
          <p
            className={`text-center text-xs opacity-70 line-clamp-1 ${isRoot ? "text-yellow-100" : ""}`}
          >
            {member.full_name}
          </p>

          {/* Meta */}
          <div
            className={`mt-1.5 pt-1.5 border-t ${isRoot ? "border-yellow-600" : isMale ? "border-amber-200" : "border-rose-200"}`}
          >
            {age !== null && (
              <p className="text-center text-xs opacity-60">{age} tahun</p>
            )}
            {member.job && (
              <p className="text-center text-xs opacity-60 truncate mt-0.5">
                {member.job}
              </p>
            )}
          </div>
        </div>

        {/* Gender badge */}
        <div
          className={`
            absolute -top-2 -right-2 w-5 h-5 rounded-full
            flex items-center justify-center text-xs
            ${isMale ? "bg-blue-500 text-white" : "bg-pink-500 text-white"}
          `}
        >
          {isMale ? "♂" : "♀"}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#C9961A",
          width: 10,
          height: 10,
          border: "2px solid #FDF6E3",
        }}
      />
    </>
  );
}

export default memo(MemberNode);
