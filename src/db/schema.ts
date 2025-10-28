import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// ============================================
// 核心用户与租户表
// ============================================

// Tenants table (租户表 - 新增)
export const tenants = pgTable("tenants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(), // 企业名称
  logo_url: text(),
  custom_product_name: varchar({ length: 255 }), // 自定义产品名称(企业版)
  owner_user_uuid: varchar({ length: 255 }).notNull(), // 主账号UUID
  plan_type: varchar({ length: 50 }).notNull().default("free"), // free/basic/pro/enterprise
  status: varchar({ length: 50 }).notNull().default("active"), // active/suspended
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Users table (用户表 - 扩展)
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    tenant_id: varchar({ length: 255 }).notNull().default(""), // 租户ID - 新增
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    role: varchar({ length: 50 }).notNull().default("member"), // admin/member/viewer - 新增
    company_name: varchar({ length: 255 }), // 企业名称 - 新增
    company_logo_url: varchar({ length: 255 }), // 企业Logo - 新增
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Team Members table (团队成员表 - 新增)
export const teamMembers = pgTable("team_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tenant_id: varchar({ length: 255 }).notNull(),
  user_uuid: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 50 }).notNull().default("member"), // admin/member/viewer
  invited_by: varchar({ length: 255 }),
  status: varchar({ length: 50 }).notNull().default("active"), // active/pending/removed
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

// ============================================
// 订阅与支付表
// ============================================

// Subscriptions table (订阅表 - 新增)
export const subscriptions = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  tenant_id: varchar({ length: 255 }).notNull(),
  plan_type: varchar({ length: 50 }).notNull(), // free/basic/pro/enterprise
  status: varchar({ length: 50 }).notNull().default("active"), // active/expired/cancelled
  monthly_quota: integer().notNull().default(0), // 月度分析次数配额
  remaining_quota: integer().notNull().default(0), // 剩余分析次数
  start_date: timestamp({ withTimezone: true }).defaultNow(),
  end_date: timestamp({ withTimezone: true }),
  auto_renew: boolean().notNull().default(false),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Orders table (订单表 - 保留并扩展)
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  tenant_id: varchar({ length: 255 }).notNull().default(""), // 新增
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  payment_method: varchar({ length: 50 }), // wechat/alipay - 新增
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

// Quota Logs table (次数日志表 - 改造自credits)
export const quotaLogs = pgTable("quota_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  tenant_id: varchar({ length: 255 }).notNull(), // 新增
  user_uuid: varchar({ length: 255 }).notNull(),
  quota_type: varchar({ length: 50 }).notNull(), // deduct/refill/reset
  quota_change: integer().notNull(), // 次数变化量
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// ============================================
// 核心业务表 - 识人系统
// ============================================

// Candidates table (候选人表 - 新增)
export const candidates = pgTable("candidates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  tenant_id: varchar({ length: 255 }).notNull(), // 租户隔离
  created_by: varchar({ length: 255 }).notNull(), // 创建人UUID
  name: varchar({ length: 255 }).notNull(), // 候选人姓名
  position: varchar({ length: 255 }).notNull(), // 应聘岗位
  is_hired: boolean().notNull().default(false), // 是否已录用
  status: varchar({ length: 50 }).notNull().default("active"), // active/archived
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Reports table (分析报告表 - 新增)
export const reports = pgTable("reports", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  tenant_id: varchar({ length: 255 }).notNull(), // 租户隔离
  candidate_id: integer().notNull(), // 关联候选人
  created_by: varchar({ length: 255 }).notNull(), // 创建人UUID
  report_data: jsonb(), // 完整报告内容(JSON)
  personality_type: varchar({ length: 50 }), // 人格类型: 感理/理感/理理/感感
  risk_level: varchar({ length: 50 }), // 风险等级: high/medium/low
  maturity_score: integer(), // 成熟度评分 (1-10)
  match_score: integer(), // 匹配度评分 (0-100)
  status: varchar({ length: 50 }).notNull().default("processing"), // completed/processing/failed
  created_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Analysis Tasks table (分析任务队列表 - 新增)
export const analysisTasks = pgTable("analysis_tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  tenant_id: varchar({ length: 255 }).notNull(),
  candidate_id: integer().notNull(),
  created_by: varchar({ length: 255 }).notNull(),
  input_text: text(), // 输入的文本内容
  file_url: varchar({ length: 255 }), // 上传的文件URL
  status: varchar({ length: 50 }).notNull().default("pending"), // pending/processing/completed/failed
  error_message: text(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  completed_at: timestamp({ withTimezone: true }),
});

// ============================================
// 其他保留表
// ============================================

// API Keys table (保留)
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  tenant_id: varchar({ length: 255 }).notNull().default(""), // 新增
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  status: varchar({ length: 50 }),
});

// Categories table (保留 - 可用于岗位分类)
export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }),
  sort: integer().notNull().default(0),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});

// Posts table (保留 - 可用于帮助文档)
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
  category_uuid: varchar({ length: 255 }),
});

// Affiliates table (保留)
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table (保留)
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  tenant_id: varchar({ length: 255 }).notNull().default(""), // 新增
  content: text(),
  rating: integer(),
});

// System Configurations table (系统配置表 - 新增)
export const configurations = pgTable("configurations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  key: varchar({ length: 255 }).notNull().unique(),
  value: text(),
  description: text(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  updated_at: timestamp({ withTimezone: true }).defaultNow(),
});
