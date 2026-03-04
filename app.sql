
-- User profiles extension table
CREATE TABLE user_profiles (
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

-- Create default profile for admin user (user_id=1)
INSERT INTO user_profiles (user_id, name, user_type) VALUES (1, 'Admin', 'contractor');

-- Material categories table (site-wide shared, no RLS needed)
CREATE TABLE material_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials library table (site-wide shared, no RLS needed)
CREATE TABLE materials (
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

-- Related materials table (site-wide shared, no RLS needed)
CREATE TABLE related_materials (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL,
    related_material_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'complementary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, related_material_id)
);

-- Product stores table (site-wide shared, no RLS needed)
CREATE TABLE product_stores (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    api_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table (site-wide shared, no RLS needed)
CREATE TABLE products (
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

-- Projects table
CREATE TABLE projects (
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

-- Project materials table
CREATE TABLE project_materials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    custom_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI estimates table
CREATE TABLE ai_estimates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    calculation_explanation TEXT,
    total_estimated_cost DECIMAL(10, 2),
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estimate items table
CREATE TABLE estimate_items (
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

-- Product comparisons table
CREATE TABLE product_comparisons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) DEFAULT 'My Comparison',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comparison items table
CREATE TABLE comparison_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    comparison_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comparison_id, product_id)
);

-- Saved materials table
CREATE TABLE saved_materials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, material_id)
);

-- Activity log table
CREATE TABLE activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for user-related tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
    FOR SELECT USING (user_id = uid());

CREATE POLICY user_profiles_insert_policy ON user_profiles
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY user_profiles_update_policy ON user_profiles
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY user_profiles_delete_policy ON user_profiles
    FOR DELETE USING (user_id = uid());

-- RLS policies for projects
CREATE POLICY projects_select_policy ON projects
    FOR SELECT USING (user_id = uid());

CREATE POLICY projects_insert_policy ON projects
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY projects_update_policy ON projects
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY projects_delete_policy ON projects
    FOR DELETE USING (user_id = uid());

-- RLS policies for project_materials
CREATE POLICY project_materials_select_policy ON project_materials
    FOR SELECT USING (user_id = uid());

CREATE POLICY project_materials_insert_policy ON project_materials
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY project_materials_update_policy ON project_materials
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY project_materials_delete_policy ON project_materials
    FOR DELETE USING (user_id = uid());

-- RLS policies for ai_estimates
CREATE POLICY ai_estimates_select_policy ON ai_estimates
    FOR SELECT USING (user_id = uid());

CREATE POLICY ai_estimates_insert_policy ON ai_estimates
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY ai_estimates_update_policy ON ai_estimates
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY ai_estimates_delete_policy ON ai_estimates
    FOR DELETE USING (user_id = uid());

-- RLS policies for estimate_items
CREATE POLICY estimate_items_select_policy ON estimate_items
    FOR SELECT USING (user_id = uid());

CREATE POLICY estimate_items_insert_policy ON estimate_items
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY estimate_items_update_policy ON estimate_items
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY estimate_items_delete_policy ON estimate_items
    FOR DELETE USING (user_id = uid());

-- RLS policies for product_comparisons
CREATE POLICY product_comparisons_select_policy ON product_comparisons
    FOR SELECT USING (user_id = uid());

CREATE POLICY product_comparisons_insert_policy ON product_comparisons
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY product_comparisons_update_policy ON product_comparisons
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY product_comparisons_delete_policy ON product_comparisons
    FOR DELETE USING (user_id = uid());

-- RLS policies for comparison_items
CREATE POLICY comparison_items_select_policy ON comparison_items
    FOR SELECT USING (user_id = uid());

CREATE POLICY comparison_items_insert_policy ON comparison_items
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY comparison_items_update_policy ON comparison_items
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY comparison_items_delete_policy ON comparison_items
    FOR DELETE USING (user_id = uid());

-- RLS policies for saved_materials
CREATE POLICY saved_materials_select_policy ON saved_materials
    FOR SELECT USING (user_id = uid());

CREATE POLICY saved_materials_insert_policy ON saved_materials
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY saved_materials_update_policy ON saved_materials
    FOR UPDATE USING (user_id = uid()) WITH CHECK (user_id = uid());

CREATE POLICY saved_materials_delete_policy ON saved_materials
    FOR DELETE USING (user_id = uid());

-- RLS policies for activity_log
CREATE POLICY activity_log_select_policy ON activity_log
    FOR SELECT USING (user_id = uid());

CREATE POLICY activity_log_insert_policy ON activity_log
    FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY activity_log_delete_policy ON activity_log
    FOR DELETE USING (user_id = uid());

-- Create indexes for performance optimization
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_material_categories_parent_id ON material_categories(parent_id);
CREATE INDEX idx_materials_category_id ON materials(category_id);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_related_materials_material_id ON related_materials(material_id);
CREATE INDEX idx_related_materials_related_material_id ON related_materials(related_material_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_material_id ON products(material_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_materials_user_id ON project_materials(user_id);
CREATE INDEX idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX idx_project_materials_material_id ON project_materials(material_id);
CREATE INDEX idx_ai_estimates_user_id ON ai_estimates(user_id);
CREATE INDEX idx_ai_estimates_project_id ON ai_estimates(project_id);
CREATE INDEX idx_estimate_items_user_id ON estimate_items(user_id);
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_material_id ON estimate_items(material_id);
CREATE INDEX idx_product_comparisons_user_id ON product_comparisons(user_id);
CREATE INDEX idx_comparison_items_user_id ON comparison_items(user_id);
CREATE INDEX idx_comparison_items_comparison_id ON comparison_items(comparison_id);
CREATE INDEX idx_comparison_items_product_id ON comparison_items(product_id);
CREATE INDEX idx_saved_materials_user_id ON saved_materials(user_id);
CREATE INDEX idx_saved_materials_material_id ON saved_materials(material_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Insert sample data for material categories
INSERT INTO material_categories (name, description, parent_id, icon_url, display_order) VALUES
('Lumber & Wood', 'All types of wood materials for construction', NULL, 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=200', 1),
('Concrete & Masonry', 'Concrete, cement, blocks, and masonry supplies', NULL, 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=200', 2),
('Roofing Materials', 'Shingles, tiles, and roofing accessories', NULL, 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=200', 3),
('Insulation', 'Thermal and sound insulation materials', NULL, 'https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg?auto=compress&cs=tinysrgb&w=200', 4),
('Drywall & Plaster', 'Drywall sheets, plaster, and finishing materials', NULL, 'https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=200', 5),
('Flooring', 'Hardwood, tile, carpet, and other flooring options', NULL, 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=200', 6),
('Electrical', 'Wiring, outlets, switches, and electrical components', NULL, 'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=200', 7),
('Plumbing', 'Pipes, fittings, fixtures, and plumbing supplies', NULL, 'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=200', 8),
('Paint & Finishes', 'Interior and exterior paints, stains, and sealers', NULL, 'https://images.pexels.com/photos/1669754/pexels-photo-1669754.jpeg?auto=compress&cs=tinysrgb&w=200', 9),
('Hardware & Fasteners', 'Nails, screws, bolts, and construction hardware', NULL, 'https://images.pexels.com/photos/209235/pexels-photo-209235.jpeg?auto=compress&cs=tinysrgb&w=200', 10);

-- Insert subcategories
INSERT INTO material_categories (name, description, parent_id, display_order) VALUES
('Dimensional Lumber', '2x4, 2x6, 2x8 and other standard sizes', 1, 1),
('Plywood & Panels', 'Plywood sheets, OSB, and panel products', 1, 2),
('Hardwood', 'Oak, maple, cherry, and other hardwoods', 1, 3),
('Ready-Mix Concrete', 'Pre-mixed concrete for various applications', 2, 1),
('Cement & Mortar', 'Portland cement, mortar mix, and grout', 2, 2),
('Concrete Blocks', 'CMU blocks, cinder blocks, and pavers', 2, 3);

-- Insert sample materials
INSERT INTO materials (category_id, name, description, unit_of_measurement, thumbnail_url, technical_specs, common_uses, usage_recommendations, average_price_per_unit) VALUES
(11, '2x4x8 Pressure Treated Lumber', 'Pressure-treated pine lumber, ideal for outdoor construction', 'piece', 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=400', '{"dimensions": "1.5\" x 3.5\" x 8''", "species": "Southern Yellow Pine", "treatment": "Ground Contact", "moisture_content": "19%"}', 'Deck framing, fence posts, outdoor structures', 'Allow to dry before painting. Use corrosion-resistant fasteners. Not for interior use.', 8.50),
(11, '2x6x10 Kiln Dried Lumber', 'Kiln-dried dimensional lumber for framing', 'piece', 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=400', '{"dimensions": "1.5\" x 5.5\" x 10''", "species": "Douglas Fir", "grade": "#2 and Better", "moisture_content": "15%"}', 'Wall framing, floor joists, roof rafters', 'Check for warping before installation. Store flat and dry.', 12.75),
(12, '4x8 CDX Plywood 3/4"', 'Construction-grade plywood for sheathing', 'sheet', 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=400', '{"dimensions": "4'' x 8'' x 0.75\"", "grade": "CDX", "core": "Veneer", "exposure": "Exterior"}', 'Roof sheathing, wall sheathing, subfloors', 'Install with grain perpendicular to supports. Leave 1/8" gap for expansion.', 45.00),
(14, 'Ready-Mix Concrete 3000 PSI', 'Standard concrete mix for general construction', 'cubic yard', 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=400', '{"strength": "3000 PSI", "slump": "4-5 inches", "aggregate_size": "3/4 inch", "air_content": "6%"}', 'Foundations, slabs, sidewalks, driveways', 'Pour within 90 minutes of mixing. Cure for minimum 7 days. Protect from freezing.', 125.00),
(15, 'Type I/II Portland Cement', 'General purpose portland cement', '94 lb bag', 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=400', '{"type": "I/II", "weight": "94 lbs", "coverage": "4.5 cubic feet", "compressive_strength": "4000 PSI at 28 days"}', 'Concrete mixing, mortar, grout, stucco', 'Mix with clean water and aggregate. Store in dry location. Use within 6 months.', 12.50),
(16, '8x8x16 Concrete Block', 'Standard concrete masonry unit', 'piece', 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=400', '{"dimensions": "8\" x 8\" x 16\"", "weight": "38 lbs", "compressive_strength": "1900 PSI", "absorption": "13 lbs/ft³"}', 'Foundation walls, retaining walls, structural walls', 'Lay with mortar joints. Reinforce as required by code. Fill cores with grout if needed.', 2.25),
(3, 'Architectural Shingles - Duration', 'Premium laminated asphalt shingles', 'bundle (33.3 sq ft)', 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=400', '{"warranty": "Lifetime Limited", "wind_rating": "130 mph", "fire_rating": "Class A", "weight": "240 lbs per square"}', 'Residential roofing, re-roofing projects', 'Install over proper underlayment. Use 4 nails per shingle. Minimum 4:12 pitch.', 35.00),
(4, 'R-13 Fiberglass Batt Insulation', 'Kraft-faced fiberglass insulation for 2x4 walls', 'roll (75 sq ft)', 'https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg?auto=compress&cs=tinysrgb&w=400', '{"r_value": "R-13", "thickness": "3.5 inches", "width": "15 inches", "length": "93 inches", "facing": "Kraft paper"}', 'Exterior wall insulation, interior partition walls', 'Install with facing toward heated space. Wear protective equipment. Do not compress.', 28.00),
(5, '1/2" Drywall Sheet 4x8', 'Standard gypsum drywall panel', 'sheet', 'https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=400', '{"dimensions": "4'' x 8'' x 0.5\"", "weight": "57 lbs", "edge": "Tapered", "core": "Gypsum"}', 'Interior walls and ceilings', 'Hang perpendicular to framing. Use drywall screws 12" on center. Tape and finish joints.', 12.00),
(6, 'Oak Hardwood Flooring 3/4"', 'Solid red oak hardwood flooring', 'square foot', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400', '{"species": "Red Oak", "thickness": "3/4 inch", "width": "2.25 inches", "grade": "Select", "finish": "Unfinished"}', 'Living rooms, bedrooms, dining rooms', 'Acclimate wood for 7 days. Install over proper subfloor. Leave expansion gaps.', 6.50);

-- Insert sample product stores
INSERT INTO product_stores (name, logo_url, website_url) VALUES
('Home Depot', 'https://images.pexels.com/photos/5691607/pexels-photo-5691607.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://www.homedepot.com'),
('Lowes', 'https://images.pexels.com/photos/5691607/pexels-photo-5691607.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://www.lowes.com'),
('Amazon', 'https://images.pexels.com/photos/5691607/pexels-photo-5691607.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://www.amazon.com'),
('Menards', 'https://images.pexels.com/photos/5691607/pexels-photo-5691607.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://www.menards.com'),
('84 Lumber', 'https://images.pexels.com/photos/5691607/pexels-photo-5691607.jpeg?auto=compress&cs=tinysrgb&w=100', 'https://www.84lumber.com');

-- Insert sample products
INSERT INTO products (store_id, material_id, name, description, price, image_url, product_url, sku, availability_status, rating, review_count) VALUES
(1, 1, 'Pressure-Treated Lumber 2x4x8', 'Ground contact rated pressure treated lumber', 8.47, 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/12345', 'HD-PT-2x4x8', 'in_stock', 4.5, 1250),
(2, 1, '2x4x8 Pressure Treated Pine', 'Above ground pressure treated lumber', 8.98, 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.lowes.com/p/67890', 'LW-PT-2x4x8', 'in_stock', 4.3, 890),
(1, 3, 'CDX Plywood 3/4 in. x 4 ft. x 8 ft.', 'Exterior grade construction plywood', 44.98, 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/23456', 'HD-PLY-CDX-34', 'in_stock', 4.6, 2100),
(2, 3, '3/4" CDX Plywood Sheet', 'Construction grade plywood panel', 46.50, 'https://images.pexels.com/photos/1268551/pexels-photo-1268551.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.lowes.com/p/78901', 'LW-PLY-CDX-34', 'in_stock', 4.4, 1650),
(1, 4, 'Quikrete 3000 PSI Concrete Mix', 'Ready to use concrete mix 80 lb bag', 4.75, 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/34567', 'HD-QK-3000-80', 'in_stock', 4.7, 3200),
(3, 5, 'Quikrete Portland Cement Type I/II', '94 lb bag of portland cement', 13.25, 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.amazon.com/dp/B001234', 'AMZ-QK-PC-94', 'in_stock', 4.5, 780),
(1, 7, 'Owens Corning Duration Shingles', 'Architectural roofing shingles - Estate Gray', 36.98, 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/45678', 'HD-OC-DUR-EG', 'in_stock', 4.8, 4500),
(2, 7, 'Duration Designer Shingles', 'Premium architectural shingles - Onyx Black', 38.50, 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.lowes.com/p/89012', 'LW-OC-DUR-OB', 'in_stock', 4.7, 3800),
(1, 8, 'Owens Corning R-13 Insulation', 'Kraft faced fiberglass batt insulation', 29.97, 'https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/56789', 'HD-OC-R13-KF', 'in_stock', 4.4, 1100),
(1, 9, 'Sheetrock 1/2 in. x 4 ft. x 8 ft.', 'Standard drywall panel', 11.98, 'https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=300', 'https://www.homedepot.com/p/67890', 'HD-USG-DW-12', 'in_stock', 4.6, 5600);

-- Insert related materials
INSERT INTO related_materials (material_id, related_material_id, relationship_type) VALUES
(1, 10, 'commonly_used_together'),
(3, 1, 'commonly_used_together'),
(3, 10, 'commonly_used_together'),
(4, 5, 'alternative'),
(7, 8, 'commonly_used_together'),
(9, 8, 'commonly_used_together');
