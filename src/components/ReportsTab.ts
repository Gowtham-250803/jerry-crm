// Day-Wise, Monthly, and Yearly Reporting Module for Jerry Business CRM

// Helper to format Indian currency values
export function formatRupees(num: number): string {
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

// Helper to determine the creation date of CRM objects
export function getCreationDate(id: string, defaultDate: string = '2026-05-26'): string {
  if (id.startsWith('contact-')) {
    const ms = Number(id.replace('contact-', ''));
    if (!isNaN(ms)) {
      return new Date(ms).toISOString().split('T')[0];
    }
  }
  if (id.startsWith('lead-')) {
    const ms = Number(id.replace('lead-', ''));
    if (!isNaN(ms)) {
      return new Date(ms).toISOString().split('T')[0];
    }
  }
  if (id.startsWith('task-')) {
    const ms = Number(id.replace('task-', ''));
    if (!isNaN(ms)) {
      return new Date(ms).toISOString().split('T')[0];
    }
  }
  if (id.startsWith('cmp-')) {
    const ms = Number(id.replace('cmp-', ''));
    if (!isNaN(ms)) {
      return new Date(ms).toISOString().split('T')[0];
    }
  }

  // Fallback dates for initial template items to populate mock data
  if (id === '1') return '2026-05-15';
  if (id === '2') return '2026-05-21';
  if (id === '3') return '2026-04-10';
  if (id === '4') return '2025-11-12';

  return defaultDate;
}

// Generate reports interface
export function renderReportsTab(state: any): string {
  const rt = state.reportType || 'month';
  const currency = state.settings.currencySymbol || '₹';

  // 1. Gather filtered datasets based on report type
  let filteredContacts: any[] = [];
  let filteredLeads: any[] = [];
  let filteredTasks: any[] = [];
  let periodLabel = '';

  if (rt === 'day') {
    const targetDate = state.selectedDate || '2026-05-26';
    periodLabel = new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id) === targetDate);
    filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id) === targetDate);
    filteredTasks = state.tasks.filter((t: any) => t.dueDate === targetDate || getCreationDate(t.id) === targetDate);
  } else if (rt === 'month') {
    const targetMonth = state.selectedMonth || '2026-05'; // YYYY-MM
    const [year, month] = targetMonth.split('-');
    const opt: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    periodLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', opt);

    filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetMonth));
    filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetMonth));
    filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetMonth)) || getCreationDate(t.id).startsWith(targetMonth));
  } else {
    const targetYear = state.selectedYear || '2026';
    periodLabel = `Year ${targetYear}`;

    filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetYear));
    filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetYear));
    filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetYear)) || getCreationDate(t.id).startsWith(targetYear));
  }

  // 2. Compute telemetry aggregated key indicators
  const totalAcquisitions = filteredContacts.length;
  const leadsCreatedCount = filteredLeads.length;
  const totalLeadsValue = filteredLeads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);
  
  const wonLeadsList = filteredLeads.filter((l: any) => l.status === 'Deals Won');
  const totalWonValue = wonLeadsList.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);
  const totalWonCount = wonLeadsList.length;

  const pendingLeadsList = filteredLeads.filter((l: any) => l.status !== 'Deals Won');
  const totalPendingValue = pendingLeadsList.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);

  const completedTasksCount = filteredTasks.filter((t: any) => t.status === 'Completed').length;
  const totalTasksCount = filteredTasks.length;
  const tasksDoneRatioStr = totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount} Completed` : '0/0 Tasks';
  const taskPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // 3. Render precise responsive SVG timeline charts based on active timeframe
  let svgChartMarkup = '';
  if (rt === 'day') {
    // Show surrounding 7 Days timeline (selectedDate +/- 3 days)
    const baseDate = new Date(state.selectedDate || '2026-05-26');
    const dayLabels: string[] = [];
    const dayValues: number[] = [];

    for (let i = -3; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const yyyymmdd = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      const dayLeadsValue = state.leads
        .filter((l: any) => getCreationDate(l.id) === yyyymmdd)
        .reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);

      dayLabels.push(dayName);
      dayValues.push(dayLeadsValue);
    }

    const maxValue = Math.max(...dayValues, 10000);
    const chartHeight = 160;
    const barWidth = 40;
    const gap = 30;

    svgChartMarkup = `
      <div class="h-56 w-full flex items-end justify-between px-4 pb-6 pt-2 font-mono text-[9px] text-zinc-500 select-none">
        ${dayValues.map((val, idx) => {
          const heightPercent = Math.min((val / maxValue) * 100, 100);
          const barHeight = Math.max((heightPercent / 100) * chartHeight, 4);
          const isSelected = idx === 3; // Selected day is the center point
          return `
            <div class="flex flex-col items-center gap-2 flex-1 group relative">
              <!-- Tooltip on hover -->
              <div class="absolute -top-8 bg-zinc-900 text-white rounded px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10 font-sans pointer-events-none">
                Pipeline: ${formatRupees(val)}
              </div>
              
              <!-- Value Bar -->
              <div class="w-10 rounded-t-lg transition-all duration-500 hover:scale-x-105 ${isSelected ? 'bg-zinc-800 shadow-lg' : 'bg-zinc-200 hover:bg-zinc-400'}" style="height: ${barHeight}px"></div>
              
              <!-- Date Label -->
              <span class="font-sans font-bold text-[10px] mt-2 ${isSelected ? 'text-zinc-900 font-extrabold pb-0.5 border-b-2 border-zinc-900' : 'text-zinc-500'}">
                ${dayLabels[idx]}
              </span>
              <span class="text-[8px] font-medium text-slate-405 leading-none">
                ${val > 0 ? formatRupees(val) : '₹0'}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (rt === 'month') {
    // Show Weekly trends of the month divided in 4 segments
    const targetMonth = state.selectedMonth || '2026-05';
    const [year, month] = targetMonth.split('-').map(Number);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const weeks = [
      { name: 'Wk 1 (1-7)', start: 1, end: 7, value: 0 },
      { name: 'Wk 2 (8-14)', start: 8, end: 14, value: 0 },
      { name: 'Wk 3 (15-21)', start: 15, end: 21, value: 0 },
      { name: 'Wk 4 (22-31)', start: 22, end: totalDaysInMonth, value: 0 }
    ];

    weeks.forEach(wk => {
      const wkLeads = state.leads.filter((l: any) => {
        const cDate = getCreationDate(l.id);
        if (!cDate.startsWith(targetMonth)) return false;
        const day = Number(cDate.split('-')[2]);
        return day >= wk.start && day <= wk.end;
      });
      wk.value = wkLeads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);
    });

    const maxVal = Math.max(...weeks.map(w => w.value), 20000);
    
    // Line chart coordinate definitions
    const width = 600;
    const height = 150;
    const points = weeks.map((wk, idx) => {
      const x = 50 + idx * 160;
      const y = height - (Math.min((wk.value / maxVal) * 100, 100) / 100) * (height - 30);
      return { x, y, name: wk.name, value: wk.value };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    svgChartMarkup = `
      <div class="relative w-full overflow-x-auto select-none pt-4 pb-2">
        <svg class="w-full min-w-[550px] overflow-visible" height="${height + 40}" viewBox="0 0 ${width} ${height + 20}">
          <!-- Horizontal Grid Lines -->
          <line x1="20" y1="${height}" x2="${width - 20}" y2="${height}" stroke="#e2e8f0" stroke-dasharray="4" />
          <line x1="20" y1="${height / 2}" x2="${width - 20}" y2="${height / 2}" stroke="#f1f5f9" stroke-dasharray="4" />
          <line x1="20" y1="30" x2="${width - 20}" y2="30" stroke="#f1f5f9" stroke-dasharray="4" />

          <!-- Dynamic SVG Areas -->
          <polyline fill="none" stroke="#18181b" stroke-width="3" stroke-linecap="round" points="${polylinePoints}" />
          
          <!-- Area shadow fill -->
          <polygon fill="url(#zinc-grad)" opacity="0.1" points="50,${height} ${polylinePoints} ${50 + 3 * 160},${height}" />

          <!-- Points circles & texts labels -->
          ${points.map((p, idx) => `
            <g class="group cursor-pointer">
              <circle cx="${p.x}" cy="${p.y}" r="6" fill="#27272a" stroke="#ffffff" stroke-width="2.5" class="transition-all group-hover:r-8" />
              <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="10" fill="#18181b">
                ${formatRupees(p.value)}
              </text>
              <text x="${p.x}" y="${height + 20}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="9" fill="#52525b">
                ${p.name}
              </text>
            </g>
          `).join('')}

          <defs>
            <linearGradient id="zinc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#27272a" />
              <stop offset="100%" stop-color="#27272a" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    `;
  } else {
    // Yearly breakdown by 12 Months
    const months = [
      { name: 'Jan', key: '01', value: 0 },
      { name: 'Feb', key: '02', value: 0 },
      { name: 'Mar', key: '03', value: 0 },
      { name: 'Apr', key: '04', value: 0 },
      { name: 'May', key: '05', value: 0 },
      { name: 'Jun', key: '06', value: 0 },
      { name: 'Jul', key: '07', value: 0 },
      { name: 'Aug', key: '08', value: 0 },
      { name: 'Sep', key: '09', value: 0 },
      { name: 'Oct', key: '10', value: 0 },
      { name: 'Nov', key: '11', value: 0 },
      { name: 'Dec', key: '12', value: 0 }
    ];

    const targetYear = state.selectedYear || '2026';
    months.forEach(m => {
      const matcher = `${targetYear}-${m.key}`;
      const mLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(matcher));
      m.value = mLeads.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);
    });

    const maxValue = Math.max(...months.map(m => m.value), 40000);
    const chartHeight = 150;

    svgChartMarkup = `
      <div class="h-56 w-full flex items-end justify-between px-2 pb-6 pt-2 font-mono text-[9px] text-slate-400 select-none overflow-x-auto md:overflow-visible">
        ${months.map((m) => {
          const heightPercent = Math.min((m.value / maxValue) * 100, 100);
          const barHeight = Math.max((heightPercent / 100) * chartHeight, 4);
          return `
            <div class="flex flex-col items-center gap-1.5 flex-1 min-w-[32px] group relative mx-0.5">
              <!-- Value Bar -->
              <div class="w-full max-w-[20px] rounded-t bg-gradient-to-t from-zinc-400 to-zinc-700 transition-all duration-300 hover:scale-x-110" style="height: ${barHeight}px" title="${m.name}: ${formatRupees(m.value)}"></div>
              
              <!-- Label -->
              <span class="font-sans font-bold text-[9px] mt-1.5 text-zinc-600 leading-none">
                ${m.name}
              </span>
              <span class="text-[7.5px] font-medium text-zinc-500 mt-0.5 leading-none">
                ${m.value > 0 ? (m.value >= 100000 ? `${(m.value / 100000).toFixed(1)}L` : `${Math.round(m.value / 1000)}k`) : '0'}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 4. Detailed reports screen template injection
  return `
    <div class="space-y-6">

      <!-- HEADER ACTION SELECTORS -->
      <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-zinc-900 bg-zinc-100 border border-zinc-250 px-2.5 py-1 rounded-md">Telemetry Hub</span>
          <h3 class="text-base font-bold text-zinc-900 tracking-tight mt-2.5">Interactive Sales & Customers Ledger</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Select a scale and target index period to filter business indicators day-wise, monthly, or yearly.</p>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          <!-- Interval pill group -->
          <div class="flex items-center bg-zinc-100 p-0.75 rounded-2xl border border-zinc-200">
            <button id="btn-rep-day" class="px-3.5 py-2 text-[10px] uppercase font-extrabold rounded-xl transition-all cursor-pointer ${rt === 'day' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}">
              Day-Wise
            </button>
            <button id="btn-rep-month" class="px-3.5 py-2 text-[10px] uppercase font-extrabold rounded-xl transition-all cursor-pointer ${rt === 'month' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}">
              Monthly
            </button>
            <button id="btn-rep-year" class="px-3.5 py-2 text-[10px] uppercase font-extrabold rounded-xl transition-all cursor-pointer ${rt === 'year' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}">
              Yearly
            </button>
          </div>

          <!-- Active pickers -->
          <div class="flex items-center gap-1.5">
            ${rt === 'day' 
              ? `<input type="date" id="rep-date-picker" value="${state.selectedDate}" class="bg-zinc-50 border border-zinc-250 text-xs font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:border-zinc-900 text-zinc-700" />`
              : rt === 'month'
                ? `<input type="month" id="rep-month-picker" value="${state.selectedMonth}" class="bg-zinc-50 border border-zinc-250 text-xs font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:border-zinc-900 text-zinc-700" />`
                : `<select id="rep-year-picker" class="bg-zinc-50 border border-zinc-250 text-xs font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:border-zinc-900 text-zinc-700 cursor-pointer">
                    <option value="2026" ${state.selectedYear === '2026' ? 'selected' : ''}>Year 2026</option>
                    <option value="2025" ${state.selectedYear === '2025' ? 'selected' : ''}>Year 2025</option>
                    <option value="2024" ${state.selectedYear === '2024' ? 'selected' : ''}>Year 2024</option>
                   </select>`
            }
          </div>

        </div>
      </div>

      <!-- MAIN METRICS COMPANION BENTO GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Metric box 1 -->
        <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Client Registrations</span>
            <div class="p-2 bg-zinc-100 text-zinc-800 rounded-xl border border-zinc-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
          </div>
          <div class="mt-4">
            <span class="text-2xl font-extrabold text-zinc-900 tracking-tight block">${totalAcquisitions}</span>
            <span class="text-[10px] font-semibold text-zinc-455 block mt-1">Acquisitions in ${periodLabel}</span>
          </div>
        </div>

        <!-- Metric box 2 -->
        <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active Deals Value</span>
            <div class="p-2 bg-zinc-105 text-zinc-800 rounded-xl border border-zinc-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <div class="mt-4">
            <span class="text-2xl font-extrabold text-zinc-900 tracking-tight block">${currency}${totalLeadsValue.toLocaleString('en-IN')}</span>
            <span class="text-[10px] font-semibold text-zinc-455 block mt-1">${leadsCreatedCount} deals added this period</span>
          </div>
        </div>

        <!-- Metric box 3 -->
        <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Revenue Closed/Won</span>
            <div class="p-2 bg-zinc-900 text-white rounded-xl border border-zinc-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div class="mt-4">
            <span class="text-2xl font-extrabold text-zinc-900 tracking-tight block">${currency}${totalWonValue.toLocaleString('en-IN')}</span>
            <span class="text-[10px] font-semibold text-zinc-500 block mt-1">${totalWonCount} deals completed successfully</span>
          </div>
        </div>

        <!-- Metric box 4 -->
        <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">CRM Checklist Progress</span>
            <div class="p-2 bg-zinc-100 text-zinc-800 rounded-xl border border-zinc-250">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
            </div>
          </div>
          <div class="mt-4 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-extrabold text-zinc-800">${tasksDoneRatioStr}</span>
              <span class="font-bold text-zinc-900">${taskPercent}%</span>
            </div>
            <div class="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div class="bg-zinc-800 h-full rounded-full transition-all duration-500" style="width: ${taskPercent}%"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- VISUAL TREND CHART PANEL (SVG) -->
      <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs">
        <div class="border-b border-zinc-100 pb-3 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Trend Comparison Graph</span>
            <h4 class="text-xs font-extrabold text-zinc-900 tracking-tight">Active Leads Generation Pipeline Values</h4>
          </div>
          <span class="text-[10px] font-semibold text-zinc-900 bg-zinc-100 border border-zinc-250 px-2 py-0.5 rounded-md">Interactive Visualizer</span>
        </div>

        <div class="mt-4">
          ${svgChartMarkup}
        </div>
      </div>

      <!-- PRIMARY PERIOD LEDGER GRID (PRINTABLE TABLE) -->
      <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden" id="printable-ledger-region">
        <div class="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400">Business Records ledger</span>
            <h4 class="text-xs font-extrabold text-slate-900 tracking-tight">Itemized Transactions / Registrations during ${periodLabel}</h4>
          </div>

          <!-- Download / Print buttons -->
          <div class="flex items-center gap-2">
            <button id="btn-export-csv" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download CSV
            </button>

            <button id="btn-print-ledger" class="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-[10px] font-black tracking-wide uppercase shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print PDF Ledger
            </button>
          </div>
        </div>

        <!-- Ledger Table container -->
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-700 border-collapse whitespace-nowrap">
            <thead>
              <tr class="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-400 text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4 rounded-l-xl">Record Scale</th>
                <th class="py-3 px-4">Item Name / Title</th>
                <th class="py-3 px-4">Associated Client / Company</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Timeline Index</th>
                <th class="py-3 px-4 text-right rounded-r-xl">Financial Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 font-medium text-zinc-600">
              
              <!-- CONTACTS -->
              ${filteredContacts.map(c => `
                <tr class="hover:bg-zinc-55 transition-colors">
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-[9px] font-extrabold uppercase border border-zinc-200">Customer</span>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-zinc-900">${c.name}</td>
                  <td class="py-3.5 px-4 text-zinc-500">${c.company}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 text-[9px] font-black rounded-lg ${c.status === 'Active' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-100 text-zinc-500'}">
                      ${c.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[10px] text-zinc-400">${getCreationDate(c.id)}</td>
                  <td class="py-3.5 px-4 text-right text-zinc-400">-</td>
                </tr>
              `).join('')}

              <!-- LEADS/DEALS -->
              ${filteredLeads.map(l => `
                <tr class="hover:bg-zinc-55 transition-colors">
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-md bg-zinc-200 text-zinc-900 text-[9px] font-extrabold uppercase border border-zinc-300">Active Deal</span>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-zinc-900">${l.title}</td>
                  <td class="py-3.5 px-4 text-zinc-500">${l.company}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 text-[9px] font-black rounded-lg ${l.status === 'Deals Won' ? 'bg-zinc-800 text-white' : l.status === 'In Progress' ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-50 text-zinc-400'}">
                      ${l.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[10px] text-slate-400">${getCreationDate(l.id)}</td>
                  <td class="py-3.5 px-4 text-right font-bold text-slate-800">${formatRupees(l.value)}</td>
                </tr>
              `).join('')}

              <!-- TASKS -->
              ${filteredTasks.map(t => `
                <tr class="hover:bg-zinc-55 transition-colors">
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-[9px] font-extrabold uppercase border border-zinc-200">Checklist Task</span>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-zinc-900">${t.description}</td>
                  <td class="py-3.5 px-4 text-zinc-500">-</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 text-[9px] font-black rounded-lg ${t.status === 'Completed' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-800 border border-zinc-300'}">
                      ${t.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[10px] text-zinc-500">${t.dueDate || getCreationDate(t.id)}</td>
                  <td class="py-3.5 px-4 text-right text-zinc-400">-</td>
                </tr>
              `).join('')}

              ${filteredContacts.length === 0 && filteredLeads.length === 0 && filteredTasks.length === 0 
                ? `
                  <tr>
                    <td colspan="6" class="text-center py-10">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <svg class="w-8 h-8 text-zinc-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span class="text-xs font-bold text-zinc-400">No telemetry log registry records found for ${periodLabel}.</span>
                      </div>
                    </td>
                  </tr>
                `
                : ''
              }

            </tbody>
          </table>
        </div>
      </div>

      <!-- GEMINI ADVISOR AI INTELLIGENCE SYSTEM -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <!-- Subtle monochrome layout elements -->
        <div class="absolute w-48 h-48 bg-zinc-500/5 rounded-full blur-2xl -bottom-10 -left-10 pointer-events-none"></div>

        <div class="space-y-2 max-w-xl relative z-10">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-1.81-5.186L2 14l5.186-1.81L9 7l1.81 5.186L15 14l-5.187 1.81l-.001.094z" /></svg>
            <span class="text-[9px] font-extrabold uppercase tracking-widest text-zinc-300">Executive AI Advisor</span>
          </div>
          <h4 class="text-base font-bold tracking-tight">Generate Gemini Strategic Advisor Ledger Insight Report</h4>
          <p class="text-zinc-350 text-xs">Let Gemini flash models cross-evaluate new client sign-ups, checklist ratio completions, and sales estimates to provide smart diagnostic executive reviews.</p>
          
          <!-- AI report loader and dynamic text -->
          ${state.loadingReportAi 
            ? `
              <div class="py-6 flex items-center gap-3">
                <div class="w-5 h-5 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                <span class="text-[11px] font-bold text-zinc-300">Gemini model is scanning telemetry variables...</span>
              </div>
            `
            : state.reportAiText 
              ? `
                <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-4.5 mt-4 text-xs leading-relaxed text-zinc-100 font-medium select-text max-h-[350px] overflow-y-auto whitespace-pre-line font-sans prose prose-invert">
                  ${state.reportAiText}
                </div>
              `
              : ''
          }
        </div>

        <button id="btn-trigger-ai-report" class="whitespace-nowrap px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-black rounded-xl text-xs uppercase shadow-md active:scale-95 transition-all cursor-pointer relative z-10 leading-none">
          ✨ Analyze telemetry with Gemini
        </button>
      </div>

    </div>
  `;
}

// Attach clicking listeners of reports tabs and actions
export function attachReportsTabClicks(state: any, renderApp: () => void, logActivity: (text: string) => void) {
  
  // 1. Time scale togglers
  const btnDay = document.getElementById('btn-rep-day');
  if (btnDay) {
    btnDay.addEventListener('click', () => {
      state.reportType = 'day';
      renderApp();
    });
  }

  const btnMonth = document.getElementById('btn-rep-month');
  if (btnMonth) {
    btnMonth.addEventListener('click', () => {
      state.reportType = 'month';
      renderApp();
    });
  }

  const btnYear = document.getElementById('btn-rep-year');
  if (btnYear) {
    btnYear.addEventListener('click', () => {
      state.reportType = 'year';
      renderApp();
    });
  }

  // 2. Date input indicators change listeners
  const datePicker = document.getElementById('rep-date-picker') as HTMLInputElement;
  if (datePicker) {
    datePicker.addEventListener('change', () => {
      state.selectedDate = datePicker.value;
      renderApp();
    });
  }

  const monthPicker = document.getElementById('rep-month-picker') as HTMLInputElement;
  if (monthPicker) {
    monthPicker.addEventListener('change', () => {
      state.selectedMonth = monthPicker.value;
      renderApp();
    });
  }

  const yearPicker = document.getElementById('rep-year-picker') as HTMLSelectElement;
  if (yearPicker) {
    yearPicker.addEventListener('change', () => {
      state.selectedYear = yearPicker.value;
      renderApp();
    });
  }

  // 3. Trigger dynamic executive reports via server Gemini API
  const btnTriggerAi = document.getElementById('btn-trigger-ai-report');
  if (btnTriggerAi) {
    btnTriggerAi.addEventListener('click', () => {
      const rt = state.reportType || 'month';
      
      // Select exact period string
      let periodLabel = '';
      let filteredContacts = [];
      let filteredLeads = [];
      let filteredTasks = [];

      if (rt === 'day') {
        const targetDate = state.selectedDate || '2026-05-26';
        periodLabel = new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id) === targetDate);
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id) === targetDate);
        filteredTasks = state.tasks.filter((t: any) => t.dueDate === targetDate || getCreationDate(t.id) === targetDate);
      } else if (rt === 'month') {
        const targetMonth = state.selectedMonth || '2026-05';
        const [year, month] = targetMonth.split('-');
        periodLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetMonth));
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetMonth));
        filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetMonth)) || getCreationDate(t.id).startsWith(targetMonth));
      } else {
        const targetYear = state.selectedYear || '2026';
        periodLabel = `Year ${targetYear}`;
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetYear));
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetYear));
        filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetYear)) || getCreationDate(t.id).startsWith(targetYear));
      }

      const totalAcquisitions = filteredContacts.length;
      const leadsCreatedCount = filteredLeads.length;
      
      const wonLeadsList = filteredLeads.filter((l: any) => l.status === 'Deals Won');
      const totalWonValue = wonLeadsList.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);

      const pendingLeadsList = filteredLeads.filter((l: any) => l.status !== 'Deals Won');
      const totalPendingValue = pendingLeadsList.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0);

      const completedTasksCount = filteredTasks.filter((t: any) => t.status === 'Completed').length;
      const totalTasksCount = filteredTasks.length;
      const tasksDoneStr = `${completedTasksCount} done out of ${totalTasksCount}`;

      // Start loading
      state.loadingReportAi = true;
      renderApp();

      fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: rt,
          selectedPeriod: periodLabel,
          acquisitions: totalAcquisitions,
          leadsCreated: leadsCreatedCount,
          wonValue: totalWonValue,
          pendingValue: totalPendingValue,
          tasksDone: tasksDoneStr
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        state.reportAiText = data.report || 'Telemetry variables analyzed successfully.';
        logActivity(`✨ Gemini successfully analyzed business results for ${periodLabel}.`);
      })
      .catch(() => {
        state.reportAiText = '### Failed to fetch report\nConnection to Gemini assistant is busy right now. Please try again.';
      })
      .finally(() => {
        state.loadingReportAi = false;
        renderApp();
      });
    });
  }

  // 4. Download Comma Separated CSV
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const rt = state.reportType || 'month';
      let filteredContacts: any[] = [];
      let filteredLeads: any[] = [];
      let filteredTasks: any[] = [];
      let periodLabel = '';

      if (rt === 'day') {
        const targetDate = state.selectedDate || '2026-05-26';
        periodLabel = targetDate;
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id) === targetDate);
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id) === targetDate);
        filteredTasks = state.tasks.filter((t: any) => t.dueDate === targetDate || getCreationDate(t.id) === targetDate);
      } else if (rt === 'month') {
        const targetMonth = state.selectedMonth || '2026-05';
        periodLabel = targetMonth;
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetMonth));
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetMonth));
        filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetMonth)) || getCreationDate(t.id).startsWith(targetMonth));
      } else {
        const targetYear = state.selectedYear || '2026';
        periodLabel = targetYear;
        filteredContacts = state.contacts.filter((c: any) => getCreationDate(c.id).startsWith(targetYear));
        filteredLeads = state.leads.filter((l: any) => getCreationDate(l.id).startsWith(targetYear));
        filteredTasks = state.tasks.filter((t: any) => (t.dueDate && t.dueDate.startsWith(targetYear)) || getCreationDate(t.id).startsWith(targetYear));
      }

      // Generate clean CSV String
      let csvContent = `Jerry Business CRM Report Ledger - ${periodLabel}\n\n`;
      csvContent += `Record Scale,Item Name,Client / Company,Status,Date,Value\n`;

      // Contacts
      filteredContacts.forEach(c => {
        csvContent += `Customer,"${c.name.replace(/"/g, '""')}","${c.company.replace(/"/g, '""')}","${c.status}",${getCreationDate(c.id)},0\n`;
      });

      // Leads
      filteredLeads.forEach(l => {
        csvContent += `Active Deal,"${l.title.replace(/"/g, '""')}","${l.company.replace(/"/g, '""')}","${l.status}",${getCreationDate(l.id)},${l.value}\n`;
      });

      // Tasks
      filteredTasks.forEach(t => {
        csvContent += `Checklist Task,"${t.description.replace(/"/g, '""')}",-,"${t.status}",${t.dueDate || getCreationDate(t.id)},0\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Jerry_CRM_Report_${periodLabel}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logActivity(`Downloaded CSV report ledger for ${periodLabel}.`);
    });
  }

  // 5. Print PDF Ledger
  const btnPrintLedger = document.getElementById('btn-print-ledger');
  if (btnPrintLedger) {
    btnPrintLedger.addEventListener('click', () => {
      // Open clean minimal print layout or native window print
      const printableArea = document.getElementById('printable-ledger-region');
      if (printableArea) {
        const backupContent = document.body.innerHTML;
        const printContent = printableArea.innerHTML;
        
        // Render custom polished printable statement view
        document.body.innerHTML = `
          <div style="font-family: sans-serif; padding: 40px; color: #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; mb: 30px;">
              <div>
                <h1 style="margin: 0; font-size: 24px; color: #0f172a;">Jerry Business CRM Ledger Statement</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Telemetry audit reports generated for ${state.settings.enterpriseName}</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0; font-size: 14px; color: #4338ca;">Indian Sales Workspace Statement</h3>
                <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">Printed at: ${new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div style="margin-top: 30px;">
              ${printContent}
            </div>

            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Generated securely on Pixel Craft Workspace.
            </div>
          </div>
        `;

        window.print();
        
        // Restore document
        window.location.reload();
      }
    });
  }
}
