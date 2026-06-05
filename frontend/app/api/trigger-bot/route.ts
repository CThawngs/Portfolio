import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO;
  const pat = process.env.GITHUB_PAT;

  if (!username || !repo || !pat) {
    return NextResponse.json(
      {
        status: "Error",
        message: "Missing GITHUB_USERNAME, GITHUB_REPO, or GITHUB_PAT environment variables.",
      },
      { status: 500 }
    );
  }

  const url = `https://api.github.com/repos/${username}/${repo}/dispatches`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `Bearer ${pat}`,
        "User-Agent": "Portfolio-Webhook-Trigger",
      },
      body: JSON.stringify({
        event_type: "trigger-translation-bot",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          status: "Error",
          message: `GitHub API returned status ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      status: "Success",
      message: "Translation bot activated!",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "Error",
        message: "Failed to contact GitHub API",
        error: err.message || err,
      },
      { status: 500 }
    );
  }
}
