import { db } from "./db";
import { services } from "@shared/schema";
import { pool } from "./db";

async function seed() {
  const existing = await db.select().from(services);
  if (existing.length === 0) {
    await db.insert(services).values([
      { name: "Corte Masculino", type: "male", price: 3500, commissionRate: 40, description: "Corte tradicional ou degradê" },
      { name: "Corte Feminino", type: "female", price: 6000, commissionRate: 50, description: "Corte, lavagem e finalização" },
      { name: "Barba", type: "male", price: 2500, commissionRate: 40, description: "Barba completa ou desenhada" },
      { name: "Combo Corte + Barba", type: "promo", price: 5000, commissionRate: 40, description: "Promoção especial" },
    ]);
    console.log("Services seeded");
  } else {
    console.log("Services already seeded");
  }
}

seed().catch(console.error).finally(() => {
  pool.end();
});
