-- Script simplificado para agregar campos a products
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Agregar nuevos campos a la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID,
ADD COLUMN IF NOT EXISTS subcategory_id UUID,
ADD COLUMN IF NOT EXISTS supplier_id UUID,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- 2. Agregar las claves foráneas después (para evitar errores si las tablas no existen)
-- ALTER TABLE public.products ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id);
-- ALTER TABLE public.products ADD CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);
-- ALTER TABLE public.products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

-- 3. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);