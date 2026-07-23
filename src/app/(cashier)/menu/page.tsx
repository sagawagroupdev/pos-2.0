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
      <Tabs defaultValue="items">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola daftar menu dan kategori
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="items">Menu</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
        </div>
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
