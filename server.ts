import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
import { supabase } from './src/lib/supabase';

(async () => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*');

  console.log('Supabase Test:', data, error);
})();

// Initialize server-side Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3500; // Vite proxies to 3000, we run on 3000 (wait, let's keep it 3000 as requested by environment constraints)
const SE_PORT = 3001;

app.use(express.json());

// File Database path
const DB_PATH = path.join(process.cwd(), 'database.json');

// Interface definition for data persistence
interface DBStore {
  users: any[];
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
}

// Default initial database records with Rupee (₹) symbols and Indian contexts
const initialDB: DBStore = {
  users: [
    { name: 'Rahul Sharma', email: 'rahul@pixelcraft.in', password: 'Password123' }
  ],
  contacts: [
    { id: '1', name: 'Rajesh Kumar', company: 'Pixel Craft India', status: 'Active', email: 'rajesh@pixelcraft.in' },
    { id: '2', name: 'Priya Sharma', company: 'Mumbai Design Studio', status: 'Lead', email: 'priya@designstudio.in' },
    { id: '3', name: 'Amit Patel', company: 'Patel Tech Services', status: 'Active', email: 'amit@pateltech.co.in' },
    { id: '4', name: 'Ananya Rao', company: 'Delta Finance Bengaluru', status: 'Inactive', email: 'ananya@deltafinance.co.in' }
  ],
  leads: [
    { id: '1', title: 'Website Design & Development', value: 150000, status: 'In Progress', company: 'Pixel Craft India' },
    { id: '2', title: 'CRM Software Upgrade', value: 350000, status: 'New Leads', company: 'Mumbai Design Studio' },
    { id: '3', title: 'Custom Payment Integration', value: 85000, status: 'Deals Won', company: 'Patel Tech Services' }
  ],
  tasks: [
    { id: '1', description: 'Discuss pricing with Priya Sharma', dueDate: '2026-05-30', priority: 'High', status: 'In Progress' },
    { id: '2', description: 'Send contract copy to Rajesh Kumar', dueDate: '2026-06-03', priority: 'Medium', status: 'Pending' },
    { id: '3', description: 'Product demo call with Delta team', dueDate: '2026-05-28', priority: 'Low', status: 'Completed' }
  ],
  campaigns: [
    {
      id: 'cmp-1',
      name: 'Festive Season Marketing Offer',
      status: 'active',
      sentCount: 1240,
      openRate: 64.2,
      clickRate: 18.5,
      subject: 'Special 20% discount on software services this festive season!',
      targetSegment: 'High-Value Leads'
    },
    {
      id: 'cmp-2',
      name: 'Product Feature Beta Launch',
      status: 'scheduled',
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      subject: 'Be the first to try out our new customer support features',
      scheduledTime: '2026-06-01 10:00 AM',
      targetSegment: 'Active Customers'
    },
    {
      id: 'cmp-3',
      name: 'Old Lead Follow-up Alert',
      status: 'completed',
      sentCount: 840,
      openRate: 41.8,
      clickRate: 9.3,
      subject: 'Are you still looking for a CRM solution?',
      targetSegment: 'Stalled Prospects'
    }
  ],
  settings: {
    enterpriseName: 'Pixel Craft India',
    currencySymbol: '₹',
    enableAI: true,
    leadAutoAssign: true,
    notifyDevs: false
  }
};

// Database read helper
function readDB(): DBStore {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return initialDB;
  }
}

// Database write helper
function writeDB(data: DBStore) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving data to database file:', err);
  }
}

// Auth API Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (user) {
    res.json({ name: user.name, email: user.email });
  } else {
    res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter your name, email, and password.' });
  }

  const db = readDB();
  const userExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    return res.status(409).json({ error: 'This email is already registered.' });
  }

  const newUser = { name, email, password };
  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ success: true, user: { name, email } });
});

// GET complete CRM data
app.get('/api/crm/data', (req, res) => {
  const db = readDB();
  res.json({
    contacts: db.contacts,
    leads: db.leads,
    tasks: db.tasks,
    campaigns: db.campaigns,
    settings: db.settings
  });
});

// Contacts (Customers) APIs
app.post('/api/crm/contacts', (req, res) => {
  const db = readDB();
  const newContact = {
    id: `contact-${Date.now()}`,
    name: req.body.name,
    company: req.body.company,
    status: req.body.status || 'Lead',
    email: req.body.email
  };
  db.contacts.unshift(newContact);
  writeDB(db);
  res.status(201).json(newContact);
});

app.delete('/api/crm/contacts/:id', (req, res) => {
  const db = readDB();
  db.contacts = db.contacts.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, message: 'Customer record deleted successfully.' });
});

// Leads (Sales Pipeline) APIs
app.post('/api/crm/leads', (req, res) => {
  const db = readDB();
  const newLead = {
    id: `lead-${Date.now()}`,
    title: req.body.title,
    value: Number(req.body.value) || 0,
    status: req.body.status || 'New Leads',
    company: req.body.company
  };
  db.leads.unshift(newLead);
  writeDB(db);
  res.status(201).json(newLead);
});

app.patch('/api/crm/leads/:id', (req, res) => {
  const db = readDB();
  db.leads = db.leads.map(lead => {
    if (lead.id === req.params.id) {
      return { ...lead, ...req.body };
    }
    return lead;
  });
  writeDB(db);
  const updatedLead = db.leads.find(l => l.id === req.params.id);
  res.json(updatedLead);
});

app.delete('/api/crm/leads/:id', (req, res) => {
  const db = readDB();
  db.leads = db.leads.filter(l => l.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Tasks (To-Dos) APIs
app.post('/api/crm/tasks', (req, res) => {
  const db = readDB();
  const newTask = {
    id: `task-${Date.now()}`,
    description: req.body.description,
    dueDate: req.body.dueDate,
    priority: req.body.priority || 'Medium',
    status: req.body.status || 'Pending'
  };
  db.tasks.unshift(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

app.patch('/api/crm/tasks/:id', (req, res) => {
  const db = readDB();
  db.tasks = db.tasks.map(task => {
    if (task.id === req.params.id) {
      return { ...task, ...req.body };
    }
    return task;
  });
  writeDB(db);
  const updatedTask = db.tasks.find(t => t.id === req.params.id);
  res.json(updatedTask);
});

app.delete('/api/crm/tasks/:id', (req, res) => {
  const db = readDB();
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Campaigns (Offers) APIs
app.post('/api/crm/campaigns', (req, res) => {
  const db = readDB();
  const newCmp = {
    id: `cmp-${Date.now()}`,
    name: req.body.name,
    status: 'draft',
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    subject: req.body.subject,
    targetSegment: req.body.targetSegment
  };
  db.campaigns.unshift(newCmp);
  writeDB(db);
  res.status(201).json(newCmp);
});

app.post('/api/crm/campaigns/:id/launch', (req, res) => {
  const db = readDB();
  db.campaigns = db.campaigns.map(c => {
    if (c.id === req.params.id) {
      return {
        ...c,
        status: 'active',
        sentCount: c.sentCount + 1500,
        openRate: Math.round((45 + Math.random() * 25) * 10) / 10,
        clickRate: Math.round((8 + Math.random() * 12) * 10) / 10
      };
    }
    return c;
  });
  writeDB(db);
  const launched = db.campaigns.find(c => c.id === req.params.id);
  res.json(launched);
});

app.delete('/api/crm/campaigns/:id', (req, res) => {
  const db = readDB();
  db.campaigns = db.campaigns.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Settings APIs
app.post('/api/crm/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// 1.5 AI Dynamic Day/Month/Year Reporting Endpoint in Indian English
app.post('/api/ai/report', async (req, res) => {
  try {
    const { reportType, selectedPeriod, acquisitions, leadsCreated, wonValue, pendingValue, tasksDone } = req.body;
    const db = readDB();

    const systemPrompt = "You are a senior Business Intelligence executive and sales advisor in India specializing in small business growth.";
    const userPrompt = `
      You are writing a dynamic executive business performance report for "${db.settings.enterpriseName || 'Pixel Craft India'}".
      Please analyze the following telemetry statistics for the selected timeframe:
      - Report Scale: ${reportType.toUpperCase()}-wise Report
      - Period Analyzed: ${selectedPeriod}
      - Client Acquisitions (New Registrations): ${acquisitions} customers
      - Active Sales Leads Created: ${leadsCreated} deals
      - Total Revenue Managed / Won: ₹${Number(wonValue).toLocaleString('en-IN')}
      - Pending Leads Estimate Value: ₹${Number(pendingValue).toLocaleString('en-IN')}
      - Task checklist completion: ${tasksDone}

      Write your summary and analysis in exactly 3 short and direct sections:
      1. **Performance Summary**: Speak in simple Indian English, explaining what these numbers tell us about this specific period's trends (e.g. if customers are increasing, if values look robust, use terms like Lakhs where suitable).
      2. **Strategic Insights**: Provide exactly 2 highly localized, actionable next steps or recommendations (e.g. following up with inactive partners, launching festival campaigns, completing overdue tasks).
      3. **Slogan of the Period**: Give an encouraging, sharp corporate slogan for "${db.settings.enterpriseName || 'Pixel Craft India'}" matching our performance.

      Format using clean markdown with bold section names. Make it look professional!
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const reportText = response.text || "Report generated successfully. Continue monitoring your sales indicators.";
    res.json({ report: reportText });
  } catch (error: any) {
    console.error('Gemini Report API Error:', error);
    res.status(500).json({ error: 'AI advisor is currently compiling reports for other systems. Please try again shortly!' });
  }
});

// SERVER-SIDE GEMINI AI INTEGRATION API ENDPOINTS

// 1. AI Intelligent Sales Forecast Endpoint in Simple Indian English
app.post('/api/ai/forecast', async (req, res) => {
  try {
    const db = readDB();
    const leadCount = db.leads.length;
    const totalPipelineValue = db.leads.reduce((sum, lead) => sum + lead.value, 0);
    const completedTasks = db.tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = db.tasks.filter(t => t.status !== 'Completed').length;
    const activeContacts = db.contacts.filter(c => c.status === 'Active').length;

    const systemPrompt = "You are a friendly, experienced sales advisor in India helping small businesses and startups grow.";
    const userPrompt = `
      Write a warm sales update report based on our current business statistics in simple Indian English. Keep it direct and helpful.
      Do not use complex western corporate jargon. Use terms like "Lakhs" if talking about high numbers, or keep values in standard rupee formatting.
      Current Business Statistics:
      - Total Active Customers we are in touch with: ${activeContacts}
      - Live Sales Deals in our pipeline: ${leadCount}
      - Total Estimated Deal Value: ₹${totalPipelineValue.toLocaleString('en-IN')}
      - Pending Daily Tasks to complete: ${pendingTasks} (Already Completed: ${completedTasks})

      Structure your report in exactly 3 short, easy-to-read paragraphs:
      1. A warm business summary analyzing how we are doing and how much revenue we can expect next month.
      2. 3 simple, practical tips in points for today to help close the deals faster based on the ratio of tasks to deals.
      3. A cheerful business slogan or motto for "${db.settings.enterpriseName || 'Pixel Craft India'}" to inspire our team.
      
      Format the entire reply beautifully with standard, clean markdown (using bold texts and bullets). Keep the tone very encouraging and simple!
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const aiOutputText = response.text || "AI Assistant is analyzing the data. Please check back in a few seconds.";
    res.json({ forecast: aiOutputText });
  } catch (error: any) {
    console.error('Gemini Forecast API Error:', error);
    res.status(500).json({ error: 'AI Assistant is taking a short tea break. Please try in a bit!' });
  }
});

// 2. AI Email Subject Lines Optimization with Indian friendly defaults
app.post('/api/ai/suggest-subject', async (req, res) => {
  const { campaignName, targetSegment, draftSubject } = req.body;
  if (!campaignName || !targetSegment) {
    return res.status(400).json({ error: 'Please enter a campaign name first.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `
        Suggest 3 friendly, highly click-worthy business email subject lines in simple Indian English for a promotional/marketing campaign.
        Our Campaign Details:
        - Campaign Name: ${campaignName}
        - Target Customer Group: ${targetSegment}
        - Our draft subject idea: ${draftSubject || 'None'}

        Output a strict JSON array of strings with exactly 3 options. Keep the tone warm and direct, perfect for Indian business owners.
        Do not write any extra conversation text. Return only the JSON list of strings.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "Exactly 3 engaging, clear marketing email subject lines."
        }
      }
    });

    const options = JSON.parse(response.text.trim());
    res.json({ options });
  } catch (error: any) {
    console.error('Gemini Subject Suggest API Error:', error);
    res.status(500).json({ error: 'Failed to generate subject ideas. Using standard template.' });
  }
});

// Start Express Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(SE_PORT, '0.0.0.0', () => {
    console.log(`Server running fine on port ${SE_PORT}`);
  });
}

startServer();
