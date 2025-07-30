
import { Database } from './services/database.types';

// Deriving types from Supabase schema to ensure consistency (snake_case)
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type Sucursal = Database['public']['Tables']['sucursales']['Row'];
export type BranchStock = Database['public']['Tables']['branch_stock']['Row'];
export type EcommerceIntegration = Database['public']['Tables']['ecommerce_integrations']['Row'];
export type EcommerceOrder = Database['public']['Tables']['ecommerce_orders']['Row'];
export type EcommerceOrderStatus = Database['public']['Tables']['ecommerce_orders']['Row']['status'];
export type IntegrationPlatform = Database['public']['Enums']['integration_platforms'];


export type ProductUpdate = Database['public']['Tables']['products']['Update'];


// Since config is JSONB, we define its structure explicitly with snake_case
export interface Config {
  base_currency: 'ARS' | 'USD';
  active_plan: 'Emprendedor' | 'Comercios' | 'Pymes';
  business_name?: string;
  business_address?: string;
  business_phone?: string;
}

// UserProfile combines auth user info with the DB profile row
// and includes nested Role information. It's meant for the logged-in user.
export type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  email: string;
  role: Role | null;
};

// SystemUser is for listing all users in the system, where email is not available from the profiles table.
export type SystemUser = Database['public']['Tables']['profiles']['Row'] & {
  role: Role | null;
};

// SaleItem is also a JSONB type, so we define it here with snake_case
export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Overwrite the types for JSONB columns in SaleDocument for strong typing
export type SaleDocument = Database['public']['Tables']['documents']['Row'] & {
    customer: Customer | { id: 'cf'; name: 'Consumidor Final' };
    items: SaleItem[];
};

// Types for E-commerce Integrations
export interface ApiCredentials {
  api_key?: string;
  api_secret?: string;
  store_url?: string;
  access_token?: string;
}

export interface SyncConfig {
  stock_source: 'global' | 'branch';
  branch_id: string | null;
  sync_prices: boolean;
}

export interface SimulatedOrderLineItem {
  product_id: string;
  quantity: number;
}

// Type for logging synchronization events
export interface SyncLog {
    id: string;
    timestamp: string;
    direction: 'pwa_to_ecom' | 'ecom_to_pwa';
    platform: IntegrationPlatform | 'Sistema';
    product_sku?: string;
    status: 'success' | 'error';
    message: string;
}


export type Currency = 'ARS' | 'USD';
export type PaymentMethod =
  | 'Efectivo'
  | 'Tarjeta de débito'
  | 'Tarjeta de crédito'
  | 'Transferencia bancaria'
  | 'Cuenta corriente'
  | 'Cheque físico'
  | 'E-check'
  | 'A crédito / financiación'
  | 'E-commerce'
  | 'Pago combinado';

export type DocumentType = 'Factura' | 'Presupuesto' | 'Reserva';
export type DocumentStatus = 'Pagada' | 'Pendiente de pago' | 'Parcialmente pagada';
export type PlanName = 'Emprendedor' | 'Comercios' | 'Pymes';

export interface Plan {
  name: PlanName;
  price: string;
  target: string;
  features: string[];
  color: string;
  integrations?: string[];
}