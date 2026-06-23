import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager, type CategoryRow } from "./category-manager";
import {
  ItemManager,
  type ItemRow,
  type CategoryOption,
} from "./item-manager";

export default async function MenuPage() {
  const [categories, items] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
    }),
  ]);

  const categoryRows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    itemCount: c._count.items,
  }));

  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const itemRows: ItemRow[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    stock: item.stock,
    image: item.image,
    isAvailable: item.isAvailable,
    categoryId: item.categoryId,
    categoryName: item.category.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Kelola Menu</h1>
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Item</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <ItemManager items={itemRows} categories={categoryOptions} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManager categories={categoryRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
