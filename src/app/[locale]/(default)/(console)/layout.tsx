import ConsoleLayout from "@/components/console/layout";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getTranslations } from "next-intl/server";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function ({ children }: { children: ReactNode }) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const t = await getTranslations();

  const sidebar: Sidebar = {
    nav: {
      items: [
        {
          title: "👁️ 首页",
          url: "/dashboard",
          icon: "RiDashboardLine",
          is_active: false,
        },
        {
          title: "➕ 新建任务",
          url: "/tasks/create",
          icon: "RiAddCircleLine",
          is_active: false,
        },
        {
          title: "📂 历史记录",
          url: "/reports",
          icon: "RiFileListLine",
          is_active: false,
        },
        {
          title: "🌐 团队图谱",
          url: "/team-map",
          icon: "RiTeamLine",
          is_active: false,
        },
        {
          title: t("user.my_orders"),
          url: "/my-orders",
          icon: "RiOrderPlayLine",
          is_active: false,
        },
        {
          title: t("my_credits.title"),
          url: "/my-credits",
          icon: "RiBankCardLine",
          is_active: false,
        },
      ],
    },
  };

  return <ConsoleLayout sidebar={sidebar}>{children}</ConsoleLayout>;
}
