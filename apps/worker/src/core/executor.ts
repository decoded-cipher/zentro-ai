
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';

import { ZentroAction } from './parser';
import { broadcastToSSE } from '../helpers/sse';

const BASE_WORK_DIR = '/tmp/zentro';



// Executes a single action (file or shell)
export async function executeAction(
  projectId: string,
  action: ZentroAction,
  baseWorkDir: string = BASE_WORK_DIR
): Promise<{ success: boolean; output?: string; error?: string }> {
  
  // Project files are mounted directly at /tmp/zentro in the container
  // The manager mounts /tmp/zentro/projects/{projectId} from host to /tmp/zentro in container
  const projectPath = baseWorkDir;
  
  try {
    if (action.type === 'file') {
      if (!action.filePath) {
        throw new Error('File action requires filePath');
      }
      
      return await executeFileAction(projectId, projectPath, action);
    } else if (action.type === 'shell') {
      return await executeShellAction(projectId, action, projectPath);
    } else {
      throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage
    };
  }
}



// Executes file creation/modification action
async function executeFileAction(
  projectId: string,
  projectPath: string,
  action: ZentroAction
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const filePath = join(projectPath, action.filePath!);
    const fileDir = dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true });
    
    // Write file content
    await fs.writeFile(filePath, action.content, 'utf-8');
    
    broadcastToSSE({
      projectId,
      type: 'file_action',
      content: `Created/updated: ${action.filePath}`
    });
    
    return {
      success: true,
      output: `File ${action.filePath} created/updated successfully`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to write file: ${errorMessage}`
    };
  }
}



// Executes shell command action
async function executeShellAction(
  projectId: string,
  action: ZentroAction,
  projectPath: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    const command = action.content.trim();
    
    // Parse command and arguments
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    broadcastToSSE({
      projectId,
      type: 'shell_action',
      content: `Executing: ${command}`
    });
    
    const child = spawn(cmd, args, {
      cwd: projectPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      broadcastToSSE({
        projectId,
        type: 'shell_output',
        content: output
      });
    });
    
    child.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      broadcastToSSE({
        projectId,
        type: 'shell_error',
        content: output
      });
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output: stdout || 'Command executed successfully'
        });
      } else {
        resolve({
          success: false,
          error: stderr || `Command failed with exit code ${code}`
        });
      }
    });
    
    child.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to execute command: ${error.message}`
      });
    });
  });
}



// Executes all actions from an artifact in sequence
export async function executeArtifact(
  projectId: string,
  actions: ZentroAction[],
  baseWorkDir: string = BASE_WORK_DIR
): Promise<{ success: boolean; results: Array<{ action: ZentroAction; result: any }> }> {
  const results: Array<{ action: ZentroAction; result: any }> = [];
  
  for (const action of actions) {
    const result = await executeAction(projectId, action, baseWorkDir);
    results.push({ action, result });
    
    if (!result.success && action.type === 'shell') {
      // Continue even if shell command fails, but log it
      console.warn(`Action failed: ${action.type}`, result.error);
    } else if (!result.success) {
      // File operations should not fail
      console.error(`Action failed: ${action.type}`, result.error);
    }
  }
  
  const allSuccess = results.every(r => r.result.success);
  
  return {
    success: allSuccess,
    results
  };
}

