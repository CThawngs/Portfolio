// ── Helper: concatenate ALL rich-text segments into a single string ──────────
// Notion splits long or formatted text across multiple segments in the array.
// Reading only [0] silently drops everything after the first segment —
// that was the root cause of descriptions not matching what's in Notion CMS.
function richText(field) {
  if (!field || !Array.isArray(field)) return "";
  return field.map((s) => s.plain_text ?? "").join("");
}

export async function getPublishedPortfolio() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  const apiKey = process.env.NOTION_API_KEY;

  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID is not set in env variables');
  }
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in env variables');
  }

  const items = [];
  let hasMore = true;
  let nextCursor = undefined;

  while (hasMore) {
    const body = {
      filter: {
        property: 'Status',
        status: { equals: 'Published' },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      ...(nextCursor ? { start_cursor: nextCursor } : {}),
    };

    // Notion API call with no-store to always fetch fresh data
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Notion API query failed: ${res.status} ${errorText}`);
    }

    const response = await res.json();

    const mapped = response.results.map((page) => {
      const properties = page.properties ?? {};
      return {
        id:       page.id,
        status:   properties['Status']?.status?.name ?? "",
        // Use richText() on title arrays too — titles can also have multiple segments
        title_vn: richText(properties['Title (VN)']?.title)       || "Untitled",
        title_en: richText(properties['Title (EN)']?.rich_text)   || "Untitled",
        // KEY FIX: join ALL rich_text segments, not just [0]
        desc_vn:  richText(properties['Description (VN)']?.rich_text),
        desc_en:  richText(properties['Description (EN)']?.rich_text),
        category: properties['Category']?.select?.name ?? "Uncategorized",
        tags:     properties['Tags']?.multi_select?.map(t => t.name) ?? [],
        images:   properties['Images']?.files?.map(f => f.file?.url || f.external?.url) ?? [],
        links:    properties['Links']?.url ?? "",
        last_edited_time: properties['Last edited time']?.last_edited_time ?? page.last_edited_time,
        project_date: (properties['Date'] && properties['Date'].date) ? {
          start: properties['Date'].date.start || null,
          end:   properties['Date'].date.end   || null
        } : null
      };
    });

    items.push(...mapped);

    hasMore     = response.has_more;
    nextCursor  = response.next_cursor ?? undefined;
  }

  return items;
}

export async function getProfileData() {
  const databaseId = process.env.NOTION_PROFILE_DATABASE_ID;
  const apiKey = process.env.NOTION_API_KEY;

  if (!databaseId) {
    return null;
  }
  if (!apiKey) {
    throw new Error('NOTION_API_KEY is not set in env variables');
  }

  const body = {
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 1,
  };

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error(`Notion API profile query failed: ${res.status}`);
    return null;
  }

  const response = await res.json();
  if (!response.results || response.results.length === 0) {
    return null;
  }

  const page       = response.results[0];
  const properties = page.properties ?? {};

  return {
    name_vn:   richText(properties['Name (VN)']?.title)     || "Untitled",
    name_en:   richText(properties['Name (EN)']?.rich_text) || "Untitled",
    role_vn:   richText(properties['Role (VN)']?.rich_text),
    role_en:   richText(properties['Role (EN)']?.rich_text),
    bio_vn:    richText(properties['Bio (VN)']?.rich_text),
    bio_en:    richText(properties['Bio (EN)']?.rich_text),
    dob:       properties['Dob']?.date?.start
               ?? properties['DOB']?.date?.start
               ?? properties['Date of Birth']?.date?.start
               ?? null,
    email:     properties['Email']?.email     ?? "",
    github:    properties['Github']?.url      ?? properties['GitHub']?.url    ?? "",
    linkedin:  properties['Linkedin']?.url    ?? properties['LinkedIn']?.url  ?? "",
    instagram: properties['Instagram']?.url   ?? ""
  };
}
