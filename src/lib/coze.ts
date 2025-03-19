const COZE_API_BASE = process.env.NEXT_PUBLIC_COZE_API_BASE || "https://api.coze.cn";
const COZE_AUTH_URL = `${COZE_API_BASE}/api/permission/oauth2/authorize`;
const BOT_ID = process.env.NEXT_PUBLIC_COZE_BOT_ID;

interface WorkflowParams {
  input: string;
  workflow_id?: string;
  bot_id?: string;
}

export async function runWorkflow({ input }: WorkflowParams) {
  const accessToken = localStorage.getItem("coze_access_token");
  
  if (!accessToken) {
    throw new Error("No access token found");
  }

  try {
    console.log("发送工作流请求，参数:", {
      input,
      workflow_id: process.env.NEXT_PUBLIC_COZE_WORKFLOW_ID,
    });
    
    const response = await fetch(`${COZE_API_BASE}/v1/workflow/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        parameters: {
          input: input
        },
        workflow_id: process.env.NEXT_PUBLIC_COZE_WORKFLOW_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("工作流执行失败:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Failed to run workflow: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log("API原始响应文本:", responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("解析API响应JSON失败:", parseError);
      throw new Error("Invalid JSON response from API");
    }
    
    console.log("工作流执行成功，解析后的响应:", result);
    console.log("响应数据类型:", typeof result);
    console.log("响应字段:", Object.keys(result));
    
    if (result.data) {
      console.log("data字段类型:", typeof result.data);
      console.log("data字段内容:", result.data);
    }
    
    // 验证响应格式
    if (!result || typeof result !== 'object') {
      throw new Error("Invalid workflow response format");
    }
    
    // 确保data字段是字符串
    if (result.data && typeof result.data !== 'string') {
      console.log("将data字段转换为字符串");
      try {
        result.data = JSON.stringify(result.data);
        console.log("转换后的data字段:", result.data);
      } catch (stringifyError) {
        console.error("将data字段转换为字符串失败:", stringifyError);
        throw new Error("Failed to stringify data field");
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error running workflow:", error);
    throw error;
  }
}

export function initiateCozeAuth() {
  const CLIENT_ID = process.env.NEXT_PUBLIC_COZE_CLIENT_ID;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_COZE_REDIRECT_URI;
  
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error("缺少必要的环境变量配置");
  }
  
  const STATE = generateRandomState();
  
  // 存储state用于后续验证
  localStorage.setItem("coze_auth_state", STATE);
  
  // 保存当前页面的URL，确保能回到问题列表页面
  localStorage.setItem("coze_return_path", window.location.pathname);
  
  const authUrl = new URL(COZE_AUTH_URL);
  authUrl.searchParams.append("client_id", CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", STATE);
  authUrl.searchParams.append("scope", "workflow");

  // 在当前页面进行跳转
  window.location.href = authUrl.toString();
}

function generateRandomState() {
  return Math.random().toString(36).substring(2, 15);
}

export async function getCozeToken(code: string) {
  const CLIENT_ID = process.env.NEXT_PUBLIC_COZE_CLIENT_ID;
  const CLIENT_SECRET = process.env.NEXT_PUBLIC_COZE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_COZE_REDIRECT_URI;

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error("缺少必要的环境变量配置");
  }

  try {
    const response = await fetch(`${COZE_API_BASE}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLIENT_SECRET}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID
      })
    });

    if (!response.ok) {
      throw new Error('获取token失败');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取token时出错:', error);
    throw error;
  }
} 