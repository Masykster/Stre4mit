import { NextResponse } from 'next/server';
import { romanizeText } from '@/app/lib/romanize';

export async function POST(request) {
  try {
    const body = await request.json();
    const texts = Array.isArray(body?.texts) ? body.texts : [];

    const results = texts.slice(0, 100).map((t) =>
      typeof t === 'string' ? romanizeText(t, { titleCase: true }) : ''
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
