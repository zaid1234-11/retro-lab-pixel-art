/**
 * TXT Exporter
 *
 * Exports character-based effects (ASCII, Matrix Rain) as plain text files.
 * Always exports from the character grid data model — never from canvas readback.
 */

/**
 * Download a text string as a .txt file.
 */
export function downloadTXT(textContent: string, filename: string = 'retro_output.txt'): void {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Build a TXT string from a 2D character grid.
 * Each row becomes a line of text.
 */
export function charGridToTXT(charGrid: { char: string }[][]): string {
  return charGrid.map(row => row.map(cell => cell.char).join('')).join('\n');
}
