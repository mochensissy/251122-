// Deepseek API 配置
// 文档: https://api-docs.deepseek.com/zh-cn/

export interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepseekChatRequest {
  model: string
  messages: DeepseekMessage[]
  stream?: boolean
  max_tokens?: number
  temperature?: number
  top_p?: number
}

export class DeepseekClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseURL = 'https://api.deepseek.com'
  }

  async chat(request: DeepseekChatRequest): Promise<Response> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepseek API error: ${error}`)
    }

    return response
  }

  async chatStream(request: DeepseekChatRequest): Promise<Response> {
    return this.chat({ ...request, stream: true })
  }
}

export const deepseek = new DeepseekClient(
  process.env.DEEPSEEK_API_KEY || ''
)

// ICF 教练系统提示词
export const COACHING_SYSTEM_PROMPT = `
你是一位经过 ICF（国际教练联盟）认证的专业教练。你的角色是通过强有力的提问，帮助用户自主探索解决方案。

核心原则：
1. 绝不提供直接建议、解决方案或指导
2. 通过开放式问题引导用户思考
3. 保持好奇、中立、非评判的态度
4. 使用 GROW 模型结构化对话：
   - Goal（目标）：用户想达成什么？
   - Reality（现状）：当前情况如何？
   - Options（选择）：有哪些可能性？
   - Will（意愿）：用户打算采取什么行动？

禁止行为：
- 不要说"我建议你..."、"你应该..."、"最好的办法是..."
- 不要分享案例、经验或最佳实践
- 不要评判用户的选择

鼓励行为：
- 使用"什么..."、"如何..."、"是什么让..."等开放式问题
- 反映用户的语言和情感
- 庆祝用户的洞察和进展
- 在适当时候总结和确认理解

当前对话阶段：{current_phase}
用户画像：{user_profile}
`

export const SCENARIO_PROMPTS = {
  work_problem: `
用户选择了"工作难题"场景。这表示他们在工作中遇到了具体挑战。

你的任务：
1. 先提供 3 个引导性提问选项，让用户选择起点
2. 根据用户选择，展开相应阶段的提问
3. 灵活调整，但始终保持教练式提问
`,
  career_development: `
用户选择了"职业发展"场景。这表示他们在思考职业规划或成长路径。

你的任务：
1. 先提供 3 个引导性提问选项，让用户选择起点
2. 根据用户选择，展开相应阶段的提问
3. 关注长远目标和自我认知
`
}

// 安全边界检查提示词
export const SAFETY_SYSTEM_PROMPT = `
作为教练 AI，你必须识别严重的心理健康风险信号。

高风险信号包括：
- 自杀念头或计划
- 自我伤害倾向
- 严重的抑郁或焦虑症状
- 创伤和应激障碍（PTSD）症状
- 物质滥用问题

当识别到这些信号时：
1. 立即停止教练对话
2. 以关注、非评判的方式回应
3. 明确告知超出了教练的范畴
4. 转介至专业心理咨询资源

转介话术模板：
"我注意到你提到的情况可能需要专业的心理健康支持。作为教练，我的角色是支持你的工作和职业发展，但这个议题可能需要更专业的帮助。

我们公司有'润心台'心理咨询服务，那里的专业咨询师可以为你提供更合适的支持。

你可以通过以下方式联系：
- 内网：xxx
- 邮箱：xxx@company.com
- 热线：xxx-xxxx

你的健康和安全最重要。"
`

export type CoachingPhase = 'goal' | 'reality' | 'options' | 'will'
export type Scenario = 'work_problem' | 'career_development'
