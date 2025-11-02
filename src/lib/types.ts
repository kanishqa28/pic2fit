export interface Garment {
  id: string;
  name: string;
  category: string;
  image_url: string;
  description: string;
  tags: string[];
  created_at: string;
}

export interface TryOnHistory {
  id: string;
  user_image_url: string;
  garment_id: string;
  result_image_url: string | null;
  session_id: string;
  created_at: string;
  garment?: Garment;
}

export interface Favorite {
  id: string;
  session_id: string;
  garment_id: string;
  created_at: string;
  garment?: Garment;
}

export interface Recommendation {
  id: string;
  garment_id: string;
  recommended_garment_id: string;
  score: number;
  created_at: string;
  recommended_garment?: Garment;
}
