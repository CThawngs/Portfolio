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

    // Notion API call with revalidate / caching config
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store', // force fresh data
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Notion API query failed: ${res.status} ${errorText}`);
    }

    const response = await res.json();

    const mapped = response.results.map((page) => {
      const properties = page.properties ?? {};
      return {
        id: page.id,
        title_vn: properties['Title (VN)']?.title[0]?.plain_text ?? "Untitled",
        title_en: properties['Title (EN)']?.rich_text[0]?.plain_text ?? "Untitled",
        desc_vn: properties['Description (VN)']?.rich_text[0]?.plain_text ?? "",
        desc_en: properties['Description (EN)']?.rich_text[0]?.plain_text ?? "",
        category: properties['Category']?.select?.name ?? "Uncategorized",
        tags: properties['Tags']?.multi_select?.map(t => t.name) ?? [],
        images: properties['Images']?.files?.map(f => f.file?.url || f.external?.url) ?? [],
        links: properties['Links']?.url ?? "",
        last_edited_time: properties['Last edited time']?.last_edited_time ?? page.last_edited_time,
        project_date: (properties['Date'] && properties['Date'].date) ? { 
          start: properties['Date'].date.start || null, 
          end: properties['Date'].date.end || null 
        } : null
      };
    });

    items.push(...mapped);

    hasMore = response.has_more;
    nextCursor = response.next_cursor ?? undefined;
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
    cache: 'no-store', // force fresh data
  });

  if (!res.ok) {
    console.error(`Notion API profile query failed: ${res.status}`);
    return null;
  }

  const response = await res.json();
  if (!response.results || response.results.length === 0) {
    return null;
  }

  const page = response.results[0];
  const properties = page.properties ?? {};

  return {
    name_vn: properties['Name (VN)']?.title[0]?.plain_text ?? "Untitled",
    name_en: properties['Name (EN)']?.rich_text[0]?.plain_text ?? "Untitled",
    role_vn: properties['Role (VN)']?.rich_text[0]?.plain_text ?? "",
    role_en: properties['Role (EN)']?.rich_text[0]?.plain_text ?? "",
    bio_vn: properties['Bio (VN)']?.rich_text[0]?.plain_text ?? "",
    bio_en: properties['Bio (EN)']?.rich_text[0]?.plain_text ?? "",
    dob: properties['Dob']?.date?.start ?? properties['DOB']?.date?.start ?? properties['Date of Birth']?.date?.start ?? null,
    email: properties['Email']?.email ?? "",
    github: properties['Github']?.url ?? properties['GitHub']?.url ?? "",
    linkedin: properties['Linkedin']?.url ?? properties['LinkedIn']?.url ?? "",
    instagram: properties['Instagram']?.url ?? ""
  };
}
