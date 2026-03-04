-- =========================================================
-- CLARIFICA - Script de configuración para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

-- ── 1) Funciones helper ──

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.uid()
RETURNS BIGINT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub';
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 2) Tablas de autenticación ──

CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'clarifica_user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refresh_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL,
    session_id BIGINT NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_refresh_tokens_updated_at
  BEFORE UPDATE ON public.refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_passcode (
    id BIGSERIAL PRIMARY KEY,
    passcode VARCHAR(255) NOT NULL,
    passcode_type VARCHAR(255) NOT NULL DEFAULT 'EMAIL',
    pass_object VARCHAR(255) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 minutes'),
    retry_count INT NOT NULL DEFAULT 0,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER user_passcode_updated_at_trg
  BEFORE UPDATE ON public.user_passcode
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pass_object ON public.user_passcode(pass_object);

-- ── 3) Tablas de la aplicación ──

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('homeowner', 'contractor', 'builder')),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.material_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.materials (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_of_measurement VARCHAR(50) NOT NULL,
    thumbnail_url TEXT,
    technical_specs JSONB,
    common_uses TEXT,
    usage_recommendations TEXT,
    average_price_per_unit DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.related_materials (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL,
    related_material_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'complementary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, related_material_id)
);

CREATE TABLE IF NOT EXISTS public.product_stores (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL,
    material_id BIGINT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    product_url TEXT NOT NULL,
    sku VARCHAR(100),
    availability_status VARCHAR(50) DEFAULT 'in_stock',
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    description TEXT,
    dimensions JSONB,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.project_materials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    custom_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ai_estimates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    calculation_explanation TEXT,
    total_estimated_cost DECIMAL(10, 2),
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.estimate_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    estimate_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    estimated_quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.product_comparisons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) DEFAULT 'Mi comparación',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.comparison_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    comparison_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comparison_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.saved_materials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, material_id)
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 4) RLS para tablas de usuario ──

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Política permisiva para anon/authenticated en tablas públicas (materiales, productos, tiendas)
-- Estas tablas NO tienen RLS porque son catálogo público

-- RLS para tablas de usuario: permitir acceso a sus propios datos
CREATE POLICY user_profiles_all ON public.user_profiles FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY projects_all ON public.projects FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY project_materials_all ON public.project_materials FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY ai_estimates_all ON public.ai_estimates FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY estimate_items_all ON public.estimate_items FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY product_comparisons_all ON public.product_comparisons FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY comparison_items_all ON public.comparison_items FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY saved_materials_all ON public.saved_materials FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());
CREATE POLICY activity_log_all ON public.activity_log FOR ALL USING (user_id = uid()) WITH CHECK (user_id = uid());

-- RLS para auth tables: acceso desde service role (backend)
CREATE POLICY users_service ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY sessions_service ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY refresh_tokens_service ON public.refresh_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY user_passcode_service ON public.user_passcode FOR ALL USING (true) WITH CHECK (true);

-- ── 5) Índices de rendimiento ──

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_material_categories_parent_id ON public.material_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON public.materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_name ON public.materials(name);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_material_id ON public.products(material_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- ── 6) Datos iniciales: categorías y materiales de ejemplo ──

INSERT INTO public.material_categories (name, description, parent_id, icon_url, display_order) VALUES
('Madera', 'Todos los tipos de madera para construcción', NULL, NULL, 1),
('Concreto y Mampostería', 'Cemento, bloques, mortero y agregados', NULL, NULL, 2),
('Techos', 'Láminas, tejas y accesorios para techo', NULL, NULL, 3),
('Aislamiento', 'Materiales de aislamiento térmico y acústico', NULL, NULL, 4),
('Tablaroca', 'Paneles de yeso y acabados', NULL, NULL, 5),
('Pisos', 'Losetas, madera, porcelanato y más', NULL, NULL, 6),
('Eléctrico', 'Cables, contactos, interruptores y componentes', NULL, NULL, 7),
('Plomería', 'Tubería, conexiones y accesorios de plomería', NULL, NULL, 8),
('Pintura y Acabados', 'Pinturas, selladores, barnices e impermeabilizantes', NULL, NULL, 9),
('Herramientas y Fijación', 'Tornillos, clavos, taquetes y herramientas', NULL, NULL, 10);

INSERT INTO public.product_stores (name, logo_url, website_url) VALUES
('Home Depot', NULL, 'https://www.homedepot.com.mx'),
('Mercado Libre', NULL, 'https://www.mercadolibre.com.mx'),
('Amazon', NULL, 'https://www.amazon.com.mx'),
('Coppel', NULL, 'https://www.coppel.com');
