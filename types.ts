
export type Language = 'ko' | 'en';

export type ViewState = 'DASHBOARD' | 'BUILDER' | 'TEMPLATES';

export enum QuoteStatus {
  DRAFT = 'Draft',
  FINALIZED = 'Finalized',
  WON = 'Won',
  LOST = 'Lost'
}

export type TemplateId = 'standard' | 'modern' | 'minimal' | 'bold' | 'elegant' | 'tech' | 'playful' | 'eco' | 'midnight' | 'brutalist' | 'vogue' | 'organic';

export type FontFamily = 'sans' | 'serif' | 'mono' | 'playfair' | 'montserrat' | 'noto' | 'roboto-slab';

export type TutorialLevel = 'basic' | 'pro';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  paperColor: string;
  fontFamily: FontFamily;
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  headerLayout: 'split' | 'centered' | 'banner' | 'clean';
  tableStyle: 'minimal' | 'bordered' | 'striped' | 'grid';
  accentAlpha: number;
  showWatermark: boolean;
  paperPadding: 'compact' | 'normal' | 'wide';
  logoSize: number; 
  logoOpacity: number; 
  logoAlignment: 'left' | 'center' | 'right';
  logoBlendMode: 'normal' | 'multiply' | 'screen';
  invertLogo: boolean;
  logoPosX: number; 
  logoPosY: number; 
}

export type DiscountType = 'amount' | 'percentage';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: DiscountType;
  unit?: string;
}

export interface Quote {
  id: string;
  number: string;
  docType?: 'quote' | 'invoice'; // New: Support for Invoice mode
  clientName: string;
  clientEmail: string;
  issueDate: string;
  expiryDate: string;
  currency: string;
  items: LineItem[];
  status: QuoteStatus;
  templateId: TemplateId;
  theme?: ThemeConfig;
  terms: string;
  notes: string;
  language: Language;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface AppSettings {
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultTemplateId: TemplateId;
  theme: ThemeConfig;
  companyName: string;
  representativeName: string;
  companyAddress: string;
  companyRegNo: string;
  companyEmail: string;
  companyPhone: string;
  bankInfo: string;
  companyLogo?: string;
  companySeal?: string;
  companyWebsite?: string;
  companySlogan?: string;
  businessType?: string;
  businessItem?: string;
  customFields: CustomField[];
  language: Language;
  hasSeenTutorial?: boolean;
  tutorialLevel: TutorialLevel;
  tutorialStep: number;
  monthlyGoal: number;
  defaultTerms?: string;
  defaultFooterNotes?: string;
  docNumberPrefix: string; 
  nextDocNumber: number;   
}
