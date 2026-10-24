import { Activity } from 'lucide-react'
import { sellOutMockData } from '../mock-data'

export function SellOutMetrics() {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">PHARMACY DISPENSING</span>
          <h3>Dispensed Volume</h3>
        </div>
        <Activity />
      </div>
      <div className="chart-total">
        <strong>{sellOutMockData.dispensedValue}</strong>
        <span>Across {sellOutMockData.pharmacyCount} partner pharmacies</span>
      </div>
    </div>
  )
}
