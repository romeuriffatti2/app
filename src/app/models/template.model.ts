export interface PdfmeTemplate {
  id: number;
  name: string;
  type: string;
  systemDefault: boolean;
  sourceTemplateId: number | null;
  jsonSchema: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveTemplateRequest {
  name?: string;
  jsonSchema?: string;
}
