"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "../action-result";
import { requireActor } from "../session";
import * as users from "../services/users";
import * as departments from "../services/departments";

export async function createUserAction(input: Parameters<typeof users.createUser>[1]) {
  return runAction(async () => {
    const actor = await requireActor();
    await users.createUser(actor, input);
    revalidatePath("/admin/users");
    return null;
  });
}

export async function updateUserAction(input: Parameters<typeof users.updateUser>[1]) {
  return runAction(async () => {
    const actor = await requireActor();
    await users.updateUser(actor, input);
    revalidatePath("/admin/users");
    return null;
  });
}

export async function resetPasswordAction(userId: string, password: string) {
  return runAction(async () => {
    const actor = await requireActor();
    await users.resetPassword(actor, userId, password);
    return null;
  });
}

export async function changeOwnPasswordAction(current: string, next: string) {
  return runAction(async () => {
    const actor = await requireActor();
    await users.changeOwnPassword(actor, current, next);
    return null;
  });
}

export async function searchUsersAction(q: string) {
  return runAction(async () => {
    const actor = await requireActor();
    return users.searchUsers(actor, q);
  });
}

export async function createDepartmentAction(name: string) {
  return runAction(async () => {
    const actor = await requireActor();
    await departments.createDepartment(actor, name);
    revalidatePath("/admin/departments");
    return null;
  });
}

export async function renameDepartmentAction(id: string, name: string) {
  return runAction(async () => {
    const actor = await requireActor();
    await departments.renameDepartment(actor, id, name);
    revalidatePath("/admin/departments");
    return null;
  });
}

export async function deleteDepartmentAction(id: string) {
  return runAction(async () => {
    const actor = await requireActor();
    await departments.deleteDepartment(actor, id);
    revalidatePath("/admin/departments");
    return null;
  });
}
