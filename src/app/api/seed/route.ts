import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/seed — inserts test Split AC equipment for the logged-in company (MANAGER only)
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;

  // Find or create a test client
  let client = await prisma.client.findFirst({
    where: { companyId, name: "Cliente Teste" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        companyId,
        name: "Cliente Teste",
        document: "00.000.000/0001-00",
        email: "teste@exemplo.com",
        phone: "(11) 99999-9999",
        address: "Rua Teste, 123 - São Paulo, SP",
      },
    });
  }

  // Check if equipment already exists
  const existing = await prisma.equipment.findFirst({
    where: { companyId, clientId: client.id, name: "Split Hi-wall Sala 01" },
  });

  if (existing) {
    return NextResponse.json({ message: "Equipamento já existe", equipmentId: existing.id });
  }

  const equipment = await prisma.equipment.create({
    data: {
      companyId,
      clientId: client.id,
      name: "Split Hi-wall Sala 01",
      type: "Split Hi-wall",
      brand: "Carrier",
      model: "42XQB018515LC",
      notes: "Ar-condicionado Split (Hi-wall / Piso-Teto / Cassete) - dados de teste",
      components: {
        create: [
          {
            name: "Evaporadora",
            order: 0,
            items: {
              create: [
                { name: "Filtro de ar", order: 0 },
                { name: "Serpentina (evaporador)", order: 1 },
                { name: "Ventilador (turbina)", order: 2 },
                { name: "Bandeja de drenagem", order: 3 },
                { name: "Sensor de temperatura", order: 4 },
              ],
            },
          },
          {
            name: "Condensadora",
            order: 1,
            items: {
              create: [
                { name: "Compressor", order: 0 },
                { name: "Condensador (serpentina externa)", order: 1 },
                { name: "Ventilador", order: 2 },
                { name: "Hélice", order: 3 },
                { name: "Contator", order: 4 },
                { name: "Capacitor", order: 5 },
                { name: "Pressostato (se houver)", order: 6 },
              ],
            },
          },
          {
            name: "Sistema frigorígeno",
            order: 2,
            items: {
              create: [
                { name: "Tubulação de cobre", order: 0 },
                { name: "Válvulas de serviço", order: 1 },
                { name: "Isolamento térmico", order: 2 },
              ],
            },
          },
          {
            name: "Sistema elétrico",
            order: 3,
            items: {
              create: [
                { name: "Placa eletrônica", order: 0 },
                { name: "Fiação", order: 1 },
                { name: "Disjuntores", order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      components: { include: { items: true }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({
    message: "Equipamento criado com sucesso",
    clientId: client.id,
    clientName: client.name,
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    components: equipment.components.map((c) => ({
      name: c.name,
      items: c.items.map((i) => i.name),
    })),
  });
}
