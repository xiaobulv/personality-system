import { AdapterUser } from "next-auth/adapters";
import { Account, User } from "next-auth";
import { getUuid } from "@/lib/hash";
import { getIsoTimestr } from "@/lib/time";
import { saveUser } from "@/services/user";
import { User as UserType } from "@/types/user";
import { getClientIp } from "@/lib/ip";
import { createTenant } from "@/services/tenant";

export async function handleSignInUser(
  user: User | AdapterUser,
  account: Account
): Promise<UserType | null> {
  try {
    if (!user.email) {
      throw new Error("invalid signin user");
    }
    if (!account.type || !account.provider || !account.providerAccountId) {
      throw new Error("invalid signin account");
    }

    const userInfo: UserType = {
      uuid: getUuid(),
      email: user.email,
      nickname: user.name || "",
      avatar_url: user.image || "",
      signin_type: account.type,
      signin_provider: account.provider,
      signin_openid: account.providerAccountId,
      created_at: new Date(),
      signin_ip: await getClientIp(),
    };

    const savedUser = await saveUser(userInfo);

    // 自动创建租户和免费订阅
    try {
      await createTenant({
        name: savedUser.email.split('@')[0] + "的团队",
        ownerUserUuid: savedUser.uuid,
        planType: "free",
      });
      console.log("租户创建成功:", savedUser.uuid);
    } catch (error) {
      console.error("创建租户失败:", error);
      // 不影响登录流程
    }

    return savedUser;
  } catch (e) {
    console.error("handle signin user failed:", e);
    throw e;
  }
}
