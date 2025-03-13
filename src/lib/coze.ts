const COZE_API_BASE = "https://api.coze.cn";
const COZE_AUTH_URL = "https://www.coze.cn/api/permission/oauth2/authorize";
const BOT_ID = "7475993452724617257";

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
    const response = await fetch("https://api.coze.cn/v1/workflow/run", {
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
      throw new Error("Failed to run workflow");
    }
    return await response.json();
  } catch (error) {
    console.error("Error running workflow:", error);
    throw error;
  }
}

export function initiateCozeAuth() {
  const CLIENT_ID = process.env.NEXT_PUBLIC_COZE_CLIENT_ID;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_COZE_REDIRECT_URI;
  const STATE = generateRandomState();
  
  // 存储state用于后续验证
  localStorage.setItem("coze_auth_state", STATE);
  
  const authUrl = new URL(COZE_AUTH_URL);
  authUrl.searchParams.append("client_id", CLIENT_ID!);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI!);
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
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_COZE_API_BASE}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_COZE_CLIENT_SECRET}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_COZE_REDIRECT_URI,
        client_id: process.env.NEXT_PUBLIC_COZE_CLIENT_ID
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