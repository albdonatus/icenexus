import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServiceOrdersClient from "./ServiceOrdersClient";

export default async function ServiceOrdersPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const orders = await prisma.serviceOrder.findMany({
    where: { companyId },
    include: {
      client: { select: { id: true, name: true } },
      equipment: {
        select: {
          id: true,
          name: true,
          type: true,
          components: {
            select: {
              id: true,
              name: true,
              items: { select: { id: true, name: true }, orderBy: { order: "asc" } },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      technician: { select: { name: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return <ServiceOrdersClient orders={JSON.parse(JSON.stringify(orders))} />;
}
