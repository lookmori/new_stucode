import { cn } from "@/lib/utils";
import { ProblemStatus } from "@/types/problem";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Circle } from "lucide-react";

interface ProblemStatusBadgeProps {
  status: ProblemStatus;
}

const statusConfig = {
  CORRECT: {
    label: "正确",
    color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    icon: CheckCircle,
  },
  WRONG: {
    label: "错误",
    color: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    icon: XCircle,
  },
  PENDING: {
    label: "未做",
    color: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
    icon: Circle,
  },
};

export function ProblemStatusBadge({ status }: ProblemStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5",
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
} 