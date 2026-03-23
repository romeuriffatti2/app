export interface CertificateRequest {
    certificates: CertificateItemRequest[];
    magazineId: number;

    type: string;
    volume: string;
    number: string;
}

export interface CertificateItemRequest {
    name: string;
    validationCode: string;
    metadata?: any;
}
