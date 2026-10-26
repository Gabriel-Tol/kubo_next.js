// Mesin status pesanan (PRD 4.4) — murni, tanpa DB, supaya mudah diuji.

export const STATUS = {
  MENUNGGU: "Menunggu Pembayaran",
  DIKONFIRMASI: "Dikonfirmasi",
  DIPROSES: "Diproses",
  SIAP: "Siap Diambil",
  DIANTAR: "Sedang Diantar",
  SELESAI: "Selesai",
  BATAL: "Dibatalkan",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
export type Fulfillment = "PICKUP" | "DELIVERY";

export const STATUS_AKTIF: Status[] = [
  STATUS.MENUNGGU,
  STATUS.DIKONFIRMASI,
  STATUS.DIPROSES,
  STATUS.SIAP,
  STATUS.DIANTAR,
];

export function statusAkhir(s: string): boolean {
  return s === STATUS.SELESAI || s === STATUS.BATAL;
}

export function allowedNext(from: string, fulfillment: Fulfillment): Status[] {
  switch (from) {
    case STATUS.MENUNGGU:
      return [STATUS.DIKONFIRMASI, STATUS.BATAL];
    case STATUS.DIKONFIRMASI:
      return [STATUS.DIPROSES, STATUS.BATAL];
    case STATUS.DIPROSES:
      return fulfillment === "PICKUP" ? [STATUS.SIAP, STATUS.BATAL] : [STATUS.DIANTAR, STATUS.BATAL];
    case STATUS.SIAP:
    case STATUS.DIANTAR:
      return [STATUS.SELESAI, STATUS.BATAL];
    default:
      return [];
  }
}

export function isValidTransition(from: string, to: string, fulfillment: Fulfillment): boolean {
  return allowedNext(from, fulfillment).includes(to as Status);
}
