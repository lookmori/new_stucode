import { NextResponse } from "next/server";

const COZE_TOKEN_URL = "https://api.coze.cn/oauth/token";
const CLIENT_ID = process.env.COZE_CLIENT_ID;
const CLIENT_SECRET = process.env.COZE_CLIENT_SECRET;
const REDIRECT_URI = process.env.COZE_REDIRECT_URI;

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // 构建获取访问令牌的请求
    const tokenResponse = await fetch(COZE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code: code,
        redirect_uri: REDIRECT_URI!,
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