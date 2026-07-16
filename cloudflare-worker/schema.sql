PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'POS Philippines',
  tagline TEXT DEFAULT 'Your Business. Our Solutions.',
  hero_title TEXT DEFAULT 'Complete POS Solutions for Every Business',
  hero_subtitle TEXT DEFAULT 'POS Systems, CCTV, Biometrics, Solar and more. Quality products, affordable prices, and reliable after-sales support.',
  email TEXT DEFAULT 'posphils@gmail.com',
  phone TEXT DEFAULT '09363280696',
  facebook_name TEXT DEFAULT 'POS Philippines',
  facebook_url TEXT DEFAULT '',
  address TEXT DEFAULT 'Serving businesses nationwide in the Philippines',
  logo_url TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order, name);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category_id, display_order, name);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  brand_id TEXT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY(brand_id) REFERENCES brands(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, brand_id, is_available);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  inclusions_json TEXT NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packages_order ON packages(display_order, name);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  tracking TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category_id TEXT,
  brand_id TEXT,
  product_id TEXT,
  sales_representative TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New Inquiry',
  public_note TEXT DEFAULT 'Your inquiry was received and is waiting for review.',
  internal_note TEXT DEFAULT '',
  followup_date TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY(brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inquiries_tracking ON inquiries(tracking);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS inquiry_history (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_history_inquiry ON inquiry_history(inquiry_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  tracking TEXT NOT NULL,
  name TEXT NOT NULL,
  business TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id, expires_at);
