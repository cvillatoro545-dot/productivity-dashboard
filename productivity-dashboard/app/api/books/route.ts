import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const saved = searchParams.get("saved");

  // Return saved books from DB
  if (saved === "true") {
    try {
      await initializeDatabase();
      const books = await sql`SELECT * FROM books ORDER BY updated_at DESC`;
      return NextResponse.json(books);
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }
  }

  // Search Open Library
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,cover_i,first_publish_year,edition_count`
    );
    const data = await res.json();

    const results = (data.docs || []).map((book: any) => ({
      ol_key: book.key,
      title: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      cover_id: book.cover_i || null,
      year: book.first_publish_year || null,
      cover_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to search Open Library" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { ol_key, title, author, cover_url, year, status = "want_to_read" } = body;

    const [book] = await sql`
      INSERT INTO books (ol_key, title, author, cover_url, year, status)
      VALUES (${ol_key}, ${title}, ${author}, ${cover_url || null}, ${year || null}, ${status})
      ON CONFLICT (ol_key) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save book" }, { status: 500 });
  }
}
