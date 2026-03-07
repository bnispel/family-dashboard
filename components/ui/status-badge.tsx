type StatusType = "draft" | "submitted" | "paid" | "needs-attention" | "anytime-eligible"

const statusStyles: Record<StatusType, { bg: string; text: string; label: string }> = {
  "draft": {
    bg: "bg-[#F3F4F6]",
    text: "text-[#374151]",
    label: "Draft",
  },
  "submitted": {
    bg: "bg-[#DEF3FB]",
    text: "text-[#014E6D]",
    label: "Submitted",
  },
  "paid": {
    bg: "bg-[#EBFCD9]",
    text: "text-[#37541E]",
    label: "Paid",
  },
  "needs-attention": {
    bg: "bg-[#FDE8E8]",
    text: "text-red-700",
    label: "Needs Attention",
  },
  "anytime-eligible": {
    bg: "bg-[#EBFCD9]",
    text: "text-[#37541E]",
    label: "Anytime Eligible",
  },
}

export function StatusBadge({ status }: { status: StatusType }) {
  const { bg, text, label } = statusStyles[status]
  return (
    <span className={`inline-block px-3 py-1 rounded-[6px] text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}