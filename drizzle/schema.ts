import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * 核心用户表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tenantId: int("tenantId"), // 关联租户ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 租户表（多租户隔离）
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(), // 关联users.id
  status: mysqlEnum("status", ["active", "suspended", "deleted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 订阅表（套餐管理）
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  planType: mysqlEnum("planType", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  quotaTotal: int("quotaTotal").default(0).notNull(), // 总次数
  quotaUsed: int("quotaUsed").default(0).notNull(), // 已使用次数
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 候选人表
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }), // 应聘岗位
  sourceText: text("sourceText").notNull(), // 原始文本（简历、聊天记录等）
  sourceType: mysqlEnum("sourceType", ["text", "file", "chat"]).default("text").notNull(),
  isHired: boolean("isHired").default(false).notNull(), // 是否已录用
  hiredAt: timestamp("hiredAt"),
  createdBy: int("createdBy").notNull(), // 创建人user_id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 分析报告表
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  candidateId: int("candidateId").notNull(),
  tenantId: int("tenantId").notNull(),
  
  // 人格类型判断结果
  personalityType: varchar("personalityType", { length: 50 }), // 感理型、理感型、理理型、感感型
  personalityDimension1: varchar("personalityDimension1", { length: 50 }), // 表达维度
  personalityDimension2: varchar("personalityDimension2", { length: 50 }), // 行为维度
  
  // 评分
  maturityScore: int("maturityScore").default(0), // 成熟度评分 0-10
  matchScore: int("matchScore").default(0), // 匹配度评分 0-100
  
  // 风险评估
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low").notNull(),
  riskFactors: text("riskFactors"), // JSON数组：风险因素列表
  
  // 完整报告数据（JSON）
  reportData: text("reportData").notNull(), // 包含所有分析结果的JSON
  
  // 元数据
  analysisStatus: mysqlEnum("analysisStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 分析任务队列表
 */
export const analysisTasks = mysqlTable("analysisTasks", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  candidateId: int("candidateId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

/**
 * 团队成员表
 */
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member", "readonly"]).default("member").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  invitedBy: int("invitedBy"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 次数使用日志表
 */
export const quotaLogs = mysqlTable("quotaLogs", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  operationType: mysqlEnum("operationType", ["analysis", "recharge", "refund"]).notNull(),
  quotaChange: int("quotaChange").notNull(), // 正数为增加，负数为扣除
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  relatedId: int("relatedId"), // 关联的候选人ID或订单ID
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export type AnalysisTask = typeof analysisTasks.$inferSelect;
export type InsertAnalysisTask = typeof analysisTasks.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export type QuotaLog = typeof quotaLogs.$inferSelect;
export type InsertQuotaLog = typeof quotaLogs.$inferInsert;
