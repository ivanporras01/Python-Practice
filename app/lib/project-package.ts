import { strToU8, zipSync } from 'fflate';
import { backupText, projectReport, projects, type CapstoneWork } from './capstone-work';

export function projectPackage(projectId: string, work: CapstoneWork, student = 'Student') {
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error('Choose a known project.');
  return new Uint8Array(zipSync({
    [project.file]: strToU8(work.code),
    'inputs.txt': strToU8(work.inputs),
    [projectId + '_project_backup.json']: strToU8(backupText(projectId, work)),
    [projectId + '_practice_report.md']: strToU8(projectReport(projectId, work, student)),
    'README.txt': strToU8('Introduction to Python — By Professor Porras\n\nExtract this ZIP to a folder on your computer.\nThe .py file contains your Python code. Open it in your Python editor.\ninputs.txt contains the values for input(), one per line.\nThe .md report contains your prediction, code, last output, and explanation.\nKeep the .json backup. Open it in the portal to continue your complete project.\nFiles: https://python-practice.hectorporras0916.workers.dev/?view=files\n'),
  }, { level: 0 }));
}

export function exercisePackage(name: string, code: string, inputs: string) {
  return new Uint8Array(zipSync({ [name.replace(/[^a-zA-Z0-9._-]/g, '_') + '.py']: strToU8(code), 'inputs.txt': strToU8(inputs) }, { level: 0 }));
}
