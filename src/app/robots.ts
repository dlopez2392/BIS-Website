import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/business';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${BASE}/sitemap.xml` };
}
