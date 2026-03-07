import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowUpFromBracket, faEye, faFileLines, faImage } from "@fortawesome/free-solid-svg-icons"
import { IconDefinition } from "@fortawesome/fontawesome-svg-core"

type DocumentStatus = "missing" | "uploaded"

interface DocumentRowProps {
  name: string
  required?: boolean
  status: DocumentStatus
  date?: string
  icon?: IconDefinition
  onAction?: () => void
}

const iconsByExtension: Record<string, IconDefinition> = {
  jpg: faImage,
  jpeg: faImage,
  png: faImage,
  pdf: faFileLines,
  default: faFileLines,
}

function getIcon(name: string): IconDefinition {
  const ext = name.split(".").pop()?.toLowerCase() || "default"
  return iconsByExtension[ext] ?? iconsByExtension["default"]
}

export function DocumentRow({ name, required, status, date, icon, onAction }: DocumentRowProps) {
  const resolvedIcon = icon ?? getIcon(name)

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
      <div className="flex items-center gap-2.5">
        {status === "uploaded" && (
          <FontAwesomeIcon icon={resolvedIcon} className="w-4 h-4 text-[#9CA3AF]" />
        )}
        <div>
          <p className="text-sm font-medium text-[#111928]">
            {name}{" "}
            {required && (
              <span className="text-[#9CA3AF] font-normal text-xs">(Required)</span>
            )}
          </p>
          {status === "missing" && (
            <p className="text-sm text-orange-600 font-medium mt-0.5">Document Missing</p>
          )}
          {status === "uploaded" && date && (
            <p className="text-xs text-[#9CA3AF]">{date}</p>
          )}
        </div>
      </div>
      <button className="p-1" onClick={onAction}>
        <FontAwesomeIcon
          icon={status === "missing" ? faArrowUpFromBracket : faEye}
          className="w-4 h-4 text-[#9CA3AF]"
        />
      </button>
    </div>
  )
}