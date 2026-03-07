import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faTriangleExclamation,
  faCircleInfo,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons"

type AlertVariant = "warning" | "info" | "success"

interface AlertBannerProps {
  variant?: AlertVariant
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; iconColor: string; buttonBorder: string }> = {
  warning: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    iconColor: "text-orange-700",
    buttonBorder: "border-orange-700",
  },
  info: {
    bg: "bg-[#DEF3FB]",
    border: "border-[#00A8E5]",
    text: "text-[#014E6D]",
    iconColor: "text-[#00A8E5]",
    buttonBorder: "border-[#014E6D]",
  },
  success: {
    bg: "bg-[#EBFCD9]",
    border: "border-[#8CD43F]",
    text: "text-[#37541E]",
    iconColor: "text-[#8CD43F]",
    buttonBorder: "border-[#37541E]",
  },
}

const variantIcons: Record<AlertVariant, typeof faTriangleExclamation> = {
  warning: faTriangleExclamation,
  info: faCircleInfo,
  success: faCircleCheck,
}

export function AlertBanner({ variant = "warning", title, message, actionLabel, onAction }: AlertBannerProps) {
  const styles = variantStyles[variant]
  const icon = variantIcons[variant]

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-[4px] px-4 py-4`}>
      <div className="flex gap-2.5 items-start">
        <FontAwesomeIcon icon={icon} className={`w-4 h-4 mt-0.5 shrink-0 ${styles.iconColor}`} />
        <div>
          <p className={`text-sm font-semibold ${styles.text}`}>{title}</p>
          <p className={`text-sm mt-1 leading-snug ${styles.text}`}>{message}</p>
          {actionLabel && (
            <button
              onClick={onAction}
              className={`mt-3 h-9 px-4 text-sm border ${styles.buttonBorder} ${styles.text} rounded-[6px] bg-transparent`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}