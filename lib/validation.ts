import { z } from "zod";

export const SRI_LANKA_MOBILE_REGEX = /^07\d{8}$/;
export const SRI_LANKA_NIC_REGEX = /^(?:\d{9}[VvXx]|\d{12})$/;
export const LAT_LNG_REGEX = /^-?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?)\s*,\s*-?(?:180(?:\.0+)?|(?:1[0-7]\d|\d{1,2})(?:\.\d+)?)$/;

export function isValidLocationTag(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (LAT_LNG_REGEX.test(trimmed)) return true;
  try {
    const url = new URL(trimmed);
    return (
      url.protocol === "https:" &&
      (url.hostname.includes("google.") ||
        url.hostname.includes("goo.gl") ||
        url.hostname.includes("maps.app.goo.gl") ||
        url.hostname.includes("openstreetmap.org"))
    );
  } catch {
    return false;
  }
}

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, or hyphens."),
    email: z.string().trim().email("Please enter a valid email address."),
    first_name: z.string().trim().min(1, "First name is required."),
    last_name: z.string().trim().min(1, "Last name is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirm: z.string().min(8, "Please confirm your password."),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export const profileUpdateSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  last_name: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  mobile_number: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || SRI_LANKA_MOBILE_REGEX.test(v.replace(/\s+/g, "")), {
      message: "Please enter a valid 10-digit mobile number.",
    }),
  nic: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || SRI_LANKA_NIC_REGEX.test(v.replace(/\s+/g, "")), {
      message: "Please enter a valid National Identity Card (NIC) number.",
    }),
});

export const addressSchema = z.object({
  title: z.string().trim().min(1, "Address title (e.g. Home, Site A) is required."),
  address_line_1: z.string().trim().min(3, "Street address is required."),
  address_line_2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "Province / State is required."),
  postal_code: z.string().trim().min(3, "Postal code is required."),
  is_default: z.boolean().optional(),
});

export const rentalDispatchSchema = z.object({
  delivery_street: z.string().trim().min(3, "Delivery street / site road is required."),
  delivery_city: z.string().trim().min(2, "City is required."),
  delivery_state: z.string().trim().min(2, "Province / State is required."),
  delivery_zip_code: z.string().trim().min(3, "Postal code is required."),
  house_number: z.string().trim().min(1, "House/plot number is required for dispatch."),
  tagged_location: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidLocationTag(v), {
      message: "Please provide a valid map link or coordinates.",
    }),
  customer_mobile: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => SRI_LANKA_MOBILE_REGEX.test(v), {
      message: "Please enter a valid 10-digit mobile number.",
    }),
});
