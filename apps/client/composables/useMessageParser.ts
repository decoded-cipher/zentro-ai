
export interface ParsedAction {
  type: 'action' | 'artifact'
  content: string
  attributes?: Record<string, string>
}

export interface ParsedMessage {
  text: string
  actions: ParsedAction[]
}



// Parse messages with embedded actions and artifacts
export const useMessageParser = () => {
  const extractAttributes = (tagContent: string): Record<string, string> => {
    const attributes: Record<string, string> = {}
    const attrRegex = /(\w+)="([^"]*)"/g
    let match

    // Extract all attributes from the tag content
    while ((match = attrRegex.exec(tagContent)) !== null) {
      attributes[match[1]] = match[2]
    }
    return attributes
  }

  const parseTag = (
    regex: RegExp,
    content: string,
    type: 'action' | 'artifact'
  ): Array<{ full: string; attributes: Record<string, string>; content: string; type: 'action' | 'artifact' }> => {
    
    const matches: Array<{ full: string; attributes: Record<string, string>; content: string; type: 'action' | 'artifact' }> = []
    let match
    
    // Extract all matches for the given tag type
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        full: match[0],
        attributes: extractAttributes(match[1]),
        content: match[2].trim(),
        type,
      })
    }
    return matches
  }



  // Parses a message string and extracts text and embedded actions/artifacts
  const parseMessage = (content: string): ParsedMessage => {
    const artifactRegex = /<zentroArtifact([^>]*)>([\s\S]*?)<\/zentroArtifact>/g
    const actionRegex = /<zentroAction([^>]*)>([\s\S]*?)<\/zentroAction>/g

    const artifacts = parseTag(artifactRegex, content, 'artifact')
    const actions = parseTag(actionRegex, content, 'action')
    
    let remainingText = content

    // Remove all matched tags from remaining text
    const allMatches = [...artifacts, ...actions]
    for (const match of allMatches) {
      remainingText = remainingText.replace(match.full, '')
    }

    // Clean up remaining text
    remainingText = remainingText.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

    return {
      text: remainingText,
      actions: allMatches.map(({ type, content, attributes }) => ({ type, content, attributes })),
    }
  }

  return { parseMessage }
}

