import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase-admin';
import { checkQuota, logUsage } from '@/lib/usage';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODELS: Record<string, string> = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-7',
};

const DEFAULT_MODEL = 'opus';

function loadFile(filename: string): string {
  try {
    const path = join(process.cwd(), 'references', filename);
    if (existsSync(path)) {
      return readFileSync(path, 'utf-8');
    }
  } catch (e) {
    console.warn(`Could not load reference file: ${filename}`);
  }
  return '';
}

const SECTION_MAP = loadFile('section-mapping.md');
const CASE_LAW = loadFile('case-law-landmarks.md');
const TAX_PLANNING = loadFile('tax-planning.md');
const NOTICE_HANDLING = loadFile('notice-handling.md');

const SYSTEM_PROMPT_BASE = `You are an expert Indian Income Tax Analyser—a highly qualified Chartered Accountant and Tax Advocate specialising in Indian direct taxation.

## Dual-Act Regime (CRITICAL)
As of 1 April 2026, India operates under a dual-Act regime:
- **Income-tax Act, 2025 (ITA 2025)** — governs FY 2026-27 (AY 2027-28) onwards
- **Income-tax Act, 1961 (ITA 1961)** — governs AY 2025-26 and all earlier assessment years

ALWAYS identify the Assessment Year before citing any section.

## Section Mappings
${SECTION_MAP}

## Case Law & Disputable Areas
${CASE_LAW}

## Tax Planning Strategies
${TAX_PLANNING}

## Notice & Assessment Handling
${NOTICE_HANDLING}

Respond in professional but accessible English. Use markdown for formatting.`;

const AUDIENCE_INSTRUCTIONS: Record<string, string> = {
  student: "\n## Audience: Student (Learn Mode)\nExplain concepts from first principles. Define technical terms before using them. Use relatable examples and analogies. Avoid jargon. Be encouraging and educational.",
  professional: "\n## Audience: Working Professional / Enterprise\nAssume basic tax literacy. Be concise and action-oriented. Focus on practical implications, compliance steps, and deadlines. Avoid over-explaining basics.",
  ca: "\n## Audience: Chartered Accountant (Advanced)\nUse full technical terminology. Cite exact section numbers, sub-sections, and provisos. Reference CBDT circulars, notifications, and ITAT/HC/SC judgments where relevant. Discuss alternate interpretations and litigation risk.",
};

function buildSystemPrompt(audience: string, actContext: string) {
  const suffix = AUDIENCE_INSTRUCTIONS[audience] || '';
  let contextInstruction = "";
  if (actContext === "ita2025") {
    contextInstruction = "\n\n## ACT CONTEXT OVERRIDE\nThe user has explicitly set the context to **ITA 2025**. You MUST answer using the new Income-tax Act, 2025 regardless of the assessment year mentioned, unless absolutely impossible.";
  } else if (actContext === "ita1961") {
    contextInstruction = "\n\n## ACT CONTEXT OVERRIDE\nThe user has explicitly set the context to **ITA 1961**. You MUST answer using the old Income-tax Act, 1961 regardless of the assessment year mentioned, unless absolutely impossible.";
  }
  return SYSTEM_PROMPT_BASE + contextInstruction + suffix;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await req.json();
    const userMessage = data.message?.trim();
    const modelKey = data.model || DEFAULT_MODEL;
    const audience = data.audience || 'professional';
    const actContext = data.actContext || 'both';
    const history = data.history || [];

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 });
    }

    // Check quota for all users
    const quotaCheck = await checkQuota(decodedToken.uid);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Monthly request quota exceeded',
          quota: quotaCheck,
        },
        { status: 429, headers: {
          'Retry-After': '86400', // 1 day
          'X-Quota-Limit': quotaCheck.limit.toString(),
          'X-Quota-Used': (quotaCheck.limit - quotaCheck.remaining).toString(),
          'X-Quota-Remaining': '0',
        }}
      );
    }

    const modelId = MODELS[modelKey] || MODELS[DEFAULT_MODEL];
    const systemPrompt = buildSystemPrompt(audience, actContext);

    const messages = [...history, { role: 'user', content: userMessage }];

    const responseStream = await anthropic.messages.stream({
      model: modelId,
      max_tokens: 8192,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } } as any],
      messages,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let totalInputTokens = 0;
          let totalOutputTokens = 0;

          for await (const chunk of responseStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
            }
            // Track token usage
            if (chunk.type === 'message_start' && chunk.message.usage) {
              totalInputTokens = chunk.message.usage.input_tokens;
            }
            if (chunk.type === 'message_delta' && chunk.usage) {
              totalOutputTokens = chunk.usage.output_tokens;
            }
          }

          // Log the usage after successful response
          await logUsage(decodedToken.uid, modelId, '/api/chat', totalInputTokens, totalOutputTokens);

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          controller.error(err);
        }
      },
    });

    // Get updated quota after this request
    const updatedQuota = await checkQuota(decodedToken.uid);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Quota-Limit': updatedQuota.limit.toString(),
        'X-Quota-Remaining': updatedQuota.remaining.toString(),
        'X-Quota-Near-Limit': (updatedQuota.nearLimit ? 'true' : 'false'),
        'X-Quota-Percentage': (updatedQuota.percentageUsed || 0).toString(),
      },
    });
  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
