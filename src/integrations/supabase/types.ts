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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      backlog: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          prioridade: string
          responsavel: string | null
          status: string
          story_points: number
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade: string
          responsavel?: string | null
          status: string
          story_points: number
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string
          responsavel?: string | null
          status?: string
          story_points?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily: {
        Row: {
          created_at: string
          data: string
          hoje: string
          id: string
          impedimentos: string | null
          ontem: string
          sprint_id: string
          updated_at: string
          usuario: string
        }
        Insert: {
          created_at?: string
          data?: string
          hoje: string
          id?: string
          impedimentos?: string | null
          ontem: string
          sprint_id: string
          updated_at?: string
          usuario: string
        }
        Update: {
          created_at?: string
          data?: string
          hoje?: string
          id?: string
          impedimentos?: string | null
          ontem?: string
          sprint_id?: string
          updated_at?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resource: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      retrospectiva: {
        Row: {
          acoes: string[]
          bom: string[]
          created_at: string
          data: string
          id: string
          melhorar: string[]
          sprint_id: string
          updated_at: string
        }
        Insert: {
          acoes?: string[]
          bom?: string[]
          created_at?: string
          data?: string
          id?: string
          melhorar?: string[]
          sprint_id: string
          updated_at?: string
        }
        Update: {
          acoes?: string[]
          bom?: string[]
          created_at?: string
          data?: string
          id?: string
          melhorar?: string[]
          sprint_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retrospectiva_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_assignment: {
        Row: {
          allocation_pct: number | null
          created_at: string
          id: string
          resource_id: string
          role: string | null
          task_id: string
        }
        Insert: {
          allocation_pct?: number | null
          created_at?: string
          id?: string
          resource_id: string
          role?: string | null
          task_id: string
        }
        Update: {
          allocation_pct?: number | null
          created_at?: string
          id?: string
          resource_id?: string
          role?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignment_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resource"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignment_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "schedule_task"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_dependency: {
        Row: {
          created_at: string
          id: string
          lag_hours: number
          predecessor_id: string
          successor_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          lag_hours?: number
          predecessor_id: string
          successor_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          lag_hours?: number
          predecessor_id?: string
          successor_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_dependency_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "schedule_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_dependency_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "schedule_task"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_task: {
        Row: {
          created_at: string
          duration_days: number | null
          duration_is_estimate: boolean
          end_at: string | null
          id: string
          is_summary: boolean
          name: string
          notes: string | null
          order_index: number
          parent_id: string | null
          predecessors: string | null
          project_id: string
          responsavel: string | null
          start_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days?: number | null
          duration_is_estimate?: boolean
          end_at?: string | null
          id?: string
          is_summary?: boolean
          name: string
          notes?: string | null
          order_index?: number
          parent_id?: string | null
          predecessors?: string | null
          project_id: string
          responsavel?: string | null
          start_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number | null
          duration_is_estimate?: boolean
          end_at?: string | null
          id?: string
          is_summary?: boolean
          name?: string
          notes?: string | null
          order_index?: number
          parent_id?: string | null
          predecessors?: string | null
          project_id?: string
          responsavel?: string | null
          start_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_task_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "schedule_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_task_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sprint_tarefas: {
        Row: {
          backlog_id: string
          created_at: string
          id: string
          responsavel: string | null
          sprint_id: string
          status: string
          updated_at: string
        }
        Insert: {
          backlog_id: string
          created_at?: string
          id?: string
          responsavel?: string | null
          sprint_id: string
          status: string
          updated_at?: string
        }
        Update: {
          backlog_id?: string
          created_at?: string
          id?: string
          responsavel?: string | null
          sprint_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tarefas_backlog_id_fkey"
            columns: ["backlog_id"]
            isOneToOne: false
            referencedRelation: "backlog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_tarefas_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      subtarefas: {
        Row: {
          created_at: string
          fim: string
          id: string
          inicio: string
          responsavel: string | null
          sprint_tarefa_id: string
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fim: string
          id?: string
          inicio: string
          responsavel?: string | null
          sprint_tarefa_id: string
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fim?: string
          id?: string
          inicio?: string
          responsavel?: string | null
          sprint_tarefa_id?: string
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtarefas_sprint_tarefa_id_fkey"
            columns: ["sprint_tarefa_id"]
            isOneToOne: false
            referencedRelation: "sprint_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrador" | "operador"
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
      app_role: ["administrador", "operador"],
    },
  },
} as const
