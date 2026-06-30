import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return NextResponse.json(
      { error: 'TMDb API Key not configured. Please add TMDB_API_KEY to your .env.local file.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');

  const query = new URLSearchParams(searchParams);
  query.set('api_key', apiKey);
  query.set('include_adult', 'false');

  const url = `https://api.themoviedb.org/3/${path}?${query.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 } // Cache results for 1 hour
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.status_message || `TMDb API returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
