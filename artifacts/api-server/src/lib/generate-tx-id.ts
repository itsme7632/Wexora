// EstateFund transaction IDs (customer-facing): EF-TX-XXXXXX
// Historical records keep their original TX-/VX- identifiers.
const PREFIX = "EF-TX";

export function generateTxId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `${PREFIX}-${digits}`;
}
