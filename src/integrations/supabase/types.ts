export type ExpenseCategory =
  | "insurance"
  | "getaround_box"
  | "tires_repair"
  | "fuel"
  | "platform_fees"
  | "cost_basis"
  | "other";

export type TaxMode = "flat_rate" | "simplified_real" | "micro_bic_like";

export type SpaceKind = "getaround" | "pea" | "crypto" | "other";

export type Space = {
  id: string;
  owner_id: string;
  kind: SpaceKind;
  name: string;
  created_at: string;
};

export type Vehicle = {
  id: string;
  space_id: string;
  owner_id: string;
  label: string;
  plate: string | null;
  make_model: string | null;
  acquisition_cost: number | null;
  acquisition_on: string | null;
  amort_months: number | null;
  active_from: string | null;
  created_at: string;
};

export type Rental = {
  id: string;
  vehicle_id: string;
  owner_id: string;
  start_at: string;
  end_at: string;
  gross_amount: number;
  platform_fees: number;
  net_amount: number;
  notes: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  vehicle_id: string;
  owner_id: string;
  spent_on: string;
  category: ExpenseCategory;
  amount: number;
  notes: string | null;
  is_recurring: boolean;
  repeat_until: string | null;
  created_at: string;
};

export type TaxSettings = {
  id: string;
  owner_id: string;
  space_id: string;
  mode: TaxMode;
  flat_rate_percent: number;
  micro_allowance_percent: number;
  notes: string | null;
  created_at: string;
};

type TableDef<
  Row,
  Insert = Partial<Row> & Record<string, unknown>,
  Update = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      spaces: TableDef<
        Space,
        {
          id?: string;
          owner_id: string;
          kind: SpaceKind;
          name: string;
          created_at?: string;
        }
      >;
      vehicles: TableDef<
        Vehicle,
        {
          id?: string;
          space_id: string;
          owner_id: string;
          label: string;
          plate?: string | null;
          make_model?: string | null;
          acquisition_cost?: number | null;
          acquisition_on?: string | null;
          amort_months?: number | null;
          active_from?: string | null;
          created_at?: string;
        }
      >;
      rentals: TableDef<
        Rental,
        {
          id?: string;
          vehicle_id: string;
          owner_id: string;
          start_at: string;
          end_at: string;
          gross_amount?: number;
          platform_fees?: number;
          net_amount?: number;
          notes?: string | null;
          created_at?: string;
        }
      >;
      expenses: TableDef<
        Expense,
        {
          id?: string;
          vehicle_id: string;
          owner_id: string;
          spent_on: string;
          category: ExpenseCategory;
          amount: number;
          notes?: string | null;
          is_recurring?: boolean;
          repeat_until?: string | null;
          created_at?: string;
        }
      >;
      tax_settings: TableDef<
        TaxSettings,
        {
          id?: string;
          owner_id: string;
          space_id: string;
          mode?: TaxMode;
          flat_rate_percent?: number;
          micro_allowance_percent?: number;
          notes?: string | null;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
