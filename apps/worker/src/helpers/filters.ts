import { promises as fs } from 'fs';
import { relative } from 'path';

// Try multiple possible paths for the filter file
const POSSIBLE_FILTER_PATHS = [
  '/app/apps/worker/rclone_filters.txt', // Docker container path (most likely)
  '/usr/local/bin/rclone_filters.txt', // Alternative Docker path
  './rclone_filters.txt', // Relative path (for local development)
];

interface FilterRule {
  pattern: string;
  exclude: boolean; // true for exclude (-), false for include (+)
}

let cachedFilters: FilterRule[] | null = null;

/**
 * Loads and parses the rclone filter file
 */
async function loadFilters(): Promise<FilterRule[]> {
  if (cachedFilters) {
    return cachedFilters;
  }

  // Try to find the filter file in one of the possible locations
  let content: string | null = null;
  for (const path of POSSIBLE_FILTER_PATHS) {
    try {
      content = await fs.readFile(path, 'utf-8');
      break; // Found it, stop trying
    } catch {
      // Continue to next path
    }
  }

  if (!content) {
    console.warn('Could not find rclone_filters.txt, using default exclusions');
    // Return default exclusions if file can't be read
    cachedFilters = [
      { pattern: 'node_modules/**', exclude: true },
      { pattern: '.next/**', exclude: true },
      { pattern: 'dist/**', exclude: true },
      { pattern: 'build/**', exclude: true },
      { pattern: '.DS_Store', exclude: true },
    ];
    return cachedFilters;
  }

  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => {
      // Remove empty lines and comments
      return line && !line.startsWith('#');
    });

    const filters: FilterRule[] = [];
    for (const line of lines) {
      if (line.startsWith('-')) {
        // Exclude pattern
        filters.push({
          pattern: line.substring(1).trim(),
          exclude: true
        });
      } else if (line.startsWith('+')) {
        // Include pattern (overrides exclusions)
        filters.push({
          pattern: line.substring(1).trim(),
          exclude: false
        });
      }
    }

    cachedFilters = filters;
    return filters;
  } catch (error) {
    console.error('Error loading filter file:', error);
    // Return default exclusions if file can't be read
    return [
      { pattern: 'node_modules/**', exclude: true },
      { pattern: '.next/**', exclude: true },
      { pattern: 'dist/**', exclude: true },
      { pattern: 'build/**', exclude: true },
      { pattern: '.DS_Store', exclude: true },
    ];
  }
}

/**
 * Simple pattern matcher for glob-like patterns
 * Supports:
 * - ** for recursive directory matching (e.g., "node_modules/**")
 * - * for single-level wildcard (e.g., "*.log")
 * - Exact matches (e.g., ".DS_Store")
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // Handle recursive directory pattern (/**)
  if (normalizedPattern.endsWith('/**')) {
    const basePattern = normalizedPattern.slice(0, -3); // Remove '/**'
    // Match if path starts with base pattern followed by / or is exactly the base pattern
    return normalizedPath === basePattern || normalizedPath.startsWith(basePattern + '/');
  }

  // Handle single-level wildcard (*)
  if (normalizedPattern.includes('*')) {
    // Convert pattern to regex
    const regexPattern = normalizedPattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '.*'); // Convert * to .*
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  }

  // Exact match
  return normalizedPath === normalizedPattern;
}

/**
 * Checks if a file path should be excluded based on rclone filters
 * @param filePath Absolute path to the file or directory
 * @param projectRoot Root directory of the project
 */
export async function shouldExcludeFile(filePath: string, projectRoot: string): Promise<boolean> {
  const filters = await loadFilters();
  const relativePath = relative(projectRoot, filePath);
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize to forward slashes

  // Track if any include rule matches (includes override excludes)
  let hasIncludeMatch = false;
  let hasExcludeMatch = false;

  for (const filter of filters) {
    if (matchesPattern(normalizedPath, filter.pattern)) {
      if (filter.exclude) {
        hasExcludeMatch = true;
      } else {
        hasIncludeMatch = true;
      }
    }
  }

  // If an include rule matches, don't exclude
  if (hasIncludeMatch) {
    return false;
  }

  // If an exclude rule matches, exclude it
  return hasExcludeMatch;
}

