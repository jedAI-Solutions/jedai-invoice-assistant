import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Eye, ArrowUpDown } from "lucide-react";
import { BookingEntry, Mandant } from "@/types/booking";

interface BookingTableProps {
  entries: BookingEntry[];
  onEntrySelect: (entry: BookingEntry) => void;
  onApprove: (entryId: string) => void;
  onDelete: (entryId: string) => void;
  selectedEntry?: BookingEntry | null;
  confidenceFilter: string;
  onConfidenceFilterChange: (filter: string) => void;
  statusFilter: 'all' | 'pending' | 'modified';
  onStatusFilterChange: (filter: 'all' | 'pending' | 'modified') => void;
}

export const BookingTable = ({
  entries,
  onEntrySelect,
  onApprove,
  onDelete,
  selectedEntry,
  confidenceFilter,
  onConfidenceFilterChange,
  statusFilter,
  onStatusFilterChange
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

const filteredByStatus = entries.filter((e) => {
  if (statusFilter === 'all') return e.status !== 'approved';
  return e.status === statusFilter;
});

const sortedEntries = [...filteredByStatus].sort((a, b) => {
  const aValue = a[sortField];
  const bValue = b[sortField];

  // Numeric sort
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  }

  // Date sort for known date fields
  if (sortField === 'date' || sortField === 'createdAt' || sortField === 'lastModified') {
    const parse = (v: any) => {
      const t = Date.parse(String(v));
      return isNaN(t) ? 0 : t;
    };
    const aTime = parse(aValue);
    const bTime = parse(bValue);
    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
  }

  // Fallback string sort
  const aStr = String(aValue ?? '').toLowerCase();
  const bStr = String(bValue ?? '').toLowerCase();
  return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
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
      case 'modified': return 'warning';
      case 'ready': return 'secondary';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'exported': return 'Exportiert';
      case 'modified': return 'Geändert';
      case 'ready': return 'Bereit';
      case 'pending': return 'Prüfung';
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
    <TooltipProvider>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="flex flex-col md:flex-row md:items-center justify-between font-modern gap-3">
            <span className="text-xl font-semibold">Klassifizierte Rechnungen</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Select value={confidenceFilter} onValueChange={onConfidenceFilterChange}>
                  <SelectTrigger className="w-full sm:w-32 md:w-40 text-xs md:text-sm">
                    <SelectValue placeholder="KI-Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Konfidenz</SelectItem>
                    <SelectItem value="green">🟢 Hoch (≥90%)</SelectItem>
                    <SelectItem value="yellow">🟡 Mittel (70-89%)</SelectItem>
                    <SelectItem value="red">🔴 Niedrig (&lt;70%)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as any)}>
                  <SelectTrigger className="w-full sm:w-32 md:w-40 text-xs md:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle (ohne Genehmigte)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="modified">Modified</SelectItem>
                  </SelectContent>
                </Select>
                
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-modern text-xs sm:text-sm self-center">
                  {sortedEntries.length} Belege
                </Badge>
              </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            <Table className="w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="font-modern text-xs px-1 w-16">KI%</TableHead>
                  <TableHead className="font-modern text-xs px-1 w-20 hidden sm:table-cell"><SortButton field="date">Datum</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 w-24 hidden md:table-cell"><SortButton field="mandant">Mandant</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 min-w-[150px]"><SortButton field="description">Beschreibung</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 w-20 hidden lg:table-cell"><SortButton field="account">Konto</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 w-20"><SortButton field="amount">Betrag</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 w-16 hidden sm:table-cell"><SortButton field="taxRate">USt</SortButton></TableHead>
                  <TableHead className="font-modern text-xs px-1 w-20 hidden md:table-cell">Status</TableHead>
                  <TableHead className="font-modern text-xs px-1 w-24">Aktionen</TableHead>
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
                     <TableCell className="px-1">
                       <div className="flex items-center gap-1">
                         <div className={`w-2 h-2 rounded-full ${
                           entry.confidence >= 90 ? 'bg-success' : 
                           entry.confidence >= 70 ? 'bg-warning' : 'bg-destructive'
                         }`} />
                         <span className="text-xs font-medium font-mono">
                           {entry.confidence}%
                         </span>
                       </div>
                     </TableCell>
                      <TableCell className="font-medium font-modern text-xs truncate px-1 hidden sm:table-cell">{entry.date}</TableCell>
                      <TableCell className="truncate px-1 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs font-modern truncate">
                          {entry.mandant}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate font-modern text-xs px-1" title={entry.description}>{entry.description}</TableCell>
                      <TableCell className="font-mono text-xs truncate px-1 hidden lg:table-cell">{entry.account}</TableCell>
                      <TableCell className="font-semibold font-modern text-xs truncate px-1">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell className="font-modern text-xs px-1 hidden sm:table-cell">{entry.taxRate}</TableCell>
                     <TableCell className="px-1 hidden md:table-cell">
                       <Badge variant={getStatusColor(entry.status) as any} className="text-xs">
                         {getStatusText(entry.status)}
                       </Badge>
                     </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="px-1">
                      <div className="flex gap-1">
                        {(entry.status === 'pending' || entry.status === 'modified') && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-success/20 hover:text-success"
                                  onClick={() => onApprove(entry.id)}
                                >
                                  <Check className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Genehmigen</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                                  onClick={() => {
                                    if (window.confirm('Diesen Eintrag und verbundene Daten wirklich endgültig löschen?')) {
                                      onDelete(entry.id);
                                    }
                                  }}
                                >
                                  <X className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Löschen</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-primary/20"
                              onClick={() => onEntrySelect(entry)}
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Anzeigen</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};