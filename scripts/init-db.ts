/**
 * 数据库初始化脚本
 * 用于创建表结构和初始数据
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

async function main() {
  console.log("🚀 开始初始化数据库...");

  // 从环境变量获取数据库连接
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  console.log("📦 连接数据库:", databaseUrl.split("@")[1] || "localhost");

  // 创建数据库连接
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    // 测试连接
    console.log("🔍 测试数据库连接...");
    await client`SELECT 1`;
    console.log("✅ 数据库连接成功");

    // 检查表是否存在
    console.log("\n📋 检查数据库表...");
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    console.log(`找到 ${tables.length} 个表:`);
    tables.forEach((t) => {
      console.log(`  - ${t.table_name}`);
    });

    if (tables.length === 0) {
      console.log("\n⚠️  数据库为空，请运行以下命令创建表:");
      console.log("  pnpm db:push");
    } else {
      console.log("\n✅ 数据库表已存在");

      // 检查核心表
      const requiredTables = [
        "users",
        "tenants",
        "subscriptions",
        "candidates",
        "reports",
      ];
      const existingTables = tables.map((t) => t.table_name);
      const missingTables = requiredTables.filter(
        (t) => !existingTables.includes(t)
      );

      if (missingTables.length > 0) {
        console.log("\n⚠️  缺少以下核心表:");
        missingTables.forEach((t) => {
          console.log(`  - ${t}`);
        });
        console.log("\n请运行: pnpm db:push");
      } else {
        console.log("✅ 所有核心表都已创建");
      }
    }

    console.log("\n🎉 数据库初始化检查完成！");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
