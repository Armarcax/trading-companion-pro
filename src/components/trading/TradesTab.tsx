import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Trade } from '@/types/trading';

interface TradesTabProps {
  trades: Trade[];
}

export function TradesTab({ trades }: TradesTabProps) {
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Trade History</h3>
        <p className="text-sm text-muted-foreground">
          View all your executed trades
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Profit/Loss</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell className="font-medium">{trade.pair}</TableCell>
              <TableCell>
                <Badge
                  variant={trade.type === 'BUY' ? 'default' : 'secondary'}
                  className={cn(
                    trade.type === 'BUY' 
                      ? 'bg-profit/20 text-profit border-profit/30' 
                      : 'bg-loss/20 text-loss border-loss/30'
                  )}
                >
                  {trade.type}
                </Badge>
              </TableCell>
              <TableCell>
                ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>{trade.quantity.toFixed(4)}</TableCell>
              <TableCell className={cn(
                "font-medium",
                trade.profit >= 0 ? "text-profit" : "text-loss"
              )}>
                {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {trade.timestamp.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {trade.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
