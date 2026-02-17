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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          created_at: string
          estimated_cost: number | null
          id: string
          intent: string | null
          model: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_cost?: number | null
          id?: string
          intent?: string | null
          model?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_cost?: number | null
          id?: string
          intent?: string | null
          model?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          max_amount: number
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount: number
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount?: number
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_limits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_limits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          closing_day: number
          created_at: string
          credit_limit: number | null
          current_bill: number | null
          due_day: number
          id: string
          institution: string
          name: string
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_day?: number
          created_at?: string
          credit_limit?: number | null
          current_bill?: number | null
          due_day?: number
          id?: string
          institution: string
          name: string
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_day?: number
          created_at?: string
          credit_limit?: number | null
          current_bill?: number | null
          due_day?: number
          id?: string
          institution?: string
          name?: string
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          role: string
          transaction_data: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          transaction_data?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          transaction_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          due_date: string
          id: string
          installment_count: number | null
          installment_paid: number | null
          interest_rate: number | null
          is_installment: boolean
          is_paid: boolean
          name: string
          notes: string | null
          paid_amount: number
          priority: string
          profile_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string
          id?: string
          installment_count?: number | null
          installment_paid?: number | null
          interest_rate?: number | null
          is_installment?: boolean
          is_paid?: boolean
          name: string
          notes?: string | null
          paid_amount?: number
          priority?: string
          profile_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          installment_count?: number | null
          installment_paid?: number | null
          interest_rate?: number | null
          is_installment?: boolean
          is_paid?: boolean
          name?: string
          notes?: string | null
          paid_amount?: number
          priority?: string
          profile_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          goal_type: string
          icon: string
          id: string
          is_completed: boolean
          name: string
          profile_id: string | null
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount?: number
          goal_type?: string
          icon?: string
          id?: string
          is_completed?: boolean
          name: string
          profile_id?: string | null
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          goal_type?: string
          icon?: string
          id?: string
          is_completed?: boolean
          name?: string
          profile_id?: string | null
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          card_id: string | null
          created_at: string
          id: string
          installment_count: number
          installment_paid: number
          installment_value: number | null
          is_completed: boolean
          manual_value: boolean
          name: string
          next_due_date: string
          notes: string | null
          profile_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          id?: string
          installment_count?: number
          installment_paid?: number
          installment_value?: number | null
          is_completed?: boolean
          manual_value?: boolean
          name: string
          next_due_date?: string
          notes?: string | null
          profile_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          id?: string
          installment_count?: number
          installment_paid?: number
          installment_value?: number | null
          is_completed?: boolean
          manual_value?: boolean
          name?: string
          next_due_date?: string
          notes?: string | null
          profile_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          day_of_month: number
          description: string
          id: string
          is_active: boolean
          last_generated_date: string | null
          notes: string | null
          profile_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          day_of_month?: number
          description: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          profile_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          day_of_month?: number
          description?: string
          id?: string
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          profile_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          due_day: number
          id: string
          is_active: boolean
          is_recurring: boolean
          last_notified_date: string | null
          name: string
          next_due_date: string
          notes: string | null
          profile_id: string | null
          remind_days_before: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_notified_date?: string | null
          name: string
          next_due_date: string
          notes?: string | null
          profile_id?: string | null
          remind_days_before?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_notified_date?: string | null
          name?: string
          next_due_date?: string
          notes?: string | null
          profile_id?: string | null
          remind_days_before?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spending_profiles: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_id: string | null
          id: string
          plan: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_id?: string | null
          id?: string
          plan?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_id?: string | null
          id?: string
          plan?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          card_id: string | null
          category_id: string
          created_at: string
          date: string
          description: string
          expense_type: string | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          notes: string | null
          payment_method: string | null
          profile_id: string | null
          status: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category_id: string
          created_at?: string
          date?: string
          description: string
          expense_type?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          payment_method?: string | null
          profile_id?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          expense_type?: string | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          notes?: string | null
          payment_method?: string | null
          profile_id?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "spending_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_subscription_status: { Args: never; Returns: boolean }
    }
    Enums: {
      transaction_type: "expense" | "income"
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
      transaction_type: ["expense", "income"],
    },
  },
} as const
