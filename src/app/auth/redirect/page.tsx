import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role as string;
  if (role === "SUPERADMIN") redirect("/admin");
  if (role === "TECHNICIAN") redirect("/technician");
  redirect("/manager");
}
