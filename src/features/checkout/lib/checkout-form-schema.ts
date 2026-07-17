import { z } from "zod";

export const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Phone is required."),
  address: z.string().trim().min(1, "Address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State / province is required."),
  postalCode: z.string().trim().min(1, "Postal code is required."),
  country: z.string().trim().min(1, "Country is required."),
  shippingMethodId: z.string().trim().min(1, "Select a shipping method."),
});

export type CheckoutFormSchemaValues = z.infer<typeof checkoutFormSchema>;
