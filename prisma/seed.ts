import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Super Admin
  const superHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@icenexus.com" },
    update: {},
    create: {
      name: "Super Administrador",
      email: "admin@icenexus.com",
      passwordHash: superHash,
      role: "SUPERADMIN",
    },
  });

  // Create Manager
  const managerHash = await bcrypt.hash("gestor123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "gestor@icenexus.com" },
    update: {},
    create: {
      name: "Gestor Administrador",
      email: "gestor@icenexus.com",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });
  console.log("✅ Manager:", manager.email);

  // Create Technician
  const techHash = await bcrypt.hash("tecnico123", 10);
  const technician = await prisma.user.upsert({
    where: { email: "tecnico@icenexus.com" },
    update: {},
    create: {
      name: "João Técnico",
      email: "tecnico@icenexus.com",
      passwordHash: techHash,
      role: "TECHNICIAN",
    },
  });
  console.log("✅ Technician:", technician.email);

  // Create Client
  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      name: "Empresa Fria Ltda",
      document: "12.345.678/0001-99",
      phone: "(11) 99999-1234",
      email: "contato@empresafria.com",
      address: "Rua das Geladeiras, 42 - São Paulo, SP",
    },
  });
  console.log("✅ Client:", client.name);

  // Create Equipment
  const equipment = await prisma.equipment.upsert({
    where: { id: "seed-equipment-1" },
    update: {},
    create: {
      id: "seed-equipment-1",
      clientId: client.id,
      name: "Split Sala de Reuniões",
      type: "Split",
      brand: "Carrier",
      model: "38HXC",
      serialNumber: "SN20241001",
    },
  });
  console.log("✅ Equipment:", equipment.name);

  // Create Checklist Template
  const template = await prisma.checklistTemplate.upsert({
    where: { id: "seed-template-1" },
    update: {},
    create: {
      id: "seed-template-1",
      name: "Manutenção Preventiva - Split",
      description: "Checklist padrão para manutenção de split",
      equipmentType: "Split",
      components: {
        create: [
          {
            name: "Filtro",
            order: 0,
            actions: {
              create: [
                { description: "Limpar filtro de ar", order: 0 },
                { description: "Verificar presença de sujeira excessiva", order: 1 },
                { description: "Trocar filtro se necessário", order: 2 },
              ],
            },
          },
          {
            name: "Compressor",
            order: 1,
            actions: {
              create: [
                { description: "Inspecionar funcionamento", order: 0 },
                { description: "Verificar ruídos anormais", order: 1 },
                { description: "Medir corrente elétrica", order: 2 },
              ],
            },
          },
          {
            name: "Condensador",
            order: 2,
            actions: {
              create: [
                { description: "Limpar serpentina", order: 0 },
                { description: "Verificar obstrução nas aletas", order: 1 },
                { description: "Verificar temperatura de saída", order: 2 },
              ],
            },
          },
          {
            name: "Evaporador",
            order: 3,
            actions: {
              create: [
                { description: "Limpar serpentina do evaporador", order: 0 },
                { description: "Verificar vazamento de refrigerante", order: 1 },
                { description: "Medir pressão de sucção", order: 2 },
              ],
            },
          },
          {
            name: "Dreno",
            order: 4,
            actions: {
              create: [
                { description: "Limpar bandeja de condensado", order: 0 },
                { description: "Testar drenagem com água", order: 1 },
                { description: "Verificar obstrução no tubo de dreno", order: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Checklist Template:", template.name);

  console.log("\n🎉 Seed concluído!\n");
  console.log("Credenciais de acesso:");
  console.log("  Gestor:  gestor@icenexus.com  / gestor123");
  console.log("  Técnico: tecnico@icenexus.com / tecnico123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
