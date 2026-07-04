export interface PdfmeTemplate {
  id: number;
  name: string;
  type: string;
  emailSubject?: string;
  emailBody?: string;
  systemDefault: boolean;
  sourceTemplateId: number | null;
  jsonSchema: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveTemplateRequest {
  name?: string;
  emailSubject?: string;
  emailBody?: string;
  jsonSchema?: string;
}
