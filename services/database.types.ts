export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
        Relationships: [
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          celular: string | null
          condicion_iibb: string | null
          domicilio_comercial: Json | null
          email: string | null
          id: string
          iibb_numero: string | null
          inicio_actividades: string | null
          name: string
          nombre_fantasia: string | null
          notas: string | null
          razon_social: string | null
          tax_condition: string
          tax_id: string
          telefono: string | null
        }
        Insert: {
          address?: string | null
          celular?: string | null
          condicion_iibb?: string | null
          domicilio_comercial?: Json | null
          email?: string | null
          id: string
          iibb_numero?: string | null
          inicio_actividades?: string | null
          name: string
          nombre_fantasia?: string | null
          notas?: string | null
          razon_social?: string | null
          tax_condition: string
          tax_id: string
          telefono?: string | null
        }
        Update: {
          address?: string | null
          celular?: string | null
          condicion_iibb?: string | null
          domicilio_comercial?: Json | null
          email?: string | null
          id?: string
          iibb_numero?: string | null
          inicio_actividades?: string | null
          name?: string
          nombre_fantasia?: string | null
          notas?: string | null
          razon_social?: string | null
          tax_condition?: string
          tax_id?: string
          telefono?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          paid_amount?: number
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
        Relationships: [
          {
            foreignKeyName: "documents_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ecommerce_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
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
          status?: string
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
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          id: number
          invoice_id: string
          price_ars: number
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: number
          invoice_id: string
          price_ars: number
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: number
          invoice_id?: string
          price_ars?: number
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string
          date: string
          document_type: string
          exchange_rate_applied: number | null
          id: string
          invoice_number: string
          notes: string | null
          price_list_id: string | null
          salesperson_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency: string
          date: string
          document_type: string
          exchange_rate_applied?: number | null
          id: string
          invoice_number: string
          notes?: string | null
          price_list_id?: string | null
          salesperson_id?: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string
          date?: string
          document_type?: string
          exchange_rate_applied?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          price_list_id?: string | null
          salesperson_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespersons"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_details: {
        Row: {
          amount: number
          id: number
          invoice_id: string
          method: string
          payment_date: string
          transaction_details: string | null
        }
        Insert: {
          amount: number
          id?: number
          invoice_id: string
          method: string
          payment_date: string
          transaction_details?: string | null
        }
        Update: {
          amount?: number
          id?: number
          invoice_id?: string
          method?: string
          payment_date?: string
          transaction_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_details_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          discount_percentage: number
          id: string
          name: string
        }
        Insert: {
          discount_percentage?: number
          id: string
          name: string
        }
        Update: {
          discount_percentage?: number
          id?: string
          name?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "roles_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salespersons: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          id: string
          name: string
        }
        Insert: {
          category_id: string
          id: string
          name: string
        }
        Update: {
          category_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "sucursales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      integration_platforms: "Shopify" | "WooCommerce" | "Tienda Nube"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      integration_platforms: ["Shopify", "WooCommerce", "Tienda Nube"],
    },
  },
} as const
