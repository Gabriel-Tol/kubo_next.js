import { describe, expect, it } from "vitest";
import { STATUS, allowedNext, isValidTransition } from "../../src/lib/services/order-status";
import { hitungTotal, penjualanProduk } from "../../src/lib/services/pricing";

describe("mesin status pesanan", () => {
  it("MENUNGGU hanya boleh ke Dikonfirmasi atau Dibatalkan", () => {
    expect(allowedNext(STATUS.MENUNGGU, "PICKUP")).toEqual([STATUS.DIKONFIRMASI, STATUS.BATAL]);
    expect(isValidTransition(STATUS.MENUNGGU, STATUS.DIPROSES, "PICKUP")).toBe(false);
  });

  it("DIPROSES bercabang sesuai metode penerimaan", () => {
    expect(allowedNext(STATUS.DIPROSES, "PICKUP")).toContain(STATUS.SIAP);
    expect(allowedNext(STATUS.DIPROSES, "DELIVERY")).toContain(STATUS.DIANTAR);
    expect(isValidTransition(STATUS.DIPROSES, STATUS.SIAP, "DELIVERY")).toBe(false);
  });

  it("Selesai dan Dibatalkan final", () => {
    expect(allowedNext(STATUS.SELESAI, "PICKUP")).toEqual([]);
    expect(allowedNext(STATUS.BATAL, "DELIVERY")).toEqual([]);
    expect(isValidTransition(STATUS.SELESAI, STATUS.BATAL, "PICKUP")).toBe(false);
  });

  it("lompat status tidak valid ditolak", () => {
    expect(isValidTransition(STATUS.MENUNGGU, STATUS.SELESAI, "PICKUP")).toBe(false);
    expect(isValidTransition(STATUS.DIKONFIRMASI, STATUS.SIAP, "PICKUP")).toBe(false);
  });
});

describe("perhitungan total (BR-03)", () => {
  it("total = subtotal + ongkir, penjualan produk tanpa ongkir", () => {
    expect(hitungTotal(170000, 20000)).toBe(190000);
    expect(penjualanProduk(190000, 20000)).toBe(170000);
    expect(hitungTotal(170000, 0)).toBe(170000);
  });
});
