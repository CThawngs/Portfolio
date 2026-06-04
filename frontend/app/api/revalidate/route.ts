import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedToken = process.env.REVALIDATE_TOKEN || "thang-portfolio-secret";

  if (secret !== expectedToken) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  try {
    // Clear cache for the homepage
    revalidatePath("/");
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Error revalidating", error: err.message || err },
      { status: 500 }
    );
  }
}
