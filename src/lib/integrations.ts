export type IntegrationCategory = "payment" | "communication" | "biometrics" | "lms" | "meeting";
export type IntegrationStatus = "connected" | "error" | "disconnected" | "pending";

export interface TenantIntegration {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  category: IntegrationCategory;
  provider_name: string;
  display_name: string;
  config: Record<string, any>;
  is_enabled: boolean;
  status: IntegrationStatus;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IntegrationCatalogItem {
  provider_name: string;
  display_name: string;
  category: IntegrationCategory;
  description: string;
  icon_name: string;
  required_fields: { key: string; label: string; type?: string }[];
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    provider_name: "razorpay",
    display_name: "Razorpay Gateway",
    category: "payment",
    description: "Accept fee payments directly into college bank accounts via UPI, Credit/Debit cards & Net Banking.",
    icon_name: "CreditCard",
    required_fields: [
      { key: "key_id", label: "Razorpay Key ID" },
      { key: "key_secret", label: "Razorpay Key Secret", type: "password" },
      { key: "webhook_secret", label: "Webhook Secret", type: "password" },
    ],
  },
  {
    provider_name: "stripe",
    display_name: "Stripe Global",
    category: "payment",
    description: "International student fees & international conferences ticketing gateway.",
    icon_name: "DollarSign",
    required_fields: [
      { key: "publishable_key", label: "Publishable Key" },
      { key: "secret_key", label: "Secret Key", type: "password" },
    ],
  },
  {
    provider_name: "whatsapp_business",
    display_name: "WhatsApp Cloud API (Meta/Wati)",
    category: "communication",
    description: "Instant WhatsApp broadcast circulars, attendance fee reminders, and admission updates.",
    icon_name: "MessageCircle",
    required_fields: [
      { key: "phone_number_id", label: "Phone Number ID" },
      { key: "waba_id", label: "WhatsApp Business Account ID" },
      { key: "access_token", label: "Permanent Access Token", type: "password" },
    ],
  },
  {
    provider_name: "essl_biometrics",
    display_name: "eSSL / ZKTeco Biometrics",
    category: "biometrics",
    description: "Automate faculty and staff attendance sync from RFID and Fingerprint terminals over LAN/Cloud Push.",
    icon_name: "ScanFace",
    required_fields: [
      { key: "device_ip", label: "Terminal IP / Cloud Gateway URL" },
      { key: "port", label: "TCP/IP Port (Default: 4370)" },
      { key: "comm_key", label: "Communication Key" },
    ],
  },
  {
    provider_name: "hikvision",
    display_name: "Hikvision Face Access Control",
    category: "biometrics",
    description: "High-speed face recognition turnover gates for library and hostel automated attendance check-ins.",
    icon_name: "ScanLine",
    required_fields: [
      { key: "api_url", label: "HikCentral ISAPI URL" },
      { key: "app_key", label: "App Key" },
      { key: "app_secret", label: "App Secret", type: "password" },
    ],
  },
  {
    provider_name: "zoom_education",
    display_name: "Zoom for Education",
    category: "meeting",
    description: "Automatically spawn virtual classrooms and hybrid lecture meeting links inside LMS subject slots.",
    icon_name: "Video",
    required_fields: [
      { key: "account_id", label: "Zoom Account ID" },
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password" },
    ],
  },
];
