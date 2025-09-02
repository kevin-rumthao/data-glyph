import { useState, useMemo, useReducer, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Filter, Brain, ArrowLeft, Plus, X, BarChart3 } from 'lucide-react';

// Types
interface DataRow {
  id: number;
  name: string;
  age: number;
  city: string;
  has_pet: boolean;
  job: string;
  description: string;
}

interface FilterState {
  column: string;
  value: string;
}

// Reducer for filter management
const filterReducer = (state: FilterState[], action: any): FilterState[] => {
  switch (action.type) {
    case 'ADD_FILTER':
      return [...state, { column: '', value: '' }];
    case 'REMOVE_FILTER':
      return state.filter((_, i) => i !== action.index);
    case 'UPDATE_FILTER':
      const newFilters = [...state];
      newFilters[action.index][action.key] = action.value;
      if (action.key === 'column') {
        newFilters[action.index].value = '';
      }
      return newFilters;
    case 'RESET_FILTERS':
      return [];
    default:
      return state;
  }
};

// Sample data
const initialData: DataRow[] = [
  { 
    id: 1, 
    name: 'John Doe', 
    age: 32, 
    city: 'New York', 
    has_pet: true, 
    job: 'Engineer', 
    description: 'John is a highly skilled engineer who recently moved to the city.' 
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    age: 28, 
    city: 'Los Angeles', 
    has_pet: false, 
    job: 'Designer', 
    description: 'Jane is a creative designer with a passion for web development and user experience.' 
  },
  { 
    id: 3, 
    name: 'Peter Jones', 
    age: 45, 
    city: 'Chicago', 
    has_pet: true, 
    job: 'Manager', 
    description: 'Peter manages a large team and is an expert in project management and organizational leadership.' 
  },
];

const DataAnnotator = () => {
  const [data, setData] = useState<DataRow[]>(initialData);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);
  const [filters, dispatch] = useReducer(filterReducer, []);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [insights, setInsights] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const { toast } = useToast();

  // Get headers from data
  const headers = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => key !== 'id');
  }, [data]);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return filters.every(filter => {
        const { column, value } = filter;
        if (!column || !value) return true;
        
        const rowValue = row[column as keyof DataRow];
        if (typeof rowValue === 'boolean') {
          return (rowValue ? 'Yes' : 'No') === value;
        }
        return String(rowValue) === value;
      });
    });
  }, [data, filters]);

  // Get unique values for a column
  const getUniqueValues = useCallback((columnName: string) => {
    if (!columnName || !data.length) return [];
    const values = data.map(row => {
      const value = row[columnName as keyof DataRow];
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return String(value);
    });
    return [...new Set(values)].sort();
  }, [data]);

  // Handle file upload simulation
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Upload",
        description: `${file.name} would be processed in a real implementation.`
      });
    }
  };

  // Generate AI insights simulation
  const handleGenerateInsights = () => {
    if (!filteredData.length) {
      toast({
        title: "No Data",
        description: "No data to analyze. Please apply filters first.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInsights(true);
    setIsInsightsOpen(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const sampleInsights = `
Based on the filtered data analysis:

• ${filteredData.length} records analyzed
• Average age: ${Math.round(filteredData.reduce((sum, row) => sum + row.age, 0) / filteredData.length)}
• Cities represented: ${[...new Set(filteredData.map(row => row.city))].join(', ')}
• Pet owners: ${filteredData.filter(row => row.has_pet).length}/${filteredData.length}
• Most common job: ${Object.entries(
        filteredData.reduce((acc, row) => {
          acc[row.job] = (acc[row.job] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}

Key patterns identified:
- Professional diversity across multiple industries
- Geographic distribution spanning major US cities
- Mixed demographic characteristics suggesting broad representation
      `.trim();
      
      setInsights(sampleInsights);
      setIsGeneratingInsights(false);
    }, 2000);
  };

  // Render highlighted text
  const renderHighlightedText = (text: string) => {
    if (!highlights.length) return text;
    
    const regex = new RegExp(`(${highlights.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) =>
          highlights.some(h => h.toLowerCase() === part.toLowerCase()) ? (
            <span key={index} className="bg-highlight-bg text-primary font-medium rounded-sm px-1">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="shadow-subtle">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold bg-gradient-ai bg-clip-text text-transparent flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-ai-primary" />
              AI-Powered Data Annotator
            </CardTitle>
            <p className="text-muted-foreground text-lg mt-2">
              Intelligent data analysis with AI-powered insights and annotations
            </p>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {selectedRow ? (
          <DetailView 
            row={selectedRow} 
            onBack={() => setSelectedRow(null)}
            renderHighlightedText={renderHighlightedText}
            highlights={highlights}
            setHighlights={setHighlights}
          />
        ) : (
          <>
            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="ai" className="shadow-ai">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Data File
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.csv"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {data.length} records loaded
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Data Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <Select
                      value={filter.column}
                      onValueChange={(value) => 
                        dispatch({ type: 'UPDATE_FILTER', index, key: 'column', value })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {filter.column && (
                      <Select
                        value={filter.value}
                        onValueChange={(value) => 
                          dispatch({ type: 'UPDATE_FILTER', index, key: 'value', value })
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {getUniqueValues(filter.column).map(value => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch({ type: 'REMOVE_FILTER', index })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => dispatch({ type: 'ADD_FILTER' })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Filter
                  </Button>
                  {filters.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => dispatch({ type: 'RESET_FILTERS' })}
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button
                variant="ai"
                onClick={handleGenerateInsights}
                disabled={filteredData.length === 0}
                className="shadow-ai"
              >
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Insights
              </Button>
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Data Table ({filteredData.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        {headers.map(header => (
                          <th
                            key={header}
                            className="text-left p-4 font-semibold text-foreground capitalize"
                          >
                            {header.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((row, index) => (
                          <tr
                            key={row.id}
                            className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedRow(row)}
                          >
                            {headers.map(header => (
                              <td key={header} className="p-4 text-sm">
                                {typeof row[header as keyof DataRow] === 'string' ? (
                                  renderHighlightedText(String(row[header as keyof DataRow]))
                                ) : typeof row[header as keyof DataRow] === 'boolean' ? (
                                  row[header as keyof DataRow] ? 'Yes' : 'No'
                                ) : (
                                  String(row[header as keyof DataRow])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td 
                            colSpan={headers.length} 
                            className="p-8 text-center text-muted-foreground"
                          >
                            No matching results found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Insights Modal */}
        <Dialog open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai-primary" />
                AI Generated Insights
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {isGeneratingInsights ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-primary"></div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 whitespace-pre-line text-sm">
                  {insights}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Detail View Component
const DetailView = ({ 
  row, 
  onBack, 
  renderHighlightedText, 
  highlights, 
  setHighlights 
}: {
  row: DataRow;
  onBack: () => void;
  renderHighlightedText: (text: string) => React.ReactNode;
  highlights: string[];
  setHighlights: (highlights: string[]) => void;
}) => {
  const [rating, setRating] = useState('');
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    selectedText: '', 
    action: 'add' 
  });
  const { toast } = useToast();

  const handleGenerateSummary = () => {
    setIsGeneratingSummary(true);
    
    // Simulate AI summary generation
    setTimeout(() => {
      const generatedSummary = `Professional summary for ${row.name}:

${row.name} is a ${row.age}-year-old ${row.job.toLowerCase()} based in ${row.city}. ${row.description} ${row.has_pet ? 'They are a pet owner, which suggests a nurturing personality and responsibility.' : 'They do not currently have pets.'} 

This individual demonstrates strong professional capabilities in their field and appears well-established in their career. Their background suggests they would be a valuable addition to any team requiring expertise in their domain.`;
      
      setSummary(generatedSummary);
      setIsGeneratingSummary(false);
    }, 1500);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText) {
      setContextMenu({
        visible: true,
        x: e.pageX,
        y: e.pageY,
        selectedText,
        action: highlights.includes(selectedText) ? 'remove' : 'add'
      });
    }
  };

  const handleHighlight = () => {
    const { selectedText, action } = contextMenu;
    if (action === 'add') {
      setHighlights([...highlights, selectedText]);
      toast({
        title: "Highlight Added",
        description: `"${selectedText}" has been highlighted.`
      });
    } else {
      setHighlights(highlights.filter(h => h !== selectedText));
      toast({
        title: "Highlight Removed",
        description: `"${selectedText}" highlight has been removed.`
      });
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSubmitRating = () => {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please enter a rating between 1 and 5.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Rating Submitted",
      description: `Rating of ${numRating} stars submitted successfully!`
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Table
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Details for {row.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Summary Section */}
          <div className="space-y-4">
            <Button
              variant="ai"
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="w-full shadow-ai"
            >
              {isGeneratingSummary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Summary
                </>
              )}
            </Button>
            
            {summary && (
              <div className="bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5 border border-ai-primary/20 rounded-lg p-4">
                <h4 className="font-semibold text-ai-primary mb-2">AI Summary:</h4>
                <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Annotation Instructions:</strong> Select text in any response and right-click to add or remove highlights.
            </p>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold w-1/3">Question</th>
                  <th className="text-left p-4 font-semibold">Response</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(row).map(([key, value]) => (
                  !['id'].includes(key) && (
                    <tr key={key} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td 
                        className="p-4 text-sm cursor-text"
                        onContextMenu={handleContextMenu}
                      >
                        {typeof value === 'string' ? (
                          renderHighlightedText(value)
                        ) : typeof value === 'boolean' ? (
                          value ? 'Yes' : 'No'
                        ) : (
                          String(value)
                        )}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* Context Menu */}
          {contextMenu.visible && (
            <div
              className="fixed bg-card border border-border rounded-md shadow-lg p-2 z-50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={handleHighlight}
              >
                {contextMenu.action === 'add' ? (
                  <>
                    <span className="w-3 h-3 bg-highlight rounded-sm mr-2" />
                    Highlight "{contextMenu.selectedText.substring(0, 20)}..."
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 mr-2" />
                    Remove Highlight
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Rating Section */}
          <Card className="bg-gradient-to-r from-secondary/20 to-accent/20">
            <CardHeader>
              <CardTitle className="text-lg">Rate this Application</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="1-5"
                  className="w-20"
                />
                <Button onClick={handleSubmitRating} variant="data">
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataAnnotator;