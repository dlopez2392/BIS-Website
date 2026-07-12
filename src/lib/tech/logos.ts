export interface TechLogo {
  name: string;
  file: string; // basename in public/logos/, rendered as /logos/<file>.svg
}

// Curated roster shown in the home-page "Platforms we work with" marquee.
// Every entry MUST have a real SVG at public/logos/<file>.svg (rendered as a
// monochrome CSS-masked silhouette). Ordered by category so the strip reads
// full-stack as it scrolls. To add a logo: drop a single-color /
// transparent-background <file>.svg into public/logos/ (it masks to a clean
// monochrome silhouette) and add an entry here.
export const techLogos: TechLogo[] = [
  // Cloud / Infrastructure
  { name: 'Microsoft', file: 'microsoft' },
  { name: 'Azure', file: 'azure' },
  { name: 'AWS', file: 'aws' },
  { name: 'Google Workspace', file: 'googleworkspace' },
  { name: 'VMware', file: 'vmware' },
  // Networking
  { name: 'Cisco', file: 'cisco' },
  { name: 'Fortinet', file: 'fortinet' },
  { name: 'Ubiquiti', file: 'ubiquiti' },
  // Cybersecurity
  { name: 'CrowdStrike', file: 'crowdstrike' },
  { name: 'Malwarebytes', file: 'malwarebytes' },
  { name: 'Bitdefender', file: 'bitdefender' },
  { name: 'Proofpoint', file: 'proofpoint' },
  // Backup / Storage
  { name: 'Datto', file: 'datto' },
  { name: 'Veeam', file: 'veeam' },
  { name: 'Synology', file: 'synology' },
  // Remote / Comms
  { name: 'TeamViewer', file: 'teamviewer' },
  { name: 'Zoom', file: 'zoom' },
  { name: 'RingCentral', file: 'ringcentral' },
  // Apps / CRM
  { name: 'Salesforce', file: 'salesforce' },
  { name: 'Adobe', file: 'adobe' },
  { name: 'Dropbox', file: 'dropbox' },
  // Development / AI
  { name: 'GitHub', file: 'github' },
  { name: 'OpenAI', file: 'openai' },
  { name: 'Anthropic', file: 'anthropic' },
  { name: 'Supabase', file: 'supabase' },
  { name: 'Python', file: 'python' },
  // Hardware
  { name: 'Dell', file: 'dell' },
  { name: 'HP', file: 'hp' },
  { name: 'Lenovo', file: 'lenovo' },
  { name: 'Apple', file: 'apple' },
];
