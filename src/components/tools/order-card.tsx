"use client";

import { useState } from "react";
import { ToolCard } from "./tool-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, User } from "lucide-react";

interface OrderData {
  name: string;
  from: string;
  to: string;
}

interface OrderCardProps {
  data: OrderData | null | undefined;
}

export function OrderCard({ data }: OrderCardProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // 数据验证
  if (
    !data ||
    !data.name ||
    typeof data.from !== "string" ||
    typeof data.to !== "string"
  ) {
    return (
      <ToolCard title="Order Information">
        <Alert>
          <AlertDescription>Invalid or missing order data</AlertDescription>
        </Alert>
      </ToolCard>
    );
  }

  return (
    <ToolCard title="Order Information">
      <div className="space-y-4">
        {/* 订单信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{data.name}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">{data.from}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">{data.to}</span>
          </div>
        </div>

        {/* 确认按钮 */}
        <div className="flex justify-end pt-2">
          {isConfirmed ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Order Confirmed</span>
            </div>
          ) : (
            <Button size="sm" onClick={() => setIsConfirmed(true)}>
              Confirm Order
            </Button>
          )}
        </div>
      </div>
    </ToolCard>
  );
}
