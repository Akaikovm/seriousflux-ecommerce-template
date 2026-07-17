/**
 * Full-storefront maintenance surface when `maintenanceMode` is on.
 *
 * Presentational: copy comes from StoreSettings (storeName / tagline).
 */

type MaintenanceScreenProps = {
  storeName: string;
  tagline: string;
};

export function MaintenanceScreen({
  storeName,
  tagline,
}: MaintenanceScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {storeName}
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
        {tagline.trim() ||
          "We are temporarily closed for maintenance. Please check back soon."}
      </p>
    </div>
  );
}
