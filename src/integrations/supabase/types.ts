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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_kit_leads: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          kit_sent: boolean | null
          paid: boolean
          paid_at: string | null
          paypal_order_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          kit_sent?: boolean | null
          paid?: boolean
          paid_at?: string | null
          paypal_order_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          kit_sent?: boolean | null
          paid?: boolean
          paid_at?: string | null
          paypal_order_id?: string | null
        }
        Relationships: []
      }
      consult_call_bookings: {
        Row: {
          amount_cents: number
          booking_type: string
          created_at: string
          duration_minutes: number
          email: string
          first_name: string
          hold_expires_at: string | null
          id: string
          note: string | null
          paid: boolean
          paid_at: string | null
          paypal_order_id: string | null
          services: string[]
          slot_time: string | null
        }
        Insert: {
          amount_cents?: number
          booking_type?: string
          created_at?: string
          duration_minutes?: number
          email: string
          first_name: string
          hold_expires_at?: string | null
          id?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          paypal_order_id?: string | null
          services?: string[]
          slot_time?: string | null
        }
        Update: {
          amount_cents?: number
          booking_type?: string
          created_at?: string
          duration_minutes?: number
          email?: string
          first_name?: string
          hold_expires_at?: string | null
          id?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          paypal_order_id?: string | null
          services?: string[]
          slot_time?: string | null
        }
        Relationships: []
      }
      consulting_intake: {
        Row: {
          areas: string | null
          brand_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          website: string | null
          whatsapp: string
        }
        Insert: {
          areas?: string | null
          brand_name: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          website?: string | null
          whatsapp: string
        }
        Update: {
          areas?: string | null
          brand_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          website?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      insider_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      market_hitch_waitlist: {
        Row: {
          audience: string
          company: string
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          audience: string
          company: string
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          audience?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      retailer_ai_waitlist: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
        }
        Relationships: []
      }
      retailer_applications: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          instagram: string | null
          last_name: string
          store_name: string
          website: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          instagram?: string | null
          last_name: string
          store_name: string
          website?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          instagram?: string | null
          last_name?: string
          store_name?: string
          website?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      score_leads: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          score_status: string
          store_url: string | null
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          score_status?: string
          store_url?: string | null
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          score_status?: string
          store_url?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
