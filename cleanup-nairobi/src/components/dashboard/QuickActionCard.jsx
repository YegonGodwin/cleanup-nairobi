import { Card, CardContent } from "../ui/Card";
import { ArrowRight, Plus } from "lucide-react";

const QuickActionCard = ({
  icon,
  title,
  description,
  onClick,
  color = "green",
  variant = "default",
  className = "",
  ...props
}) => {
  const colorClasses = {
    green: {
      bg: "bg-gradient-to-br from-green-50 to-emerald-50",
      icon: "bg-green-100 text-green-600 group-hover:bg-green-200",
      text: "text-green-700",
      border: "border-green-100 hover:border-green-200",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
      icon: "bg-blue-100 text-blue-600 group-hover:bg-blue-200",
      text: "text-blue-700",
      border: "border-blue-100 hover:border-blue-200",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-violet-50",
      icon: "bg-purple-100 text-purple-600 group-hover:bg-purple-200",
      text: "text-purple-700",
      border: "border-purple-100 hover:border-purple-200",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-amber-50",
      icon: "bg-orange-100 text-orange-600 group-hover:bg-orange-200",
      text: "text-orange-700",
      border: "border-orange-100 hover:border-orange-200",
    },
  };

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${colorClasses[color].bg} ${colorClasses[color].border} ${className}`}
      onClick={onClick}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`p-4 rounded-2xl transition-all duration-300 ${colorClasses[color].icon}`}
          >
            {icon}
          </div>

          <div className="space-y-2">
            <h3 className={`font-semibold text-lg ${colorClasses[color].text}`}>
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div
            className={`flex items-center gap-2 text-sm font-medium ${colorClasses[color].text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;
