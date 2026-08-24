export const NOTIFICATION_CHANNELS = ["email", "whatsapp", "sms"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_EVENTS = [
  "reservation",
  "paiement",
  "echeance",
  "stock_faible",
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type SerializedNotification = {
  id: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  to: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
};

export function notificationEventLabel(event: string) {
  switch (event) {
    case "reservation":
      return "Réservation";
    case "paiement":
      return "Paiement";
    case "echeance":
      return "Échéance";
    case "stock_faible":
      return "Stock faible";
    default:
      return event;
  }
}

export function notificationChannelLabel(channel: string) {
  switch (channel) {
    case "email":
      return "Email";
    case "whatsapp":
      return "WhatsApp";
    case "sms":
      return "SMS";
    default:
      return channel;
  }
}
