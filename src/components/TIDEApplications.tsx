import { useState, useMemo, useReducer, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Filter, Brain, ArrowLeft, Plus, X, BarChart3, Eye, RefreshCw, Users, LogOut } from 'lucide-react';

// Global type declaration for XLSX library
declare global {
  interface Window {
    XLSX: any;
  }
}

// Types for TIDE Application System
interface ApplicationRow {
  id: string;
  timestamp: string;
  application_code: string;
  eligibility: 'Eligible' | 'Not Eligible';
  email: string;
  brand_name: string;
  applicant_name: string;
  description?: string;
  business_model?: string;
  target_market?: string;
  funding_stage?: string;
  team_size?: number;
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

// Sample TIDE application data
const initialApplications: ApplicationRow[] = [
  {
    id: '2025A-TIDEC4-0001',
    timestamp: '24/07/2025 17:17:09',
    application_code: '2025A-TIDEC4-0001',
    eligibility: 'Not Eligible',
    email: 'rajsadhanala143@gmail.com',
    brand_name: 'Sadhanala Device',
    applicant_name: 'Sadhanala Prathyusha',
    description: 'IoT device startup focusing on smart home automation solutions',
    business_model: 'B2C Hardware Sales',
    target_market: 'Smart Home Consumers',
    funding_stage: 'Seed',
    team_size: 3
  },
  {
    id: '2025A-TIDEC4-0002',
    timestamp: '24/07/2025 17:47:55',
    application_code: '2025A-TIDEC4-0002',
    eligibility: 'Not Eligible',
    email: 'sravanthichitluri15@gmail.com',
    brand_name: 'Sravanthi',
    applicant_name: 'Chitluri Sravanthi',
    description: 'Digital marketing agency specializing in social media growth',
    business_model: 'Service Based',
    target_market: 'Small Businesses',
    funding_stage: 'Bootstrap',
    team_size: 2
  },
  {
    id: '2025A-TIDEC4-0003',
    timestamp: '14/08/2025 00:03:29',
    application_code: '2025A-TIDEC4-0003',
    eligibility: 'Eligible',
    email: 'fin.aioxz@gmail.com',
    brand_name: 'F-AI',
    applicant_name: 'AKASH S SRIVASTAVA',
    description: 'AI ACCOUNTANT AND FINANCIAL CONSULTANT - Built in house AI that handles 96% of accounting tasks automatically. Saves 10X time, cost and resources for MNC, SME, Startups and Consultants.',
    business_model: 'SaaS Subscription',
    target_market: 'MNC SME Startups Consultants',
    funding_stage: 'Pre-Series A',
    team_size: 12
  },
  {
    id: '2025A-TIDEC4-0004',
    timestamp: '24/07/2025 18:21:22',
    application_code: '2025A-TIDEC4-0004',
    eligibility: 'Eligible',
    email: 'gravystories@gmail.com',
    brand_name: 'Gravy Stories',
    applicant_name: 'Founder Name',
    description: 'Digital storytelling platform for creative content creators',
    business_model: 'Platform with Commission',
    target_market: 'Content Creators',
    funding_stage: 'Seed',
    team_size: 8
  },
  {
    id: '2025A-TIDEC4-0005',
    timestamp: '25/07/2025 09:15:33',
    application_code: '2025A-TIDEC4-0005',
    eligibility: 'Eligible',
    email: 'healthtech@startup.com',
    brand_name: 'MediCore AI',
    applicant_name: 'Dr. Sarah Johnson',
    description: 'AI-powered diagnostic tool for early disease detection using machine learning algorithms',
    business_model: 'B2B SaaS',
    target_market: 'Healthcare Providers',
    funding_stage: 'Series A',
    team_size: 15
  }
];

const TIDEApplications = () => {
  const [applications, setApplications] = useState<ApplicationRow[]>(initialApplications);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRow | null>(null);
  const [filters, dispatch] = useReducer(filterReducer, []);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [insights, setInsights] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get headers from applications
  const headers = useMemo(() => {
    if (applications.length === 0) return [];
    return Object.keys(applications[0]).filter(key => key !== 'id');
  }, [applications]);

  // Filter applications based on active filters
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      return filters.every(filter => {
        const { column, value } = filter;
        if (!column || !value) return true;
        
        const appValue = app[column as keyof ApplicationRow];
        return String(appValue) === value;
      });
    });
  }, [applications, filters]);

  // Get unique values for a column
  const getUniqueValues = useCallback((columnName: string) => {
    if (!columnName || !applications.length) return [];
    const values = applications.map(app => {
      const value = app[columnName as keyof ApplicationRow];
      return String(value);
    });
    return [...new Set(values)].sort();
  }, [applications]);

  // Generate unique ID for applications
  const generateApplicationId = async (applicationData: any): Promise<string> => {
    const dataString = JSON.stringify(applicationData);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
  };

  // Handle file upload for Google Sheets format
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Load XLSX library dynamically
    const loadXLSX = () => {
      return new Promise((resolve, reject) => {
        if ((window as any).XLSX) {
          resolve((window as any).XLSX);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve((window as any).XLSX);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    try {
      const XLSX = await loadXLSX() as any;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (jsonData.length > 1) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            
            // Map Google Sheets columns to ApplicationRow format
            const newApplications: ApplicationRow[] = await Promise.all(
              rows.map(async (row, index) => {
                const application: any = {};
                
                headers.forEach((header, colIndex) => {
                  const normalizedHeader = header.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^\w_]/g, '');
                  application[normalizedHeader] = row[colIndex] || '';
                });

                // Generate required fields if missing
                const id = await generateApplicationId(application);
                return {
                  id: application.id || application.application_code || id,
                  timestamp: application.timestamp || new Date().toLocaleString(),
                  application_code: application.application_code || `2025A-TIDEC4-${String(index + 1).padStart(4, '0')}`,
                  eligibility: (application.eligibility === 'Eligible' || application.eligibility === 'Not Eligible') 
                    ? application.eligibility 
                    : 'Not Eligible',
                  email: application.email || '',
                  brand_name: application.brand_name || application.company_name || '',
                  applicant_name: application.applicant_name || application.founder_name || application.name || '',
                  description: application.description || application.business_description || '',
                  business_model: application.business_model || '',
                  target_market: application.target_market || '',
                  funding_stage: application.funding_stage || '',
                  team_size: parseInt(application.team_size) || 0
                } as ApplicationRow;
              })
            );

            setApplications(newApplications);
            dispatch({ type: 'RESET_FILTERS' });
            
            toast({
              title: "Upload Successful",
              description: `Loaded ${newApplications.length} applications from ${file.name}`
            });
          } else {
            toast({
              title: "Upload Error",
              description: "File appears to be empty or invalid format",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          toast({
            title: "Upload Error",
            description: "Failed to parse the file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error loading XLSX library:', error);
      toast({
        title: "Upload Error",
        description: "Failed to load file parser. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Generate AI insights for startup applications
  const handleGenerateInsights = () => {
    if (!filteredApplications.length) {
      toast({
        title: "No Data",
        description: "No applications to analyze. Please apply filters first.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInsights(true);
    setIsInsightsOpen(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const eligibleCount = filteredApplications.filter(app => app.eligibility === 'Eligible').length;
      const totalTeamSize = filteredApplications.reduce((sum, app) => sum + (app.team_size || 0), 0);
      const avgTeamSize = Math.round(totalTeamSize / filteredApplications.length);
      const uniqueBusinessModels = [...new Set(filteredApplications.map(app => app.business_model).filter(Boolean))];
      const uniqueTargetMarkets = [...new Set(filteredApplications.map(app => app.target_market).filter(Boolean))];

      const sampleInsights = `
TIDE 2.0 Program Application Analysis:

📊 APPLICATION METRICS:
• Total Applications Analyzed: ${filteredApplications.length}
• Eligible Applications: ${eligibleCount} (${Math.round((eligibleCount/filteredApplications.length)*100)}%)
• Not Eligible: ${filteredApplications.length - eligibleCount}
• Average Team Size: ${avgTeamSize} members

🏢 BUSINESS MODEL DISTRIBUTION:
${uniqueBusinessModels.map(model => 
  `• ${model}: ${filteredApplications.filter(app => app.business_model === model).length} applications`
).join('\n')}

🎯 TARGET MARKET ANALYSIS:
${uniqueTargetMarkets.slice(0, 5).map(market => 
  `• ${market}: ${filteredApplications.filter(app => app.target_market === market).length} startups`
).join('\n')}

💡 KEY INSIGHTS:
- Strong representation in AI/Tech sector with F-AI leading in innovation
- Diverse funding stages from Bootstrap to Series A
- High potential in B2B SaaS and platform-based business models
- Emerging opportunities in healthcare technology and automation
- Mixed eligibility suggests need for better pre-screening criteria

🔍 RECOMMENDATIONS:
- Focus mentorship on eligible startups with proven traction
- Consider creating specialized tracks for different business models
- Evaluate team composition and technical expertise more thoroughly
      `.trim();
      
      setInsights(sampleInsights);
      setIsGeneratingInsights(false);
    }, 2000);
  };

  // Render highlighted text
  const renderHighlightedText = (text: string) => {
    if (!highlights.length || !text) return text;
    
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

  const getEligibilityBadge = (eligibility: string) => {
    return eligibility === 'Eligible' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Eligible</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Not Eligible</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-subtle">
          <CardHeader className="pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-ai-primary" />
                  Evaluate IIMV FIELD's Applications
                </CardTitle>
                <p className="text-muted-foreground text-lg mt-2">
                  for TIDE2.0 Program (Cohort 4) Incubation
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Admin
                </Button>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {selectedApplication ? (
          <ApplicationDetailView 
            application={selectedApplication} 
            onBack={() => setSelectedApplication(null)}
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
                    <Button variant="ai" className="shadow-ai" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Applications
                    </Button>
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.csv,.xls"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {filteredApplications.length} of {applications.length} applicants
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
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
                disabled={filteredApplications.length === 0}
                className="shadow-ai"
              >
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Insights
              </Button>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{application.brand_name}</h3>
                          {getEligibilityBadge(application.eligibility)}
                        </div>
                        <p className="text-muted-foreground">{application.email}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Application Code: {application.application_code}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedApplication(application)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {application.eligibility === 'Eligible' ? 'Evaluate' : 'View'}
                      </Button>
                    </div>

                    {application.description && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          {renderHighlightedText(application.description)}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Timestamp:</span>
                        <p className="text-muted-foreground">{application.timestamp}</p>
                      </div>
                      <div>
                        <span className="font-medium">Applicant:</span>
                        <p className="text-muted-foreground">{application.applicant_name}</p>
                      </div>
                      {application.business_model && (
                        <div>
                          <span className="font-medium">Business Model:</span>
                          <p className="text-muted-foreground">{application.business_model}</p>
                        </div>
                      )}
                      {application.team_size && (
                        <div>
                          <span className="font-medium">Team Size:</span>
                          <p className="text-muted-foreground">{application.team_size} members</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredApplications.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No matching applications found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Insights Modal */}
        <Dialog open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai-primary" />
                AI Generated Application Insights
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {isGeneratingInsights ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-primary"></div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 whitespace-pre-line text-sm font-mono">
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

// Application Detail View Component
const ApplicationDetailView = ({ 
  application, 
  onBack, 
  renderHighlightedText, 
  highlights, 
  setHighlights 
}: {
  application: ApplicationRow;
  onBack: () => void;
  renderHighlightedText: (text: string) => React.ReactNode;
  highlights: string[];
  setHighlights: (highlights: string[]) => void;
}) => {
  const [rating, setRating] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [isGeneratingEvaluation, setIsGeneratingEvaluation] = useState(false);
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    selectedText: '', 
    action: 'add' 
  });
  const { toast } = useToast();

  const handleGenerateEvaluation = () => {
    setIsGeneratingEvaluation(true);
    
    // Simulate AI evaluation generation
    setTimeout(() => {
      const generatedEvaluation = `
TIDE 2.0 Application Evaluation for ${application.brand_name}

📋 APPLICATION OVERVIEW:
Applicant: ${application.applicant_name}
Company: ${application.brand_name}
Current Status: ${application.eligibility}

🏢 BUSINESS ANALYSIS:
Business Model: ${application.business_model || 'Not specified'}
Target Market: ${application.target_market || 'Not specified'}
Team Size: ${application.team_size || 'Not specified'} members
Funding Stage: ${application.funding_stage || 'Not specified'}

📝 DETAILED ASSESSMENT:
${application.description || 'No description provided'}

💡 EVALUATION CRITERIA:
✓ Innovation Potential: High - Demonstrates novel approach
✓ Market Opportunity: Strong - Clear target market identified
✓ Team Capability: ${application.team_size && application.team_size > 5 ? 'Strong' : 'Developing'} - ${application.team_size} member team
✓ Business Model: ${application.business_model?.includes('SaaS') ? 'Scalable' : 'Traditional'} - ${application.business_model}

🎯 RECOMMENDATION:
${application.eligibility === 'Eligible' ? 
  'RECOMMENDED FOR INCUBATION - Strong potential for growth and market impact.' : 
  'NEEDS IMPROVEMENT - Requires further development before admission.'}

📊 RISK ASSESSMENT:
- Market Risk: Medium
- Technical Risk: Low
- Execution Risk: Medium
- Funding Risk: ${application.funding_stage === 'Bootstrap' ? 'High' : 'Low'}

Next Steps: ${application.eligibility === 'Eligible' ? 
  'Schedule interview and due diligence' : 
  'Provide feedback and encourage reapplication'}
      `.trim();
      
      setEvaluation(generatedEvaluation);
      setIsGeneratingEvaluation(false);
    }, 2500);
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
    if (isNaN(numRating) || numRating < 1 || numRating > 10) {
      toast({
        title: "Invalid Rating",
        description: "Please enter a rating between 1 and 10.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Evaluation Submitted",
      description: `Rating of ${numRating}/10 submitted for ${application.brand_name}!`
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Applications
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{application.brand_name}</CardTitle>
              <p className="text-muted-foreground mt-1">Application Code: {application.application_code}</p>
            </div>
            <Badge className={application.eligibility === 'Eligible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {application.eligibility}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Evaluation Section */}
          <div className="space-y-4">
            <Button
              variant="ai"
              onClick={handleGenerateEvaluation}
              disabled={isGeneratingEvaluation}
              className="w-full shadow-ai"
            >
              {isGeneratingEvaluation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating AI Evaluation...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate AI Evaluation
                </>
              )}
            </Button>
            
            {evaluation && (
              <div className="bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5 border border-ai-primary/20 rounded-lg p-4">
                <h4 className="font-semibold text-ai-primary mb-2">AI Evaluation Report:</h4>
                <div className="text-sm leading-relaxed whitespace-pre-line font-mono">
                  {evaluation}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Annotation Instructions:</strong> Select text in any field and right-click to add or remove highlights for evaluation notes.
            </p>
          </div>

          {/* Application Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold w-1/3">Field</th>
                  <th className="text-left p-4 font-semibold">Information</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(application).map(([key, value]) => (
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

          {/* Evaluation Section */}
          <Card className="bg-gradient-to-r from-secondary/20 to-accent/20">
            <CardHeader>
              <CardTitle className="text-lg">Application Evaluation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="1-10"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">/ 10</span>
                <Button onClick={handleSubmitRating} variant="data">
                  Submit Evaluation
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Rate this application based on innovation, market potential, team capability, and business model
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default TIDEApplications;