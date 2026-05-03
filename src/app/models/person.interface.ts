export interface PersonRequest {
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
