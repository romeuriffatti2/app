export interface PersonRequest {
    name: string;
    email: string;
    cpf: string;
}

export interface PersonUpdateRequest {
    name: string;
    email: string;
    cpf: string;
}

export interface PersonResponse {
    id: number;
    name: string;
    email: string;
    cpf: string;
}

export interface PersonDeletedError {
    errorCode: 'PERSON_DELETED';
    personId: number;
    personName: string;
    message: string;
}
