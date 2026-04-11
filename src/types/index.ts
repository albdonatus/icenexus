import type { Role, ServiceOrderStatus, ActionStatus } from "@prisma/client";

export type { Role, ServiceOrderStatus, ActionStatus };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    role: Role;
  }
  interface JWT {
    id: string;
    role: Role;
  }
}
