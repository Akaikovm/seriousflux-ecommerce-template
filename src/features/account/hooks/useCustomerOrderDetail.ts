"use client";

import { useEffect, useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks";
import { OrderError, OrderService } from "@/features/orders/services";
import type { Order } from "@/features/orders/types";
import { useT } from "@/i18n";

type UseCustomerOrderResult = {
  order: Order | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

/**
 * Loads a single order with ownership verification via OrderService.getForCustomer.
 */
export function useCustomerOrder(orderId: string): UseCustomerOrderResult {
  const t = useT();
  const { customerId, loading: authLoading } = useCurrentUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      if (!customerId || !orderId.trim()) {
        setOrder(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const next = await new OrderService().getForCustomer(
          orderId,
          customerId,
        );
        if (!cancelled) {
          if (!next) {
            setOrder(null);
            setNotFound(true);
          } else {
            setOrder(next);
            setNotFound(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setOrder(null);
          setNotFound(false);
          setError(
            err instanceof OrderError
              ? err.message
              : t("account.orderLoadFailed"),
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
  }, [authLoading, customerId, orderId, t]);

  return {
    order,
    loading: authLoading || loading,
    error,
    notFound,
  };
}
