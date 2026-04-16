import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import EquipmentClient from "./EquipmentClient";

export default async function EquipmentPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const equipment = await prisma.equipment.findMany({
    where: { active: true, companyId },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-sm text-gray-500 mt-1">{equipment.length} equipamento(s) cadastrado(s)</p>
        </div>
        <Link href="/manager/equipment/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Novo Equipamento
          </Button>
        </Link>
      </div>

      <EquipmentClient equipment={equipment} />
    </div>
  );
}
