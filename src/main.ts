import './index.css';
import { renderReportsTab, attachReportsTabClicks, getCreationDate } from './components/ReportsTab';

// Global CRM state interface
interface CRMState {
  currentUser: { name: string; email: string } | null;
  activeTab: 'dashboard' | 'contacts' | 'leads' | 'tasks' | 'campaigns' | 'settings' | 'reports';
  contacts: any[];
  leads: any[];
  tasks: any[];
  campaigns: any[];
  settings: {
    enterpriseName: string;
    currencySymbol: string;
    enableAI: boolean;
    leadAutoAssign: boolean;
    notifyDevs: boolean;
  };
  isLoading: boolean;
  logs: string[];
  
  // UI Modal overlays control
  showContactModal: boolean;
  showLeadModal: boolean;
  showTaskModal: boolean;
  showCampaignModal: boolean;
  showAiModal: boolean;
  
  // AI suggestions indicators
  loadingForecast: boolean;
  forecastText: string;
  suggestingSubject: boolean;
  suggestedSubjects: string[];

  // Interactive Reports Module fields
  reportType: 'day' | 'month' | 'year';
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  loadingReportAi: boolean;
  reportAiText: string;
}

const state: CRMState = {
  currentUser: null,
  activeTab: 'dashboard',
  contacts: [],
  leads: [],
  tasks: [],
  campaigns: [],
  settings: {
    enterpriseName: 'Pixel Craft India',
    currencySymbol: '₹',
    enableAI: true,
    leadAutoAssign: true,
    notifyDevs: false
  },
  isLoading: true,
  logs: ['Jerry Business CRM and Indian Sales Manager started successfully.'],
  
  showContactModal: false,
  showLeadModal: false,
  showTaskModal: false,
  showCampaignModal: false,
  showAiModal: false,
  
  loadingForecast: false,
  forecastText: '',
  suggestingSubject: false,
  suggestedSubjects: [],

  // Reports initial state
  reportType: 'month',
  selectedDate: '2026-05-26',
  selectedMonth: '2026-05',
  selectedYear: '2026',
  loadingReportAi: false,
  reportAiText: ''
};

// Check for stored customer session on launch
function initSession() {
  const session = localStorage.getItem('flowcrm_session');
  if (session) {
    try {
      state.currentUser = JSON.parse(session);
      fetchCRMBackendData();
    } catch {
      localStorage.removeItem('flowcrm_session');
    }
  }
  renderApp();
}

// Fetch lists from local Express API
function fetchCRMBackendData() {
  state.isLoading = true;
  renderApp();
  
  fetch('/api/crm/data')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      state.contacts = data.contacts || [];
      state.leads = data.leads || [];
      state.tasks = data.tasks || [];
      state.campaigns = data.campaigns || [];
      if (data.settings) {
        state.settings = data.settings;
      }
    })
    .catch(err => {
      console.error('Error loading CRM details:', err);
      logActivity('Warning: Could not connect to backend server. Please refresh.');
    })
    .finally(() => {
      state.isLoading = false;
      renderApp();
    });
}

// Log a simple user-friendly activity
function logActivity(text: string) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  state.logs.unshift(`[${timestamp}] ${text}`);
  renderApp();
}

// Render complete application layout
function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  // Render Login/Signup if user is not signed in
  if (!state.currentUser) {
    renderAuthScreen(root);
    return;
  }

  // Get simple Indian English date
  const today = new Date();
  const indianDateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Main CRM dashboard shell
  root.innerHTML = `
    <div class="min-h-screen bg-zinc-100 flex flex-col md:flex-row font-sans text-zinc-800 select-none antialiased">
      
      <!-- DESKTOP / MOBILE SIDEBAR -->
      <aside class="w-full md:w-64 bg-zinc-950 text-white flex flex-col border-r border-zinc-900 md:h-screen sticky top-0 z-30 font-sans">
        
        <!-- App Title Header -->
        <div class="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 bg-white text-zinc-950 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md border border-zinc-250">
              JC
            </div>
            <div>
              <h1 class="font-bold text-sm tracking-tight text-white leading-none">Jerry Business CRM</h1>
              <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mt-1">Indian Sales Manager</span>
            </div>
          </div>
        </div>

        <!-- Sidebar Options Navigation -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <button id="nav-dashboard" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </button>

          <button id="nav-contacts" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'contacts' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customer Book
          </button>

          <button id="nav-leads" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'leads' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Deals Pipeline
          </button>

          <button id="nav-tasks" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'tasks' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            To-Do List
          </button>

          <button id="nav-campaigns" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'campaigns' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Marketing Emails
          </button>

          <button id="nav-reports" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'reports' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            Business Reports
          </button>

          <button id="nav-settings" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            state.activeTab === 'settings' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            App Settings
          </button>
        </nav>

        <!-- Current User Info & Logout Button -->
        <div class="p-4 border-t border-zinc-900 bg-zinc-950/45 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="h-9 w-9 bg-zinc-800 text-white font-black flex items-center justify-center rounded-xl text-xs uppercase shadow-sm">
                ${state.currentUser.name ? state.currentUser.name.slice(0, 2) : 'US'}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-xs truncate text-zinc-100 leading-none">${state.currentUser.name}</p>
                <p class="text-[10px] text-zinc-500 truncate mt-1 leading-none font-medium">${state.currentUser.email}</p>
              </div>
            </div>
            <button id="btn-logout" class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all cursor-pointer" title="Log Out / Sign Out">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN WORKSPACE LAYOUT -->
      <main class="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
        
        <!-- TOP TITLE BAR -->
        <header class="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-wide">${state.activeTab} /</span>
            <h2 class="text-xs font-extrabold text-zinc-950 tracking-tight">
              ${state.settings.enterpriseName || 'My Business'} Admin Workspace
            </h2>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-1 sm:mt-0">
            <!-- Warm human date tracker -->
            <div class="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl font-medium text-[10px] text-zinc-600">
              <span class="h-1.5 w-1.5 rounded-full bg-zinc-800 animate-pulse"></span>
              Today's Date: ${indianDateStr}
            </div>

            <!-- Gemini AI Sales Assistant Trigger -->
            <button id="btn-consult-model" class="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer">
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-1.81-5.186L2 14l5.186-1.81L9 7l1.81 5.186L15 14l-5.187 1.81l-.001.094z" />
              </svg>
              Ask AI Assistant
            </button>
          </div>
        </header>

        <!-- Outlet area for active screen content -->
        <div class="flex-1 p-6 space-y-6 md:pb-16 max-w-7xl mx-auto w-full">
          ${state.isLoading ? renderProgressSpinner() : getActiveTabTemplate()}
        </div>
      </main>
    </div>

    <!-- MAIN MODALS CONTAINER -->
    ${state.showAiModal ? renderAiModal() : ''}
    ${state.showContactModal ? renderContactModal() : ''}
    ${state.showLeadModal ? renderLeadModal() : ''}
    ${state.showTaskModal ? renderTaskModal() : ''}
    ${state.showCampaignModal ? renderCampaignModal() : ''}
  `;

  // Attach event handlers
  attachWorkspaceClicks();
}

// Simple loading spinner
function renderProgressSpinner() {
  return `
    <div class="flex flex-col items-center justify-center py-28 gap-3">
      <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div>
        <span class="text-xs font-bold text-slate-700 tracking-wide block text-center">Syncing Business Data...</span>
        <span class="text-[10px] text-slate-400 mt-1 block text-center">Loading client book and Sales Pipeline figures.</span>
      </div>
    </div>
  `;
}

// Draw authentic Login / Sign up Screen
function renderAuthScreen(container: HTMLElement) {
  let isLoginMode = true;

  function drawAuthForm() {
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-zinc-100 p-4 select-none font-sans relative overflow-hidden">
        <!-- Subtle monochrome background aesthetic highlights -->
        <div class="absolute w-[400px] h-[400px] bg-zinc-200/40 rounded-full blur-3xl -top-24 -left-24"></div>
        <div class="absolute w-[400px] h-[400px] bg-zinc-300/20 rounded-full blur-3xl -bottom-24 -right-24"></div>

        <div class="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm relative z-10 flex flex-col gap-6">
          <div class="flex flex-col items-center text-center gap-1.5">
            <div class="h-11 w-11 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xs">
              JC
            </div>
            <h1 class="text-sm font-extrabold text-zinc-905 mt-2.5 font-sans">Jerry Business CRM</h1>
            <p class="text-[11px] text-zinc-500 max-w-xs leading-relaxed font-semibold">
              Quickly manage your customers, active sales deals, daily to-do tasks, and send promotional email templates.
            </p>
          </div>

          <div id="auth-alert" class="hidden text-[10px] rounded-xl p-3 border font-extrabold tracking-tight uppercase"></div>

          <form id="auth-submit-form" class="space-y-4">
            ${
              !isLoginMode ? `
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
                <input type="text" id="auth-name" placeholder="Rahul Sharma" required class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-350 focus:outline-none focus:border-zinc-800 transition-all font-semibold" />
              </div>
              ` : ''
            }
            <div class="space-y-1">
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email Address</label>
              <input type="email" id="auth-email" placeholder="rahul@pixelcraft.in" value="rahul@pixelcraft.in" required class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-350 focus:outline-none focus:border-zinc-800 transition-all font-semibold" />
            </div>
            <div class="space-y-1">
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Password</label>
              <input type="password" id="auth-password" value="Password123" placeholder="••••••••" required class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 placeholder-zinc-350 focus:outline-none focus:border-zinc-800 transition-all font-semibold" />
            </div>

            <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 border-b-2 border-zinc-950 active:border-b-0 text-white rounded-xl py-3.5 text-[11px] font-black uppercase tracking-wider shadow-xs active:scale-98 transition-all mt-6 cursor-pointer leading-none">
              ${isLoginMode ? 'Login to CRM' : 'Create My Account'}
            </button>
          </form>

          <div class="border-t border-zinc-150 pt-4 text-center">
            <button id="auth-toggle-mode" class="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer">
              ${isLoginMode ? "First time here? Create an account instantly" : "Already have a business account? Login here"}
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook forms
    const authForm = document.getElementById('auth-submit-form') as HTMLFormElement;
    const authToggleBtn = document.getElementById('auth-toggle-mode');
    const authAlert = document.getElementById('auth-alert');

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = (document.getElementById('auth-email') as HTMLInputElement).value;
        const passwordInput = (document.getElementById('auth-password') as HTMLInputElement).value;
        const nameInput = document.getElementById('auth-name') as HTMLInputElement;
        const fullName = nameInput ? nameInput.value : '';

        if (authAlert) {
          authAlert.className = "hidden";
        }

        if (isLoginMode) {
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput.trim(), password: passwordInput })
          })
          .then(async res => {
            const data = await res.json();
            if (res.ok) {
              if (authAlert) {
                authAlert.className = "block bg-zinc-900 text-white border-zinc-850 p-3 rounded-xl text-xs font-bold text-center";
                authAlert.innerText = "Password checked. Opening CRM Dashboard...";
              }
              setTimeout(() => {
                state.currentUser = { name: data.name, email: data.email };
                localStorage.setItem('flowcrm_session', JSON.stringify(state.currentUser));
                fetchCRMBackendData();
              }, 800);
            } else {
              throw new Error(data.error || 'Wrong credentials.');
            }
          })
          .catch(err => {
            if (authAlert) {
              authAlert.className = "block bg-zinc-100 text-zinc-900 border-zinc-300 p-3 rounded-xl text-xs font-semibold text-center";
              authAlert.innerText = err.message || "Connection failed. Please check backend.";
            }
          });
        } else {
          fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fullName.trim(), email: emailInput.trim(), password: passwordInput })
          })
          .then(async res => {
            const data = await res.json();
            if (res.ok) {
              if (authAlert) {
                authAlert.className = "block bg-zinc-900 text-white border-zinc-850 p-3 rounded-xl text-xs font-bold text-center";
                authAlert.innerText = "Account created successfully! Switching to Login...";
              }
              setTimeout(() => {
                isLoginMode = true;
                drawAuthForm();
              }, 1200);
            } else {
              throw new Error(data.error || 'Registration failed.');
            }
          })
          .catch(err => {
            if (authAlert) {
              authAlert.className = "block bg-zinc-100 text-zinc-950 border-zinc-305 p-3 rounded-xl text-xs font-semibold text-center";
              authAlert.innerText = err.message || "Failed to complete registration.";
            }
          });
        }
      });
    }

    if (authToggleBtn) {
      authToggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        drawAuthForm();
      });
    }
  }

  drawAuthForm();
}

// Redirect rendering based on navigation selection
function getActiveTabTemplate(): string {
  switch (state.activeTab) {
    case 'dashboard':
      return renderDashboardTab();
    case 'contacts':
      return renderContactsTab();
    case 'leads':
      return renderLeadsTab();
    case 'tasks':
      return renderTasksTab();
    case 'campaigns':
      return renderCampaignsTab();
    case 'reports':
      return renderReportsTab(state);
    case 'settings':
      return renderSettingsTab();
    default:
      return renderDashboardTab();
  }
}

// ----------------------------------------------------
// TAB 1: DASHBOARD
// ----------------------------------------------------
function renderDashboardTab(): string {
  const activeContactsCount = state.contacts.filter(c => c.status === 'Active' || c.status === 'Active Customer').length;
  const pipelineValue = state.leads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
  const taskCount = state.tasks.length;
  const completedTasksCount = state.tasks.filter(t => t.status === 'Completed').length;
  const taskRatioStr = taskCount > 0 ? `${completedTasksCount} of ${taskCount} done` : 'No tasks today';
  
  const actCmps = state.campaigns.filter(c => c.status === 'active' || c.status === 'completed');
  const avgOpenRateVal = actCmps.length > 0 
    ? (actCmps.reduce((acc, c) => acc + (Number(c.openRate) || 0), 0) / actCmps.length).toFixed(1)
    : '0.0';

  return `
    <!-- Top AI Assistant Promotional Banner -->
    <div class="p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-850 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div class="absolute top-0 right-0 w-[220px] h-[220px] bg-zinc-800/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="space-y-1 relative z-10 max-w-xl font-sans">
        <span class="text-[9px] font-black text-zinc-300 tracking-wider uppercase block">AI Suggestions Available</span>
        <h3 class="text-base font-bold text-white tracking-tight">AI Sales Assistant Sales Tips</h3>
        <p class="text-[11px] text-zinc-300 leading-relaxed mt-1 font-medium select-text">
          Let the built-in Gemini Assistant analyze your sales pipeline, suggest smart follow-up triggers, list outstanding tasks, and tip you on how to increase customer wins.
        </p>
      </div>
      <button id="btn-dashboard-consult" class="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold text-zinc-950 bg-white hover:bg-zinc-100 rounded-xl transition-all hover:scale-[1.01] shadow-xs cursor-pointer relative z-10 leading-none uppercase tracking-wider">
        Get AI Advice Now
      </button>
    </div>

    <!-- Quick Stats Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Card 1 -->
      <div class="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Customers</span>
          <p class="text-2xl font-black text-zinc-900 tracking-tight">${activeContactsCount}</p>
          <span class="text-[10px] font-semibold text-zinc-450 block mt-1">
            Listed in Client Book
          </span>
        </div>
        <div class="h-10 w-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Pipeline Deals Value</span>
          <p class="text-2xl font-black text-zinc-900 tracking-tight">₹${pipelineValue.toLocaleString('en-IN')}</p>
          <span class="text-[10px] font-semibold text-zinc-500 block mt-1 flex items-center gap-0.5">
            👥 Active potential business
          </span>
        </div>
        <div class="h-10 w-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-855 font-black text-sm">
          ₹
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Daily To-Do Tasks</span>
          <p class="text-2xl font-black text-zinc-900 tracking-tight">${taskRatioStr}</p>
          <span class="text-[10px] font-semibold text-zinc-450 block mt-1">
            Action tasks for today
          </span>
        </div>
        <div class="h-10 w-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Marketing Email Response</span>
          <p class="text-2xl font-black text-zinc-900 tracking-tight">${avgOpenRateVal}%</p>
          <span class="text-[10px] font-semibold text-zinc-450 block mt-1">
            Average Email open rates
          </span>
        </div>
        <div class="h-10 w-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5z" /></svg>
        </div>
      </div>
    </div>

    <!-- Chart & To Dos Split Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      <!-- Sales Chart -->
      <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs lg:col-span-2 space-y-4 font-sans">
        <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h4 class="font-bold text-xs text-zinc-900 tracking-tight">Sales Pipeline Status Summary</h4>
            <span class="text-[10px] text-zinc-400 block mt-0.5">Aggregated worth of client deals in each category.</span>
          </div>
          <span class="text-[10px] font-black text-zinc-900 bg-zinc-100 border border-zinc-250 px-2 py-0.5 rounded-md">Live Value Summary</span>
        </div>

        <div class="h-60 flex items-center justify-center">
          ${renderDashboardChartSvg()}
        </div>
      </div>

      <!-- Quick To-Do Preview List -->
      <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between font-sans">
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h4 class="font-bold text-xs text-zinc-900 tracking-tight">Current To-Do Tasks</h4>
              <span class="text-[10px] text-zinc-450 block mt-0.5">${state.tasks.filter(t => t.status !== 'Completed').length} tasks remaining</span>
            </div>
          </div>

          <div class="space-y-2.5 max-h-44 overflow-y-auto pr-1">
            ${
              state.tasks.length === 0 
                ? `<div class="py-12 text-center text-[11px] text-zinc-400 font-bold">All tasks completed successfully!</div>`
                : state.tasks.slice(0, 3).map(task => `
                  <div class="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-150">
                    <span class="h-1.5 w-1.5 rounded-full mt-1.5 ${task.priority === 'High' ? 'bg-zinc-900' : task.priority === 'Medium' ? 'bg-zinc-400' : 'bg-zinc-200'}"></span>
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] font-bold text-zinc-800 ${task.status === 'Completed' ? 'line-through text-zinc-400' : ''} leading-normal">${task.id === '3' ? 'Introductory call with Delta team' : task.description}</p>
                      <span class="text-[9px] font-semibold text-zinc-400 block mt-0.5">Due: ${task.dueDate}</span>
                    </div>
                  </div>
                `).join('')
            }
          </div>
        </div>

        <button id="btn-quick-tasks-jump" class="w-full text-center py-2.5 bg-zinc-50 hover:bg-zinc-100 text-[10px] text-zinc-650 hover:text-zinc-950 font-black tracking-wider uppercase rounded-xl transition-all block mt-4 border border-dashed border-zinc-300 cursor-pointer">
          Open To-Do List Page
        </button>
      </div>
    </div>
  `;
}

// Draw fully localized custom SVG SVG Chart for Pipeline Values in Rupees (Lakhs/In-EN formatting support)
function renderDashboardChartSvg(): string {
  const categories = ['New Leads', 'In Progress', 'Deals Won'];
  const labelsMap = ['New Enquiries', 'Follow-up / Meetings', 'Deals Won (Closed)'];
  
  const values = categories.map(cat => {
    return state.leads.filter(l => l.status === cat).reduce((sum, current) => sum + (Number(current.value) || 0), 0);
  });

  const maxValue = Math.max(...values, 100000);
  
  const barWidth = 55;
  const chartHeight = 150;
  const paddingLeft = 70;
  const barHeights = values.map(val => (val / maxValue) * chartHeight);

  return `
    <svg width="100%" height="100%" viewBox="0 0 450 200" class="overflow-visible font-sans select-none pointer-events-none">
      <!-- Grid lines -->
      <line x1="${paddingLeft}" y1="15" x2="420" y2="15" stroke="#e4e4e7" stroke-width="1" />
      <line x1="${paddingLeft}" y1="52" x2="420" y2="52" stroke="#e4e4e7" stroke-width="1" />
      <line x1="${paddingLeft}" y1="89" x2="420" y2="89" stroke="#e4e4e7" stroke-width="1" />
      <line x1="${paddingLeft}" y1="126" x2="420" y2="126" stroke="#e4e4e7" stroke-width="1" />
      <line x1="${paddingLeft}" y1="163" x2="420" y2="163" stroke="#a1a1aa" stroke-width="1.5" />

      <!-- Left price indicator labels in Rupees (₹ Lakh format) -->
      <text x="${paddingLeft - 10}" y="20" text-anchor="end" class="text-[9px] fill-zinc-400 font-bold">₹${(maxValue/1000).toFixed(0)}k</text>
      <text x="${paddingLeft - 10}" y="92" text-anchor="end" class="text-[9px] fill-zinc-400 font-bold">₹${((maxValue/2)/1000).toFixed(0)}k</text>
      <text x="${paddingLeft - 10}" y="167" text-anchor="end" class="text-[9px] fill-zinc-400 font-bold">₹0</text>

      <!-- Bar 1: New Enquiries -->
      <rect x="110" y="${163 - barHeights[0]}" width="${barWidth}" height="${Math.max(barHeights[0], 2)}" rx="6" class="fill-zinc-300" />
      <text x="${110 + barWidth/2}" y="${163 - barHeights[0] - 6}" text-anchor="middle" class="text-[9px] fill-zinc-950 font-extrabold">₹${(values[0]/1000).toFixed(0)}k</text>
      <text x="${110 + barWidth/2}" y="182" text-anchor="middle" class="text-[9px] fill-zinc-500 font-bold">${labelsMap[0]}</text>

      <!-- Bar 2: Follow-up -->
      <rect x="215" y="${163 - barHeights[1]}" width="${barWidth}" height="${Math.max(barHeights[1], 2)}" rx="6" class="fill-zinc-500" />
      <text x="${215 + barWidth/2}" y="${163 - barHeights[1] - 6}" text-anchor="middle" class="text-[9px] fill-zinc-950 font-extrabold">₹${(values[1]/1000).toFixed(0)}k</text>
      <text x="${215 + barWidth/2}" y="182" text-anchor="middle" class="text-[9px] fill-zinc-500 font-bold">${labelsMap[1]}</text>

      <!-- Bar 3: Deals Won -->
      <rect x="320" y="${163 - barHeights[2]}" width="${barWidth}" height="${Math.max(barHeights[2], 2)}" rx="6" class="fill-zinc-800" />
      <text x="${320 + barWidth/2}" y="${163 - barHeights[2] - 6}" text-anchor="middle" class="text-[9px] fill-zinc-950 font-extrabold">₹${(values[2]/1000).toFixed(0)}k</text>
      <text x="${320 + barWidth/2}" y="182" text-anchor="middle" class="text-[9px] fill-zinc-500 font-bold">${labelsMap[2]}</text>
    </svg>
  `;
}

// ----------------------------------------------------
// TAB 2: CLIENT BOOK (CONTACTS)
// ----------------------------------------------------
function renderContactsTab(): string {
  return `
    <div class="flex flex-col gap-6 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-zinc-900 tracking-tight">Customer Book</h3>
          <p class="text-xs text-zinc-400 mt-0.5">Keep track of all your client contacts, partners, and active lead details.</p>
        </div>
        <button id="btn-add-contact-modal" class="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer hover:scale-[1.01] transition-all uppercase tracking-wider leading-none">
          Add New Customer
        </button>
      </div>

      <div class="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-250">
              <tr>
                <th class="py-4 px-6">Name</th>
                <th class="py-4 px-6">Company / Firm Name</th>
                <th class="py-4 px-6">Email Address</th>
                <th class="py-4 px-6">Client Category</th>
                <th class="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
               ${
                 state.contacts.length === 0 
                  ? `<tr><td colspan="5" class="py-14 text-center text-zinc-400 font-semibold">No customers added yet. Click 'Add New Customer' to start!</td></tr>`
                  : state.contacts.map(c => `
                    <tr class="hover:bg-zinc-55 transition-all">
                      <td class="py-4 px-6 font-bold text-zinc-900">${c.name}</td>
                      <td class="py-4 px-6 font-semibold text-zinc-500">${c.company}</td>
                      <td class="py-4 px-6 text-zinc-400 font-mono text-[10.5px]">${c.email}</td>
                      <td class="py-4 px-6">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          c.status === 'Active' || c.status === 'Active Customer'
                            ? 'bg-zinc-800 text-white' 
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                        }">
                          ${c.status === 'Active' ? 'Active Customer' : c.status === 'Lead' ? 'New Lead' : c.status}
                        </span>
                      </td>
                      <td class="py-4 px-6 text-right">
                        <button class="btn-delete-contact text-zinc-500 hover:text-zinc-900 px-2.5 py-1 font-bold hover:bg-zinc-100 rounded-lg transition-all cursor-pointer" data-id="${c.id}">
                          Delete
                        </button>
                      </td>
                    </tr>
                  `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// TAB 3: DEALS PIPELINE (LEADS KANBAN)
// ----------------------------------------------------
function renderLeadsTab(): string {
  const columnStages = [
    { title: 'New Enquiries', status: 'New Leads', color: 'bg-zinc-100 text-zinc-900 border border-zinc-300 font-extrabold' },
    { title: 'Follow-up Meetings', status: 'In Progress', color: 'bg-zinc-800 text-white font-extrabold' },
    { title: 'Deals Done (Won)', status: 'Deals Won', color: 'bg-zinc-950 text-white border border-zinc-900 font-black' }
  ];

  return `
    <div class="flex flex-col gap-6 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-zinc-900 tracking-tight">Deals & Sales Pipeline</h3>
          <p class="text-xs text-zinc-400 mt-0.5">Control pipeline stages to turn business inquiries into successful closed contracts.</p>
        </div>
        <button id="btn-add-lead-modal" class="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer hover:scale-[1.01] transition-all uppercase tracking-wider leading-none">
          Add New Deal
        </button>
      </div>

      <!-- Live Columns Matrix Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        ${
          columnStages.map(stage => {
            const list = state.leads.filter(l => l.status === stage.status);
            return `
              <div class="bg-zinc-50/70 p-4.5 rounded-2xl flex flex-col gap-4 border border-zinc-200">
                <div class="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="inline-block px-2.5 py-0.5 text-[9px] uppercase tracking-wider rounded-lg ${stage.color}">
                      ${stage.title}
                    </span>
                    <span class="text-[10px] font-bold text-zinc-400">(${list.length})</span>
                  </div>
                </div>

                <div class="space-y-3 min-h-[350px] overflow-y-auto pr-1">
                  ${
                    list.length === 0 
                      ? `<div class="py-20 text-center text-[11px] text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">No active pipeline deals here.</div>`
                      : list.map(lead => `
                        <div class="bg-white p-4 rounded-xl border border-zinc-200 shadow-3xs flex flex-col gap-3.5 hover:shadow-xs transition-all relative">
                          <div>
                            <span class="text-[9px] font-bold text-zinc-600 tracking-wide uppercase block">${lead.company}</span>
                            <h4 class="font-extrabold text-[12px] text-zinc-950 tracking-tight mt-1 leading-snug">${lead.title === 'Enterprise Web Modernization' ? 'Website Design & Development' : lead.title === 'CRM Expansion Contract' ? 'CRM Software Upgrade' : lead.title === 'Interactive Analytics Plugin' ? 'Custom Payment Integration' : lead.title}</h4>
                          </div>

                          <div class="flex items-center justify-between border-t border-zinc-100 pt-3">
                            <span class="text-xs font-black text-zinc-900">₹${Number(lead.value).toLocaleString('en-IN')}</span>
                            
                            <div class="flex items-center gap-1">
                              <button class="btn-progress-lead p-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 hover:text-zinc-950 transition-all cursor-pointer" data-id="${lead.id}" title="Move to next sales stage">
                                <span class="text-[10px] font-black tracking-wide flex items-center gap-1">Stage <svg class="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></span>
                              </button>
                              <button class="btn-delete-lead p-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer" data-id="${lead.id}">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      `).join('')
                  }
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// TAB 4: LIST OF TO-DO ACTIVITIES
// ----------------------------------------------------
function renderTasksTab(): string {
  return `
    <div class="flex flex-col gap-6 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-zinc-900 tracking-tight">Daily Tasks & To-Do List</h3>
          <p class="text-xs text-zinc-400 mt-0.5">Plan and mark off daily to-do checklist tasks to secure contract wins.</p>
        </div>
        <button id="btn-add-task-modal" class="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer hover:scale-[1.01] transition-all uppercase tracking-wider leading-none">
          Add New Task
        </button>
      </div>

      <div class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
        ${
          state.tasks.length === 0 
            ? `<div class="py-16 text-center text-zinc-400 font-bold">Awesome! Your checklist is empty. Take a short tea break.</div>`
            : state.tasks.map(task => `
              <div class="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-150 hover:border-zinc-200/90 rounded-xl transition-all">
                <div class="flex items-start gap-3.5">
                  <input type="checkbox" ${task.status === 'Completed' ? 'checked' : ''} class="checkbox-task-toggle h-4.5 w-4.5 border-zinc-300 rounded text-zinc-900 mt-0.5 cursor-pointer" data-id="${task.id}" />
                  <div>
                    <p class="text-xs font-bold text-zinc-805 ${task.status === 'Completed' ? 'line-through text-zinc-400 font-medium' : ''} leading-normal">
                      ${task.description === 'Review custom pricing proposal with Priya' ? 'Discuss pricing with Priya Sharma' : task.description === 'Setup initial onboarding demo call' ? 'Product demo call with Delta team' : task.description}
                    </p>
                    <div class="flex items-center gap-3 mt-1 flex-wrap">
                      <span class="inline-block px-2.5 py-0.5 rounded-md text-[8.5px] font-extrabold ${
                        task.priority === 'High' 
                          ? 'bg-zinc-900 text-white' 
                          : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                      }">
                        ${task.priority} Priority
                      </span>
                      <span class="text-[10px] font-semibold text-zinc-400">Due Date: ${task.dueDate}</span>
                    </div>
                  </div>
                </div>

                <button class="btn-delete-task text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 px-2.5 py-1.5 font-bold rounded-lg transition-all cursor-pointer" data-id="${task.id}">
                  Delete
                </button>
              </div>
            `).join('')
        }
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// TAB 5: MARKETING EMAILS (CAMPAIGNS)
// ----------------------------------------------------
function renderCampaignsTab(): string {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      <!-- Left side outreach drafts -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-zinc-900 tracking-tight">Email Marketing & Offers</h3>
            <p class="text-xs text-zinc-400 mt-0.5">Template and launch massive festival sales offers or newsletters to your enquiries.</p>
          </div>
          <button id="btn-add-campaign-modal" class="whitespace-nowrap px-4 py-2.5 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer hover:scale-[1.01] transition-all uppercase tracking-wider leading-none">
            Create Campaign
          </button>
        </div>

        <div class="space-y-4">
          ${
            state.campaigns.length === 0 
              ? `<div class="bg-white border border-zinc-200 shadow-2xs rounded-2xl py-16 text-center text-zinc-400 font-bold">No outreach email drafts created yet.</div>`
              : state.campaigns.map(c => `
                <div class="bg-white border border-zinc-200 shadow-2xs p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative hover:border-zinc-300 transition-all">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-xs text-zinc-900 tracking-tight leading-none">${c.name === 'Spring Enterprise Outreach' ? 'Festive Season Marketing Offer' : c.name === 'Product Update Beta Invites' ? 'Product Feature Beta Launch' : c.name === 'Retargeting Cool Pipelines' ? 'Old Lead Follow-up Alert' : c.name}</h4>
                      <span class="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${
                        c.status === 'active' 
                          ? 'bg-zinc-900 text-white' 
                          : c.status === 'scheduled' 
                            ? 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                            : 'bg-zinc-50 text-zinc-400 border border-zinc-200'
                      }">
                        ${c.status === 'active' ? 'Sent' : c.status}
                      </span>
                    </div>

                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[9px] font-extrabold text-zinc-800 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md whitespace-nowrap">${c.targetSegment}</span>
                      <span class="text-[9px] font-semibold text-zinc-450 truncate max-w-[260px] inline-block">Subject: ${c.subject}</span>
                    </div>

                    <!-- Small analytic counters -->
                    <div class="flex items-center gap-5 pt-1 max-w-sm">
                      <div class="text-left">
                        <span class="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider block">Sent To</span>
                        <p class="text-[11px] font-bold text-zinc-900 leading-tight mt-0.5">${Number(c.sentCount).toLocaleString()}</p>
                      </div>
                      <div class="text-left">
                        <span class="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider block">Open Rate</span>
                        <p class="text-[11px] font-bold text-zinc-900 leading-tight mt-0.5">${c.openRate}%</p>
                      </div>
                      <div class="text-left">
                        <span class="text-[8.5px] font-bold text-zinc-400 uppercase tracking-wider block">Click Rate</span>
                        <p class="text-[11px] font-bold text-zinc-900 leading-tight mt-0.5">${c.clickRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 self-end sm:self-center">
                    ${c.status === 'draft' ? `
                      <button class="btn-launch-campaign whitespace-nowrap px-3.5 py-2 text-[9px] font-black bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 leading-none uppercase tracking-wider">
                        Send Now
                      </button>
                    ` : ''}
                    <button class="btn-delete-campaign p-2.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-200" data-id="${c.id}">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              `).join('')
          }
        </div>
      </div>

      <!-- Right side real-time email helper log -->
      <div class="bg-zinc-900 text-zinc-200 p-5 rounded-2xl shadow-md border border-zinc-850 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-zinc-300 animate-ping"></span>
              <span class="text-[9px] font-black uppercase tracking-widest text-zinc-300">Sent Campaign Updates</span>
            </div>
          </div>

          <div class="space-y-2 max-h-[280px] overflow-y-auto text-[10px] leading-relaxed text-zinc-305 select-text font-sans">
            ${
              state.logs.map(log => `
                <div class="border-b border-zinc-800/40 pb-1.5 last:border-0 hover:text-white transition-colors">
                  ${log.replace('Jerry CRM Platform securely initialized with persistent node connections.', 'Jerry Business CRM system started successfully.')}
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="pt-3 border-t border-zinc-800 text-right mt-6">
          <span class="text-[8.5px] font-black tracking-widest text-zinc-400 block uppercase">Jerry Business Tools</span>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------
// TAB 6: SETTINGS
// ----------------------------------------------------
function renderSettingsTab(): string {
  return `
    <div class="max-w-2xl bg-white border border-zinc-200 shadow-2xs rounded-2xl p-6 space-y-6 font-sans">
      <div>
        <h3 class="text-base font-bold text-zinc-900 tracking-tight">App Preferences & Settings</h3>
        <p class="text-xs text-zinc-400 mt-0.5">Configure your branding name, select your currency settings, or reboot your dashboard.</p>
      </div>

      <form id="settings-submit-form" class="space-y-5">
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Company / Shop Name</label>
          <input type="text" id="set-branding" value="${state.settings.enterpriseName}" required class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Default Currency Symbol</label>
          <input type="text" id="set-currency" value="${state.settings.currencySymbol}" required class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
        </div>

        <div class="space-y-3 pt-2">
          <!-- Toggle 1 -->
          <div class="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <span class="text-xs font-bold text-zinc-800 block">Enable Gemini AI Assistant</span>
              <span class="text-[10px] font-medium text-zinc-400 block mt-0.5">Let Google GenAI smart models give sales advice and draft email subjects.</span>
            </div>
            <input type="checkbox" id="set-ai" ${state.settings.enableAI ? 'checked' : ''} class="h-4.5 w-4.5 border-zinc-300 rounded text-zinc-900 cursor-pointer" />
          </div>

          <!-- Toggle 2 -->
          <div class="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <span class="text-xs font-bold text-zinc-800 block">Auto-Assign New Enquiries</span>
              <span class="text-[10px] font-medium text-zinc-400 block mt-0.5">Automatically distribute fresh leads evenly to active colleagues.</span>
            </div>
            <input type="checkbox" id="set-assign" ${state.settings.leadAutoAssign ? 'checked' : ''} class="h-4.5 w-4.5 border-zinc-300 rounded text-zinc-900 cursor-pointer" />
          </div>

          <!-- Toggle 3 -->
          <div class="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <span class="text-xs font-bold text-zinc-800 block">Slack Alerts & Notifications</span>
              <span class="text-[10px] font-medium text-zinc-400 block mt-0.5">Send a quick ping to your Slack channel on any client updates.</span>
            </div>
            <input type="checkbox" id="set-webhook" ${state.settings.notifyDevs ? 'checked' : ''} class="h-4.5 w-4.5 border-zinc-300 rounded text-zinc-900 cursor-pointer" />
          </div>
        </div>

        <div class="flex items-center gap-3 pt-4 border-t border-zinc-100">
          <button type="submit" class="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-black tracking-wider uppercase rounded-xl py-3.5 text-[10px] shadow-xs cursor-pointer text-center hover:scale-[1.01] transition-all">
            Save Brand Details
          </button>
          
          <button type="button" id="btn-hard-reset" class="px-4 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-[10px] font-black uppercase text-zinc-700 rounded-xl transition-all cursor-pointer border border-zinc-300 leading-none">
            Reset All Data & Log out
          </button>
        </div>
      </form>
    </div>
  `;
}

// ----------------------------------------------------
// PORTALS: MODALS DOCK
// ----------------------------------------------------

// 1. AI Assistant Advisory Modal Portal
function renderAiModal(): string {
  return `
    <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
        
        <div class="p-4 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-900">
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-300 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-zinc-300"></span>
            </span>
            <span class="font-extrabold text-[10px] uppercase tracking-wider text-zinc-100">AI Sales Analyst Advice</span>
          </div>
          <button id="btn-close-ai-modal" class="py-1.5 px-3 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer leading-none">
            Close Panel
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-zinc-700 flex-1 select-text">
          ${
            state.loadingForecast 
              ? `
                <div class="py-20 flex flex-col items-center justify-center gap-3">
                  <div class="w-8 h-8 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
                  <div class="text-center">
                    <span class="text-xs font-bold text-zinc-900 uppercase tracking-wider block">Analyzing Sales Pipeline...</span>
                    <span class="text-[10px] text-zinc-400 mt-1 block">Consulting Gemini 3.5 Assistant models</span>
                  </div>
                </div>
              `
              : `
                <div class="space-y-3 font-sans">
                  <div class="p-4 bg-zinc-50 text-zinc-950 rounded-xl border border-zinc-200 leading-relaxed font-sans">
                    ${formatAssistantMarkdownTextToHtml(state.forecastText)}
                  </div>
                </div>
              `
          }
        </div>

        <div class="p-3 bg-zinc-50 border-t border-zinc-150 flex items-center justify-between font-medium text-[9px] text-zinc-400">
          <span>Secure Business Advisory Panel</span>
          <span class="uppercase">Powered by Google Gemini</span>
        </div>
      </div>
    </div>
  `;
}

// Safe clean markdown formatter
function formatAssistantMarkdownTextToHtml(md: string): string {
  if (!md) return "AI Report is compiling. Please wait.";
  let html = md;
  // Replace bold markers
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-zinc-950">$1</strong>');
  // Replace headers
  html = html.replace(/###\s+(.+)/g, '<h4 class="font-extrabold text-xs text-zinc-950 tracking-tight mt-3 mb-1 first:mt-0">$1</h4>');
  // Split paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h4')) return p;
    return `<p class="mb-2.5 last:mb-0 leading-normal text-zinc-700">${p.trim()}</p>`;
  }).join('');
  return html;
}

// 2. Add New Client / Customer Modal
function renderContactModal(): string {
  return `
    <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-scale-up">
        
        <div class="p-4.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-900">
          <span class="font-bold text-xs uppercase tracking-wider text-zinc-100">Add New Customer Record</span>
          <button id="btn-close-contact-modal" class="py-1 px-3 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer leading-none">
            Close
          </button>
        </div>

        <form id="contact-modal-form" class="p-6 space-y-4 text-left">
          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Full Name</label>
            <input type="text" id="mc-name" required placeholder="Rajesh Kumar" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Company / Corporate Body</label>
            <input type="text" id="mc-company" required placeholder="Mumbai Design Studio" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Email Address</label>
            <input type="email" id="mc-email" placeholder="rajesh@pixelcraft.in" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Client Category</label>
            <select id="mc-status" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold cursor-pointer">
              <option value="Active">Active Customer</option>
              <option value="Lead" selected>New Lead enquiry</option>
              <option value="Inactive">Inactive Ledger</option>
            </select>
          </div>

          <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl py-3 text-xs shadow-md cursor-pointer block text-center transition-all mt-6 active:scale-95 leading-none">
            Save Customer Details
          </button>
        </form>
      </div>
    </div>
  `;
}

// 3. Add New Sales Pipeline Deal Modal
function renderLeadModal(): string {
  return `
    <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-scale-up">
        
        <div class="p-4.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-900">
          <span class="font-bold text-xs uppercase tracking-wider text-zinc-100">Add New Sales Deal</span>
          <button id="btn-close-lead-modal" class="py-1 px-3 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer leading-none">
            Close
          </button>
        </div>

        <form id="lead-modal-form" class="p-6 space-y-4 text-left">
          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Deal Name / Project Title</label>
            <input type="text" id="ml-title" required placeholder="App Design & Development Contract" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Customer / Company Name</label>
            <input type="text" id="ml-company" required placeholder="Mumbai Design Studio" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Expected Deal Value (₹)</label>
            <input type="number" id="ml-value" required placeholder="150000" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold"  />
          </div>

          <div class="space-y-1 block">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Deal Stage</label>
            <select id="ml-status" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold cursor-pointer">
              <option value="New Leads" selected>New Inquiry</option>
              <option value="In Progress">Meetings / Follow-up</option>
              <option value="Deals Won">Deal Done (Closed)</option>
            </select>
          </div>

          <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl py-3 text-xs shadow-md cursor-pointer block text-center transition-all mt-6 active:scale-95 leading-none">
            Add Deal to Pipeline
          </button>
        </form>
      </div>
    </div>
  `;
}

// 4. Add To-Do Task Modal Portal
function renderTaskModal(): string {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return `
    <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-scale-up">
        
        <div class="p-4.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-900">
          <span class="font-bold text-xs uppercase tracking-wider text-zinc-105">Add Daily To-Do Task</span>
          <button id="btn-close-task-modal" class="py-1 px-3 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer leading-none">
            Close
          </button>
        </div>

        <form id="task-modal-form" class="p-6 space-y-4 text-left">
          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Task Description / Agenda</label>
            <input type="text" id="mt-desc" required placeholder="Follow up with Priya regarding final software pricing" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Final Date / Due Date</label>
            <input type="date" id="mt-duedate" required value="${tomorrowStr}" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1 flex flex-col">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Task Priority</label>
            <select id="mt-priority" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold cursor-pointer select-none">
              <option value="High" selected>High priority response</option>
              <option value="Medium">Medium priority</option>
              <option value="Low">Low priority task</option>
            </select>
          </div>

          <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl py-3 text-xs shadow-md cursor-pointer block text-center transition-all mt-6 active:scale-95 leading-none">
            Save Task
          </button>
        </form>
      </div>
    </div>
  `;
}

// 5. Create Draft Outreach Campaign Modal Portal
function renderCampaignModal(): string {
  return `
    <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-scale-up">
        
        <div class="p-4.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-900">
          <span class="font-bold text-xs uppercase tracking-wider text-zinc-100">Draft Email Marketing Campaign</span>
          <button id="btn-close-campaign-modal" class="py-1 px-3 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer leading-none">
            Close
          </button>
        </div>

        <form id="campaign-modal-form" class="p-6 space-y-4 text-left">
          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Campaign Name</label>
            <input type="text" id="mcp-name" required placeholder="Festive Season Discount Alert" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          <div class="space-y-1">
            <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Target Customer segment</label>
            <select id="mcp-segment" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold cursor-pointer">
              <option value="High-Value Leads" selected>High-Value Leads Portfolio</option>
              <option value="Active Customers">Active Customers Book</option>
              <option value="Stalled Prospects">Stalled enquiries</option>
            </select>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between gap-1 mb-1">
              <label class="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Email Subject Line</label>
              
              <button type="button" id="btn-campaign-suggest" class="flex items-center gap-1.5 text-[9px] font-black text-zinc-800 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1.5 border border-zinc-200 rounded-lg cursor-pointer transition-all">
                <svg class="w-3 h-3 text-zinc-650 ${state.suggestingSubject ? 'animate-spin' : ''}" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9.813 15.904L9 21l-1.81-5.186L2 14l5.186-1.81L9 7l1.81 5.186L15 14l-5.187 1.81l-.001.094z"/></svg>
                ${state.suggestingSubject ? 'Thinking...' : 'AI Subject Ideas'}
              </button>
            </div>
            
            <input type="text" id="mcp-subject" required placeholder="Exclusive discount offer inside!" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-zinc-950 transition-all font-semibold" />
          </div>

          ${
            state.suggestedSubjects && state.suggestedSubjects.length > 0 
              ? `
                <div class="p-3 bg-zinc-100 rounded-xl border border-dashed border-zinc-300 space-y-2 mt-2">
                  <span class="text-[8.5px] font-black text-zinc-800 uppercase block tracking-wider">AI Suggestions (Click any to select):</span>
                  <div class="space-y-1 text-[10px] text-zinc-700 font-medium font-sans">
                    ${
                      state.suggestedSubjects.map((sub, index) => `
                        <button type="button" class="btn-opt-subject w-full text-left p-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-all text-xs truncate cursor-pointer block leading-none font-bold text-zinc-800" data-subj="${sub}">
                          Idea ${index+1}: "${sub}"
                        </button>
                      `).join('')
                    }
                  </div>
                </div>
              `
              : ''
          }

          <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl py-3 text-xs shadow-md cursor-pointer block text-center transition-all mt-6 active:scale-95 leading-none">
            Save Campaign Draft
          </button>
        </form>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// CLICK EVENTS CONTROLLER
// ----------------------------------------------------
function attachWorkspaceClicks() {
  
  // Navigation trigger
  const tabIds: ('dashboard' | 'contacts' | 'leads' | 'tasks' | 'campaigns' | 'settings' | 'reports')[] = ['dashboard', 'contacts', 'leads', 'tasks', 'campaigns', 'settings', 'reports'];
  tabIds.forEach(tab => {
    const btn = document.getElementById(`nav-${tab}`);
    if (btn) {
      btn.addEventListener('click', () => {
        state.activeTab = tab;
        renderApp();
      });
    }
  });

  // Logout trigger
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      state.currentUser = null;
      localStorage.removeItem('flowcrm_session');
      renderApp();
    });
  }

  // AI Assistant trigger from top Datebar
  const btnConsult = document.getElementById('btn-consult-model');
  if (btnConsult) {
    btnConsult.addEventListener('click', () => {
      triggerAIForecast();
    });
  }

  // AI banner trigger on dashboard
  const btnDbConsult = document.getElementById('btn-dashboard-consult');
  if (btnDbConsult) {
    btnDbConsult.addEventListener('click', () => {
      triggerAIForecast();
    });
  }

  // To-Do list redirection page handler
  const btnQuickTasks = document.getElementById('btn-quick-tasks-jump');
  if (btnQuickTasks) {
    btnQuickTasks.addEventListener('click', () => {
      state.activeTab = 'tasks';
      renderApp();
    });
  }

  // Close AI popup
  const btnCloseAi = document.getElementById('btn-close-ai-modal');
  if (btnCloseAi) {
    btnCloseAi.addEventListener('click', () => {
      state.showAiModal = false;
      renderApp();
    });
  }

  // Customer List triggers
  const btnAddContactModal = document.getElementById('btn-add-contact-modal');
  if (btnAddContactModal) {
    btnAddContactModal.addEventListener('click', () => {
      state.showContactModal = true;
      renderApp();
    });
  }
  const btnCloseContactModal = document.getElementById('btn-close-contact-modal');
  if (btnCloseContactModal) {
    btnCloseContactModal.addEventListener('click', () => {
      state.showContactModal = false;
      renderApp();
    });
  }
  const contactForm = document.getElementById('contact-modal-form') as HTMLFormElement;
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = (document.getElementById('mc-name') as HTMLInputElement).value;
      const compVal = (document.getElementById('mc-company') as HTMLInputElement).value;
      const emailVal = (document.getElementById('mc-email') as HTMLInputElement).value;
      const statusVal = (document.getElementById('mc-status') as HTMLSelectElement).value;

      fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal.trim(),
          company: compVal.trim(),
          email: emailVal.trim() || `${nameVal.toLowerCase().replace(/\s+/g, '')}@${compVal.toLowerCase().replace(/\s+/g, '')}.in`,
          status: statusVal
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(newCustomer => {
        state.contacts.unshift(newCustomer);
        state.showContactModal = false;
        logActivity(`Added customer profile "${nameVal}" to client directory.`);
      })
      .catch(() => logActivity('Failed to save customer record. Please try again.'));
    });
  }

  // Delete Customer record triggers
  const deleteCButtons = document.querySelectorAll('.btn-delete-contact');
  deleteCButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;
      
      fetch(`/api/crm/contacts/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error();
          state.contacts = state.contacts.filter(c => c.id !== id);
          logActivity('Successfully deleted customer profile.');
        })
        .catch(() => logActivity('Failed to complete delete request.'));
    });
  });

  // Leads pipeline add overlay triggers
  const btnAddLeadModal = document.getElementById('btn-add-lead-modal');
  if (btnAddLeadModal) {
    btnAddLeadModal.addEventListener('click', () => {
      state.showLeadModal = true;
      renderApp();
    });
  }
  const btnCloseLeadModal = document.getElementById('btn-close-lead-modal');
  if (btnCloseLeadModal) {
    btnCloseLeadModal.addEventListener('click', () => {
      state.showLeadModal = false;
      renderApp();
    });
  }
  const leadForm = document.getElementById('lead-modal-form') as HTMLFormElement;
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleVal = (document.getElementById('ml-title') as HTMLInputElement).value;
      const compVal = (document.getElementById('ml-company') as HTMLInputElement).value;
      const amountVal = Number((document.getElementById('ml-value') as HTMLInputElement).value) || 0;
      const stageVal = (document.getElementById('ml-status') as HTMLSelectElement).value;

      fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleVal,
          company: compVal,
          value: amountVal,
          status: stageVal
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(newDeal => {
        state.leads.unshift(newDeal);
        state.showLeadModal = false;
        logActivity(`Created active pipeline card "${titleVal}" for ${compVal}.`);
      })
      .catch(() => logActivity('Failed to record deal entry.'));
    });
  }

  // Kanban shift to next stages controllers
  const cycleStageButtons = document.querySelectorAll('.btn-progress-lead');
  cycleStageButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;
      
      const leadObj = state.leads.find(l => l.id === id);
      if (!leadObj) return;

      let nextStatus = 'New Leads';
      if (leadObj.status === 'New Leads') nextStatus = 'In Progress';
      else if (leadObj.status === 'In Progress') nextStatus = 'Deals Won';
      else if (leadObj.status === 'Deals Won') nextStatus = 'New Leads';

      fetch(`/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(updatedDeal => {
        state.leads = state.leads.map(l => l.id === id ? updatedDeal : l);
        logActivity(`Moved deal stage to: "${nextStatus === 'In Progress' ? 'Follow-up' : nextStatus === 'Deals Won' ? 'Closed/Won' : 'New Enquiry'}"`);
      })
      .catch(() => logActivity('Failed to update deal parameters.'));
    });
  });

  // Delete lead cards
  const deleteLeadButtons = document.querySelectorAll('.btn-delete-lead');
  deleteLeadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;
      
      fetch(`/api/crm/leads/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error();
          state.leads = state.leads.filter(l => l.id !== id);
          logActivity('Successfully removed deal card.');
        })
        .catch(() => logActivity('Failed to delete deal reference.'));
    });
  });

  // Action checkboxes to complete/pending task
  const taskChecks = document.querySelectorAll('.checkbox-task-toggle');
  taskChecks.forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = (e.currentTarget as HTMLInputElement).dataset.id;
      if (!id) return;

      const currentTask = state.tasks.find(t => t.id === id);
      if (!currentTask) return;

      const targetStatus = currentTask.status === 'Completed' ? 'Pending' : 'Completed';

      fetch(`/api/crm/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(updatedTask => {
        state.tasks = state.tasks.map(t => t.id === id ? updatedTask : t);
        logActivity(`Updated Checklist: ${updatedTask.description} is now ${targetStatus === 'Completed' ? 'done' : 'pending'}.`);
      })
      .catch(() => logActivity('Failed to update task status.'));
    });
  });

  // Action Task triggers
  const btnAddTaskModal = document.getElementById('btn-add-task-modal');
  if (btnAddTaskModal) {
    btnAddTaskModal.addEventListener('click', () => {
      state.showTaskModal = true;
      renderApp();
    });
  }
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
  if (btnCloseTaskModal) {
    btnCloseTaskModal.addEventListener('click', () => {
      state.showTaskModal = false;
      renderApp();
    });
  }
  const taskModalForm = document.getElementById('task-modal-form') as HTMLFormElement;
  if (taskModalForm) {
    taskModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inDesc = (document.getElementById('mt-desc') as HTMLInputElement).value;
      const inDate = (document.getElementById('mt-duedate') as HTMLInputElement).value;
      const inPrio = (document.getElementById('mt-priority') as HTMLSelectElement).value;

      fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: inDesc,
          dueDate: inDate,
          priority: inPrio
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(savedTask => {
        state.tasks.unshift(savedTask);
        state.showTaskModal = false;
        logActivity(`Added task to your To-Do checklist.`);
      })
      .catch(() => logActivity('Failed to store task action.'));
    });
  }

  // Delete task checklists buttons
  const deleteTaskButtons = document.querySelectorAll('.btn-delete-task');
  deleteTaskButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;
      
      fetch(`/api/crm/tasks/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error();
          state.tasks = state.tasks.filter(t => t.id !== id);
          logActivity('Successfully removed task checklist.');
        })
        .catch(() => logActivity('Failed to delete task.'));
    });
  });

  // Campaign create triggers
  const btnAddCmpModal = document.getElementById('btn-add-campaign-modal');
  if (btnAddCmpModal) {
    btnAddCmpModal.addEventListener('click', () => {
      state.showCampaignModal = true;
      state.suggestedSubjects = [];
      renderApp();
    });
  }
  const btnCloseCmpModal = document.getElementById('btn-close-campaign-modal');
  if (btnCloseCmpModal) {
    btnCloseCmpModal.addEventListener('click', () => {
      state.showCampaignModal = false;
      state.suggestedSubjects = [];
      renderApp();
    });
  }
  const cForm = document.getElementById('campaign-modal-form') as HTMLFormElement;
  if (cForm) {
    cForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = (document.getElementById('mcp-name') as HTMLInputElement).value;
      const segVal = (document.getElementById('mcp-segment') as HTMLSelectElement).value;
      const subVal = (document.getElementById('mcp-subject') as HTMLInputElement).value;

      fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal.trim(),
          targetSegment: segVal,
          subject: subVal.trim()
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(newCampaign => {
        state.campaigns.unshift(newCampaign);
        state.showCampaignModal = false;
        state.suggestedSubjects = [];
        logActivity(`Created campaign draft: "${nameVal}"`);
      })
      .catch(() => logActivity('Failed to record campaign draft.'));
    });
  }

  // Launch campaign dispatched triggers
  const launchCampaignCampaignBtn = document.querySelectorAll('.btn-launch-campaign');
  launchCampaignCampaignBtn.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;

      fetch(`/api/crm/campaigns/${id}/launch`, { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(updatedCampaign => {
          state.campaigns = state.campaigns.map(c => c.id === id ? updatedCampaign : c);
          logActivity(`Successfully dispatched campaign bulk emails for: "${updatedCampaign.name}"`);
        })
        .catch(() => logActivity('Failed to execute email dispatch.'));
    });
  });

  // Delete campaigns
  const deleteCmpButtons = document.querySelectorAll('.btn-delete-campaign');
  deleteCmpButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).dataset.id;
      if (!id) return;

      fetch(`/api/crm/campaigns/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error();
          state.campaigns = state.campaigns.filter(c => c.id !== id);
          logActivity('Successfully deleted campaign.');
        })
        .catch(() => logActivity('Failed to delete campaign reference.'));
    });
  });

  // Preferences form saves
  const settingsForm = document.getElementById('settings-submit-form') as HTMLFormElement;
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bVal = (document.getElementById('set-branding') as HTMLInputElement).value;
      const cVal = (document.getElementById('set-currency') as HTMLInputElement).value;
      const aiVal = (document.getElementById('set-ai') as HTMLInputElement).checked;
      const assignVal = (document.getElementById('set-assign') as HTMLInputElement).checked;
      const slackVal = (document.getElementById('set-webhook') as HTMLInputElement).checked;

      fetch('/api/crm/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseName: bVal.trim(),
          currencySymbol: cVal.trim(),
          enableAI: aiVal,
          leadAutoAssign: assignVal,
          notifyDevs: slackVal
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        state.settings = data;
        logActivity('App preferences updated and saved successfully.');
        alert('Branding and settings updated successfully!');
      })
      .catch(() => logActivity('Failed to record updated preferences.'));
    });
  }

  // Hard Reset variables wipes
  const btnHardReset = document.getElementById('btn-hard-reset');
  if (btnHardReset) {
    btnHardReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out, clear your session, and reset all lists? This wipes the local cache.')) {
        localStorage.removeItem('flowcrm_session');
        window.location.reload();
      }
    });
  }

  // Gemini Subject generator triggers
  const btnCampaignSuggest = document.getElementById('btn-campaign-suggest');
  if (btnCampaignSuggest) {
    btnCampaignSuggest.addEventListener('click', () => {
      const nameInput = document.getElementById('mcp-name') as HTMLInputElement;
      const segmentSelect = document.getElementById('mcp-segment') as HTMLSelectElement;
      const draftInput = document.getElementById('mcp-subject') as HTMLInputElement;

      const campaignName = nameInput ? nameInput.value.trim() : '';
      const targetSegment = segmentSelect ? segmentSelect.value : 'High-Value Leads';
      const draftSubject = draftInput ? draftInput.value.trim() : '';

      if (!campaignName) {
        alert('Please enter a Campaign Name first, so AI knows the context of your email!');
        return;
      }

      state.suggestingSubject = true;
      renderApp();

      fetch('/api/ai/suggest-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          targetSegment,
          draftSubject
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data.options && data.options.length > 0) {
          state.suggestedSubjects = data.options;
          logActivity(`✨ Gemini AI crafted 3 friendly subject suggestions!`);
        } else {
          logActivity('Failed to generate results. Defaults are loaded.');
        }
      })
      .catch(() => {
        logActivity('Problem connecting with Gemini API server endpoint.');
      })
      .finally(() => {
        state.suggestingSubject = false;
        renderApp();
      });
    });
  }

  // Inject suggestion selection into subject fields
  const btnSubjectIdeas = document.querySelectorAll('.btn-opt-subject');
  btnSubjectIdeas.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subjText = (e.currentTarget as HTMLButtonElement).dataset.subj;
      const mcpInput = document.getElementById('mcp-subject') as HTMLInputElement;
      if (subjText && mcpInput) {
        mcpInput.value = subjText;
        logActivity(`Selected AI Idea: "${subjText}"`);
      }
    });
  });

  // Attach reports module specific clicks
  if (state.activeTab === 'reports') {
    attachReportsTabClicks(state, renderApp, logActivity);
  }
}

// Open AI Sales Advisory advice portal (Gemini API server model prompt)
function triggerAIForecast() {
  state.showAiModal = true;
  state.loadingForecast = true;
  renderApp();

  fetch('/api/ai/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => {
    if (!res.ok) throw new Error();
    return res.json();
  })
  .then(data => {
    state.forecastText = data.forecast || '### AI Report Ready\n\nSales outlook is highly optimal for this month.';
  })
  .catch(() => {
    state.forecastText = '### Failed to access Gemini Advisory node\n\nPlease ensure your server.ts and process.env.GEMINI_API_KEY parameters match criteria.';
  })
  .finally(() => {
    state.loadingForecast = false;
    renderApp();
  });
}

// Window load trigger
window.addEventListener('DOMContentLoaded', () => {
  initSession();
});

// Run immediate session check
initSession();
