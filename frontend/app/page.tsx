export const dynamic = 'force-dynamic';

import PortfolioUI, { Project } from "./PortfolioUI";
import { getPublishedPortfolio, getProfileData } from "@/lib/notion";

// Force dynamic rendering to always fetch the freshest data from Notion CMS
export const revalidate = 0;

export default async function HomePage() {
  let projects: Project[] = [];
  let profileData = null;
  
  try {
    const [data, profile] = await Promise.all([
      getPublishedPortfolio(),
      getProfileData()
    ]);
    projects = data.map((item: any) => ({
      id: item.id,
      title_vn: item.title_vn || "",
      title_en: item.title_en || "",
      desc_vn: item.desc_vn || "",
      desc_en: item.desc_en || "",
      category: item.category || "",
      links: item.links || "",
      images: Array.isArray(item.images) ? item.images : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      project_date: item.project_date || null,
    }));
    profileData = profile;
  } catch (error) {
    console.error("Failed to fetch published portfolio items from Notion:", error);
  }

  return <PortfolioUI projects={projects} profileData={profileData} />;
}
