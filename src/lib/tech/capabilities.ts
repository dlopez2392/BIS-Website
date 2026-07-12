export interface CapabilityGroup {
  id: string; // maps to i18n `capabilities.groups.<id>`
  items: string[]; // proper-noun product names, shared across locales
}

export const capabilityGroups: CapabilityGroup[] = [
  { id: 'infraCloud', items: ['Microsoft 365', 'Microsoft Azure', 'Amazon Web Services (AWS)', 'Google Workspace', 'Exchange Online', 'Windows Server', 'Remote Desktop Services (RDS)', 'Azure Portal'] },
  { id: 'virtualization', items: ['VMware', 'Hyper-V'] },
  { id: 'networking', items: ['Cisco', 'Cisco Meraki', 'Fortinet (FortiGate)', 'Ubiquiti UniFi', 'SonicWall', 'Aruba Networks', 'HPE Networking', 'Dell Networking', 'TP-Link Business', 'Netgear Business', 'Synology Routers', 'DNS', 'DHCP', 'DFS'] },
  { id: 'security', items: ['CrowdStrike Falcon', 'Microsoft Defender', 'Microsoft Defender for Endpoint', 'Microsoft Defender for Office 365', 'Microsoft Sentinel', 'Bitdefender', 'Malwarebytes', 'Huntress', 'Proofpoint', 'Barracuda', 'DNSFilter', 'Breach Secure Now'] },
  { id: 'backupDr', items: ['Datto', 'Axcient', 'Veeam', 'Azure Backup', 'Windows Server Backup'] },
  { id: 'storage', items: ['Synology', 'QNAP', 'Dell PowerVault'] },
  { id: 'endpoint', items: ['Microsoft Intune', 'Microsoft Endpoint Manager', 'Windows Autopilot', 'Group Policy'] },
  { id: 'remote', items: ['TeamViewer', 'AnyDesk', 'ConnectWise Control (ScreenConnect)', 'Quick Assist'] },
  { id: 'voip', items: ['Microsoft Teams Phone', 'Talkdesk', 'RingCentral', 'Zoom', 'Cisco Webex'] },
  { id: 'identity', items: ['Microsoft Entra ID (Azure AD)', 'Active Directory', 'Cisco Duo', 'Keeper Security', 'Single Sign-On (SSO)', 'Multi-Factor Authentication (MFA)'] },
  { id: 'productivity', items: ['Microsoft Office', 'Microsoft Teams', 'SharePoint', 'OneDrive', 'OneNote', 'Microsoft Planner', 'Microsoft Loop', 'Trello', 'Asana', 'Monday.com', 'Dropbox', 'Box', 'Adobe Acrobat Pro', 'Adobe Creative Cloud'] },
  { id: 'crm', items: ['Salesforce', 'HubSpot', 'Microsoft Dynamics'] },
  { id: 'legal', items: ['Litify', 'Needles Neos', 'Docrio', 'Trainual'] },
  { id: 'bi', items: ['Microsoft Power BI', 'Microsoft Excel', 'Azure Data Warehouse'] },
  { id: 'databases', items: ['Microsoft SQL Server', 'Azure SQL', 'MySQL', 'PostgreSQL', 'Supabase'] },
  { id: 'devAi', items: ['OpenAI API', 'Anthropic Claude API', 'OpenRouter', 'GLM 5.2', 'GitHub', 'GitHub Copilot', 'Visual Studio Code', 'Cursor', 'Claude Code CLI', 'Clerk', 'REST APIs', 'Python', 'PowerShell', 'JavaScript', 'TypeScript', 'HTML & CSS'] },
  { id: 'monitoring', items: ['Windows Event Viewer', 'Performance Monitor', 'Microsoft 365 Admin Center', 'CrowdStrike Console', 'FortiManager', 'UniFi Controller'] },
  { id: 'hardware', items: ['Dell', 'HP', 'Lenovo', 'Microsoft Surface', 'Apple', 'APC', 'Eaton', 'EcoFlow'] },
  { id: 'partners', items: ['Applied Technology (Managed Service Provider)', 'Microsoft Partner Ecosystem', 'Hardware VARs & Procurement Partners'] },
];

export const expertiseIds: string[] = [
  'm365admin', 'azure', 'iam', 'endpointMgmt', 'networkDesign', 'firewall', 'wireless',
  'cybersecurity', 'backupDr', 'bcp', 'itOps', 'itPm', 'vendorMgmt', 'licensing', 'legalTech',
  'contactCenter', 'dataAnalytics', 'aiIntegration', 'automation', 'powerbi', 'itStrategy',
  'modernization', 'digitalTransformation', 'assessments', 'helpdesk', 'sysadmin',
];
