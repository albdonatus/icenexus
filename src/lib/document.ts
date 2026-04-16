/** Apply CPF (000.000.000-00) or CNPJ (00.000.000/0000-00) mask while typing */
export function maskDocument(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  return r === parseInt(d[10]);
}

export interface CNPJData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export async function lookupCNPJ(cnpj: string): Promise<CNPJData> {
  const digits = cnpj.replace(/\D/g, "");
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (!res.ok) throw new Error("CNPJ não encontrado");
  const data = await res.json();

  const name =
    (data.nome_fantasia as string)?.trim() ||
    (data.razao_social as string)?.trim() ||
    "";

  const phone = ((data.ddd_telefone_1 as string) ?? "").trim();

  const email = ((data.email as string) ?? "").trim().toLowerCase();

  const parts = [
    data.logradouro,
    data.numero && data.numero !== "S/N" ? data.numero : undefined,
    data.complemento || undefined,
    data.bairro || undefined,
    data.municipio ? `${data.municipio}/${data.uf}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return { name, email, phone, address: parts };
}
