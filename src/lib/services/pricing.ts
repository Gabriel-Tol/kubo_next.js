// Perhitungan total (PRD BR-03): total = subtotal item + ongkir. Ongkir bukan penjualan produk.

export function hitungTotal(subtotal: number, ongkir: number): number {
  return subtotal + ongkir;
}

export function penjualanProduk(total: number, ongkir: number): number {
  return total - ongkir;
}
