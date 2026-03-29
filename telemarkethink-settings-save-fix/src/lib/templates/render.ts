export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

export function extractTemplateVariables(template: string) {
  const matches = [...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}
