import { NextResponse } from "next/server";

const COZE_API_BASE = process.env.NEXT_PUBLIC_COZE_API_BASE || "https://api.coze.cn";
const COZE_TOKEN_URL = `${COZE_API_BASE}/oauth/token`;
const CLIENT_ID = process.env.NEXT_PUBLIC_COZE_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_COZE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_COZE_REDIRECT_URI;

export async function POST(request: Request) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("缺少必要的环境变量配置");
    }

    const { code } = await request.json();

    // 构建获取访问令牌的请求
    const tokenResponse = await fetch(COZE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token");
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
} 