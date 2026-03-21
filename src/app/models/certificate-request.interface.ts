export interface CertificateRequest {
    certificates: CertificateItemRequest[];
    magazineId: number;
}

export interface CertificateItemRequest {
    name: string;
    validationCode: string;
}
