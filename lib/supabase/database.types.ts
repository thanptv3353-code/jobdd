export type Country = "domestic" | "thailand" | "korea" | "japan";
export type AvailabilityStatus = "available" | "in_process" | "placed" | "paused" | "stale";
export type ApplicationStage =
  | "received"
  | "screening"
  | "interview"
  | "offer"
  | "contract_signed"
  | "rejected";

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          description: string;
          country_focus: Country[];
          established_year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          country_focus?: Country[];
          established_year?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          member_id: string;
          title: string;
          country: Country;
          category: string;
          salary_range: string;
          description: string;
          requirements: string[];
          quota: number;
          posted_at: string;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          title: string;
          country: Country;
          category?: string;
          salary_range?: string;
          description?: string;
          requirements?: string[];
          quota?: number;
          status?: "open" | "closed";
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "jobs_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      worker_profiles: {
        Row: {
          id: string;
          name: string;
          gender: "male" | "female";
          phone: string;
          dob: string;
          province: string;
          preferred_countries: Country[];
          availability_status: AvailabilityStatus;
          status_updated_at: string;
          status_updated_by: string;
          last_confirmed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          gender?: "male" | "female";
          phone: string;
          dob: string;
          province?: string;
          preferred_countries?: Country[];
        };
        Update: Partial<Database["public"]["Tables"]["worker_profiles"]["Insert"]> & {
          availability_status?: AvailabilityStatus;
          status_updated_at?: string;
          status_updated_by?: string;
          last_confirmed_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          worker_id: string;
          job_id: string;
          country: Country;
          stage: ApplicationStage;
          documents: Record<string, boolean>;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          job_id: string;
          country: Country;
          documents?: Record<string, boolean>;
        };
        Update: {
          stage?: ApplicationStage;
        };
        Relationships: [
          {
            foreignKeyName: "applications_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          id: string;
          worker_id: string;
          country: Country;
          company_name: string;
          position: string;
          start_date: string | null;
          contract_end_date: string | null;
          source: "jobdd" | "outside";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          country: Country;
          company_name?: string;
          position?: string;
          start_date?: string | null;
          contract_end_date?: string | null;
          source?: "jobdd" | "outside";
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["placements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "placements_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_logs: {
        Row: {
          id: string;
          worker_id: string;
          staff_name: string;
          contacted_at: string;
          channel: "phone" | "whatsapp" | "sms" | "in_person";
          result: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          staff_name: string;
          channel?: "phone" | "whatsapp" | "sms" | "in_person";
          result: string;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contact_logs_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      country_requirements: {
        Row: {
          id: string;
          country: Country;
          doc_type: string;
          required: boolean;
          min_age: number;
          max_age: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          country: Country;
          doc_type: string;
          required?: boolean;
          min_age?: number;
          max_age?: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["country_requirements"]["Insert"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_status: {
        Args: { p_phone: string };
        Returns: {
          worker: Database["public"]["Tables"]["worker_profiles"]["Row"];
          applications: {
            id: string;
            stage: ApplicationStage;
            country: Country;
            submitted_at: string;
            job_title: string;
          }[];
        } | null;
      };
      set_my_status: {
        Args: { p_phone: string; p_status: AvailabilityStatus };
        Returns: boolean;
      };
      get_public_stats: {
        Args: Record<string, never>;
        Returns: { available_workers: number; open_jobs: number; members: number };
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
