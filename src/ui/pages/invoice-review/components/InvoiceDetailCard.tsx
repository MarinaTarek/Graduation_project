export interface InvoiceDetailCardProps {
  client: string
  amount: string
  meta: string
}

export function InvoiceDetailCard({
  client,
  amount,
  meta,
}: InvoiceDetailCardProps) {
  return (
    <div className="detail-card">
      <span>{client}</span>
      <strong>{amount}</strong>
      <small>{meta}</small>
    </div>
  )
}
