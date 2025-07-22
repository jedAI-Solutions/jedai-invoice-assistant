// TypeScript type for agenda.mandantenstammdaten
export interface Mandantenstammdaten {
  id: number;
  mandant_nr: string;
  mandantentyp: string;
  name1: string;
  name2?: string | null;
  strasse?: string | null;
  plz?: string | null;
  ort: string;
  land?: string | null;
  telefon?: string | null;
  email?: string | null;
  internet?: string | null;
  rechtsform?: string | null;
  hrb_nr?: string | null;
  registergericht?: string | null;
  geschaeftsfuehrer?: string | null;
  steuer_nr?: string | null;
  ust_idnr?: string | null;
  finanzamt?: string | null;
  fa_nr?: string | null;
  wj_beginn?: string | null;
  wj_ende?: string | null;
  kontenrahmen?: string | null;
  versteuerung?: string | null;
  ust_zeitraum?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankname?: string | null;
  bearbeiter?: string | null;
  angelegt?: string | null; // timestamp with time zone
  geaendert?: string | null; // timestamp with time zone
  created_at?: string | null; // timestamp with time zone
  updated_at?: string | null; // timestamp with time zone
  zusatz?: string | null;
}