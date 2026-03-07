import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileLines } from "@fortawesome/free-solid-svg-icons"
import { StatusBadge } from "@/components/ui/status-badge"

type LoadStatus = "draft" | "submitted" | "paid" | "needs-attention" | "anytime-eligible"

interface LoadCardProps {
  loadNumber: string
  amount: string
  status: LoadStatus
  documentCount: number
  broker: string
  pickup: string
  dropoff: string
  date?: string
  progressLabel?: string
  progressStep?: number
  progressTotal?: number
  anytimeEligible?: boolean
  actions?: React.ReactNode
  onClick?: () => void
}

const progressSteps = ["Draft", "Submitted", "Reviewing", "Paid"]

export function LoadCard({
  loadNumber,
  amount,
  status,
  documentCount,
  broker,
  pickup,
  dropoff,
  date,
  progressLabel,
  progressStep,
  progressTotal = 3,
  anytimeEligible,
  actions,
  onClick,
}: LoadCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[4px] shadow-sm px-4 py-4 cursor-pointer active:opacity-80 transition-opacity"
    >
      {/* Top Row */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <span className="text-sm font-semibold text-[#111928]">{loadNumber}</span>
          {anytimeEligible && (
            <StatusBadge status="anytime-eligible" />
          )}
        </div>
        <span className="text-sm font-bold text-[#111928]">{amount}</span>
      </div>

      {/* Document count + Status */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
          <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
          <span>{documentCount}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Broker */}
      <p className="text-xs text-[#9CA3AF] mb-1">Broker</p>
      <p className="text-sm font-medium text-[#111928] mb-3">{broker}</p>

      {/* Pickup / Dropoff */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5">Pickup</p>
          <p className="text-sm font-medium text-[#111928]">{pickup}</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5">Drop-off</p>
          <p className="text-sm font-medium text-[#111928]">{dropoff}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {progressStep !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            {progressSteps.map((step, i) => (
              <span
                key={step}
                className={`text-[10px] ${i <= progressStep ? "text-[#00A8E5]" : "text-[#D1D5DB]"}`}
              >
                {step}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {progressSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= progressStep ? "bg-[#00A8E5]" : "bg-[#F3F4F6]"}`}
              />
            ))}
          </div>
          {date && <p className="text-xs text-[#9CA3AF] mt-1">Submitted {date}</p>}
          {progressLabel && (
            <p className={`text-xs mt-1 ${status === "needs-attention" ? "text-red-600" : "text-[#9CA3AF]"}`}>
              {progressLabel}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex gap-2 mt-3">
          {actions}
        </div>
      )}
    </div>
  )
}