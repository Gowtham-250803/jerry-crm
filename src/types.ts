export interface Contact {
  id: string;
  name: string;
  company: string;
  status: 'Active' | 'Lead' | 'Inactive';
  email: string;
}

export interface Lead {
  id: string;
  title: string;
  value: number;
  status: 'New Leads' | 'In Progress' | 'Deals Won';
  company: string;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
}
