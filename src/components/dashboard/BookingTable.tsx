import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Eye, ArrowUpDown } from "lucide-react";
import { BookingEntry, Mandant } from "@/types/booking";

interface BookingTableProps {
  entries: BookingEntry[];
  mandanten: Mandant[];
  selectedMandant: string;
  onMandantChange: (mandant: string) => void;
  onEntrySelect: (entry: BookingEntry) => void;
  onApprove: (entryId: string) => void;
  onReject: (entryId: string) => void;
  selectedEntry?: BookingEntry | null;
}

export const BookingTable = ({
  entries,
  mandanten,
  selectedMandant,
  onMandantChange,
  onEntrySelect,
  onApprove,
  onReject,
  selectedEntry
}: BookingTableProps) => {
  const [sortField, setSortField] = useState<keyof BookingEntry>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof BookingEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-success text-success-foreground";
    if (confidence >= 80) return "bg-success/80 text-success-foreground";
    if (confidence >= 70) return "bg-warning text-warning-foreground";
    if (confidence >= 50) return "bg-warning/80 text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'exported': return 'default';
      case 'rejected': return 'destructive';
      case 'corrected': return 'warning';
      case 'ready': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'exported': return 'Exportiert';
      case 'rejected': return 'Abgelehnt';
      case 'corrected': return 'Korrigiert';
      case 'ready': return 'Bereit';
      default: return 'Prüfung';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const SortButton = ({ field, children }: { field: keyof BookingEntry; children: React.ReactNode }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-white/10"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Buchungsübersicht</span>
          <div className="flex items-center gap-3">
            <Select value={selectedMandant} onValueChange={onMandantChange}>
              <SelectTrigger className="w-48 bg-white/10 backdrop-blur-glass border-white/20">
                <SelectValue placeholder="Mandant auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mandanten</SelectItem>
                {mandanten.map((mandant) => (
                  <SelectItem key={mandant.id} value={mandant.id}>
                    {mandant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {sortedEntries.length} Belege
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="w-12">KI</TableHead>
                <TableHead><SortButton field="date">Datum</SortButton></TableHead>
                <TableHead><SortButton field="mandant">Mandant</SortButton></TableHead>
                <TableHead><SortButton field="description">Beschreibung</SortButton></TableHead>
                <TableHead><SortButton field="account">Konto</SortButton></TableHead>
                <TableHead><SortButton field="amount">Betrag</SortButton></TableHead>
                <TableHead><SortButton field="taxRate">USt</SortButton></TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow 
                  key={entry.id}
                  className={`border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-300 ${
                    selectedEntry?.id === entry.id ? 'bg-white/15 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => onEntrySelect(entry)}
                >
                  <TableCell>
                    <div className={`w-3 h-3 rounded-full ${
                      entry.confidence >= 90 ? 'bg-success' : 
                      entry.confidence >= 80 ? 'bg-success/80' :
                      entry.confidence >= 70 ? 'bg-warning' : 'bg-destructive'
                    }`} />
                  </TableCell>
                  <TableCell className="font-medium">{entry.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {entry.mandant}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{entry.description}</TableCell>
                  <TableCell className="font-mono text-sm">{entry.account}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(entry.amount)}</TableCell>
                  <TableCell>{entry.taxRate}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(entry.status) as any} className="text-xs">
                      {getStatusText(entry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {(entry.status === 'pending' || entry.status === 'rejected') && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-success/20 hover:text-success"
                            onClick={() => onApprove(entry.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => onReject(entry.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        onClick={() => onEntrySelect(entry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};