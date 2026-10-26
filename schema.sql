-- DISCIBRA | schema gerado do banco antigo em 10/25/2026 13:40:06

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "name" text,
  "created_at" text,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admins" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "created_at" text NOT NULL,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "banners" (
  "id" uuid NOT NULL,
  "title" text,
  "subtitle" text,
  "image_url" text NOT NULL,
  "link" text,
  "active" boolean,
  "sort_order" integer,
  "created_at" text,
  CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "image_url" text,
  "active" boolean,
  "sort_order" integer,
  "created_at" text,
  "parent_id" uuid,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid NOT NULL,
  "auth_user_id" uuid,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "cpf" text,
  "phone" text,
  "address_street" text,
  "address_number" text,
  "address_complement" text,
  "address_neighborhood" text,
  "address_city" text,
  "address_state" text,
  "address_zip" text,
  "created_at" text,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name" text NOT NULL,
  "quantity" integer NOT NULL,
  "price" numeric NOT NULL,
  "created_at" text,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid NOT NULL,
  "code" text NOT NULL,
  "email" text,
  "status" text NOT NULL,
  "total" numeric NOT NULL,
  "items" jsonb NOT NULL,
  "items_summary" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "price" numeric NOT NULL,
  "original_price" numeric,
  "category_id" uuid,
  "subcategory_id" uuid,
  "image_url" text,
  "images" jsonb,
  "unit" text,
  "stock" integer,
  "active" boolean,
  "featured" boolean,
  "created_at" text,
  "sku" text,
  "weight" numeric,
  "height" numeric,
  "width" numeric,
  "depth" numeric,
  "is_new" boolean,
  "is_discount" boolean,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid NOT NULL,
  "name" text,
  "phone" text,
  "role" text,
  "created_at" text,
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "customer_id" uuid,
  "customer_name" text,
  "rating" integer NOT NULL,
  "comment" text,
  "approved" boolean,
  "created_at" text,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" text NOT NULL,
  "logo_url" text,
  "favicon_url" text,
  "chat_header_url" text,
  "banner_images" jsonb NOT NULL,
  "institutional_title" text,
  "institutional_body" text,
  "testimonials" jsonb NOT NULL,
  "updated_at" text NOT NULL,
  "gtm_id" text,
  "ga4_id" text,
  "google_site_verification" text,
  "google_ads_id" text,
  "google_ads_conversion_label" text,
  "business_name" text,
  "business_address" text,
  "business_phone" text,
  "business_hours" text,
  "business_maps_url" text,
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subcategories" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "category_id" uuid NOT NULL,
  "active" boolean,
  "sort_order" integer,
  "created_at" text,
  CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "city" text,
  "state" text,
  "comment" text NOT NULL,
  "rating" integer,
  "active" boolean,
  "sort_order" integer,
  "created_at" text,
  CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "phone" text,
  "cpf" text,
  "created_at" text,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_clicks" (
  "id" uuid NOT NULL,
  "whatsapp_number_id" uuid,
  "source" text NOT NULL,
  "device" text,
  "browser" text,
  "os" text,
  "created_at" text,
  "user_id" uuid,
  "page" text,
  "device_type" text,
  CONSTRAINT "whatsapp_clicks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_numbers" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "sort_order" integer,
  "active" boolean,
  "order_count" integer,
  "last_order_at" text,
  "created_at" text,
  CONSTRAINT "whatsapp_numbers_pkey" PRIMARY KEY ("id")
);


