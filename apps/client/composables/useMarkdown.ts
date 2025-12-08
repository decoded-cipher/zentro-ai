import { marked } from 'marked'

export const useMarkdown = () => {
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub Flavored Markdown
  })

  const renderMarkdown = (markdown: string): string => {
    if (!markdown || !markdown.trim()) {
      return ''
    }
    try {
      return marked(markdown) as string
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return markdown // Fallback to plain text
    }
  }

  return {
    renderMarkdown,
  }
}
