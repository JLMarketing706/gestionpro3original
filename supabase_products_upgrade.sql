-- Script para agregar nuevos campos al formulario de productos
-- Estos campos mejorarán la funcionalidad para e-commerce

-- 1. Agregar campos a la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN public.products.brand_id IS 'Referencia a la marca del producto';
COMMENT ON COLUMN public.products.subcategory_id IS 'Referencia a la subcategoría del producto';
COMMENT ON COLUMN public.products.supplier_id IS 'Referencia al proveedor del producto';
COMMENT ON COLUMN public.products.long_description IS 'Descripción detallada para e-commerce';
COMMENT ON COLUMN public.products.barcode IS 'Código de barras del producto';

-- 4. Actualizar políticas RLS si es necesario (mantener las existentes)
-- Las políticas existentes deberían seguir funcionando ya que agregamos campos opcionales

-- 5. Datos de ejemplo para testing (opcional)
-- Insertar algunas marcas de ejemplo si no existen
INSERT INTO public.brands (id, name) VALUES 
  (gen_random_uuid(), 'Sin marca'),
  (gen_random_uuid(), 'Coca Cola'),
  (gen_random_uuid(), 'Samsung'),
  (gen_random_uuid(), 'Apple'),
  (gen_random_uuid(), 'Pepsi'),
  (gen_random_uuid(), 'LG'),
  (gen_random_uuid(), 'Nestlé')
ON CONFLICT (name) DO NOTHING;

-- Insertar algunas subcategorías de ejemplo si no existen
-- Primero necesitamos IDs de categorías existentes
DO $$
DECLARE
    cat_alimentos UUID;
    cat_bebidas UUID;
    cat_tecnologia UUID;
    cat_limpieza UUID;
BEGIN
    -- Obtener o crear categorías
    INSERT INTO public.categories (id, name) VALUES 
        (gen_random_uuid(), 'Alimentos'),
        (gen_random_uuid(), 'Bebidas'),
        (gen_random_uuid(), 'Tecnología'),
        (gen_random_uuid(), 'Limpieza')
    ON CONFLICT (name) DO NOTHING;
    
    -- Obtener IDs de categorías
    SELECT id INTO cat_alimentos FROM public.categories WHERE name = 'Alimentos' LIMIT 1;
    SELECT id INTO cat_bebidas FROM public.categories WHERE name = 'Bebidas' LIMIT 1;
    SELECT id INTO cat_tecnologia FROM public.categories WHERE name = 'Tecnología' LIMIT 1;
    SELECT id INTO cat_limpieza FROM public.categories WHERE name = 'Limpieza' LIMIT 1;
    
    -- Insertar subcategorías
    IF cat_alimentos IS NOT NULL THEN
        INSERT INTO public.subcategories (id, name, category_id) VALUES 
            (gen_random_uuid(), 'Lácteos', cat_alimentos),
            (gen_random_uuid(), 'Carnes', cat_alimentos),
            (gen_random_uuid(), 'Frutas', cat_alimentos),
            (gen_random_uuid(), 'Verduras', cat_alimentos)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;
    
    IF cat_bebidas IS NOT NULL THEN
        INSERT INTO public.subcategories (id, name, category_id) VALUES 
            (gen_random_uuid(), 'Gaseosas', cat_bebidas),
            (gen_random_uuid(), 'Jugos', cat_bebidas),
            (gen_random_uuid(), 'Agua', cat_bebidas)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;
    
    IF cat_tecnologia IS NOT NULL THEN
        INSERT INTO public.subcategories (id, name, category_id) VALUES 
            (gen_random_uuid(), 'Smartphones', cat_tecnologia),
            (gen_random_uuid(), 'Laptops', cat_tecnologia),
            (gen_random_uuid(), 'Accesorios', cat_tecnologia)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;
    
    IF cat_limpieza IS NOT NULL THEN
        INSERT INTO public.subcategories (id, name, category_id) VALUES 
            (gen_random_uuid(), 'Detergentes', cat_limpieza),
            (gen_random_uuid(), 'Desinfectantes', cat_limpieza)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;
END $$;