"use client";

import { useEffect, useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks";
import { OrderError, OrderService } from "@/features/orders/services";
import type { Order } from "@/features/orders/types";

type UseCustomerOrdersResult = {
  orders: Order[];
  loading: boolean;
  error: string | null;
};

/**
 * Lists orders for the signed-in customer via OrderService.
 */
export function useCustomerOrders(): UseCustomerOrdersResult {
  const { customerId, loading: authLoading } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      if (!customerId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const next = await new OrderService().listByCustomerId(customerId);
        if (!cancelled) {
          setOrders(next);
        }
      } catch (err) {
        if (!cancelled) {
          setOrders([]);
          setError(
            err instanceof OrderError
              ? err.message
              : "Unable to load your orders.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, customerId]);

  return {
    orders,
    loading: authLoading || loading,
    error,
  };
}
