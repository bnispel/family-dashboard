import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"

interface SectionHeaderProps {
  title: string
  icon?: IconDefinition
  onIconClick?: () => void
}

export function SectionHeader({ title, icon, onIconClick }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-5">
      <h2 className="text-lg font-medium leading-none text-[#111928]">{title}</h2>
      {icon && (
        <button onClick={onIconClick} className="p-1">
          <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-[#9CA3AF]" />
        </button>
      )}
    </div>
  )
}