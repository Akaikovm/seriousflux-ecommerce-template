"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { SettingsContent } from "@/features/admin/settings/components/SettingsContent";
import { SettingsLayout } from "@/features/admin/settings/components/SettingsLayout";
import {
  getSettingsSections,
  isSettingsSectionId,
  resolveSectionIdForField,
} from "@/features/admin/settings/config/settings-sections";
import {
  areStoreSettingsFormValuesEqual,
  cloneStoreSettingsFormValues,
} from "@/features/admin/settings/lib/settings-form-dirty";
import type { InventoryFormValues } from "@/features/admin/settings/InventorySettingsFields";
import type { NotificationsFormValues } from "@/features/admin/settings/NotificationsSettingsFields";
import {
  toInventorySettings,
  toNotificationsSettings,
  type StoreHeroFormData,
  type StoreSettingsFormData,
} from "@/features/admin/settings/store-settings-form-data";
import {
  storeSettingsFormSchema,
  type StoreSettingsFieldErrors,
  type StoreSettingsFormValues,
} from "@/features/admin/settings/store-settings-form-schema";
import {
  LAST_SETTINGS_SECTION_KEY,
  type SettingsSectionId,
  type SettingsSectionStatus,
} from "@/features/admin/settings/types/settings-section";
import { AdminPage } from "@/features/admin/ui/AdminPage";
import { AdminPageHeader } from "@/features/admin/ui/AdminPageHeader";
import { AdminSaveBar } from "@/features/admin/ui/AdminSaveBar";
import {
  StoreSettingsError,
  StoreSettingsService,
} from "@/features/settings/services";
import type {
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "@/features/settings/types";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { useToast } from "@/shared/ui/Toast";

type StoreSettingsFormProps = {
  settings: StoreSettingsFormData;
};

function readStoredSectionId(): SettingsSectionId | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LAST_SETTINGS_SECTION_KEY);
    if (stored && isSettingsSectionId(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }

  return null;
}

function persistSectionId(id: SettingsSectionId) {
  try {
    window.localStorage.setItem(LAST_SETTINGS_SECTION_KEY, id);
  } catch {
    // Ignore storage failures.
  }
}

function readHashSectionId(): SettingsSectionId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash.replace(/^#/, "");
  return hash && isSettingsSectionId(hash) ? hash : null;
}

function scrollToSection(id: SettingsSectionId, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
  }
}

/**
 * Controlled store settings form (RFC-020).
 * One values object, one Zod pipeline, one updateGeneralSettings save.
 */
export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [values, setValues] = useState<StoreSettingsFormValues>(() =>
    cloneStoreSettingsFormValues(settings),
  );
  const [snapshot, setSnapshot] = useState<StoreSettingsFormValues>(() =>
    cloneStoreSettingsFormValues(settings),
  );
  const [fieldErrors, setFieldErrors] = useState<StoreSettingsFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSectionId, setActiveSectionId] =
    useState<SettingsSectionId>("general");
  const [flashSectionId, setFlashSectionId] =
    useState<SettingsSectionId | null>(null);
  const [flashToken, setFlashToken] = useState(0);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const ignoreScrollSyncRef = useRef(false);
  const scrollSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const activeSectionIdRef = useRef<SettingsSectionId>("general");

  const isDirty = !areStoreSettingsFormValuesEqual(values, snapshot);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    activeSectionIdRef.current = activeSectionId;
  }, [activeSectionId]);

  // Client-only restore of hash / last section (SSR always starts at general).
  useEffect(() => {
    const fromHash = readHashSectionId();
    const fromStorage = readStoredSectionId();
    const next = fromHash ?? fromStorage ?? "general";

    const frame = window.requestAnimationFrame(() => {
      activeSectionIdRef.current = next;
      setActiveSectionId(next);
      persistSectionId(next);
      scrollToSection(next, "auto");
      if (!fromHash && window.location.hash.replace(/^#/, "") !== next) {
        window.history.replaceState(null, "", `#${next}`);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const navigateToSection = useCallback((id: SettingsSectionId) => {
    activeSectionIdRef.current = id;
    setActiveSectionId(id);
    setFlashSectionId(id);
    setFlashToken((token) => token + 1);
    persistSectionId(id);
    window.history.replaceState(null, "", `#${id}`);
    ignoreScrollSyncRef.current = true;
    scrollToSection(id, "smooth");
    if (scrollSyncTimerRef.current) {
      clearTimeout(scrollSyncTimerRef.current);
    }
    scrollSyncTimerRef.current = setTimeout(() => {
      ignoreScrollSyncRef.current = false;
    }, 600);
  }, []);

  useEffect(() => {
    function onHashChange() {
      const id = readHashSectionId();
      if (id) {
        setActiveSectionId(id);
        persistSectionId(id);
        scrollToSection(id, "smooth");
      }
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const sections = getSettingsSections();
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (ignoreScrollSyncRef.current) {
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop,
          );

        const top = visible[0]?.target as HTMLElement | undefined;
        const sectionId = top?.id;
        if (!sectionId || !isSettingsSectionId(sectionId)) {
          return;
        }

        if (activeSectionIdRef.current === sectionId) {
          return;
        }

        activeSectionIdRef.current = sectionId;
        setActiveSectionId(sectionId);
        persistSectionId(sectionId);
        if (window.location.hash.replace(/^#/, "") !== sectionId) {
          window.history.replaceState(null, "", `#${sectionId}`);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!isDirtyRef.current) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${url.pathname}${url.search}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath === currentPath || nextPath.startsWith("/admin/settings")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pendingHrefRef.current = nextPath + url.hash;
      setLeaveDialogOpen(true);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  const sectionStatuses = useMemo(() => {
    const statuses: Partial<Record<SettingsSectionId, SettingsSectionStatus>> =
      {};

    for (const section of getSettingsSections()) {
      const hasErrors = section.fieldRoots.some((root) => {
        if (root === "hero") {
          return Boolean(
            fieldErrors.hero &&
              Object.values(fieldErrors.hero).some(Boolean),
          );
        }
        if (root === "paymentProviders") {
          return Boolean(fieldErrors.paymentProviders);
        }
        if (root === "notifications") {
          return Boolean(
            fieldErrors.notifications &&
              Object.values(fieldErrors.notifications).some(Boolean),
          );
        }
        if (root === "inventory") {
          return Boolean(
            fieldErrors.inventory &&
              Object.values(fieldErrors.inventory).some(Boolean),
          );
        }
        return Boolean(
          fieldErrors[root as keyof StoreSettingsFieldErrors],
        );
      });

      if (hasErrors) {
        statuses[section.id] = { hasErrors: true };
      }
    }

    return statuses;
  }, [fieldErrors]);

  function setField<
    K extends Exclude<
      keyof StoreSettingsFormValues,
      "hero" | "paymentProviders" | "notifications" | "inventory"
    >,
  >(key: K, value: StoreSettingsFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setHeroField<K extends keyof StoreHeroFormData>(
    key: K,
    value: StoreHeroFormData[K],
  ) {
    setValues((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
    setFieldErrors((current) => ({
      ...current,
      hero: { ...current.hero, [key]: undefined },
    }));
  }

  function setPaymentProviders(next: PaymentProvidersConfig) {
    setValues((current) => ({ ...current, paymentProviders: next }));
    setFieldErrors((current) => ({ ...current, paymentProviders: undefined }));
  }

  function setNotifications(next: NotificationsFormValues) {
    setValues((current) => ({ ...current, notifications: next }));
    setFieldErrors((current) => ({ ...current, notifications: undefined }));
  }

  function setInventory(next: InventoryFormValues) {
    setValues((current) => ({ ...current, inventory: next }));
    setFieldErrors((current) => ({ ...current, inventory: undefined }));
  }

  function handleCancel() {
    setValues(cloneStoreSettingsFormValues(snapshot));
    setFieldErrors({});
    setFormError(null);
  }

  function focusFirstErrorSection(errors: StoreSettingsFieldErrors) {
    const roots = Object.keys(errors);
    for (const root of roots) {
      const sectionId = resolveSectionIdForField(root);
      if (sectionId) {
        navigateToSection(sectionId);
        return;
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !isDirty) {
      return;
    }

    setFormError(null);
    const parsed = storeSettingsFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: StoreSettingsFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const root = issue.path[0];
        if (root === "hero" && typeof issue.path[1] === "string") {
          const heroKey = issue.path[1] as keyof StoreHeroFormData;
          if (!nextErrors.hero?.[heroKey]) {
            nextErrors.hero = { ...nextErrors.hero, [heroKey]: issue.message };
          }
          continue;
        }
        if (
          root === "paymentProviders" &&
          typeof issue.path[1] === "string" &&
          typeof issue.path[2] === "string"
        ) {
          const providerKey = issue.path[1] as PaymentProviderSettingsKey;
          const fieldKey = issue.path[2] as keyof PaymentProviderConfig;
          if (!nextErrors.paymentProviders?.[providerKey]?.[fieldKey]) {
            nextErrors.paymentProviders = {
              ...nextErrors.paymentProviders,
              [providerKey]: {
                ...nextErrors.paymentProviders?.[providerKey],
                [fieldKey]: issue.message,
              },
            };
          }
          continue;
        }
        if (root === "notifications" && typeof issue.path[1] === "string") {
          const fieldKey = issue.path[1] as keyof NotificationsFormValues;
          if (!nextErrors.notifications?.[fieldKey]) {
            nextErrors.notifications = {
              ...nextErrors.notifications,
              [fieldKey]: issue.message,
            };
          }
          continue;
        }
        if (root === "inventory" && typeof issue.path[1] === "string") {
          const fieldKey = issue.path[1] as keyof InventoryFormValues;
          if (!nextErrors.inventory?.[fieldKey]) {
            nextErrors.inventory = {
              ...nextErrors.inventory,
              [fieldKey]: issue.message,
            };
          }
          continue;
        }
        if (
          typeof root === "string" &&
          root !== "hero" &&
          root !== "paymentProviders" &&
          root !== "notifications" &&
          root !== "inventory" &&
          !nextErrors[
            root as Exclude<
              keyof StoreSettingsFormValues,
              "hero" | "paymentProviders" | "notifications" | "inventory"
            >
          ]
        ) {
          nextErrors[
            root as Exclude<
              keyof StoreSettingsFormValues,
              "hero" | "paymentProviders" | "notifications" | "inventory"
            >
          ] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      focusFirstErrorSection(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const { notifications, inventory, ...rest } = parsed.data;
      await new StoreSettingsService().updateGeneralSettings({
        ...rest,
        notifications: toNotificationsSettings(notifications),
        inventory: toInventorySettings(inventory),
      });
      const nextSnapshot = cloneStoreSettingsFormValues(parsed.data);
      setValues(nextSnapshot);
      setSnapshot(nextSnapshot);
      setFieldErrors({});
      toast.success("Store settings saved.");
      router.refresh();
    } catch (err) {
      if (err instanceof StoreSettingsError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = "Unable to save settings. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function confirmLeave() {
    const href = pendingHrefRef.current;
    setLeaveDialogOpen(false);
    pendingHrefRef.current = null;
    if (href) {
      isDirtyRef.current = false;
      setValues(cloneStoreSettingsFormValues(snapshot));
      router.push(href);
    }
  }

  function cancelLeave() {
    setLeaveDialogOpen(false);
    pendingHrefRef.current = null;
  }

  return (
    <AdminPage flush className="admin-settings">
      <AdminPageHeader
        eyebrow="Store configuration"
        title="Settings"
        description="Identity, branding, contact, shipping, payments, notifications, and inventory — one place for everything that shapes this store."
      />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <SettingsLayout
          activeId={activeSectionId}
          onNavigate={navigateToSection}
          sectionStatuses={sectionStatuses}
          saveBar={
            <AdminSaveBar
              dirty={isDirty}
              loading={loading}
              onDiscard={handleCancel}
            />
          }
        >
          <SettingsContent
            values={values}
            fieldErrors={fieldErrors}
            disabled={loading}
            setField={setField}
            setHeroField={setHeroField}
            setPaymentProviders={setPaymentProviders}
            setNotifications={setNotifications}
            setInventory={setInventory}
            flashSectionId={flashSectionId}
            flashToken={flashToken}
          />
        </SettingsLayout>
      </form>

      <ConfirmDialog
        open={leaveDialogOpen}
        title="Discard unsaved changes?"
        description="You have unsaved settings changes. Leave this page and lose them?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </AdminPage>
  );
}
