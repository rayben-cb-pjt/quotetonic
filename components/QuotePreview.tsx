
import React from 'react';
import { ThemeConfig, AppSettings, Language, Quote, LineItem } from '../types';
import { UI_STRINGS } from '../constants';
import { Move, Maximize2, Globe } from 'lucide-react';

interface QuotePreviewProps {
  theme: ThemeConfig;
  settings: AppSettings;
  lang: Language;
  quote?: Quote; // 실제 데이터 추가
  isMini?: boolean;
  interactive?: boolean;
  onLogoMouseDown?: (e: React.MouseEvent) => void;
  onResizeMouseDown?: (e: React.MouseEvent) => void;
}

export const QuotePreview: React.FC<QuotePreviewProps> = ({ 
  theme, 
  settings, 
  lang, 
  quote,
  isMini = false,
  interactive = false,
  onLogoMouseDown,
  onResizeMouseDown
}) => {
  // Safe access with fallback
  const t = UI_STRINGS?.[lang] || UI_STRINGS?.['en'] || {
    logoLabel: 'LOGO',
    quotationTitle: 'QUOTATION',
    invoiceTitle: 'INVOICE',
    representativeLabel: 'Representative',
    billTo: 'Bill To',
    schedule: 'Schedule',
    issueDate: 'Issue Date',
    expiryDate: 'Expiry',
    dueDate: 'Due Date',
    itemDescriptionHeader: 'Description',
    qtyHeader: 'Qty',
    priceHeader: 'Price',
    discount: 'Discount',
    totalHeader: 'Total',
    companyIdentity: 'Identity',
    regNo: 'Reg No',
    bankInfo: 'Bank',
    grandTotal: 'Total',
    signature: 'Signature',
    serviceFooter: 'Footer'
  } as any;

  const isDark = theme.paperColor === '#0f172a';
  
  const fontClassMap = {
    'sans': 'font-sans',
    'serif': 'font-serif',
    'mono': 'font-fira',
    'playfair': 'font-playfair',
    'montserrat': 'font-montserrat',
    'noto': 'font-noto',
    'roboto-slab': 'font-roboto-slab'
  };
  const fontClass = fontClassMap[theme.fontFamily] || 'font-sans';
  // Use padding but remove external margins so parent controls positioning
  const paperPadding = theme.paperPadding === 'wide' ? 'p-20' : (theme.paperPadding === 'compact' ? 'p-8' : 'p-12');

  const displayClientName = quote?.clientName || (lang === 'ko' ? '샘플 고객사' : 'GLOBAL PARTNER');
  
  const sampleItems: LineItem[] = [
    {
      id: 'sample1',
      description: lang === 'ko' ? '전문 비즈니스 컨설팅 (착수금)' : 'Professional Consultation (Initial)',
      quantity: 1,
      unitPrice: 3000,
      taxRate: 10,
      discount: 0,
      discountType: 'amount'
    },
    {
      id: 'sample2',
      description: lang === 'ko' ? '웹사이트/앱 디자인 리뉴얼' : 'UI/UX Design Renewal',
      quantity: 1,
      unitPrice: 5000,
      taxRate: 10,
      discount: 10,
      discountType: 'percentage'
    },
    {
      id: 'sample3',
      description: lang === 'ko' ? '월간 유지보수 (12개월)' : 'Monthly Maintenance (12 Months)',
      quantity: 12,
      unitPrice: 500,
      taxRate: 10,
      discount: 0,
      discountType: 'amount'
    }
  ];

  const displayItems = quote?.items && quote.items.length > 0 ? quote.items : sampleItems;

  const calculateTotal = () => {
    return displayItems.reduce((acc, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discountType === 'percentage' ? itemTotal * (item.discount / 100) : item.discount;
      const tax = (itemTotal - discount) * (item.taxRate / 100);
      return acc + (itemTotal - discount + tax);
    }, 0);
  };

  const calculateRowTotal = (item: LineItem) => {
    const sub = item.quantity * item.unitPrice;
    const disc = item.discountType === 'percentage' ? sub * (item.discount / 100) : item.discount;
    return sub - disc;
  };

  const currency = quote?.currency || 'USD';
  const grandTotal = calculateTotal();
  const hasDiscount = displayItems.some(i => i.discount > 0);

  // Doc Type logic
  const isInvoice = quote?.docType === 'invoice';
  const docTitle = isInvoice ? t.invoiceTitle : t.quotationTitle;
  const dateLabel = isInvoice ? t.dueDate : t.expiryDate;

  return (
    <div 
      className={`w-[794px] min-h-[1123px] ${paperPadding} ${fontClass} relative flex flex-col transition-all duration-500 shadow-none ${isDark ? 'text-slate-100' : 'text-slate-800'} ${interactive ? 'select-none overflow-hidden' : ''}`}
      style={{ 
        backgroundColor: theme.paperColor,
      }}
    >
      {/* Watermark Pattern */}
      {theme.showWatermark && (
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none overflow-hidden" style={{ backgroundImage: `radial-gradient(${theme.primaryColor} 1.5px, transparent 0)`, backgroundSize: '32px 32px' }}></div>
      )}

      {/* Top Banner Layout */}
      {theme.headerLayout === 'banner' && (
        <div className="absolute top-0 left-0 right-0 h-40" style={{ backgroundColor: theme.primaryColor }}></div>
      )}
      
      {/* Header Section */}
      <div className={`flex relative mb-12 ${
        theme.headerLayout === 'centered' ? 'flex-col items-center text-center' : 
        theme.headerLayout === 'banner' ? 'mt-20 justify-between items-end' : 
        'justify-between items-start'
      }`}>
        
        <div className={`flex flex-col gap-8 ${theme.headerLayout === 'centered' || theme.logoAlignment === 'center' ? 'items-center' : ''} ${theme.logoAlignment === 'right' ? 'items-end' : 'items-start'}`}>
           <div 
              className={`relative group ${interactive ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
              onMouseDown={interactive ? onLogoMouseDown : undefined}
              style={{
                width: `${theme.logoSize * 1.8}px`,
                height: `${theme.logoSize * 1.2}px`,
                position: 'relative',
                left: `${theme.logoPosX || 0}px`,
                top: `${theme.logoPosY || 0}px`,
                textAlign: theme.logoAlignment,
                opacity: (theme.logoOpacity ?? 100) / 100 
              }}
           >
             {settings.companyLogo ? (
                <div className="relative w-full h-full border border-transparent hover:border-indigo-500/30 transition-colors">
                  <img 
                    src={settings.companyLogo} 
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain pointer-events-none" 
                    style={{ 
                      mixBlendMode: theme.logoBlendMode as any,
                      filter: theme.invertLogo ? 'invert(1) brightness(2)' : 'none'
                    }}
                    alt="Logo" 
                  />
                  {interactive && (
                    <>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <Move className="text-indigo-600 bg-white/90 rounded-full p-1.5 shadow-lg backdrop-blur-sm" size={24} />
                      </div>
                      <div 
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize flex items-center justify-center z-50 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 pointer-events-auto"
                        onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown && onResizeMouseDown(e); }}
                      >
                         <Maximize2 size={10} className="text-white" />
                      </div>
                    </>
                  )}
                </div>
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg border border-dashed border-slate-300">
                  <span className="text-[14px] font-black tracking-widest uppercase opacity-30">{t.logoLabel}</span>
                </div>
             )}
           </div>
           <div className="space-y-3">
             <h1 className="text-8xl font-black uppercase tracking-tighter leading-none" style={{ color: theme.primaryColor }}>{docTitle}</h1>
             <div className="text-[14px] font-black tracking-[0.5em] font-mono opacity-40 uppercase">{quote?.number || `QT-${new Date().getFullYear()}-082`}</div>
           </div>
        </div>
        
        <div className={`${theme.headerLayout === 'centered' || theme.logoAlignment === 'center' ? 'mt-16 text-center' : theme.logoAlignment === 'right' ? 'text-left' : 'text-right'} space-y-5`}>
           <div className="text-5xl font-black tracking-tighter leading-tight">{settings.companyName}</div>
           <div className="inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-black uppercase tracking-[0.2em] text-slate-500">
             {t.representativeLabel}: {settings.representativeName}
           </div>
           <div className={`flex flex-col gap-1 ${theme.logoAlignment === 'center' ? 'items-center' : theme.logoAlignment === 'right' ? 'items-start' : 'items-end'}`}>
               <div className="text-[13px] leading-relaxed font-medium opacity-70 italic">
                  {settings.companyAddress}
               </div>
               
               {/* Website Display - Updated for better visibility */}
               {settings.companyWebsite && (
                   <div 
                      className="flex items-center gap-1.5 text-[12px] font-bold opacity-80"
                      style={{ color: theme.primaryColor }}
                   >
                       <Globe size={12} /> {settings.companyWebsite}
                   </div>
               )}
           </div>
        </div>
      </div>

      {/* Bill To & Schedule Info */}
      <div className={`grid grid-cols-2 gap-24 mb-12 py-8 border-y-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="space-y-6">
           <div className="text-[13px] font-black uppercase tracking-[0.5em] opacity-40">{t.billTo}</div>
           <div className="space-y-1">
             <div className="text-4xl font-black tracking-tight uppercase">{displayClientName}</div>
             <div className="text-sm font-bold opacity-60">{quote?.clientEmail || '---'}</div>
           </div>
        </div>
        <div className="text-right space-y-6">
           <div className="text-[13px] font-black uppercase tracking-[0.5em] opacity-40">{t.schedule}</div>
           <div className="space-y-2">
             <div className="text-sm font-bold opacity-80">{t.issueDate}: {quote?.issueDate || new Date().toISOString().split('T')[0]}</div>
             <div className="text-sm font-bold opacity-80">{dateLabel}: {quote?.expiryDate || '---'}</div>
           </div>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[13px] font-black uppercase tracking-[0.3em]" style={{ color: theme.primaryColor }}>
              <th className="py-4 border-b-4">{t.itemDescriptionHeader}</th>
              <th className="py-4 border-b-4 text-center">{t.qtyHeader}</th>
              <th className="py-4 border-b-4 text-right">{t.priceHeader}</th>
              {hasDiscount && <th className="py-4 border-b-4 text-right">{t.discount}</th>}
              <th className="py-4 border-b-4 text-right">{t.totalHeader}</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-5 border-b border-slate-100">
                  <div className="font-black text-2xl uppercase">{item.description || (lang === 'ko' ? '항목 이름 없음' : 'Untitled Item')}</div>
                </td>
                <td className="py-5 border-b border-slate-100 text-center font-bold">{item.quantity}</td>
                <td className="py-5 border-b border-slate-100 text-right font-bold">{currency} {item.unitPrice.toLocaleString()}</td>
                {hasDiscount && (
                  <td className="py-5 border-b border-slate-100 text-right font-bold text-red-400">
                    {item.discount > 0 ? (
                      item.discountType === 'percentage' 
                        ? `${item.discount}%` 
                        : `- ${currency} ${item.discount.toLocaleString()}`
                    ) : '-'}
                  </td>
                )}
                <td className="py-5 border-b border-slate-100 text-right font-black text-2xl">
                  {currency} {calculateRowTotal(item).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Area */}
      <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
         <div className="space-y-4 max-w-sm">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.companyIdentity}</div>
              <div className="text-[13px] font-bold opacity-70 uppercase">{t.regNo}: {settings.companyRegNo}</div>
              <div className="text-[13px] font-bold opacity-70 uppercase">{t.bankInfo}: {settings.bankInfo}</div>
              {settings.customFields && settings.customFields.map(field => (
                  <div key={field.id} className="text-[13px] font-bold opacity-70 uppercase">
                      {field.label}: {field.value}
                  </div>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed opacity-40 italic">
              {quote?.notes || t.noteTax}
            </p>
         </div>
         <div className="text-right space-y-16">
            <div className="bg-slate-50 p-10 rounded-3xl border-4 shadow-xl" style={{ borderColor: `${theme.primaryColor}30` }}>
               <div className="text-[13px] font-black uppercase tracking-[0.5em] opacity-40 mb-3">{t.grandTotal}</div>
               <div className="text-6xl font-black" style={{ color: theme.primaryColor }}>{currency} {grandTotal.toLocaleString()}</div>
            </div>
            <div className="relative pt-12 pr-6">
               {settings.companySeal && (
                 <img src={settings.companySeal} crossOrigin="anonymous" className="absolute -top-16 right-0 w-32 h-32 object-contain opacity-90 rotate-[-15deg] transition-transform hover:rotate-0" alt="Seal" />
               )}
               <div className="flex justify-end gap-5 items-end">
                  <span className="text-[14px] font-black uppercase tracking-[0.3em] opacity-50">
                    {t.signature} {lang === 'ko' ? '(인)' : ''}
                  </span>
                  <div className="w-56 border-b-4 border-slate-300/50"></div>
               </div>
            </div>
         </div>
      </div>

      {/* Service Footer */}
      <div className="mt-8 text-center">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">{t.serviceFooter}</p>
      </div>
    </div>
  );
};
