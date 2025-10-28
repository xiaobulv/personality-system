/**
 * AI人格分析服务
 * 基于"感理分化说"理论，三阶段分析流程
 */

import { invokeLLM } from "../_core/llm";

/**
 * 阶段1：提取人格线索
 */
export async function extractPersonalityClues(sourceText: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个专业的人格分析专家，精通"感理分化说"理论。

你的任务是从候选人的文本资料中提取人格线索。

**感理分化说理论简介：**
- **表达维度**：感性表达 vs 理性表达
- **行为维度**：结构化行为 vs 灵活化行为

**提取要点：**
1. 表达方式：语言风格、情感表达、用词习惯
2. 行为模式：做事方式、计划性、应变能力
3. 沟通特点：主动性、回应方式、信息密度
4. 价值观念：关注点、决策依据、目标导向

请提取关键线索，每条线索用一句话概括。`,
      },
      {
        role: "user",
        content: `请从以下文本中提取人格线索：\n\n${sourceText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') {
    return '';
  }
  return content;
}

/**
 * 阶段2：判断人格类型
 */
export async function judgePersonalityType(clues: string): Promise<{
  type: string;
  dimension1: string;
  dimension2: string;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个专业的人格分析专家，精通"感理分化说"理论。

**四种人格类型：**
1. **感理型**：情感表达丰富 + 行为结构化
2. **理感型**：表达克制 + 行为灵活
3. **理理型**：表达克制 + 行为结构化
4. **感感型**：情感表达丰富 + 行为灵活

**判断标准：**
- 表达维度：看语言风格、情感流露、用词习惯
- 行为维度：看计划性、灵活性、执行方式

请基于提取的线索，判断候选人的人格类型。

返回JSON格式：
{
  "type": "感理型|理感型|理理型|感感型",
  "dimension1": "感性表达|理性表达",
  "dimension2": "结构化行为|灵活化行为",
  "confidence": 0-100
}`,
      },
      {
        role: "user",
        content: `基于以下人格线索，判断候选人的人格类型：\n\n${clues}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "personality_type",
        strict: true,
        schema: {
          type: "object",
          properties: {
            type: { type: "string" },
            dimension1: { type: "string" },
            dimension2: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["type", "dimension1", "dimension2", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  return JSON.parse(content);
}

/**
 * 阶段3：生成完整报告
 */
export async function generateFullReport(params: {
  sourceText: string;
  clues: string;
  personalityType: string;
  dimension1: string;
  dimension2: string;
  candidateName: string;
  position?: string;
}): Promise<{
  maturityScore: number;
  matchScore: number;
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
  usageSuggestions: string;
  communicationGuide: string;
  positionMatch: string;
  summary: string;
}> {
  const { sourceText, clues, personalityType, dimension1, dimension2, candidateName, position } = params;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个专业的人格分析专家和HR顾问。

你的任务是基于候选人的人格类型，生成完整的分析报告。

**报告内容：**
1. **成熟度评分**（0-10）：综合评估候选人的职业成熟度
2. **匹配度评分**（0-100）：评估候选人与岗位的匹配程度
3. **风险等级**（low/medium/high）：识别潜在风险
4. **风险因素**：列出具体的风险点
5. **使用建议**：如何用好这个人
6. **沟通指南**：如何与TA沟通协作
7. **岗位适配**：适合什么岗位，不适合什么岗位
8. **总结**：一句话总结

返回JSON格式，所有文本字段用中文。`,
      },
      {
        role: "user",
        content: `候选人：${candidateName}
应聘岗位：${position || "未指定"}
人格类型：${personalityType}（${dimension1} + ${dimension2}）

人格线索：
${clues}

原始文本：
${sourceText}

请生成完整的分析报告。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "full_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            maturityScore: { type: "number" },
            matchScore: { type: "number" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            riskFactors: { type: "array", items: { type: "string" } },
            usageSuggestions: { type: "string" },
            communicationGuide: { type: "string" },
            positionMatch: { type: "string" },
            summary: { type: "string" },
          },
          required: [
            "maturityScore",
            "matchScore",
            "riskLevel",
            "riskFactors",
            "usageSuggestions",
            "communicationGuide",
            "positionMatch",
            "summary",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  return JSON.parse(content);
}

/**
 * 完整分析流程（三阶段）
 */
export async function analyzeCandidate(params: {
  sourceText: string;
  candidateName: string;
  position?: string;
}): Promise<{
  personalityType: string;
  dimension1: string;
  dimension2: string;
  maturityScore: number;
  matchScore: number;
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
  reportData: any;
}> {
  const { sourceText, candidateName, position } = params;

  // 阶段1：提取线索
  const clues = await extractPersonalityClues(sourceText);

  // 阶段2：判断类型
  const typeResult = await judgePersonalityType(clues);

  // 阶段3：生成报告
  const report = await generateFullReport({
    sourceText,
    clues,
    personalityType: typeResult.type,
    dimension1: typeResult.dimension1,
    dimension2: typeResult.dimension2,
    candidateName,
    position,
  });

  return {
    personalityType: typeResult.type,
    dimension1: typeResult.dimension1,
    dimension2: typeResult.dimension2,
    maturityScore: report.maturityScore,
    matchScore: report.matchScore,
    riskLevel: report.riskLevel,
    riskFactors: report.riskFactors,
    reportData: {
      clues,
      confidence: typeResult.confidence,
      ...report,
    },
  };
}
