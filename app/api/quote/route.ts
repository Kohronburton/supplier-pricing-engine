import { NextResponse } from "next/server";
import { calculateQuote } from "@/src/engine/pricing-engine";
import { quoteRequestSchema } from "@/src/validation/quote-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          valid: false,
          errors: parsed.error.issues.map((issue) => issue.message),
          trace: [],
        },
        { status: 400 },
      );
    }

    return NextResponse.json(calculateQuote(parsed.data));
  } catch {
    return NextResponse.json(
      {
        valid: false,
        errors: ["Unable to parse quote request."],
        trace: [],
      },
      { status: 400 },
    );
  }
}
