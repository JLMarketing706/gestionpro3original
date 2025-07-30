
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      branch_stock: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          min_stock: number
          product_id: string
          sale_price: number
          stock: number
          sucursal_id: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          min_stock?: number
          product_id: string
          sale_price: number
          stock?: number
          sucursal_id: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          min_stock?: number
          product_id?: string
          sale_price?: number
          stock?: number
          sucursal_id?: string
        }
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          cuit: string | null
          email: string
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
      }
      documents: {
        Row: {
          created_at: string
          customer: Json
          exchange_rate: number | null
          id: string
          items: Json
          paid_amount: number
          payment_currency: string
          payment_method: string
          responsable_id: string
          status: string
          subtotal: number
          sucursal_id: string | null
          tax: number
          total: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer: Json
          exchange_rate?: number | null
          id?: string
          items: Json
          paid_amount: number
          payment_currency: string
          payment_method: string
          responsable_id: string
          status: string
          subtotal: number
          sucursal_id?: string | null
          tax: number
          total: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer?: Json
          exchange_rate?: number | null
          id?: string
          items?: Json
          paid_amount?: number
          payment_currency?: string
          payment_method?: string
          responsable_id?: string
          status?: string
          subtotal?: number
          sucursal_id?: string | null
          tax?: number
          total?: number
          type?: string
          user_id?: string
        }
      }
      ecommerce_integrations: {
        Row: {
          api_credentials: Json
          created_at: string
          id: string
          is_active: boolean
          platform: Database["public"]["Enums"]["integration_platforms"]
          sync_config: Json
          user_id: string
        }
        Insert: {
          api_credentials: Json
          created_at?: string
          id?: string
          is_active?: boolean
          platform: Database["public"]["Enums"]["integration_platforms"]
          sync_config: Json
          user_id: string
        }
        Update: {
          api_credentials?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: Database["public"]["Enums"]["integration_platforms"]
          sync_config?: Json
          user_id?: string
        }
      }
      ecommerce_orders: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_data: Json | null
          original_order_id: string
          processed_at: string | null
          source_platform: string
          status: "received" | "processed" | "stock_unavailable" | "error"
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_data?: Json | null
          original_order_id: string
          processed_at?: string | null
          source_platform: string
          status?: "received" | "processed" | "stock_unavailable" | "error"
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_data?: Json | null
          original_order_id?: string
          processed_at?: string | null
          source_platform?: string
          status?: "received" | "processed" | "stock_unavailable" | "error"
          user_id?: string
        }
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sku: string
          unit: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sku: string
          unit?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sku?: string
          unit?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          config: Json | null
          full_name: string | null
          id: string
          role_id: string | null
          sucursal_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          config?: Json | null
          full_name?: string | null
          id: string
          role_id?: string | null
          sucursal_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          config?: Json | null
          full_name?: string | null
          id?: string
          role_id?: string | null
          sucursal_id?: string | null
        }
      }
      roles: {
        Row: {
          creado_por: string | null
          descripcion: string | null
          estado: boolean
          fecha_creacion: string
          id: string
          nombre: string
          permisos: Json | null
        }
        Insert: {
          creado_por?: string | null
          descripcion?: string | null
          estado?: boolean
          fecha_creacion?: string
          id?: string
          nombre: string
          permisos?: Json | null
        }
        Update: {
          creado_por?: string | null
          descripcion?: string | null
          estado?: boolean
          fecha_creacion?: string
          id?: string
          nombre?: string
          permisos?: Json | null
        }
      }
      sucursales: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_ecommerce_source: boolean
          name: string
          phone: string | null
          priority_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ecommerce_source?: boolean
          name: string
          phone?: string | null
          priority_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_ecommerce_source?: boolean
          name?: string
          phone?: string | null
          priority_order?: number
          updated_at?: string
          user_id?: string
        }
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          cuit: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
        }
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_order_to_branch: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: string
      }
      decrease_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_sucursal_id: string
        }
        Returns: undefined
      }
      get_consolidated_stock: {
        Args: {
          p_product_id: string
        }
        Returns: number
      }
      invite_user: {
        Args: {
          p_email: string
          p_role_id: string
          p_sucursal_id: string
        }
        Returns: string
      }
    }
    Enums: {
      integration_platforms: "Shopify" | "WooCommerce" | "Tienda Nube"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}