import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/redis";

const MENU_CACHE_KEY = "menu:full";
const MENU_TTL = 300;

export type MenuCategory = {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    isAvailable: boolean;
    categoryId: string;
  }[];
};

export async function getMenu(outletId: string): Promise<MenuCategory[]> {
  const cacheKey = `menu:full:${outletId}`;
  const cached = await cacheGet<MenuCategory[]>(cacheKey);
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    where: { outletId },
    orderBy: { name: "asc" },
    include: {
      items: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          image: true,
          isAvailable: true,
          categoryId: true,
        },
      },
    },
  });

  await cacheSet(cacheKey, categories, MENU_TTL);
  return categories;
}

export async function invalidateMenuCache(outletId: string) {
  await cacheInvalidate(`menu:full:${outletId}`);
}
