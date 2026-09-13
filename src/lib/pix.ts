function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const field = (id: string, value: string) =>
  `${id}${String(value.length).padStart(2, "0")}${value}`;

const sanitize = (value: string, max: number) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .,-]/g, "")
    .trim()
    .slice(0, max);

export type PixParams = {
  key: string;
  merchantName: string;
  city: string;
  amount?: number;
  txid?: string;
};

/** Static Pix BR Code (EMV) payload. */
export function buildPixPayload({
  key,
  merchantName,
  city,
  amount,
  txid = "***",
}: PixParams) {
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key.trim());
  let payload =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986");
  if (amount && amount > 0) payload += field("54", amount.toFixed(2));
  payload +=
    field("58", "BR") +
    field("59", sanitize(merchantName, 25) || "RECEBEDOR") +
    field("60", sanitize(city, 15) || "BRASIL") +
    field("62", field("05", sanitize(txid, 25) || "***")) +
    "6304";
  return payload + crc16(payload);
}
