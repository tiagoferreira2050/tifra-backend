import { prisma } from "../src/prisma/client.js";

async function run() {
  console.log("🔍 Buscando lojas sem StoreSettings...");

  const stores = await prisma.store.findMany({
    where: {
      settings: null,
    },
  });

  if (stores.length === 0) {
    console.log("✅ Todas as lojas já possuem StoreSettings");
    process.exit(0);
  }

  console.log(`⚠️ Encontradas ${stores.length} lojas sem settings`);

  for (const store of stores) {
    await prisma.storeSettings.create({
      data: {
        storeId: store.id,
        isOpen: true,
        openTime: "13:00",
        closeTime: "22:00",
        deliveryFee: 0,
        minOrderValue: 0,
        estimatedTime: "30-45 min",
        whatsapp: null,
      },
    });

    console.log(`✔ Settings criadas para store ${store.id}`);
  }

  console.log("🎉 Correção finalizada com sucesso");
  process.exit(0);
}

run().catch((error) => {
  console.error("❌ Erro ao corrigir StoreSettings:", error);
  process.exit(1);
});
