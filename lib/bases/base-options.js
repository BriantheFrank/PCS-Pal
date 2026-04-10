import { baseIndexItems } from "@/lib/bases/base-index-data";

export const BASE_OPTIONS = baseIndexItems.map((item) => ({
  id: item.slug,
  name: item.title,
}));
