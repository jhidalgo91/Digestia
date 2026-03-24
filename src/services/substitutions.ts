import { prisma } from "../lib/prisma";

export async function suggestSubstitutions(foodItemId: string, limit = 3) {
    const fi = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
    if (!fi) return [];

    const candidates = await prisma.foodItem.findMany({
        where: { group: fi.group, NOT: { id: foodItemId } },
        take: limit,
    });

    return candidates.map((c) => ({
        id: c.id,
        name: c.name,
        group: c.group,
        caloriesPer100g: c.caloriesPer100g,
        proteinPer100g: c.proteinPer100g,
    }));
}
