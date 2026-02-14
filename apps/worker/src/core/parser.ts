
export interface ZentroAction {
  type: 'file' | 'shell';
  filePath?: string;
  content: string;
}

export interface ZentroArtifact {
  id: string;
  title: string;
  actions: ZentroAction[];
}



// Parses artifacts from the assistant's response text
export function parseArtifacts(text: string): ZentroArtifact[] {
  const artifacts: ZentroArtifact[] = [];
  
  // Match <zentroArtifact> tags with attributes
  const artifactRegex = /<zentroArtifact\s+id="([^"]+)"\s+title="([^"]+)"[^>]*>([\s\S]*?)(?:<\/zentroArtifact>|$)/gi;
  
  let match;
  while ((match = artifactRegex.exec(text)) !== null) {
    const [, id, title, content] = match;
    const actions = parseActions(content);
    
    artifacts.push({
      id,
      title,
      actions
    });
  }
  
  return artifacts;
}



// Parses zentroAction elements from artifact content
function parseActions(content: string): ZentroAction[] {
  const actions: ZentroAction[] = [];
  
  // Match <zentroAction> tags with type and optional filePath attributes
  const actionRegex = /<zentroAction\s+type="([^"]+)"(?:\s+filePath="([^"]+)")?[^>]*>([\s\S]*?)<\/zentroAction>/gi;
  
  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    const [, type, filePath, actionContent] = match;
    
    // Clean up the content - remove leading/trailing whitespace
    const cleanedContent = actionContent.trim();
    
    actions.push({
      type: type as 'file' | 'shell',
      filePath: filePath || undefined,
      content: cleanedContent
    });
  }
  
  return actions;
}



// Extracts non-artifact text surrounding artifacts
export function extractNonArtifactText(text: string): { before: string; after: string; artifacts: string } {
  const artifactRegex = /<zentroArtifact[\s\S]*?<\/zentroArtifact>/gi;
  const artifacts = text.match(artifactRegex)?.join('\n\n') || '';
  
  const parts = text.split(artifactRegex);
  const before = parts[0]?.trim() || '';
  const after = parts.slice(1).join('').trim() || '';
  
  return { before, after, artifacts };
}

