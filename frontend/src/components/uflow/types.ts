export interface VideoItem {
  id: number;
  slug: string;
  filename: string;
  uploaded_by: string;
  title: string;
  uploaded_at: string;
  views: number;
  likes: number;
  is_liked: boolean;
  url: string;
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
