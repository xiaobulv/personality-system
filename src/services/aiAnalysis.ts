/**
 * AI分析服务 - 感理识人系统核心引擎
 * 基于"感理分化说"模型进行人格分析
 */

import OpenAI from "openai";

// 初始化OpenAI客户端(使用OpenRouter)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
});

// 使用的模型
const MODEL = "deepseek/deepseek-chat"; // 免费模型

// ============================================
// 类型定义
// ============================================

export interface PersonalityClues {
  thinking_patterns: string[]; // 思维模式线索
  communication_style: string[]; // 沟通风格线索
  responsibility_indicators: string[]; // 责任心指标
  emotional_expression: string[]; // 情绪表达线索
  cooperation_tendency: string[]; // 合作倾向线索
}

export interface PersonalityAnalysis {
  personality_type: "感理型" | "理感型" | "理理型" | "感感型";
  maturity_score: number; // 1-10分
  cooperation_score: number; // 1-10分
  stability_score: number; // 1-10分
  analysis_basis: string; // 分析依据
}

export interface RiskAssessment {
  risk_level: "high" | "medium" | "low";
  risk_points: string[]; // 具体风险点
  warning_details: string; // 风险详情
}

export interface PositionMatch {
  match_score: number; // 0-100分
  suitable_positions: string[]; // 适合的岗位类型
  unsuitable_positions: string[]; // 不适合的岗位类型
  usage_suggestions: string; // 使用建议
}

export interface CollaborationGuide {
  communication_style: string; // 沟通风格建议
  motivation_method: string; // 激励方式
  management_pitfalls: string[]; // 管理踩雷点
  best_practices: string; // 最佳对接方式
}

export interface CompleteReport {
  personality: PersonalityAnalysis;
  risk: RiskAssessment;
  position_match: PositionMatch;
  collaboration_guide: CollaborationGuide;
  generated_at: string;
}

// ============================================
// 第一阶段：提取人格线索
// ============================================

export async function extractPersonalityClues(
  text: string
): Promise<PersonalityClues> {
  const systemPrompt = `你是一位资深的HR专家和心理学专家，擅长从文本中提取人格特质线索。

请从以下文本中提取与候选人人格相关的关键信息，包括：
1. 思维模式：理性思考 vs 感性思考的倾向
2. 沟通风格：表达方式、语言特点、情绪流露
3. 责任心：对任务的态度、承诺的可靠性
4. 情绪表达：情绪管理能力、情绪稳定性
5. 合作倾向：团队协作意愿、人际互动模式

请以JSON格式返回，格式如下：
{
  "thinking_patterns": ["线索1", "线索2"],
  "communication_style": ["线索1", "线索2"],
  "responsibility_indicators": ["线索1", "线索2"],
  "emotional_expression": ["线索1", "线索2"],
  "cooperation_tendency": ["线索1", "线索2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as PersonalityClues;
  } catch (error) {
    console.error("提取人格线索失败:", error);
    throw new Error("AI分析服务暂时不可用，请稍后重试");
  }
}

// ============================================
// 第二阶段：人格类型判断
// ============================================

export async function analyzePersonalityType(
  clues: PersonalityClues
): Promise<PersonalityAnalysis> {
  const systemPrompt = `你是人格分析专家，精通"感理分化说"理论。

【感理分化说核心理论】
人格可以分为四种基本类型：
1. 感理型：感性主导，但具备理性思考能力。特点：情感丰富但能控制，善于共情，沟通温暖。
2. 理感型：理性主导，但能理解情感。特点：逻辑清晰，结构导向，表达内敛，情绪稳定。
3. 理理型：纯理性思维。特点：极度逻辑化，情感表达弱，任务导向，可能缺乏共情。
4. 感感型：纯感性思维。特点：情绪化，直觉导向，表达丰富，可能缺乏结构性。

【评分维度】
- 成熟度(1-10分)：人格发展的完整性和稳定性
- 配合度(1-10分)：与他人协作的意愿和能力
- 稳定度(1-10分)：情绪和行为的一致性

请根据提取的线索，判断候选人的人格类型，并给出评分和分析依据。

返回JSON格式：
{
  "personality_type": "感理型/理感型/理理型/感感型",
  "maturity_score": 8,
  "cooperation_score": 7,
  "stability_score": 9,
  "analysis_basis": "详细的分析依据说明"
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(clues, null, 2) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as PersonalityAnalysis;
  } catch (error) {
    console.error("人格类型判断失败:", error);
    throw new Error("AI分析服务暂时不可用，请稍后重试");
  }
}

// ============================================
// 第三阶段：生成完整报告
// ============================================

export async function generateCompleteReport(
  personality: PersonalityAnalysis,
  position: string
): Promise<CompleteReport> {
  const systemPrompt = `你是企业用人顾问专家，擅长根据人格分析结果给出实用的管理建议。

请根据候选人的人格类型和应聘岗位，生成完整的分析报告，包括：

1. 风险评估：识别潜在的管理风险和雷点
2. 岗位匹配：评估与岗位的契合度，给出匹配分数(0-100)
3. 协作说明书：提供具体的沟通、激励和管理建议

返回JSON格式：
{
  "risk": {
    "risk_level": "high/medium/low",
    "risk_points": ["风险点1", "风险点2"],
    "warning_details": "详细的风险说明"
  },
  "position_match": {
    "match_score": 75,
    "suitable_positions": ["适合的岗位类型"],
    "unsuitable_positions": ["不适合的岗位类型"],
    "usage_suggestions": "具体的使用建议"
  },
  "collaboration_guide": {
    "communication_style": "沟通风格建议",
    "motivation_method": "激励方式建议",
    "management_pitfalls": ["踩雷点1", "踩雷点2"],
    "best_practices": "最佳对接方式"
  }
}`;

  const userPrompt = `候选人人格分析结果：
${JSON.stringify(personality, null, 2)}

应聘岗位：${position}

请生成完整的分析报告。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      personality,
      risk: result.risk,
      position_match: result.position_match,
      collaboration_guide: result.collaboration_guide,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("生成完整报告失败:", error);
    throw new Error("AI分析服务暂时不可用，请稍后重试");
  }
}

// ============================================
// 完整分析流程（三阶段串联）
// ============================================

export async function performCompleteAnalysis(
  inputText: string,
  position: string
): Promise<CompleteReport> {
  console.log("开始AI分析 - 第一阶段：提取人格线索");
  const clues = await extractPersonalityClues(inputText);

  console.log("开始AI分析 - 第二阶段：人格类型判断");
  const personality = await analyzePersonalityType(clues);

  console.log("开始AI分析 - 第三阶段：生成完整报告");
  const report = await generateCompleteReport(personality, position);

  return report;
}
