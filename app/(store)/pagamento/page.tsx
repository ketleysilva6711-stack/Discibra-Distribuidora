import { redirect } from "next/navigation"
export const dynamic = "force-static"

export default function PagamentoRedirect() {
  redirect("/formas-de-pagamento")
}
