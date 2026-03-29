import { requirePageUser } from "@/src/lib/auth";
import { UserManagement } from "@/src/components/users/user-management";

export default async function UsersPage() {
  const user = await requirePageUser(["admin"]);

  return <UserManagement currentUserId={user.id} />;
}
