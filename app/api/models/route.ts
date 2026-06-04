import { NextResponse } from 'next/server';

const MODELS = {
  sonnet: {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6 (Fast)',
  },
  opus: {
    id: 'claude-opus-4-7',
    label: 'Claude Opus 4.7 (Most Intelligent)',
  },
};

const DEFAULT_MODEL = 'opus';

export async function GET() {
  return NextResponse.json({ models: MODELS, default: DEFAULT_MODEL });
}
