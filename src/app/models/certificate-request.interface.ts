export interface CertificateRequest {
    certificates: CertificateItemRequest[];
    magazineId: number;

    type: string;
    volume: string;
    number: string;
    templateId?: number;
}

export interface CertificateItemRequest {
    name: string;
    email?: string;
    personId?: number;
    validationCode: string;
    pdfBase64?: string;
    metadata?: any;
}
