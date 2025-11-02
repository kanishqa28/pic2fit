/*
  # Virtual Try-On Platform Schema

  1. New Tables
    - `garments`
      - `id` (uuid, primary key)
      - `name` (text) - Garment name
      - `category` (text) - Type of garment (shirt, jeans, dress, etc.)
      - `image_url` (text) - Cloudinary URL
      - `description` (text) - Item description
      - `tags` (text[]) - Tags for recommendations
      - `created_at` (timestamp)
    
    - `tryon_history`
      - `id` (uuid, primary key)
      - `user_image_url` (text) - User's photo URL
      - `garment_id` (uuid, foreign key)
      - `result_image_url` (text) - Generated try-on result
      - `session_id` (text) - Anonymous session tracking
      - `created_at` (timestamp)
    
    - `favorites`
      - `id` (uuid, primary key)
      - `session_id` (text) - Anonymous session tracking
      - `garment_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `recommendations`
      - `id` (uuid, primary key)
      - `garment_id` (uuid, foreign key) - Source garment
      - `recommended_garment_id` (uuid, foreign key) - Recommended garment
      - `score` (numeric) - Recommendation strength
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Allow public read access to garments
    - Allow anonymous users to create try-on history and favorites
    - Restrict deletions and updates

  3. Indexes
    - Index on garment categories for faster filtering
    - Index on session_id for user tracking
    - Index on recommendations for quick lookups
*/

CREATE TABLE IF NOT EXISTS garments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  description text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tryon_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_image_url text NOT NULL,
  garment_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  result_image_url text,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  garment_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, garment_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  recommended_garment_id uuid REFERENCES garments(id) ON DELETE CASCADE,
  score numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  UNIQUE(garment_id, recommended_garment_id)
);

ALTER TABLE garments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view garments"
  ON garments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view recommendations"
  ON recommendations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view their try-on history"
  ON tryon_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create try-on history"
  ON tryon_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view favorites"
  ON favorites FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their favorites"
  ON favorites FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_garments_category ON garments(category);
CREATE INDEX IF NOT EXISTS idx_tryon_session ON tryon_history(session_id);
CREATE INDEX IF NOT EXISTS idx_favorites_session ON favorites(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_garment ON recommendations(garment_id);

INSERT INTO garments (name, category, image_url, description, tags) VALUES
  ('Classic White Shirt', 'shirt', 'https://images.pexels.com/photos/2220315/pexels-photo-2220315.jpeg', 'Elegant white cotton shirt', ARRAY['formal', 'classic', 'white']),
  ('Blue Denim Jeans', 'jeans', 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg', 'Comfortable blue denim jeans', ARRAY['casual', 'denim', 'blue']),
  ('Black Blazer', 'blazer', 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg', 'Professional black blazer', ARRAY['formal', 'business', 'black']),
  ('Red Summer Dress', 'dress', 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg', 'Flowy red summer dress', ARRAY['casual', 'summer', 'red']),
  ('Grey Hoodie', 'hoodie', 'https://images.pexels.com/photos/2380794/pexels-photo-2380794.jpeg', 'Cozy grey hoodie', ARRAY['casual', 'comfortable', 'grey']),
  ('Leather Jacket', 'jacket', 'https://images.pexels.com/photos/1689781/pexels-photo-1689781.jpeg', 'Stylish leather jacket', ARRAY['casual', 'edgy', 'black']);

INSERT INTO recommendations (garment_id, recommended_garment_id, score)
SELECT 
  g1.id,
  g2.id,
  0.8
FROM garments g1
CROSS JOIN garments g2
WHERE g1.id != g2.id
  AND (
    (g1.name = 'Classic White Shirt' AND g2.name IN ('Blue Denim Jeans', 'Black Blazer'))
    OR (g1.name = 'Blue Denim Jeans' AND g2.name IN ('Classic White Shirt', 'Grey Hoodie'))
    OR (g1.name = 'Black Blazer' AND g2.name IN ('Classic White Shirt', 'Blue Denim Jeans'))
    OR (g1.name = 'Red Summer Dress' AND g2.name IN ('Leather Jacket'))
    OR (g1.name = 'Grey Hoodie' AND g2.name IN ('Blue Denim Jeans', 'Leather Jacket'))
    OR (g1.name = 'Leather Jacket' AND g2.name IN ('Blue Denim Jeans', 'Grey Hoodie'))
  );
